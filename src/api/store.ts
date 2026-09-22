/**
 * Треки магазина: доступ, превью, метаданные.
 *
 * Единственное место каталога, где есть гейт. Решает его СЕРВЕР — store-stream
 * сам смотрит покупку, подписку и квоту бесплатных прослушиваний. CLI ничего не
 * проверяет и не должен: любая клиентская проверка была бы и лишней, и неверной.
 */

import { callFunction, chunk, request, restUrl, authHeaders, anonHeaders, ApiError } from "../net/http.ts";
import { previewWindow, type PreviewWindow } from "../lib/previewWindow.ts";

export interface StoreTrack {
  id: string;
  title: string | null;
  artist_name: string | null;
  duration: number | null;
  position: number | null;
  release_id: string | null;
  preview_start_sec: number | null;
  preview_duration_sec: number | null;
  releaseTitle: string | null;
}

interface StoreTrackRow extends Omit<StoreTrack, "releaseTitle"> {
  releases: { title: string | null } | null;
}

const TRACK_SELECT =
  "id,title,artist_name,duration,position,release_id,preview_start_sec,preview_duration_sec,releases(title)";

function toTrack(row: StoreTrackRow): StoreTrack {
  const { releases, ...rest } = row;
  return { ...rest, releaseTitle: releases?.title ?? null };
}

export async function fetchTrack(trackId: string, accessToken: string | null = null): Promise<StoreTrack | null> {
  const params = new URLSearchParams({ select: TRACK_SELECT, id: `eq.${trackId}`, limit: "1" });
  const rows = (await request(restUrl(`store_tracks?${params}`), {
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
  })) as StoreTrackRow[] | null;
  const row = rows?.[0];
  return row ? toTrack(row) : null;
}

export async function listReleaseTracks(
  releaseId: string,
  accessToken: string | null = null,
): Promise<StoreTrack[]> {
  const params = new URLSearchParams({
    select: TRACK_SELECT,
    release_id: `eq.${releaseId}`,
    order: "position.asc.nullslast",
  });
  const rows = (await request(restUrl(`store_tracks?${params}`), {
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
  })) as StoreTrackRow[] | null;
  return (rows ?? []).map(toTrack);
}

// ── Доступ к воспроизведению ──

export type AccessKind =
  /** Полный трек: куплен или доступен по подписке. */
  | "full"
  /** Полный трек в счёт бесплатных прослушиваний. */
  | "free_listen"
  /** Только превью — обрезаем сами. */
  | "preview";

export interface TrackAccess {
  kind: AccessKind;
  url: string;
  /** HLS-плейлист: mpv играет его как есть, ffplay тоже умеет. */
  isHls: boolean;
  playsLeft: number | null;
  /** Когда ссылка перестанет работать. */
  issuedAt: number;
  /** Окно превью — только для kind === "preview". */
  window: PreviewWindow | null;
}

interface StoreStreamResponse {
  url?: string;
  hls?: boolean;
  free_listen?: boolean;
  plays_left?: number;
  plays_used?: number;
  error?: string;
  reason?: string;
}

/**
 * Подписанные ссылки живут недолго: store-stream отдаёт 900 секунд, превью —
 * 1800. Пауза в терминале на полчаса — обычное дело, поэтому перед
 * возобновлением ссылку надо перерезолвить, а не тыкать протухшей.
 */
export const SIGNED_URL_TTL_SEC = 900;
const RERESOLVE_AFTER_SEC = 600;

export function needsReresolve(access: TrackAccess, nowSec = Math.floor(Date.now() / 1000)): boolean {
  // Для превью запас больше (TTL 1800), но единый порог проще и безопаснее:
  // лишний перерезолв стоит одного запроса, протухшая ссылка — тишины.
  return nowSec - access.issuedAt >= RERESOLVE_AFTER_SEC;
}

/** Человеческое объяснение отказа. Причины различаются, и это важно. */
export function explainDenial(reason: string | undefined, fallback: string): string {
  switch (reason) {
    case "limit_reached":
      return "Бесплатные прослушивания этого трека закончились. Полный трек — по подписке или после покупки.";
    case "not_released":
      return "Релиз ещё не вышел.";
    case "no_owner":
    case "track_not_found":
      return "Трек не найден или снят с продажи.";
    default:
      return fallback;
  }
}

export class TrackAccessDeniedError extends Error {
  readonly reason: string | undefined;

  constructor(reason: string | undefined, fallback: string) {
    super(explainDenial(reason, fallback));
    this.name = "TrackAccessDeniedError";
    this.reason = reason;
  }
}

/**
 * Получить адрес для воспроизведения трека.
 *
 * session_id — это УСТОЙЧИВЫЙ listener_id, а не идентификатор запуска: по нему
 * сервер считает квоту бесплатных прослушиваний. Подставив сюда разовое
 * значение, мы бы начисляли себе новую квоту при каждом запуске CLI.
 */
export async function resolveTrackAccess(
  track: StoreTrack,
  listenerId: string,
  accessToken: string | null,
): Promise<TrackAccess> {
  const issuedAt = Math.floor(Date.now() / 1000);

  try {
    const data = await callFunction<StoreStreamResponse>(
      "store-stream",
      { track_id: track.id, session_id: listenerId },
      { accessToken, retries: 0 },
    );

    if (data.url) {
      return {
        kind: data.free_listen === true ? "free_listen" : "full",
        url: data.url,
        isHls: data.hls === true,
        playsLeft: typeof data.plays_left === "number" ? data.plays_left : null,
        issuedAt,
        window: null,
      };
    }
    throw new TrackAccessDeniedError(data.reason, data.error ?? "Доступ к треку не выдан");
  } catch (error) {
    if (error instanceof TrackAccessDeniedError) throw error;

    // 403 — это не сбой, а осмысленный ответ: сервер объясняет, чего не хватает.
    if (error instanceof ApiError && error.status === 403) {
      const body = (error.body ?? {}) as StoreStreamResponse;
      const denial = new TrackAccessDeniedError(body.reason, body.error ?? error.message);

      // Полного трека не дали — но превью доступно всем и без входа.
      const preview = await fetchPreviewUrls([track.id], accessToken).catch(() => new Map<string, string>());
      const url = preview.get(track.id);
      if (!url) throw denial;

      return {
        kind: "preview",
        url,
        isHls: false,
        playsLeft: typeof body.plays_left === "number" ? body.plays_left : 0,
        issuedAt,
        window: previewWindow(track),
      };
    }
    throw error;
  }
}

/**
 * Подписанные ссылки на превью, батчем.
 *
 * Функция принимает до 50 идентификаторов за раз — режем сами, иначе хвост
 * списка молча потеряется.
 */
export async function fetchPreviewUrls(
  trackIds: readonly string[],
  accessToken: string | null,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (trackIds.length === 0) return urls;

  for (const part of chunk(trackIds, 50)) {
    const data = await callFunction<{ urls?: Record<string, string> }>(
      "preview-stream",
      { track_ids: part },
      { accessToken, retries: 1 },
    );
    for (const [id, url] of Object.entries(data.urls ?? {})) urls.set(id, url);
  }
  return urls;
}
