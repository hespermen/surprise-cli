/**
 * Форматирование для терминала. Чистые функции — всё тестируется без экрана.
 */

/** «1:04:12» или «4:12». Часы появляются только когда они есть. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) return "--:--";
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  return hours > 0
    ? `${hours}:${mm}:${String(seconds).padStart(2, "0")}`
    : `${mm}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Обрезка по видимой ширине с многоточием.
 *
 * Считаем по code points, а не по UTF-16 единицам: «…» и кириллица занимают по
 * одной колонке, а вот slice по .length режет суррогатные пары пополам и
 * оставляет в выводе битый символ.
 */
export function truncate(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  const chars = [...text];
  if (chars.length <= maxWidth) return text;
  if (maxWidth === 1) return "…";
  return `${chars.slice(0, maxWidth - 1).join("")}…`;
}

/** Дополнить до ширины пробелами (по code points, как и truncate). */
export function pad(text: string, width: number): string {
  const length = [...text].length;
  return length >= width ? text : text + " ".repeat(width - length);
}

/**
 * Полоса прогресса.
 *
 * total = null — это живой поток: конца у него нет, и рисовать шкалу нечестно.
 * Возвращаем пустую строку, а вызывающий покажет одно лишь время.
 */
export function progressBar(position: number | null, total: number | null, width: number): string {
  if (total === null || total <= 0 || width <= 2) return "";
  const ratio = Math.min(1, Math.max(0, (position ?? 0) / total));
  const filled = Math.round(ratio * width);
  return "━".repeat(filled) + "─".repeat(Math.max(0, width - filled));
}
