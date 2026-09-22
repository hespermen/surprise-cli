/**
 * Выпуски (шоу): список, резолв по ссылке, аудио и треклист.
 *
 * Гейтов у выпусков нет вообще — ни supporter, ни покупок. Это самая простая
 * часть каталога: show-stream отдаёт публичный объект Storage, который mpv
 * играет как обычный mp3 с поддержкой Range.
 */

import { ARCHIVED_FILTER, isHiddenFromSite } from "../lib/showVisibility.ts";
import type { EntityParam } from "../lib/publicId.ts";
import { anonHeaders, authHeaders, callFunction, request, restUrl } from "../net/http.ts";

export interface ShowArtist {
  id: string;
  name: string;
  slug: string | null;
}

export interface Show {
  id: string;
  public_id: number | null;
  slug: string | null;
  title: string | null;
  description: string | null;
  cover_url: string | null;
  duration: number | null;
  status: string | null;
  published_at: string | null;
  tracklist_disabled: boolean | null;
  artists: ShowArtist[];
}

interface ShowRow extends Omit<Show, "artists"> {
  show_artists: Array<{ artists: ShowArtist | null }> | null;
}

const SHOW_SELECT =
  "id,public_id,slug,title,description,cover_url,duration,status,published_at,tracklist_disabled," +
  "show_artists(artists(id,name,slug))";

function toShow(row: ShowRow): Show {
  const artists = (row.show_artists ?? [])
    .map((link) => link.artists)
    .filter((artist): artist is ShowArtist => artist !== null);
  const { show_artists: _ignored, ...rest } = row;
  return { ...rest, artists };
}

function headers(accessToken: string | null): Record<string, string> {
  return accessToken ? authHeaders(accessToken) : anonHeaders();
}

/**
 * Последние выпуски.
 *
 * `status=eq.published` — это список каталога, а не «всё, что пускает RLS»:
 * unlisted открывается по прямой ссылке, но в перечислениях ему не место.
 */
export async function listShows(
  options: { limit?: number; offset?: number; accessToken?: string | null } = {},
): Promise<Show[]> {
  const params = new URLSearchParams({
    select: SHOW_SELECT,
    status: "eq.published",
    order: "published_at.desc.nullslast",
    limit: String(options.limit ?? 30),
    offset: String(options.offset ?? 0),
  });
  const rows = (await request(restUrl(`shows_v2?${params}`), {
    headers: headers(options.accessToken ?? null),
  })) as ShowRow[] | null;
  return (rows ?? []).map(toShow);
}

/**
 * Найти выпуск по параметру ссылки — числовому public_id ИЛИ слагу.
 *
 * Разбирать обязаны оба вида: /episodes/837393 и /episodes/shuliko-surprise-fm
 * ведут на одну и ту же страницу, и обе ссылки ходят по интернету.
 */
export async function findShow(param: EntityParam, accessToken: string | null = null): Promise<Show | null> {
  const filter = param.isNumeric ? `public_id=eq.${param.publicId}` : `slug=eq.${encodeURIComponent(param.slug ?? "")}`;
  const rows = (await request(restUrl(`shows_v2?select=${encodeURIComponent(SHOW_SELECT)}&${filter}&limit=1`), {
    headers: headers(accessToken),
  })) as ShowRow[] | null;

  const row = rows?.[0];
  if (!row) return null;
  // Архив RLS пропускает автору и админу — на сайте его всё равно не показывают.
  if (isHiddenFromSite(row.status)) return null;
  return toShow(row);
}

/**
 * Поиск выпусков — по названию И по имени артиста.
 *
 * Искать по одному названию бесполезно: подавляющее большинство выпусков
 * называется «SURPRISE.FM» (иногда с датой), а различает их именно артист.
 * Запрос «shuliko» по названию не находил НИЧЕГО, хотя выпуск этого артиста в
 * этот момент шёл в эфире.
 *
 * Два запроса параллельно, как на сайте (src/pages/Search.tsx): PostgREST не
 * умеет OR через вложенную таблицу, а `artists!inner` работает только фильтром
 * по ней. Дедуп по id — выпуск может найтись обоими путями сразу.
 */
