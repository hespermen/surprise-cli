/**
 * surprise radio — играть эфир.
 *
 * Эфир публичный, поэтому команда обязана работать и без входа: это её
 * нормальный режим, а не деградация.
 */

import {
  SCHEDULE_INTERVAL_MS,
  elapsedSec,
  fetchLiveChannelId,
  fetchRadioSchedule,
  fetchStationSettings,
  formatRadioItem,
  leavePresence,
  resolveLiveStream,
  sendHeartbeat,
  type RadioItem,
} from "../api/radio.ts";
import { HEARTBEAT_INTERVAL_MS } from "../config.ts";
import { formatDuration, progressBar, truncate } from "../lib/format.ts";
import { getSessionId } from "../lib/ids.ts";
import { getValidSession } from "../net/auth.ts";
import { NoAudioBackendError, pickBackend } from "../player/detect.ts";
import { logoRows } from "../ui/logo.ts";
import { startPlayback, stateMark } from "../ui/playback.ts";
import { bold, cyan, dim, green, red, terminalWidth, yellow } from "../ui/term.ts";

export async function radioCommand(argv: readonly string[]): Promise<number> {
  const asJson = argv.includes("--json");

  const settings = await fetchStationSettings();
  const streamUrl = await resolveLiveStream(settings);

  if (asJson) {
    // Машиночитаемый режим ничего не играет: он отвечает на вопрос «что в эфире»
    // и завершается — таким его удобно звать из скрипта и из строки статуса.
    const schedule = await fetchRadioSchedule().catch(() => null);
    process.stdout.write(
      `${JSON.stringify({
        stream_url: streamUrl,
        is_online: schedule?.is_online ?? null,
        now: schedule?.now ? { label: formatRadioItem(schedule.now), show: schedule.now.show } : null,
        next: schedule?.next ? { label: formatRadioItem(schedule.next) } : null,
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
  const session = await getValidSession();
  const accessToken = session?.access_token ?? null;
  const sessionId = getSessionId();
  const channelId = await fetchLiveChannelId();

  let current: RadioItem | null = null;

  const playback = startPlayback({
    backend,
    describe: () => formatRadioItem(current) || "эфир",
    hint: "space — пауза, q — выход",
    cleanup: async () => {
      // Присутствие снимаем явно: иначе строка висит до TTL и счётчик
      // слушателей врёт в большую сторону.
      if (channelId) await leavePresence(sessionId, accessToken);
      process.stdout.write("Эфир остановлен.\n");
    },
    // Позиция берётся не у плеера, а из расписания: у бесконечного потока своей
    // позиции нет, а человеку интересно, сколько уже идёт текущий выпуск.
    progress: () => ({ position: elapsedSec(current), total: current?.duration ?? null }),
    render: (state, position, total, width) => {
      const clock = total ? `${formatDuration(position)} / ${formatDuration(total)}` : formatDuration(position);
      const bar = progressBar(position, total, Math.max(0, Math.min(20, width - 46)));
      const head = truncate(formatRadioItem(current) || "эфир", Math.max(10, width - clock.length - bar.length - 8));
      return `${stateMark(state)} ${bold(head)} ${bar ? `${dim(bar)} ` : ""}${dim(clock)}`;
    },
  });

  // Загружаем ПОСЛЕ startPlayback — см. комментарий про порядок подписки там же.
  try {
    await backend.start();
    await backend.load(streamUrl);
  } catch (error) {
    playback.say(`${red("Не удалось запустить поток:")} ${(error as Error).message}`);
    playback.finish(1);
    return playback.done;
  }

  // Вместо адреса потока — логотип станции.
  //
  // Адрес был отладочным следом: слушателю он ничего не говорит, а строку
  // занимал самую заметную — первую после запуска. Кому он нужен по делу,
  // берёт его из `surprise radio --json`, где он и должен быть.
  const logo = logoRows(terminalWidth());
  playback.say(logo ? dim(logo.join("\n")) : `${green("▶")} ${bold("SURPRISE.FM")}`);
  if (degraded) {
    playback.say(`${yellow("!")} Играем через ${name}: без плавной перемотки и регулировки громкости.`);
  }

  const refreshSchedule = async () => {
    const schedule = await fetchRadioSchedule().catch(() => null);
    if (!schedule) return;

    const label = formatRadioItem(schedule.now);
    const previous = formatRadioItem(current);
    current = schedule.now;

    if (label && label !== previous) {
      playback.say(`${cyan("♪")} ${bold(label)}`);
      const description = schedule.now?.show?.description?.replace(/\s+/g, " ").trim();
      if (description) playback.say(`  ${dim(truncate(description, 76))}`);
    }
  };

  await refreshSchedule();
  const scheduleTimer = setInterval(() => void refreshSchedule(), SCHEDULE_INTERVAL_MS);
  scheduleTimer.unref?.();

  if (channelId) {
    await sendHeartbeat(channelId, sessionId, accessToken);
    const heartbeatTimer = setInterval(
      () => void sendHeartbeat(channelId, sessionId, accessToken),
      HEARTBEAT_INTERVAL_MS,
    );
    heartbeatTimer.unref?.();
  }

  return playback.done;
}
