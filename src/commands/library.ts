/**
 * surprise library [playlists|likes|finds|saved|following] — своя библиотека.
 *
 * Всё требует входа: это данные аккаунта. Без сессии команда не молчит и не
 * притворяется, что библиотека пуста, а прямо говорит, что нужно войти.
 */

import {
  listFinds,
  listLikedShows,
  listPlaylistItems,
  listPlaylists,
  listSaves,
  listSubscriptions,
  resolveSavedShows,
  resolveSubscriptionNames,
  type PlaylistSummary,
} from "../api/library.ts";
import { formatDuration, truncate } from "../lib/format.ts";
import { getValidSession } from "../net/auth.ts";
import { bold, cyan, dim, red, terminalWidth, yellow } from "../ui/term.ts";

type Section = "playlists" | "likes" | "finds" | "saved" | "following";

const SECTIONS: Section[] = ["playlists", "likes", "finds", "saved", "following"];

const SECTION_TITLES: Record<Section, string> = {
  playlists: "Плейлисты",
  likes: "Лайки",
  finds: "Находки",
  saved: "Сохранённое",
  following: "Подписки",
};

function width(): number {
  return Math.max(40, Math.min(terminalWidth(), 100));
}

function playlistLabel(playlist: PlaylistSummary): string {
  // Системные плейлисты сайт заводит по названию, а не по флагу типа: пометка
  // помогает не принять их за свои собственные.
  const mark = playlist.is_system ? dim(" (системный)") : "";
  const visibility = playlist.is_public === false ? dim(" · приватный") : "";
  return `${playlist.title}${mark}${visibility}`;
}

async function renderPlaylists(token: string, userId: string, asJson: boolean): Promise<void> {
  const playlists = await listPlaylists(token, userId);

  if (asJson) {
    process.stdout.write(`${JSON.stringify(playlists)}\n`);
    return;
  }
  if (playlists.length === 0) {
    process.stdout.write(`${dim("Плейлистов пока нет.")}\n`);
    return;
  }
  for (const playlist of playlists) {
    const count = dim(`${playlist.itemCount}`);
    process.stdout.write(`  ${count.padStart(4)}  ${truncate(playlistLabel(playlist), width() - 10)}\n`);
  }
}

async function renderLikes(token: string, userId: string, asJson: boolean): Promise<void> {
  const shows = await listLikedShows(token, userId);

  if (asJson) {
    process.stdout.write(`${JSON.stringify(shows)}\n`);
    return;
  }
  if (shows.length === 0) {
    process.stdout.write(`${dim("Лайков пока нет.")}\n`);
    return;
  }
  for (const show of shows) {
    const artists = show.artists.join(", ");
    const label = artists ? `${show.title ?? "Без названия"} — ${artists}` : (show.title ?? "Без названия");
    const time = dim(formatDuration(show.duration));
    process.stdout.write(`  ${truncate(label, width() - 12).padEnd(width() - 12)} ${time}\n`);
  }
}

async function renderFinds(token: string, userId: string, asJson: boolean): Promise<void> {
  const finds = await listFinds(token, userId);

  if (asJson) {
    process.stdout.write(`${JSON.stringify(finds)}\n`);
    return;
  }
  if (finds.length === 0) {
    process.stdout.write(`${dim("Находок пока нет.")}\n`);
    return;
  }
  for (const find of finds) {
    const label = [find.artist, find.title].filter(Boolean).join(" — ") || "неопознанный трек";
    process.stdout.write(`  ${truncate(label, width() - 24)}\n`);
    const where = find.show?.title ?? "";
    if (where) {
      process.stdout.write(`       ${dim(`${formatDuration(find.timestampSec)} · ${truncate(where, width() - 20)}`)}\n`);
    }
  }
}

