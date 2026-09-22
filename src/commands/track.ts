/**
 * Воспроизведение трека магазина.
 *
 * Отличий от выпуска три, и каждое требует своего обращения:
 *   1. доступ выдаёт сервер и может отказать — причину надо показать словами;
 *   2. ссылка подписана и живёт 15 минут — после долгой паузы её перерезолвливают;
 *   3. превью приходит ПОЛНЫМ файлом — остановиться обязан клиент.
 */

import {
  ListenCounter,
  PlayDeduper,
  ANALYTICS_THRESHOLD_MS,
  FREE_LISTEN_THRESHOLD_SEC,
  recordFreeListen,
  recordPlayEvent,
  recordTrackStart,
} from "../api/plays.ts";
import {
  TrackAccessDeniedError,
  needsReresolve,
  resolveTrackAccess,
  type StoreTrack,
  type TrackAccess,
} from "../api/store.ts";
import { formatDuration, progressBar, truncate } from "../lib/format.ts";
import { getListenerId, getSessionId } from "../lib/ids.ts";
import { NoAudioBackendError, pickBackend } from "../player/detect.ts";
import { startPlayback, stateMark } from "../ui/playback.ts";
import { bold, cyan, dim, green, red, yellow } from "../ui/term.ts";

function trackLabel(track: StoreTrack): string {
  const artist = track.artist_name?.trim();
  const title = track.title?.trim() || "Без названия";
  return artist ? `${artist} — ${title}` : title;
}

function accessNote(access: TrackAccess): string {
  switch (access.kind) {
    case "full":
      return green("полный трек");
    case "free_listen":
      return access.playsLeft === null
        ? yellow("бесплатное прослушивание")
        : yellow(`бесплатное прослушивание, осталось ${access.playsLeft}`);
    case "preview":
      return dim(`превью ${access.window ? `${access.window.durationSec} с` : ""}`.trim());
  }
}

