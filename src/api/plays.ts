/**
 * Учёт прослушиваний.
 *
 * Механизма ДВА, и они не дублируют друг друга — оба нужны:
 *
 *   record-play (edge)  — только треки магазина. Пишет track_plays и, что
 *                         важнее, СПИСЫВАЕТ бесплатное прослушивание. Не позвав
 *                         её, мы слушаем бесплатные треки, не расходуя квоту —
 *                         то есть обходим ограничение, а не «экономим запрос».
 *   record_play (RPC)   — аналитика по всем поверхностям: выпуск, трек, эфир.
 *
 * Пороги и дедуп повторяют клиент сайта: расхождение здесь означало бы, что
 * статистика терминала не сравнима со статистикой веба.
 */

import { anonHeaders, authHeaders, callFunction, request, restUrl } from "../net/http.ts";

/** Сколько надо прослушать, чтобы засчитать бесплатное прослушивание трека. */
export const FREE_LISTEN_THRESHOLD_SEC = 30;

/** Сколько надо прослушать, чтобы событие попало в аналитику. */
export const ANALYTICS_THRESHOLD_MS = 10_000;

/** Одна и та же сущность не считается чаще, чем раз в полчаса. */
export const ANALYTICS_DEDUPE_MS = 30 * 60 * 1000;

export type PlayEntity = "show_audio" | "show_video" | "store_track" | "radio_channel";

/**
 * Дедуп аналитики.
 *
 * Состояние держится в памяти процесса: CLI живёт один сеанс прослушивания, и
 * переживать перезапуск этой памяти незачем — а вот класть её на диск значило бы
 * писать файл на каждый трек.
 */
export class PlayDeduper {
  readonly #seen = new Map<string, number>();
  readonly #windowMs: number;

  constructor(windowMs = ANALYTICS_DEDUPE_MS) {
    this.#windowMs = windowMs;
  }

  /** Можно ли засчитать сейчас. Отмечает как засчитанное, если да. */
  claim(entityType: PlayEntity, entityId: string, now = Date.now()): boolean {
    const key = `${entityType}:${entityId}`;
    const last = this.#seen.get(key);
    if (last !== undefined && now - last < this.#windowMs) return false;
    this.#seen.set(key, now);
    return true;
  }

  reset(): void {
    this.#seen.clear();
  }
}

/**
 * Аналитика по любой поверхности.
 *
 * Молча глотаем сбой: неудачная запись статистики не повод портить человеку
 * прослушивание. Право на вызов есть и у анонима (grant для anon), поэтому
 * токен необязателен.
 */
export async function recordPlayEvent(
  entityType: PlayEntity,
  entityId: string,
  sessionId: string,
  durationMs: number,
  accessToken: string | null,
): Promise<void> {
  await request(restUrl("rpc/record_play"), {
    method: "POST",
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
    body: {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_session_id: sessionId,
      p_duration_ms: Math.max(0, Math.round(durationMs)),
      p_context: { device: "cli", os: process.platform },
    },
    retries: 0,
    timeoutMs: 8_000,
  }).catch(() => {});
}

/** Старт трека магазина. Дедуп на 30 секунд делает сама функция. */
export async function recordTrackStart(
  trackId: string,
  releaseId: string,
  sessionId: string,
  accessToken: string | null,
): Promise<void> {
  await callFunction(
    "record-play",
    { track_id: trackId, release_id: releaseId, session_id: sessionId },
    { accessToken, retries: 0 },
  ).catch(() => {});
}

/**
 * Списание бесплатного прослушивания — через 30 секунд, один раз на трек.
 *
 * Зовётся ТОЛЬКО если store-stream ответил free_listen: true. В остальных
 * случаях списывать нечего, и лишний вызов исказил бы счётчик.
 *
 * listenerId обязателен и обязан быть устойчивым между запусками: именно по нему
 * сервер узнаёт, сколько раз этот человек уже слушал трек.
 */
export async function recordFreeListen(
  trackId: string,
  releaseId: string,
  sessionId: string,
  listenerId: string,
  listenedSec: number,
  accessToken: string | null,
): Promise<number | null> {
  const response = await callFunction<{ plays_left?: number }>(
    "record-play",
    {
      track_id: trackId,
      release_id: releaseId,
      session_id: sessionId,
      listener_id: listenerId,
      duration_listened: Math.round(listenedSec),
      free_listen: true,
    },
    { accessToken, retries: 0 },
  ).catch(() => null);

  return typeof response?.plays_left === "number" ? response.plays_left : null;
}

/**
 * Счётчик прослушанного для одного элемента.
 *
 * Считает именно ПРОСЛУШАННОЕ, а не прошедшее: пауза не должна набивать
 * статистику, иначе оставленный на ночь терминал «прослушает» выпуск восемь раз.
 */
export class ListenCounter {
  #accumulatedMs = 0;
  #since: number | null = null;

  start(now = Date.now()): void {
    if (this.#since === null) this.#since = now;
  }

  pause(now = Date.now()): void {
    if (this.#since === null) return;
    this.#accumulatedMs += now - this.#since;
    this.#since = null;
  }

  listenedMs(now = Date.now()): number {
    return this.#accumulatedMs + (this.#since === null ? 0 : now - this.#since);
  }

  listenedSec(now = Date.now()): number {
    return this.listenedMs(now) / 1000;
  }

  reset(): void {
    this.#accumulatedMs = 0;
    this.#since = null;
  }
}
