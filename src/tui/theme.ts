/**
 * Внешний вид TUI: цвета и рисование полос.
 *
 * Собрано в одном месте, чтобы панели не расходились в оттенках и чтобы правка
 * палитры не превращалась в обход всех компонентов.
 */

export const theme = {
  accent: "cyan",
  accentDim: "blueBright",
  playing: "green",
  paused: "yellow",
  danger: "red",
  muted: "gray",
  border: "gray",
  borderActive: "cyan",
  selectionBg: "blueBright",
} as const;

/**
 * Полоса прогресса.
 *
 * total = null — живой поток: конца у него нет, и шкала врала бы о позиции.
 * Возвращаем пустую строку, панель покажет одно лишь время.
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
  const chars = [...text];
  if (chars.length <= width) return text;
  if (width === 1) return "…";
  return `${chars.slice(0, width - 1).join("")}…`;
}

export function padTo(text: string, width: number): string {
  const length = [...text].length;
  return length >= width ? fit(text, width) : text + " ".repeat(width - length);
}
