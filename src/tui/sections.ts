/**
 * Реестр разделов: что грузим, как показываем, что делаем по Enter.
 *
 * Вынесено из App отдельно намеренно. Разделов много, и если их описания
 * растекутся по контроллеру, добавление нового превратится в правку пяти
 * switch-ов. Здесь один объект на раздел — и он же документирует раздел.
 */

import { listArtists, listHosts, listReleases, type Artist, type Host, type Release } from "../api/catalog.ts";
import {
  listFinds,
  listLikedShows,
  listPlaylists,
  listSaves,
  listSubscriptions,
  resolveSavedShows,
  resolveSubscriptionNames,
  type Find,
  type LikedShow,
  type PlaylistSummary,
} from "../api/library.ts";
import { listShows, type Show } from "../api/shows.ts";
import type { RadioItem } from "../api/radio.ts";
import { formatDuration } from "../lib/format.ts";

export type SectionId =
  | "radio"
  | "shows"
  | "artists"
  | "hosts"
  | "releases"
  | "playlists"
  | "likes"
  | "finds"
  | "saved"
  | "following"
  | "search";

export interface ColumnSpec<T> {
  header: string;
  width: number;
  flex?: boolean;
  value: (row: T, index: number) => string;
}

export interface SectionSpec<T = unknown> {
  id: SectionId;
  label: string;
  /** Пустая строка-разделитель перед группой в сайдбаре. */
  group: "station" | "catalog" | "library" | "tools";
  needsAuth?: boolean;
  /** Подпись панели списка. */
  listTitle: string;
  emptyHint: string;
  columns: ReadonlyArray<ColumnSpec<T>>;
  /**
   * Загрузка. accessToken может быть null — раздел обязан либо работать без
   * входа, либо стоять с needsAuth.
   */
  load: (ctx: { accessToken: string | null; userId: string }) => Promise<T[]>;
}

const dash = (value: string | null | undefined): string => (value && value.trim() ? value : "—");

/**
 * Порядок повторяет навигацию сайта: сначала станция, потом каталог, потом
 * личное. Человек, знающий surprise.fm, не должен заново искать, где что.
 */
