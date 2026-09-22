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

/**
 * Время старта выпуска в расписании — всегда по Москве.
 *
 * Зона фиксирована намеренно: расписание станции живёт в MSK, и показывать его
 * в местной зоне слушателя значило бы, что два человека, обсуждающие один эфир,
 * видят разное время. Это конвенция всего проекта — даты в интерфейсе в
 * Europe/Moscow.
 *
 * Сегодняшнее показываем часами, остальное — с датой: в списке, где сверху
 * «дальше», а ниже вчерашнее, одни часы сбивали бы с толку.
 */
const MSK_PARTS = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatStartTime(unixSeconds: number | null | undefined, nowMs = Date.now()): string {
  if (unixSeconds === null || unixSeconds === undefined || !Number.isFinite(unixSeconds)) return "—";

  const parts = (value: Date) =>
    Object.fromEntries(MSK_PARTS.formatToParts(value).map((part) => [part.type, part.value]));

  const started = parts(new Date(unixSeconds * 1000));
  const today = parts(new Date(nowMs));

  const time = `${started.hour}:${started.minute}`;
  const sameDay = started.day === today.day && started.month === today.month;
  return sameDay ? time : `${started.day}.${started.month} ${time}`;
}

/**
 * Сегодняшняя дата по Москве в виде YYYY-MM-DD.
 *
 * Считать её через `new Date().toISOString().slice(0,10)` нельзя: это UTC, и с
 * полуночи до трёх ночи по Москве он отдаёт ВЧЕРАШНЕЕ число. Для фильтра «релиз
 * уже вышел» это значит, что вышедшие сегодня релизы на три часа пропадают из
 * каталога.
 */
export function todayInMoscow(nowMs = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
  // en-CA даёт ровно YYYY-MM-DD — тот формат, который ждёт PostgREST.
  return parts;
}
