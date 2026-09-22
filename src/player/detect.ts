/**
 * Выбор аудио-бэкенда.
 *
 * Порядок не случаен: mpv управляется по IPC и умеет всё, ffplay — грубая
 * замена без управляющего канала. Если нет ни того, ни другого, мы обязаны
 * сказать это внятно и сразу, с командой установки под систему пользователя:
 * «ничего не играет» без объяснения — худший вид отказа.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { AudioBackend } from "./backend.ts";
import { FfplayBackend } from "./ffplay.ts";
import { MpvBackend } from "./mpv.ts";

const run = promisify(execFile);

export type BackendName = "mpv" | "ffplay";

/**
 * Флаг версии у каждого свой.
 *
 * mpv понимает `--version`, а инструменты ffmpeg — только `-version` с ОДНИМ
 * дефисом: на `--version` ffplay печатает версию, но выходит с кодом 1. Проверка
 * по коду возврата из-за этого объявляла установленный ffplay отсутствующим, и
 * CLI предлагал ставить плеер поверх уже стоящего.
 */
const VERSION_FLAG: Record<string, string> = { ffplay: "-version", ffmpeg: "-version" };

function versionFlag(binary: string): string {
  const name = binary.replace(/\.exe$/i, "").split(/[\\/]/).pop() ?? binary;
  return VERSION_FLAG[name] ?? "--version";
}

/**
 * Сколько ждём ответа на --version.
 *
 * Щедро, и намеренно: на macOS ПЕРВЫЙ запуск только что установленного бинаря
 * занимает секунды — Gatekeeper проверяет подпись. С прежними четырьмя
 * секундами свежий `brew install mpv` не успевал ответить, детектор объявлял mpv
 * отсутствующим и молча уходил на ffplay. Человек ставил mpv по нашей же
 * подсказке и всё равно получал деградированный режим.
 */
const DETECT_TIMEOUT_MS = 12_000;

/**
 * Проверяем не `which`, а сам запуск: бинарь может лежать в PATH и при этом не
 * запускаться — битая установка, чужая архитектура, нет прав на исполнение.
 *
 * Вопрос, на который отвечает функция, — «получится ли его запустить», а не
 * «нравится ли ему флаг --version». Поэтому недоступным считаем только то, что
 * действительно означает недоступность: бинаря нет, он не исполняемый, путь
 * битый. Ненулевой код возврата и даже таймаут доказывают обратное — процесс
 * запустился, значит плеер есть.
 */
const MISSING_CODES = new Set(["ENOENT", "EACCES", "ENOTDIR", "EPERM"]);

export async function isAvailable(binary: string): Promise<boolean> {
  try {
    await run(binary, [versionFlag(binary)], { timeout: DETECT_TIMEOUT_MS });
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return !(typeof code === "string" && MISSING_CODES.has(code));
  }
}

export interface BackendChoice {
  backend: AudioBackend;
  name: BackendName;
  /** true — взяли запасной, часть возможностей недоступна. */
  degraded: boolean;
}

export function installHint(): string {
  switch (process.platform) {
    case "darwin":
      return "brew install mpv";
    case "win32":
      return "winget install mpv";
    default:
      return "apt install mpv  (или dnf/pacman — пакет называется так же)";
  }
}

export class NoAudioBackendError extends Error {
  constructor() {
    super(
      `Не нашли, чем играть звук. Поставьте mpv:\n  ${installHint()}\n` +
        "Подойдёт и ffplay из пакета ffmpeg, но с ним не будет плавной перемотки и регулировки громкости.",
    );
    this.name = "NoAudioBackendError";
  }
}

export async function pickBackend(preferred?: BackendName): Promise<BackendChoice> {
  const mpvBinary = process.env.SURPRISE_MPV ?? "mpv";
  const ffplayBinary = process.env.SURPRISE_FFPLAY ?? "ffplay";

  // SURPRISE_BACKEND=mpv|ffplay — принудительный выбор. Нужен ровно тогда, когда
  // автоопределение ошиблось: без него человеку остаётся только гадать, почему
  // взялся не тот плеер.
  const forced = process.env.SURPRISE_BACKEND;
  const wanted = preferred ?? (forced === "mpv" || forced === "ffplay" ? forced : undefined);

  if (wanted === "mpv") {
    if (!(await isAvailable(mpvBinary))) throw new NoAudioBackendError();
    return { backend: new MpvBackend(mpvBinary), name: "mpv", degraded: false };
  }

  if (wanted !== "ffplay" && (await isAvailable(mpvBinary))) {
    return { backend: new MpvBackend(mpvBinary), name: "mpv", degraded: false };
  }
  if (await isAvailable(ffplayBinary)) {
    return { backend: new FfplayBackend(ffplayBinary), name: "ffplay", degraded: true };
  }
  throw new NoAudioBackendError();
}