export async function playTrack(track: StoreTrack, accessToken: string | null): Promise<number> {
  const listenerId = await getListenerId();
  const sessionId = getSessionId();

  let access: TrackAccess;
  try {
    access = await resolveTrackAccess(track, listenerId, accessToken);
  } catch (error) {
    if (error instanceof TrackAccessDeniedError) {
      process.stderr.write(`${red("Нельзя послушать:")} ${error.message}\n`);
      if (!accessToken) process.stderr.write(`${dim("Возможно, поможет вход: surprise login")}\n`);
      return 1;
    }
    process.stderr.write(`${red("Не удалось получить доступ:")} ${(error as Error).message}\n`);
    return 1;
  }

  let choice;
  try {
    choice = await pickBackend();
  } catch (error) {
    if (error instanceof NoAudioBackendError) {
      process.stderr.write(`${red(error.message)}\n`);
      return 1;
    }
    throw error;
  }

  const { backend, name, degraded } = choice;
  const counter = new ListenCounter();
  const deduper = new PlayDeduper();

  let freeListenCounted = false;
  let analyticsCounted = false;

  const playback = startPlayback({
    backend,
    describe: () => trackLabel(track),
    hint: backend.canSeek ? "space — пауза, ←/→ — 10 секунд, q — выход" : "space — пауза, q — выход",
    cleanup: async () => {
      counter.pause();
      process.stdout.write("Остановлено.\n");
    },
    keys: {
      onKey: (key) => {
        // Внутри превью перемотка бессмысленна: окно — тридцать секунд, и
        // уехав за его край, мы бы сами себя оборвали.
        if (!backend.canSeek || access.kind === "preview") return false;
        if (key === "\u001B[C") {
          void backend.seek(10, "relative");
          return true;
        }
        if (key === "\u001B[D") {
          void backend.seek(-10, "relative");
          return true;
        }
        return false;
      },
    },
    render: (state, position, total, width) => {
      // У превью своя шкала: показываем прогресс внутри окна, а не внутри трека —
      // иначе полоса стоит почти на нуле и ничего не сообщает.
      const window = access.window;
      const shownPosition = window && position !== null ? Math.max(0, position - window.startSec) : position;
      const shownTotal = window ? window.durationSec : (total ?? track.duration ?? null);

      const clock = `${formatDuration(shownPosition)} / ${formatDuration(shownTotal)}`;
      const bar = progressBar(shownPosition, shownTotal, Math.max(0, Math.min(24, width - 48)));
      const head = truncate(trackLabel(track), Math.max(10, width - clock.length - bar.length - 8));
      return `${stateMark(state)} ${bold(head)} ${bar ? `${dim(bar)} ` : ""}${dim(clock)}`;
    },
  });

  try {
    await backend.start();
    await backend.load(access.url, { startSec: access.window?.startSec });
  } catch (error) {
    playback.say(`${red("Не удалось запустить:")} ${(error as Error).message}`);
    playback.finish(1);
    return playback.done;
  }

  counter.start();
  playback.say(`${cyan("♪")} ${bold(trackLabel(track))} ${accessNote(access)}`);
  if (track.releaseTitle) playback.say(dim(`  ${track.releaseTitle}`));
  if (degraded) playback.say(`${yellow("!")} Играем через ${name}: перемотка перезапускает поток.`);

  if (track.release_id) void recordTrackStart(track.id, track.release_id, sessionId, accessToken);

  const tick = setInterval(() => {
    const state = backend.status();
    if (state.paused) {
      counter.pause();
      return;
    }
    counter.start();

    const position = state.positionSec;

    // Превью обязан обрывать клиент: сервер отдаёт ПОЛНУЮ копию трека, и без
    // этой проверки «превью» оказалось бы треком целиком.
    const window = access.window;
    if (window && position !== null && position >= window.endSec) {
      playback.say(dim("Конец превью. Полный трек — по подписке или после покупки."));
      playback.finish(0);
      return;
    }

    // Аналитика — после 10 секунд фактически прослушанного, с дедупом на полчаса.
    if (!analyticsCounted && counter.listenedMs() >= ANALYTICS_THRESHOLD_MS) {
      analyticsCounted = true;
      if (deduper.claim("store_track", track.id)) {
        void recordPlayEvent("store_track", track.id, sessionId, counter.listenedMs(), accessToken);
      }
    }

    // Списание бесплатного прослушивания — ровно один раз и только если сервер
    // выдал трек именно в этом режиме. Не позвать значит слушать, не расходуя
    // квоту, то есть обойти ограничение.
    if (
      !freeListenCounted &&
      access.kind === "free_listen" &&
      track.release_id &&
      counter.listenedSec() >= FREE_LISTEN_THRESHOLD_SEC
    ) {
      freeListenCounted = true;
      const releaseId = track.release_id;
      void recordFreeListen(
        track.id,
        releaseId,
        sessionId,
        listenerId,
        counter.listenedSec(),
        accessToken,
      ).then((playsLeft) => {
        if (playsLeft !== null) playback.say(dim(`Бесплатных прослушиваний осталось: ${playsLeft}`));
      });
    }
  }, 1_000);
  tick.unref?.();

  // Подписанная ссылка живёт 15 минут. Снятие с паузы через полчаса упёрлось бы
  // в протухший адрес и выглядело бы как «плеер сломался».
  backend.on("status", (state) => {
    if (state.paused || !needsReresolve(access)) return;
    void (async () => {
      try {
        const fresh = await resolveTrackAccess(track, listenerId, accessToken);
        const position = backend.status().positionSec ?? access.window?.startSec ?? 0;
        access = fresh;
        await backend.load(fresh.url, { startSec: position });
      } catch {
        // Не вышло — продолжаем со старой ссылкой: она могла ещё не протухнуть.
      }
    })();
  });

  return playback.done;
}
