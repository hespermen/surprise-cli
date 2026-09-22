/**
 * Библиотека аккаунта: плейлисты, лайки, находки, сохранённое, подписки.
 *
 * Всё читается прямым PostgREST под токеном пользователя — отдельные
 * edge-функции здесь не нужны. Важно помнить, что «приватность» у этих таблиц
 * разная: saves и track_finds доступны ТОЛЬКО владельцу, а likes и subscriptions
 * видны и чужим, если человек это разрешил в настройках профиля.
 */

import { authHeaders, chunk, request, restUrl } from "../net/http.ts";
import { isHiddenFromSite } from "../lib/showVisibility.ts";

export interface PlaylistSummary {
  id: string;
  public_id: number | null;
  slug: string | null;
  title: string;
  description: string | null;
  is_public: boolean | null;
  is_system: boolean;
  itemCount: number;
}

interface PlaylistRow {
  id: string;
  public_id: number | null;
  slug: string | null;
  title: string;
  description: string | null;
  is_public: boolean | null;
  is_system: boolean | null;
  playlist_items: Array<{ count: number }> | null;
}

function toPlaylist(row: PlaylistRow): PlaylistSummary {
  return {
    id: row.id,
    public_id: row.public_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    is_public: row.is_public,
    is_system: row.is_system === true,
    itemCount: row.playlist_items?.[0]?.count ?? 0,
  };
}

const PLAYLIST_SELECT = "id,public_id,slug,title,description,is_public,is_system,playlist_items(count)";

export async function listPlaylists(accessToken: string, userId: string): Promise<PlaylistSummary[]> {
  const params = new URLSearchParams({
    select: PLAYLIST_SELECT,
    author_id: `eq.${userId}`,
    order: "created_at.desc",
  });
  const rows = (await request(restUrl(`playlists?${params}`), {
    headers: authHeaders(accessToken),
  })) as PlaylistRow[] | null;
  return (rows ?? []).map(toPlaylist);
}

export interface PlaylistEntry {
  /** Что это: выпуск или трек магазина. */
  kind: "show" | "track";
  id: string;
  title: string;
  subtitle: string | null;
  durationSec: number | null;
  position: number | null;
}

interface PlaylistItemRow {
  position: number | null;
  show_id: string | null;
  store_track_id: string | null;
  shows_v2: {
    id: string;
    title: string | null;
    duration: number | null;
    status: string | null;
    show_artists: Array<{ artists: { name: string } | null }> | null;
  } | null;
  store_tracks: {
    id: string;
    title: string | null;
    duration: number | null;
    artist_name: string | null;
    releases: { title: string | null } | null;
  } | null;
}

/**
 * Содержимое плейлиста.
 *
 * playlist_items полиморфна: два nullable внешних ключа без дискриминатора —
 * выпуск ИЛИ трек магазина. Разбираем по тому, какой из них заполнен.
 */
export async function listPlaylistItems(accessToken: string, playlistId: string): Promise<PlaylistEntry[]> {
  const params = new URLSearchParams({
    select:
      "position,show_id,store_track_id," +
      "shows_v2(id,title,duration,status,show_artists(artists(name)))," +
      "store_tracks(id,title,duration,artist_name,releases(title))",
    playlist_id: `eq.${playlistId}`,
    order: "position.asc.nullslast",
  });
  const rows = (await request(restUrl(`playlist_items?${params}`), {
    headers: authHeaders(accessToken),
  })) as PlaylistItemRow[] | null;

  const entries: PlaylistEntry[] = [];
  for (const row of rows ?? []) {
    const show = row.shows_v2;
    if (show) {
      // Архив не показываем даже в своём плейлисте: на сайте его нет, и терминал
      // не должен становиться единственным местом, где он виден.
      if (isHiddenFromSite(show.status)) continue;
      const artists = (show.show_artists ?? [])
        .map((link) => link.artists?.name)
        .filter((name): name is string => !!name)
        .join(", ");
      entries.push({
        kind: "show",
        id: show.id,
        title: show.title ?? "Без названия",
        subtitle: artists || null,
        durationSec: show.duration,
        position: row.position,
      });
      continue;
    }

    const track = row.store_tracks;
    if (track) {
      entries.push({
        kind: "track",
        id: track.id,
        title: track.title ?? "Без названия",
        subtitle: track.artist_name ?? track.releases?.title ?? null,
        durationSec: track.duration,
        position: row.position,
      });
    }
  }
  return entries;
}

