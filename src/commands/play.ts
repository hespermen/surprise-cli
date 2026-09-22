/**
 * surprise play <ссылка|запрос> — играть выпуск.
 *
 * Принимает и ссылку с сайта, и просто текст: человек в терминале с равной
 * вероятностью вставит URL из браузера и наберёт имя артиста по памяти.
 */

import {
  currentTrackIndex,
  fetchShowStream,
  fetchTracklist,
  findShow,
  searchShows,
  type Show,
  type TracklistItem,
} from "../api/shows.ts";
import { fetchTrack, listReleaseTracks } from "../api/store.ts";
import { formatDuration, progressBar, truncate } from "../lib/format.ts";
import { parseSurpriseLink } from "../lib/publicId.ts";
import { getValidSession } from "../net/auth.ts";
import { NoAudioBackendError, pickBackend } from "../player/detect.ts";
import { playTrack } from "./track.ts";
import { startPlayback, stateMark } from "../ui/playback.ts";
import { bold, cyan, dim, red, yellow } from "../ui/term.ts";

function showTitle(show: Show): string {
  const artists = show.artists.map((artist) => artist.name).join(", ");
  const title = show.title ?? "Без названия";
  if (!artists) return title;
  return title.toLowerCase().includes(artists.toLowerCase()) ? title : `${title} — ${artists}`;
}

function trackLine(item: TracklistItem): string {
  const artist = item.artist?.trim();
  const title = item.title?.trim();
  const label = [artist, title].filter(Boolean).join(" — ");
  return label || "неопознанный трек";
}

/** Найти выпуск: сначала как ссылку, затем как поисковый запрос. */
async function resolveShow(input: string, accessToken: string | null): Promise<Show | null> {
  const link = parseSurpriseLink(input);

  if (link) {
    // Ссылка разобралась — значит человек указал конкретную вещь. Подменять её
    // результатом поиска нельзя: он почти наверняка окажется не тем.
    if (link.kind !== "show") {
      process.stderr.write(`${yellow("!")} Пока умеем играть только выпуски. Ссылка ведёт на другое (${link.kind}).\n`);
      return null;
    }
    return findShow(link.param, accessToken);
  }

  const found = await searchShows(input, 8, accessToken);
  if (found.length === 0) return null;

  const first = found[0];
  if (!first) return null;
  if (found.length > 1) {
    process.stdout.write(`${dim(`Нашли ${found.length}, играем первый:`)}\n`);
    for (const [index, show] of found.slice(0, 5).entries()) {
      const mark = index === 0 ? cyan("▸") : " ";
      process.stdout.write(`${mark} ${truncate(showTitle(show), 70)}\n`);
    }
  }
  return first;
}

