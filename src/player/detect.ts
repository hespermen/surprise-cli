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
 * Проверяем не `which`, а сам запуск: бинарь может лежать в PATH и при этом не
 * запускаться — битая установка, чужая архитектура, нет прав на исполнение.
 */
export async function isAvailable(binary: string): Promise<boolean> {
  try {
    await run(binary, [versionFlag(binary)], { timeout: 4_000 });
    return true;
  } catch {
    return false;
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

  if (preferred !== "ffplay" && (await isAvailable(mpvBinary))) {
    return { backend: new MpvBackend(mpvBinary), name: "mpv", degraded: false };
  }
  if (await isAvailable(ffplayBinary)) {
    return { backend: new FfplayBackend(ffplayBinary), name: "ffplay", degraded: true };
  }
  throw new NoAudioBackendError();
}
