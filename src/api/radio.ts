/**
 * Эфир: какой поток играть, что в нём сейчас, и отметка присутствия.
 */

import { FALLBACK_STREAM, NOWPLAYING_INTERVAL_MS } from "../config.ts";
import {
  firstEntryFromPlaylist,
  forceHttps,
  needsPlaylistResolve,
  normalizeBackupMode,
  resolveBackupActive,
  resolveLiveStreamUrl,
} from "../lib/backupStream.ts";
import { anonHeaders, authHeaders, callFunction, request, restUrl } from "../net/http.ts";

export interface StationSettings {
  stream_url: string | null;
  backup_stream_url: string | null;
  backup_stream_mode: string | null;
  metadata_url: string | null;
}

export interface RadioShow {
  slug: string;
  title: string | null;
  cover_url: string | null;
  public_id: number | null;
  description: string | null;
  artists?: string[];
}

export interface RadioItem {
  artist: string | null;
  title: string | null;
  text: string | null;
  /** Unix-время в секундах, когда трек поставили. */
  played_at: number | null;
  /** Длительность в секундах. */
  duration: number | null;
  show: RadioShow | null;
}

export interface RadioSchedule {
  now: RadioItem | null;
  next: RadioItem | null;
  history: RadioItem[];
  is_online: boolean;
}

export async function fetchStationSettings(): Promise<StationSettings | null> {
  const params = new URLSearchParams({
    select: "stream_url,backup_stream_url,backup_stream_mode,metadata_url",
    limit: "1",
  });
  try {
    const rows = (await request(restUrl(`station_settings?${params}`), {
      headers: anonHeaders(),
    })) as StationSettings[] | null;
    return rows?.[0] ?? null;
  } catch {
    // Настройки недоступны — не повод молчать в эфире, ниже есть FALLBACK_STREAM.
    return null;
  }
}

/**
 * Адрес потока для основной станции.
 *
 * hasCurrentEfir здесь всегда false: «ручной эфир» — это состояние студии на
 * сайте, у CLI его нет. Поэтому режим 'auto' даёт основной поток, а резервный
 * включается только явным 'on' из админки.
 */
export async function resolveLiveStream(settings: StationSettings | null): Promise<string> {
  const primary = settings?.stream_url || FALLBACK_STREAM;
  const backup = settings?.backup_stream_url || FALLBACK_STREAM;
  const mode = normalizeBackupMode(settings?.backup_stream_mode);
  const active = resolveBackupActive(mode, false);

  const chosen = forceHttps(resolveLiveStreamUrl({ active, primaryUrl: primary, backupUrl: backup }));
  if (!needsPlaylistResolve(chosen)) return chosen;

  try {
    // Здесь редирект штатный: раздачи аудио и плейлисты постоянно перебрасывают
    // на ближайший узел. Тела в этом запросе нет, заголовков тоже (см. ниже),
    // так что уводить с собой нечего — в отличие от запросов к нашему API.
    const body = (await request(chosen, { headers: {}, retries: 1, followRedirects: true })) as unknown;
    const entry = typeof body === "string" ? firstEntryFromPlaylist(body) : null;
    return entry ? forceHttps(entry) : chosen;
  } catch {
    // Плейлист не открылся — отдадим как есть: mpv умеет разворачивать сам.
    return chosen;
  }
}

export function fetchRadioSchedule(): Promise<RadioSchedule> {
  return callFunction<RadioSchedule>("radio-schedule", {}, { timeoutMs: 10_000, retries: 1 });
}

export const SCHEDULE_INTERVAL_MS = NOWPLAYING_INTERVAL_MS;

/**
 * Подпись эфира: «<название шоу> w/ <артист>».
 * Порт из src/lib/showLabel.ts (через extension/src/lib/radio.ts).
 */
export function showLabel(input: { title?: string | null; artistName?: string | null }): string {
  const title = (input.title || "").trim();
  const artist = (input.artistName || "").trim();

  if (!artist) return title;
  if (!title) return artist;
  // Повтор: дата в тайтле — служебная строка, а не название программы.
  if (/\d{1,2}\.\d{1,2}\.\d{2,4}/.test(title)) return artist;

  const lowerTitle = title.toLowerCase();
  const lowerArtist = artist.toLowerCase();
  if (lowerTitle === lowerArtist) return artist;
  if (lowerTitle.includes(lowerArtist)) return title;

  return `${title} w/ ${artist}`;
}

/** Строка эфира: артисты выпуска, иначе artist из AzuraCast, иначе заголовок. */
export function formatRadioItem(item: RadioItem | null): string {
  if (!item) return "";
  const showArtists = (item.show?.artists || []).map((a) => a.trim()).filter(Boolean);
  const artist = showArtists.join(", ") || (item.artist || "").trim();
  const label = showLabel({ title: item.show?.title, artistName: artist });
  return label || (item.title || "").trim() || item.text || "";
}

/**
 * Сколько секунд уже играет текущий элемент эфира.
 *
 * AzuraCast отдаёт played_at — момент постановки, а не позицию. Считаем сами и
 * зажимаем в границы: часы клиента и сервера расходятся, а отрицательный или
 * больший длительности прогресс рисует чепуху.
 */
export function elapsedSec(item: RadioItem | null, nowSec = Math.floor(Date.now() / 1000)): number | null {
  if (!item?.played_at) return null;
  const elapsed = nowSec - item.played_at;
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  if (item.duration && elapsed > item.duration) return item.duration;
  return elapsed;
}

// ── Присутствие слушателя ──

/**
 * UUID главной станции. На сайте она живёт под виртуальным id "station-live",
 * но в БД это обычная строка radio_channels со слагом 'live' — heartbeat хочет
 * настоящий uuid.
 */
export async function fetchLiveChannelId(): Promise<string | null> {
  const params = new URLSearchParams({ select: "id", slug: "eq.live", limit: "1" });
  try {
    const rows = (await request(restUrl(`radio_channels?${params}`), {
      headers: anonHeaders(),
    })) as Array<{ id: string }> | null;
    return rows?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

function rpcUrl(name: string): string {
  return restUrl(`rpc/${name}`);
}

/** Контекст присутствия. Честно сообщаем, что это терминал, а не браузер. */
export function presenceContext(): Record<string, string> {
  return {
    device: "cli",
    os: process.platform,
    browser: "surprise-cli",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
  };
}

export async function sendHeartbeat(
  channelId: string,
  sessionId: string,
  accessToken: string | null,
): Promise<void> {
  await request(rpcUrl("radio_heartbeat"), {
    method: "POST",
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
    body: { p_channel: channelId, p_session: sessionId, p_context: presenceContext() },
    retries: 0,
    timeoutMs: 8_000,
  }).catch(() => {
    // Отметка присутствия — украшение счётчика слушателей, ронять из-за неё
    // воспроизведение нельзя.
  });
}

/**
 * Уйти из эфира. Без этого строка присутствия висит до TTL (45 с) и счётчик
 * слушателей врёт в большую сторону.
 */
export async function leavePresence(sessionId: string, accessToken: string | null): Promise<void> {
  await request(rpcUrl("radio_presence_leave"), {
    method: "POST",
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
    body: { p_session: sessionId },
    retries: 0,
    timeoutMs: 4_000,
  }).catch(() => {});
}