export async function playCommand(argv: readonly string[]): Promise<number> {
  const asJson = argv.includes("--json");
  const query = argv.filter((arg) => !arg.startsWith("--")).join(" ").trim();

  if (!query) {
    process.stderr.write(`${red("Что играть?")} Например: surprise play https://surprise.fm/episodes/837393\n`);
    return 1;
  }

  const session = await getValidSession();
  const accessToken = session?.access_token ?? null;
  const link = parseSurpriseLink(query);

  // Трек и релиз уходят в свою ветку: у них есть гейт, подписанные ссылки и
  // окно превью, которых у выпусков нет вовсе.
  if (link?.kind === "track") {
    const trackId = link.param.slug ?? "";
    const track = trackId ? await fetchTrack(trackId, accessToken) : null;
    if (!track) {
      process.stderr.write(`${red("Трек не найден:")} ${query}\n`);
      return 1;
    }
    return playTrack(track, accessToken);
  }

  if (link?.kind === "release") {
    // Релиз играем с первого трека: очередь появится вместе с TUI, а
    // промолчать здесь значило бы отказать по рабочей ссылке.
    const releaseId = link.param.slug ?? "";
    const tracks = releaseId ? await listReleaseTracks(releaseId, accessToken) : [];
    const first = tracks[0];
    if (!first) {
      process.stderr.write(`${red("У релиза нет треков или он не найден:")} ${query}\n`);
      return 1;
    }
    if (tracks.length > 1) process.stdout.write(`${dim(`В релизе ${tracks.length} треков, играем первый.`)}\n`);
    return playTrack(first, accessToken);
  }

  const show = await resolveShow(query, accessToken);
  if (!show) {
    process.stderr.write(`${red("Ничего не нашли:")} ${query}\n`);
    return 1;
  }

  const stream = await fetchShowStream(show.id, accessToken).catch(() => null);
  if (!stream?.audio_url) {
    process.stderr.write(`${red("У выпуска нет аудио:")} ${showTitle(show)}\n`);
    return 1;
  }

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify({
        id: show.id,
        public_id: show.public_id,
        slug: show.slug,
        title: show.title,
        artists: show.artists.map((artist) => artist.name),
        duration: show.duration,
        audio_url: stream.audio_url,
      })}\n`,
    );
    return 0;
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
  const tracklist = await fetchTracklist(show, accessToken).catch(() => []);

  let announcedTrack = -1;

  const playback = startPlayback({
    backend,
    describe: () => showTitle(show),
    cleanup: async () => {
      process.stdout.write("Остановлено.\n");
    },
    hint: backend.canSeek
      ? "space — пауза, ←/→ — 30 секунд, ↑/↓ — 5 минут, q — выход"
      : "space — пауза, q — выход",
    keys: {
      onKey: (key) => {
        if (!backend.canSeek) return false;
        switch (key) {
          case "\u001B[C": // →
            void backend.seek(30, "relative");
            return true;
          case "\u001B[D": // ←
            void backend.seek(-30, "relative");
            return true;
          case "\u001B[A": // ↑
            void backend.seek(300, "relative");
            return true;
          case "\u001B[B": // ↓
            void backend.seek(-300, "relative");
            return true;
          default:
            return false;
        }
      },
    },
    render: (state, position, total, width) => {
      // Длительность из каталога — запасной вариант: ffplay её не знает вовсе,
      // а mpv узнаёт только после открытия файла.
      const duration = total ?? show.duration ?? null;
      const clock = `${formatDuration(position)} / ${formatDuration(duration)}`;
      const bar = progressBar(position, duration, Math.max(0, Math.min(24, width - 48)));
      const head = truncate(showTitle(show), Math.max(10, width - clock.length - bar.length - 8));
      return `${stateMark(state)} ${bold(head)} ${bar ? `${dim(bar)} ` : ""}${dim(clock)}`;
    },
  });

  // Загружаем ПОСЛЕ startPlayback: тот вешает слушателей, и плеер, умерший
  // сразу после запуска, иначе отправил бы 'exit' в пустоту.
  try {
    await backend.start();
    await backend.load(stream.audio_url);
  } catch (error) {
    playback.say(`${red("Не удалось запустить:")} ${(error as Error).message}`);
    playback.finish(1);
    return playback.done;
  }

  playback.say(`${cyan("♪")} ${bold(showTitle(show))}`);
  if (show.duration) playback.say(dim(`${formatDuration(show.duration)}  ·  ${tracklist.length} треков в треклисте`));
  if (degraded) {
    playback.say(`${yellow("!")} Играем через ${name}: перемотка перезапускает поток, громкость не меняется.`);
  }

  // Подсветка треклиста: сообщаем о смене трека, а не перерисовываем список —
  // в построчном выводе это единственный способ не залить экран.
  if (tracklist.length > 0) {
    const timer = setInterval(() => {
      const index = currentTrackIndex(tracklist, backend.status().positionSec);
      if (index < 0 || index === announcedTrack) return;
      announcedTrack = index;
      const item = tracklist[index];
      if (!item) return;
      playback.say(`  ${dim(formatDuration(item.timestamp_sec))} ${trackLine(item)}`);
    }, 2_000);
    timer.unref?.();
  }

  return playback.done;
}
