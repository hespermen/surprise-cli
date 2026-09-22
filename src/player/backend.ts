/**
 * Общий интерфейс аудио-бэкенда.
 *
 * Бэкендов два и они неравны: mpv управляется по IPC и умеет всё, ffplay —
 * запасной вариант без управляющего канала. Различия вынесены в capability-флаги,
 * чтобы интерфейс не притворялся, будто ffplay умеет то, чего не умеет: лучше
 * спрятать в UI кнопку перемотки, чем молча её игнорировать.
 */

import { EventEmitter } from "node:events";

export interface PlaybackStatus {
  /** Текущая позиция в секундах; null — неизвестна или поток живой. */
  positionSec: number | null;
  /** Длительность в секундах; null для бесконечного потока. */
  durationSec: number | null;
  paused: boolean;
  /** Нечего играть. */
  idle: boolean;
}

export interface LoadOptions {
  /** С какой секунды начать. Для потока игнорируется. */
  startSec?: number;
}

export interface AudioBackendEvents {
  status: [PlaybackStatus];
  /** Файл доиграл до конца сам. */
  ended: [];
  /** Процесс плеера умер. Вызывающий решает, перезапускать ли. */
  exit: [{ code: number | null; signal: NodeJS.Signals | null }];
  error: [Error];
}

export interface AudioBackend {
  readonly name: string;
  readonly canSeek: boolean;
  readonly canSetVolume: boolean;
  /** Точность позиции: mpv отдаёт настоящую, ffplay считает по часам. */
  readonly positionIsExact: boolean;

  start(): Promise<void>;
  load(url: string, options?: LoadOptions): Promise<void>;
  setPaused(paused: boolean): Promise<void>;
  seek(seconds: number, mode: "absolute" | "relative"): Promise<void>;
  setVolume(percent: number): Promise<void>;
  stop(): Promise<void>;

  status(): PlaybackStatus;

  on<E extends keyof AudioBackendEvents>(
    event: E,
    listener: (...args: AudioBackendEvents[E]) => void,
  ): this;
}

export class BackendEmitter extends EventEmitter {
  override on<E extends keyof AudioBackendEvents>(
    event: E,
    listener: (...args: AudioBackendEvents[E]) => void,
  ): this {
    return super.on(event as string, listener as (...args: unknown[]) => void);
  }

  protected fire<E extends keyof AudioBackendEvents>(event: E, ...args: AudioBackendEvents[E]): void {
    // emit('error') без слушателя роняет процесс — для фонового плеера это
    // недопустимо: звук не главнее, чем остальной интерфейс.
    if (event === "error" && this.listenerCount("error") === 0) return;
    super.emit(event as string, ...args);
  }
}

export class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export const VOLUME_MIN = 0;
export const VOLUME_MAX = 130;

/** Громкость за пределами диапазона mpv ломает звук — зажимаем на входе. */
export function clampVolume(percent: number): number {
  if (!Number.isFinite(percent)) return 100;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(percent)));
}
