/**
 * Окно превью трека магазина: с какой секунды играть и сколько.
 *
 * Порт src/lib/previewWindow.ts (спека docs/specs/free-track-listens.md). Копия,
 * а не импорт — конвенция для всего, что переносится за пределы src/ сайта. При
 * правке первоисточника синхронизировать здесь.
 *
 * Зачем обрезать на клиенте вообще: в бакете store-previews лежит ПОЛНАЯ копия
 * трека в AAC 128, а не тридцатисекундный отрезок. Сервер отдаёт файл целиком, и
 * если плеер не остановится сам, «превью» окажется полным треком.
 *
 * Превью начинается не с нуля, а с 25% длительности: у электронной музыки первые
 * полминуты — интро и раскачка, по которым релиз не оценить.
 */

/** Сколько секунд играет превью, если у трека не задано иное. */
export const PREVIEW_FALLBACK_SEC = 30;

/** Доля длительности, с которой начинается превью, если старт не задан вручную. */
export const PREVIEW_START_RATIO = 0.25;

export interface PreviewTrackFields {
  duration?: number | null;
  preview_start_sec?: number | null;
  preview_duration_sec?: number | null;
}

export interface PreviewWindow {
  startSec: number;
  durationSec: number;
  /** startSec + durationSec — момент, на котором плеер обязан остановиться. */
  endSec: number;
}

const positiveInt = (value: unknown): number | null => {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Гарантии (те же, что у первоисточника):
 *   0 <= startSec, startSec + durationSec <= duration, durationSec > 0
 */
export function previewWindow(track: PreviewTrackFields): PreviewWindow {
  const total = positiveInt(track.duration);
  const wanted = positiveInt(track.preview_duration_sec) ?? PREVIEW_FALLBACK_SEC;

  // Длительность неизвестна — играем с начала, ограничение оставляем дефолтное.
  if (total === null) return { startSec: 0, durationSec: wanted, endSec: wanted };

  // Трек короче превью — звучит целиком.
  if (total <= wanted) return { startSec: 0, durationSec: total, endSec: total };

  // 0 в preview_start_sec — это «не настраивали» (так почти у всех треков), а не
  // осознанный старт с нуля, поэтому падаем на расчёт от длительности.
  const explicit = positiveInt(track.preview_start_sec);
  const desired = explicit ?? Math.floor(total * PREVIEW_START_RATIO);

  // Прижимаем к хвосту: превью не должно упираться в тишину на конце трека.
  const startSec = Math.max(0, Math.min(desired, total - wanted));

  return { startSec, durationSec: wanted, endSec: startSec + wanted };
}

/**
 * Пора ли обрывать превью.
 *
 * Правило «позиция >= конца окна» само по себе неверно, и это стоило
 * воспроизведения музыки целиком. Позиция приходит из общего состояния плеера и
 * между загрузкой нового трека и первым его отсчётом ещё принадлежит ПРЕДЫДУЩЕМУ
 * файлу. После часа эфира она равна тысячам секунд, а окно превью — тридцати:
 * проверка срабатывала мгновенно, и трек обрывался, не начавшись.
 *
 * Поэтому обрыв возможен только после того, как мы увидели позицию ВНУТРИ окна.
 * Дойти до конца можно лишь побывав до него.
 */
export function previewCutoff(
  positionSec: number | null,
  endSec: number | null,
  armed: boolean,
): { stop: boolean; armed: boolean } {
  if (endSec === null || positionSec === null) return { stop: false, armed };
  if (positionSec < endSec) return { stop: false, armed: true };
  return { stop: armed, armed };
}