// ── Лайки ──

export type LikeTarget = "show" | "track" | "release" | "playlist";

const LIKE_COLUMN: Record<LikeTarget, string> = {
  show: "show_id",
  track: "store_track_id",
  release: "store_release_id",
  playlist: "playlist_id",
};

export interface LikedShow {
  id: string;
  public_id: number | null;
  slug: string | null;
  title: string | null;
  duration: number | null;
  artists: string[];
}

export async function listLikedShows(accessToken: string, userId: string, limit = 50): Promise<LikedShow[]> {
  const params = new URLSearchParams({
    select: "created_at,shows_v2(id,public_id,slug,title,duration,status,show_artists(artists(name)))",
    user_id: `eq.${userId}`,
    show_id: "not.is.null",
    order: "created_at.desc",
    limit: String(limit),
  });
  const rows = (await request(restUrl(`likes?${params}`), {
    headers: authHeaders(accessToken),
  })) as Array<{
    shows_v2: {
      id: string;
      public_id: number | null;
      slug: string | null;
      title: string | null;
      duration: number | null;
      status: string | null;
      show_artists: Array<{ artists: { name: string } | null }> | null;
    } | null;
  }> | null;

  const shows: LikedShow[] = [];
  for (const row of rows ?? []) {
    const show = row.shows_v2;
    if (!show || isHiddenFromSite(show.status)) continue;
    shows.push({
      id: show.id,
      public_id: show.public_id,
      slug: show.slug,
      title: show.title,
      duration: show.duration,
      artists: (show.show_artists ?? [])
        .map((link) => link.artists?.name)
        .filter((name): name is string => !!name),
    });
  }
  return shows;
}

export async function isLiked(
  accessToken: string,
  userId: string,
  target: LikeTarget,
  entityId: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    select: "id",
    user_id: `eq.${userId}`,
    [LIKE_COLUMN[target]]: `eq.${entityId}`,
    limit: "1",
  });
  const rows = (await request(restUrl(`likes?${params}`), {
    headers: authHeaders(accessToken),
  })) as Array<{ id: string }> | null;
  return rows?.[0]?.id ?? null;
}

/** Поставить или снять лайк. Возвращает новое состояние. */
export async function toggleLike(
  accessToken: string,
  userId: string,
  target: LikeTarget,
  entityId: string,
): Promise<boolean> {
  const existing = await isLiked(accessToken, userId, target, entityId);

  if (existing) {
    await request(restUrl(`likes?id=eq.${existing}`), {
      method: "DELETE",
      headers: { ...authHeaders(accessToken), Prefer: "return=minimal" },
    });
    return false;
  }

  await request(restUrl("likes"), {
    method: "POST",
    headers: { ...authHeaders(accessToken), Prefer: "return=minimal" },
    body: { user_id: userId, [LIKE_COLUMN[target]]: entityId },
  });
  return true;
}

// ── Находки (закладки треков из треклистов) ──

export interface Find {
  id: string;
  artist: string | null;
  title: string | null;
  timestampSec: number | null;
  show: { id: string; public_id: number | null; slug: string | null; title: string | null } | null;
}

/**
 * «Мои находки».
 *
 * Прячем находки авторов, отключивших показ треклистов: строки в track_finds
 * при этом остаются, и на сайте их тоже не видно — терминал не должен
 * расходиться с сайтом в том, что человеку показано.
 */
export async function listFinds(accessToken: string, userId: string, limit = 50): Promise<Find[]> {
  const params = new URLSearchParams({
    select:
      "id,created_at,show_tracklist(id,artist,title,timestamp_sec," +
      "shows_v2(id,public_id,slug,title,status,hosts:host_id(tracklist_disabled)))",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: String(limit),
  });
  const rows = (await request(restUrl(`track_finds?${params}`), {
    headers: authHeaders(accessToken),
  })) as Array<{
    id: string;
    show_tracklist: {
      artist: string | null;
      title: string | null;
      timestamp_sec: number | null;
      shows_v2: {
        id: string;
        public_id: number | null;
        slug: string | null;
        title: string | null;
        status: string | null;
        hosts: { tracklist_disabled: boolean | null } | null;
      } | null;
    } | null;
  }> | null;

  const finds: Find[] = [];
  for (const row of rows ?? []) {
    const item = row.show_tracklist;
    const show = item?.shows_v2;
    if (!item || !show) continue;
    if (show.hosts?.tracklist_disabled === true) continue;
    if (isHiddenFromSite(show.status)) continue;

    finds.push({
      id: row.id,
      artist: item.artist,
      title: item.title,
      timestampSec: item.timestamp_sec,
      show: { id: show.id, public_id: show.public_id, slug: show.slug, title: show.title },
    });
  }
  return finds;
}

