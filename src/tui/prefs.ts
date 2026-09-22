/**
 * Настройки интерфейса: тема и язык.
 *
 * Лежат рядом с сессией, но в ОТДЕЛЬНОМ файле. Класть их в session.json нельзя:
 * его переписывает обновление токена под межпроцессным локом, и настройка,
 * записанная в этот момент, потерялась бы вместе с гонкой.
 */

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { configDir } from "../net/session.ts";
import { DEFAULT_THEME, THEMES, applyPalette } from "./theme.ts";
import { LANGS, setLang, type Lang } from "./i18n.ts";

export interface Prefs {
  theme: string;
  lang: Lang;
}

const DEFAULTS: Prefs = { theme: DEFAULT_THEME, lang: "ru" };

function prefsPath(): string {
  return process.env.SURPRISE_PREFS_PATH ?? join(configDir(), "prefs.json");
}

function sanitize(value: unknown): Prefs {
  if (!value || typeof value !== "object") return { ...DEFAULTS };
  const raw = value as Partial<Prefs>;
  // Незнакомые значения молча заменяются на умолчания: файл правят руками, и
  // опечатка в нём не повод показать человеку пустой экран.
  const theme = THEMES.some((candidate) => candidate.id === raw.theme) ? raw.theme! : DEFAULTS.theme;
  const lang = LANGS.some((candidate) => candidate.id === raw.lang) ? (raw.lang as Lang) : DEFAULTS.lang;
  return { theme, lang };
}

export async function loadPrefs(): Promise<Prefs> {
  try {
    return sanitize(JSON.parse(await readFile(prefsPath(), "utf8")));
  } catch {
    return { ...DEFAULTS };
  }
}

/** Применить настройки к живым палитре и словарю. */
export function applyPrefs(prefs: Prefs): void {
  applyPalette(prefs.theme);
  setLang(prefs.lang);
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  const target = prefsPath();
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  // Атомарно, как и сессия: половина файла настроек читается как их отсутствие.
  const tmp = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(prefs, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(tmp, target);
  } catch {
    await rm(tmp, { force: true }).catch(() => {});
  }
}

/** Следующее значение по кругу — для переключения по Enter. */
export function nextInCycle<T>(items: readonly T[], current: T): T {
  const index = items.indexOf(current);
  return items[(index + 1) % items.length] ?? items[0]!;
}