async function renderSaved(token: string, userId: string, asJson: boolean): Promise<void> {
  const saves = await listSaves(token, userId);
  const showIds = saves.filter((save) => save.entityType === "show").map((save) => save.entityId);
  const shows = await resolveSavedShows(token, showIds);

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        saves.map((save) => ({ ...save, title: shows.get(save.entityId)?.title ?? null })),
      )}\n`,
    );
    return;
  }
  if (saves.length === 0) {
    process.stdout.write(`${dim("Сохранённого пока нет.")}\n`);
    return;
  }

  const byType = new Map<string, number>();
  for (const save of saves) byType.set(save.entityType, (byType.get(save.entityType) ?? 0) + 1);

  for (const save of saves) {
    if (save.entityType !== "show") continue;
    const show = shows.get(save.entityId);
    if (!show) continue;
    process.stdout.write(`  ${truncate(show.title ?? "Без названия", width() - 6)}\n`);
  }

  // Остальные типы (посты, события, релизы) пока только считаем: тянуть их
  // названия — это ещё четыре таблицы, а играть их всё равно нечем.
  const others = [...byType.entries()].filter(([type]) => type !== "show");
  if (others.length > 0) {
    const summary = others.map(([type, count]) => `${type}: ${count}`).join(", ");
    process.stdout.write(`  ${dim(`ещё сохранено — ${summary}`)}\n`);
  }
}

async function renderFollowing(token: string, userId: string, asJson: boolean): Promise<void> {
  const subscriptions = await listSubscriptions(token, userId);
  const names = await resolveSubscriptionNames(token, subscriptions);

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        subscriptions.map((subscription) => ({
          ...subscription,
          name: names.get(subscription.entityId) ?? null,
        })),
      )}\n`,
    );
    return;
  }
  if (subscriptions.length === 0) {
    process.stdout.write(`${dim("Подписок пока нет.")}\n`);
    return;
  }

  for (const subscription of subscriptions) {
    const name = names.get(subscription.entityId);
    if (!name) continue;
    // Заявка на подписку к приватному профилю ждёт подтверждения — показываем
    // это, иначе человек думает, что уже подписан.
    const pending = subscription.status === "pending" ? yellow(" (ожидает подтверждения)") : "";
    process.stdout.write(`  ${dim(subscription.entityType.padEnd(7))} ${truncate(name, width() - 24)}${pending}\n`);
  }
}

export async function libraryCommand(argv: readonly string[]): Promise<number> {
  const asJson = argv.includes("--json");
  const requested = argv.find((arg) => !arg.startsWith("--")) as Section | undefined;

  if (requested && !SECTIONS.includes(requested)) {
    process.stderr.write(`${red("Неизвестный раздел:")} ${requested}\n  ${SECTIONS.join(", ")}\n`);
    return 1;
  }

  const session = await getValidSession();
  if (!session) {
    process.stderr.write(`${red("Нужен вход:")} surprise login\n`);
    return 1;
  }

  const { access_token: token, user_id: userId } = session;
  const sections = requested ? [requested] : SECTIONS;

  for (const section of sections) {
    // В JSON-режиме заголовки не печатаем: вывод должен оставаться разбираемым.
    if (!asJson && sections.length > 1) process.stdout.write(`\n${bold(SECTION_TITLES[section])}\n`);
    else if (!asJson) process.stdout.write(`${bold(SECTION_TITLES[section])}\n`);

    try {
      switch (section) {
        case "playlists":
          await renderPlaylists(token, userId, asJson);
          break;
        case "likes":
          await renderLikes(token, userId, asJson);
          break;
        case "finds":
          await renderFinds(token, userId, asJson);
          break;
        case "saved":
          await renderSaved(token, userId, asJson);
          break;
        case "following":
          await renderFollowing(token, userId, asJson);
          break;
      }
    } catch (error) {
      // Один сбойный раздел не должен прятать остальные: человек просил
      // библиотеку целиком.
      process.stderr.write(`${red(`Раздел «${SECTION_TITLES[section]}» не загрузился:`)} ${(error as Error).message}\n`);
    }
  }

  if (!asJson) process.stdout.write(`\n${dim("Играть: surprise play <ссылка|запрос>")}\n`);
  return 0;
}

/** surprise playlist <id|название> — показать содержимое плейлиста. */
export async function playlistCommand(argv: readonly string[]): Promise<number> {
  const asJson = argv.includes("--json");
  const query = argv.filter((arg) => !arg.startsWith("--")).join(" ").trim();

  const session = await getValidSession();
  if (!session) {
    process.stderr.write(`${red("Нужен вход:")} surprise login\n`);
    return 1;
  }

  const playlists = await listPlaylists(session.access_token, session.user_id);
  if (playlists.length === 0) {
    process.stdout.write(`${dim("Плейлистов пока нет.")}\n`);
    return 0;
  }

  const lowered = query.toLowerCase();
  const playlist = query
    ? playlists.find((candidate) => candidate.id === query || candidate.title.toLowerCase().includes(lowered))
    : playlists[0];

  if (!playlist) {
    process.stderr.write(`${red("Плейлист не найден:")} ${query}\n`);
    return 1;
  }

  const entries = await listPlaylistItems(session.access_token, playlist.id);

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ playlist, items: entries })}\n`);
    return 0;
  }

  process.stdout.write(`${bold(playlist.title)} ${dim(`· ${entries.length}`)}\n`);
  for (const [index, entry] of entries.entries()) {
    const number = dim(String(index + 1).padStart(3));
    const kind = entry.kind === "show" ? cyan("выпуск") : cyan("трек  ");
    const label = entry.subtitle ? `${entry.title} — ${entry.subtitle}` : entry.title;
    const time = dim(formatDuration(entry.durationSec));
    process.stdout.write(`${number} ${kind} ${truncate(label, width() - 24).padEnd(width() - 24)} ${time}\n`);
  }
  return 0;
}