// ── Сохранённое ──

export interface SavedRef {
  id: string;
  entityType: string;
  entityId: string;
}

export async function listSaves(accessToken: string, userId: string, limit = 60): Promise<SavedRef[]> {
  const params = new URLSearchParams({
    select: "id,entity_type,entity_id,created_at",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: String(limit),
  });
  const rows = (await request(restUrl(`saves?${params}`), {
    headers: authHeaders(accessToken),
  })) as Array<{ id: string; entity_type: string; entity_id: string }> | null;
  return (rows ?? []).map((row) => ({ id: row.id, entityType: row.entity_type, entityId: row.entity_id }));
}

/**
 * Дотянуть названия сохранённых выпусков.
 *
 * Идентификаторы идут чанками: Kong рубит запрос с URL длиннее ~8 КБ, и на
 * большой библиотеке одиночный `.in()` упёрся бы в этот предел незаметно.
 */
export async function resolveSavedShows(
  accessToken: string,
  ids: readonly string[],
): Promise<Map<string, { title: string | null; public_id: number | null; slug: string | null }>> {
  const out = new Map<string, { title: string | null; public_id: number | null; slug: string | null }>();
  if (ids.length === 0) return out;

  for (const part of chunk(ids, 100)) {
    const params = new URLSearchParams({
      select: "id,title,public_id,slug,status",
      id: `in.(${part.join(",")})`,
    });
    const rows = (await request(restUrl(`shows_v2?${params}`), {
      headers: authHeaders(accessToken),
    })) as Array<{
      id: string;
      title: string | null;
      public_id: number | null;
      slug: string | null;
      status: string | null;
    }> | null;

    for (const row of rows ?? []) {
      if (isHiddenFromSite(row.status)) continue;
      out.set(row.id, { title: row.title, public_id: row.public_id, slug: row.slug });
    }
  }
  return out;
}

// ── Подписки ──

export interface Subscription {
  entityType: string;
  entityId: string;
  status: string | null;
}

export async function listSubscriptions(accessToken: string, userId: string): Promise<Subscription[]> {
  const params = new URLSearchParams({
    select: "entity_type,entity_id,status,created_at",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
  });
  const rows = (await request(restUrl(`subscriptions?${params}`), {
    headers: authHeaders(accessToken),
  })) as Array<{ entity_type: string; entity_id: string; status: string | null }> | null;
  return (rows ?? []).map((row) => ({
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
  }));
}

/**
 * Имена того, на что подписан человек.
 *
 * Три таблицы, потому что подписка полиморфна: артист, автор и обычный
 * пользователь лежат в разных местах и общего представления не имеют.
 */
export async function resolveSubscriptionNames(
  accessToken: string,
  subscriptions: readonly Subscription[],
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const auth = authHeaders(accessToken);

  const groups: Array<{ types: string[]; table: string; select: string; label: (row: Record<string, unknown>) => string }> = [
    {
      types: ["artist"],
      table: "artists",
      select: "id,name",
      label: (row) => String(row.name ?? ""),
    },
    {
      types: ["host"],
      table: "hosts",
      select: "id,name",
      label: (row) => String(row.name ?? ""),
    },
    {
      types: ["user"],
      table: "profiles",
      select: "id,username,display_name",
      label: (row) => String(row.display_name || (row.username ? `@${row.username}` : "")),
    },
  ];

  await Promise.all(
    groups.map(async (group) => {
      const ids = subscriptions
        .filter((subscription) => group.types.includes(subscription.entityType))
        .map((subscription) => subscription.entityId);
      if (ids.length === 0) return;

      for (const part of chunk(ids, 100)) {
        const params = new URLSearchParams({ select: group.select, id: `in.(${part.join(",")})` });
        const rows = (await request(restUrl(`${group.table}?${params}`), { headers: auth }).catch(
          () => [],
        )) as Array<Record<string, unknown>>;
        for (const row of rows ?? []) {
          const label = group.label(row);
          if (label) names.set(String(row.id), label);
        }
      }
    }),
  );

  return names;
}
