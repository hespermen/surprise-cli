/**
 * Палитры и отрисовка полос.
 *
 * `theme` — ЖИВОЙ объект, поля которого подменяет applyPalette. Компоненты
 * читают его при отрисовке, поэтому смена темы доезжает до всех панелей сразу,
 * без протаскивания палитры пропсом через каждую из них. Для настройки, которая
 * меняется раз в жизни и одинакова для всего экрана, это честный размен.
 */

import { stripControl } from "../lib/safeText.ts";

export interface Palette {
  accent: string;
  accentDim: string;
  playing: string;
  paused: string;
  danger: string;
  muted: string;
  border: string;
  borderActive: string;
  selectionBg: string;
}

export interface ThemeSpec {
  id: string;
  /** Название на языке интерфейса не переводим: имена тем — имена. */
  label: string;
  palette: Palette;
}

export const THEMES: readonly ThemeSpec[] = [
  {
    id: "night",
    label: "Night",
    palette: {
      accent: "cyan",
      accentDim: "blueBright",
      playing: "green",
      paused: "yellow",
      danger: "red",
      muted: "gray",
      border: "gray",
      borderActive: "cyan",
      selectionBg: "blueBright",
    },
  },
  {
    id: "ember",
    label: "Ember",
    palette: {
      accent: "yellow",
      accentDim: "redBright",
      playing: "yellowBright",
      paused: "magenta",
      danger: "red",
      muted: "gray",
      border: "gray",
      borderActive: "yellow",
      selectionBg: "red",
    },
  },
  {
    id: "mono",
    label: "Mono",
    palette: {
      // Одна из тем намеренно без цвета: терминалы бывают чёрно-белыми, а ещё
      // так читают люди, которым цветовая подсветка мешает.
      accent: "white",
      accentDim: "gray",
      playing: "whiteBright",
      paused: "gray",
      danger: "white",
      muted: "gray",
      border: "gray",
      borderActive: "white",
      selectionBg: "gray",
    },
  },
  {
    id: "bloom",
    label: "Bloom",
    palette: {
      accent: "magenta",
      accentDim: "magentaBright",
      playing: "cyanBright",
      paused: "yellow",
      danger: "redBright",
      muted: "gray",
      border: "gray",
      borderActive: "magenta",
      selectionBg: "magenta",
    },
  },
];

export const DEFAULT_THEME = "night";

function paletteOf(id: string): Palette {
  return (THEMES.find((candidate) => candidate.id === id) ?? THEMES[0]!).palette;
}

export const theme: Palette = { ...paletteOf(DEFAULT_THEME) };

export function applyPalette(id: string): void {
  Object.assign(theme, paletteOf(id));
}

/**
 * Полоса прогресса.
 *
 * total = null — живой поток: конца у него нет, и шкала врала бы о позиции.
 */
export function bar(position: number | null, total: number | null, width: number): string {
  if (total === null || total <= 0 || width < 2) return "";
  const ratio = Math.min(1, Math.max(0, (position ?? 0) / total));
  const filled = Math.round(ratio * width);
  return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
}

/**
 * Обрезка по видимой ширине.
 *
 * По code points, а не по UTF-16 единицам: кириллица и «…» занимают по колонке,
 * а slice по .length разрывает суррогатные пары и оставляет битый символ.
 */
export function fit(text: string, width: number): string {
  if (width <= 0) return "";
  // См. комментарий в lib/format.ts: чистим в одном месте, через которое
  // проходит весь текст сервера, а не у каждого вызывающего.
  const chars = [...stripControl(text)];
  // Очищенное, а не исходное — см. тот же разбор в lib/format.ts.
  const clean = chars.join("");
  if (chars.length <= width) return clean;
  if (width === 1) return "…";
  return `${chars.slice(0, width - 1).join("")}…`;
}

export function padTo(text: string, width: number): string {
  const length = [...text].length;
  return length >= width ? fit(text, width) : text + " ".repeat(width - length);
}