export const SECTIONS: ReadonlyArray<SectionSpec<never>> = [
  {
    id: "radio",
    label: "Эфир",
    group: "station",
    listTitle: "Эфир — что играет и что играло",
    emptyHint: "Расписание пока недоступно",
    columns: [
      { header: "", width: 6, value: () => "" },
      { header: "Выпуск", width: 0, flex: true, value: (item: RadioItem) => item.title ?? "—" },
      { header: "Длит.", width: 8, value: (item: RadioItem) => formatDuration(item.duration) },
    ],
    // Эфир грузится в App отдельно: он обновляется по таймеру и нужен ещё и
    // панели плеера, поэтому живёт не здесь.
    load: async () => [],
  },
  {
    id: "shows",
    label: "Новое",
    group: "catalog",
    listTitle: "Новое — свежие выпуски",
    emptyHint: "Список пуст",
    columns: [
      { header: "Выпуск", width: 0, flex: true, value: (show: Show) => dash(show.title) },
      {
        header: "Артисты",
        width: 24,
        value: (show: Show) => dash(show.artists.map((artist) => artist.name).join(", ")),
      },
      { header: "Длит.", width: 8, value: (show: Show) => formatDuration(show.duration) },
    ],
    load: ({ accessToken }) => listShows({ limit: 100, accessToken }),
  },
  {
    id: "artists",
    label: "Резиденты",
    group: "catalog",
    listTitle: "Резиденты",
    emptyHint: "Никого не нашли",
    columns: [
      { header: "Имя", width: 0, flex: true, value: (artist: Artist) => artist.name },
      { header: "", width: 10, value: (artist: Artist) => (artist.is_resident ? "резидент" : "") },
    ],
    load: ({ accessToken }) => listArtists({ accessToken }),
  },
  {
    id: "hosts",
    label: "Авторы",
    group: "catalog",
    listTitle: "Авторы",
    emptyHint: "Никого не нашли",
    columns: [
      { header: "Имя", width: 0, flex: true, value: (host: Host) => host.name },
      { header: "", width: 10, value: (host: Host) => (host.is_verified ? "✓" : "") },
    ],
    load: ({ accessToken }) => listHosts(accessToken),
  },
  {
    id: "releases",
    label: "Музыка",
    group: "catalog",
    listTitle: "Музыка — релизы",
    emptyHint: "Релизов не нашли",
    columns: [
      { header: "Релиз", width: 0, flex: true, value: (release: Release) => release.title },
      { header: "Артисты", width: 24, value: (release: Release) => dash(release.artists.join(", ")) },
      // Дату режем до года-месяца-дня как есть: release_date — это date без
      // времени, и приводить её к локальной зоне нельзя (сдвинется на сутки).
      { header: "Дата", width: 10, value: (release: Release) => release.release_date ?? "—" },
    ],
    load: ({ accessToken }) => listReleases(accessToken),
  },
  {
    id: "playlists",
    label: "Моя коллекция",
    group: "library",
    needsAuth: true,
    listTitle: "Моя коллекция — плейлисты",
    emptyHint: "Плейлистов пока нет",
    columns: [
      { header: "Плейлист", width: 0, flex: true, value: (playlist: PlaylistSummary) => playlist.title },
      { header: "Треков", width: 8, value: (playlist: PlaylistSummary) => String(playlist.itemCount) },
    ],
    load: ({ accessToken, userId }) => (accessToken ? listPlaylists(accessToken, userId) : Promise.resolve([])),
  },
  {
    id: "likes",
    label: "Избранное",
    group: "library",
    needsAuth: true,
    listTitle: "Избранное",
    emptyHint: "Лайков пока нет",
    columns: [
      { header: "Выпуск", width: 0, flex: true, value: (show: LikedShow) => dash(show.title) },
      { header: "Артисты", width: 24, value: (show: LikedShow) => dash(show.artists.join(", ")) },
      { header: "Длит.", width: 8, value: (show: LikedShow) => formatDuration(show.duration) },
    ],
    load: ({ accessToken, userId }) => (accessToken ? listLikedShows(accessToken, userId) : Promise.resolve([])),
  },
  {
    id: "finds",
    label: "Мои находки",
    group: "library",
    needsAuth: true,
    listTitle: "Мои находки",
    emptyHint: "Находок пока нет",
    columns: [
      {
        header: "Трек",
        width: 0,
        flex: true,
        value: (find: Find) => dash([find.artist, find.title].filter(Boolean).join(" — ")),
      },
      { header: "Из выпуска", width: 28, value: (find: Find) => dash(find.show?.title) },
      { header: "Метка", width: 8, value: (find: Find) => formatDuration(find.timestampSec) },
    ],
    load: ({ accessToken, userId }) => (accessToken ? listFinds(accessToken, userId) : Promise.resolve([])),
  },
  {
    id: "saved",
    label: "Сохранённое",
    group: "library",
    needsAuth: true,
    listTitle: "Сохранённое",
    emptyHint: "Сохранённого пока нет",
    columns: [
      { header: "Что", width: 0, flex: true, value: (row: SavedRow) => row.title },
      { header: "Тип", width: 12, value: (row: SavedRow) => row.entityType },
    ],
    load: async ({ accessToken, userId }) => {
      if (!accessToken) return [];
      const saves = await listSaves(accessToken, userId);
      const showIds = saves.filter((save) => save.entityType === "show").map((save) => save.entityId);
      const titles = await resolveSavedShows(accessToken, showIds);
      return saves.map<SavedRow>((save) => ({
        id: save.entityId,
        entityType: save.entityType,
        title: titles.get(save.entityId)?.title ?? save.entityId,
        isShow: save.entityType === "show" && titles.has(save.entityId),
      }));
    },
  },
  {
    id: "following",
    label: "Подписки",
    group: "library",
    needsAuth: true,
    listTitle: "Подписки",
    emptyHint: "Подписок пока нет",
    columns: [
      { header: "Кто", width: 0, flex: true, value: (row: FollowRow) => row.name },
      { header: "Тип", width: 12, value: (row: FollowRow) => row.entityType },
      { header: "", width: 12, value: (row: FollowRow) => (row.pending ? "ожидает" : "") },
    ],
    load: async ({ accessToken, userId }) => {
      if (!accessToken) return [];
      const subscriptions = await listSubscriptions(accessToken, userId);
      const names = await resolveSubscriptionNames(accessToken, subscriptions);
      return subscriptions
        .map<FollowRow>((subscription) => ({
          id: subscription.entityId,
          entityType: subscription.entityType,
          name: names.get(subscription.entityId) ?? subscription.entityId,
          pending: subscription.status === "pending",
        }))
        .filter((row) => row.name !== row.id);
    },
  },
  {
    id: "search",
    label: "Поиск",
    group: "tools",
    listTitle: "Поиск",
    emptyHint: "Введите запрос — минимум две буквы",
    columns: [
      { header: "Выпуск", width: 0, flex: true, value: (show: Show) => dash(show.title) },
      {
        header: "Артисты",
        width: 24,
        value: (show: Show) => dash(show.artists.map((artist) => artist.name).join(", ")),
      },
      { header: "Длит.", width: 8, value: (show: Show) => formatDuration(show.duration) },
    ],
    // Поиск грузится по вводу, а не при открытии раздела.
    load: async () => [],
  },
] as ReadonlyArray<SectionSpec<never>>;

export interface SavedRow {
  id: string;
  entityType: string;
  title: string;
  isShow: boolean;
}

export interface FollowRow {
  id: string;
  entityType: string;
  name: string;
  pending: boolean;
}

export function sectionById(id: SectionId): SectionSpec<never> {
  const found = SECTIONS.find((section) => section.id === id);
  if (!found) throw new Error(`неизвестный раздел: ${id}`);
  return found;
}
