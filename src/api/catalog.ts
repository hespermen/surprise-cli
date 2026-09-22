/**
 * Каталог: артисты, авторы, релизы.
 *
 * Всё публичное — читается прямым PostgREST с anon-ключом, вход не нужен.
 * RLS сам отсекает неактивных артистов и неопубликованные релизы, но тому, что
 * он НЕ отсекает (архивные выпуски), фильтр ставим сами — см. showVisibility.
 */

import { anonHeaders, authHeaders, request, restUrl } from "../net/http.ts";

function headers(accessToken: string | null): Record<string, string> {
  return accessToken ? authHeaders(accessToken) : anonHeaders();
}

export interface Artist {
  id: string;
  public_id: number | null;
  slug: string | null;
  name: string;
  bio: string | null;
  is_resident: boolean | null;
}

export async function listArtists(
  options: { limit?: number; accessToken?: string | null; residentsOnly?: boolean } = {},
): Promise<Artist[]> {
  const params = new URLSearchParams({
    select: "id,public_id,slug,name,bio,is_resident",
    is_active: "eq.true",
    order: "name.asc",
    limit: String(options.limit ?? 200),
  });
  // Резидент — отдельный статус, а не «первый в сортировке». Раздел сайта
  // /browse/residents показывает именно их, и смешивать туда весь каталог
  // артистов значит подменять смысл раздела.
  if (options.residentsOnly !== false) params.append("is_resident", "eq.true");
  const rows = (await request(restUrl(`artists?${params}`), {
    headers: headers(options.accessToken ?? null),
  })) as Artist[] | null;
  return rows ?? [];
}

/**
 * Поиск артистов идёт через RPC, а не ilike по имени.
 *
 * search_artists ищет ещё и по алиасам (artists.aliases) и ставит префиксные
 * совпадения первыми. Свой ilike по name нашёл бы меньше и в худшем порядке.
 */
export async function searchArtists(
  query: string,
  limit = 20,
  accessToken: string | null = null,
): Promise<Artist[]> {
  const rows = (await request(restUrl("rpc/search_artists"), {
    method: "POST",
    headers: headers(accessToken),
    body: { p_q: query, p_limit: limit },
  })) as Array<{ id: string; name: string; slug: string | null; public_id: number | null }> | null;

  return (rows ?? []).map((row) => ({
    id: row.id,
    public_id: row.public_id,
    slug: row.slug,
    name: row.name,
    bio: null,
    is_resident: null,
  }));
}

export interface Host {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  is_verified: boolean | null;
}

/** Авторы (резиденты). public_id у них нет — ссылка всегда по слагу. */
export async function listHosts(
  accessToken: string | null = null,
  limit = 200,
  verifiedOnly = true,
): Promise<Host[]> {
  const params = new URLSearchParams({
    select: "id,slug,name,bio,is_verified",
    order: "name.asc",
    limit: String(limit),
  });
  // hosts содержит и неактивные, и служебные записи — без фильтра список
  // превращается в свалку, по которой невозможно найти живого автора.
  if (verifiedOnly) params.append("is_verified", "eq.true");
  const rows = (await request(restUrl(`hosts?${params}`), {
    headers: headers(accessToken),
  })) as Host[] | null;
  return rows ?? [];
}

export interface Release {
  id: string;
  public_id: number | null;
  slug: string;
  title: string;
  release_date: string | null;
  type: string | null;
  artists: string[];
}

interface ReleaseRow extends Omit<Release, "artists"> {
  release_artists: Array<{ position: number | null; artists: { name: string } | null }> | null;
}

function toRelease(row: ReleaseRow): Release {
  const artists = (row.release_artists ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((link) => link.artists?.name)
    .filter((name): name is string => !!name);
  const { release_artists: _ignored, ...rest } = row;
  return { ...rest, artists };
}

export async function listReleases(accessToken: string | null = null, limit = 100): Promise<Release[]> {
  const params = new URLSearchParams({
    select: "id,public_id,slug,title,release_date,type,release_artists(position,artists(name))",
    is_published: "eq.true",
    order: "release_date.desc.nullslast",
    limit: String(limit),
  });
  const rows = (await request(restUrl(`releases?${params}`), {
    headers: headers(accessToken),
  })) as ReleaseRow[] | null;
  return (rows ?? []).map(toRelease);
}

/** Выпуски конкретного артиста — для панели деталей и «играть всё». */
export async function showsByArtist(
  artistId: string,
  accessToken: string | null = null,
  limit = 50,
): Promise<Array<{ id: string; title: string | null; duration: number | null }>> {
  const params = new URLSearchParams({
    select: "shows_v2(id,title,duration,status,published_at)",
    artist_id: `eq.${artistId}`,
    limit: String(limit),
  });
  const rows = (await request(restUrl(`show_artists?${params}`), {
    headers: headers(accessToken),
  })) as Array<{
    shows_v2: { id: string; title: string | null; duration: number | null; status: string | null } | null;
  }> | null;

  return (rows ?? [])
    .map((row) => row.shows_v2)
    .filter(
      (show): show is { id: string; title: string | null; duration: number | null; status: string | null } =>
        show !== null && show.status !== "archived",
    )
    .map(({ id, title, duration }) => ({ id, title, duration }));
}

/** Выпуски автора — для перехода внутрь карточки. */
export async function showsByHost(
  hostId: string,
  accessToken: string | null = null,
  limit = 100,
): Promise<Array<{ id: string; title: string | null; duration: number | null; published_at: string | null }>> {
  const params = new URLSearchParams({
    select: "id,title,duration,published_at",
    host_id: `eq.${hostId}`,
    status: "eq.published",
    order: "published_at.desc.nullslast",
    limit: String(limit),
  });
  const rows = (await request(restUrl(`shows_v2?${params}`), {
    headers: headers(accessToken),
  })) as Array<{ id: string; title: string | null; duration: number | null; published_at: string | null }> | null;
  return rows ?? [];
}
