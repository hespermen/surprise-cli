/**
 * Реестр команд командной строки.
 *
 * Зачем она нужна рядом с горячими клавишами: клавиш хватает на частое, но не
 * на всё. Команда принимает аргумент («найти такое-то», «громкость 40»), её
 * можно подсмотреть в списке и не надо запоминать — а горячую клавишу надо.
 */

import type { SectionId } from "./sections.ts";

export interface CommandSpec {
  /** Имя без слэша. */
  name: string;
  /** Подсказка по аргументу, показывается серым после имени. */
  arg?: string;
  hint: string;
  /** Синонимы — чтобы не гадать, как называется команда. */
  aliases?: string[];
}

export const COMMANDS: readonly CommandSpec[] = [
  { name: "radio", hint: "вернуться в живой эфир", aliases: ["live", "эфир"] },
  { name: "play", hint: "играть выбранное в списке" },
  { name: "pause", hint: "пауза и снятие с паузы", aliases: ["p"] },
  { name: "search", arg: "<запрос>", hint: "искать выпуски", aliases: ["s", "найти"] },
  { name: "goto", arg: "<раздел>", hint: "перейти в раздел по названию", aliases: ["g", "открыть"] },
  { name: "volume", arg: "<0-130>", hint: "громкость", aliases: ["vol", "v"] },
  { name: "mute", hint: "выключить или включить звук" },
  { name: "back", hint: "вернуться из карточки к списку", aliases: ["b", "назад"] },
  { name: "login", hint: "войти в аккаунт (подскажет команду оболочки)" },
  { name: "whoami", hint: "кто вошёл" },
  { name: "help", hint: "справка по клавишам", aliases: ["?"] },
  { name: "quit", hint: "выход", aliases: ["q", "exit"] },
];

/** Раздел по человеческому названию — для `/goto`. */
export const SECTION_ALIASES: Record<string, SectionId> = {
  эфир: "radio",
  радио: "radio",
  radio: "radio",
  новое: "shows",
  выпуски: "shows",
  shows: "shows",
  резиденты: "artists",
  артисты: "artists",
  artists: "artists",
  авторы: "hosts",
  hosts: "hosts",
  музыка: "releases",
  релизы: "releases",
  releases: "releases",
  коллекция: "playlists",
  плейлисты: "playlists",
  playlists: "playlists",
  избранное: "likes",
  лайки: "likes",
  likes: "likes",
  находки: "finds",
  finds: "finds",
  сохранённое: "saved",
  сохраненное: "saved",
  saved: "saved",
  подписки: "following",
  following: "following",
  поиск: "search",
  search: "search",
};

export interface ParsedCommand {
  name: string;
  argument: string;
}

/**
 * Разбор введённой строки.
 *
 * Ведущий слэш необязателен: человек, открывший строку клавишей, уже обозначил
 * намерение, и требовать от него ещё и слэш — лишний шаг.
 */
export function parseCommand(input: string): ParsedCommand | null {
  const text = input.trim().replace(/^\//, "");
  if (!text) return null;
  const space = text.indexOf(" ");
  return space === -1
    ? { name: text.toLowerCase(), argument: "" }
    : { name: text.slice(0, space).toLowerCase(), argument: text.slice(space + 1).trim() };
}

/** Команда по имени или синониму. */
export function resolveCommand(name: string): CommandSpec | null {
  const lowered = name.toLowerCase();
  return (
    COMMANDS.find((command) => command.name === lowered || command.aliases?.includes(lowered)) ?? null
  );
}

/**
 * Список для подсказки под строкой ввода.
 *
 * Пустой ввод показывает ВСЕ команды: это и есть ответ на «какие вообще есть».
 * Дальше список сужается по мере набора — совпадение по началу имени и по
 * синонимам, чтобы «най» находило «search».
 */
export function suggestCommands(input: string): CommandSpec[] {
  const parsed = parseCommand(input);
  if (!parsed) return [...COMMANDS];

  // Аргумент уже набирают — команда выбрана, подсказывать больше нечего.
  if (input.includes(" ")) {
    const exact = resolveCommand(parsed.name);
    return exact ? [exact] : [];
  }

  return COMMANDS.filter(
    (command) =>
      command.name.startsWith(parsed.name) ||
      command.aliases?.some((alias) => alias.startsWith(parsed.name)),
  );
}