export async function searchShows(query: string, limit = 12, accessToken: string | null = null): Promise<Show[]> {
  const pattern = `%${query}%`;
  const auth = headers(accessToken);

  const byTitle = new URLSearchParams({
    select: SHOW_SELECT,
    title: `ilike.${pattern}`,
    order: "published_at.desc.nullslast",
    limit: String(limit),
  });
  // Архив отсекаем прямо в запросе, а не после выборки: иначе он съедал бы
  // места в лимите и выдача молча редела.
  byTitle.append("status", `not.in.${ARCHIVED_FILTER}`);

  const byArtist = new URLSearchParams({
    select: `show:show_id(${SHOW_SELECT}),artists:artist_id!inner(name)`,
    "artists.name": `ilike.${pattern}`,
    limit: String(limit),
  });

  const [titleRows, artistRows] = await Promise.all([
    request(restUrl(`shows_v2?${byTitle}`), { headers: auth }).catch(() => []) as Promise<ShowRow[]>,
    request(restUrl(`show_artists?${byArtist}`), { headers: auth }).catch(() => []) as Promise<
      Array<{ show: ShowRow | null }>
    >,
  ]);

  const found = new Map<string, Show>();
  for (const row of titleRows ?? []) found.set(row.id, toShow(row));
  for (const link of artistRows ?? []) {
    const row = link.show;
    // Вложенный выпуск приходит без фильтра статуса — отсекаем архив здесь.
    if (!row || found.has(row.id) || isHiddenFromSite(row.status)) continue;
    found.set(row.id, toShow(row));
  }

  return [...found.values()]
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, limit);
}

export interface ShowStream {
  audio_url: string | null;
  video_url: string | null;
}

/**
 * Адрес аудио выпуска.
 *
 * Берём именно через show-stream, а не поле shows_v2.audio_url из выборки: так
 * же делает плеер сайта, и функция остаётся единственным местом, где решается,
 * что именно отдавать.
 */
export function fetchShowStream(showId: string, accessToken: string | null = null): Promise<ShowStream> {
  return callFunction<ShowStream>("show-stream", { show_id: showId }, { accessToken });
}

export interface TracklistItem {
  id: string;
  position: number | null;
  timestamp_sec: number | null;
  end_timestamp_sec: number | null;
  artist: string | null;
  title: string | null;
  is_identified: boolean | null;
}

/**
 * Треклист выпуска по таймкодам.
 *
 * Пустой список при tracklist_disabled — не ошибка: автор мог отключить показ
 * треклистов, и строки в базе при этом остаются.
 */
export async function fetchTracklist(show: Show, accessToken: string | null = null): Promise<TracklistItem[]> {
  if (show.tracklist_disabled) return [];

  const params = new URLSearchParams({
    select: "id,position,timestamp_sec,end_timestamp_sec,artist,title,is_identified",
    show_id: `eq.${show.id}`,
    order: "timestamp_sec.asc.nullslast,position.asc",
  });
  const rows = (await request(restUrl(`show_tracklist?${params}`), {
    headers: headers(accessToken),
  })) as TracklistItem[] | null;
  return rows ?? [];
}

/**
 * Какой трек звучит на данной секунде.
 *
 * Возвращает индекс, а не сам элемент: вызывающему нужно и подсветить строку, и
 * понять, сменился ли трек с прошлой отрисовки.
 *
 * Границу берём по timestamp_sec следующего трека, а не по end_timestamp_sec
 * текущего: последний заполнен не везде, и опора на него оставляла бы дыры
 * между треками, в которых подсветка гасла.
 */
export function currentTrackIndex(items: readonly TracklistItem[], positionSec: number | null): number {
  if (positionSec === null || items.length === 0) return -1;

  let found = -1;
  for (const [index, item] of items.entries()) {
    const start = item.timestamp_sec;
    if (start === null || start > positionSec) break;
    found = index;
  }
  return found;
}
