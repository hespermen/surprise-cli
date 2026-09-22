/**
 * Логика измерителя уровня.
 *
 * Шкала и зоны — те же, что у любого аппаратного индикатора: слева запас, у нуля
 * жёлтая зона, выше — красная. Это не украшение: смысл измерителя в том, чтобы
 * одним взглядом понять, есть ли запас до перегрузки, а для этого граница должна
 * стоять там, где её привыкли видеть.
 *
 * Всё здесь — чистые функции над числами: поведение измерителя проверяется
 * тестами, а не разглядыванием экрана.
 */

/** Нижний край шкалы. Ниже -40 dBFS различать уже нечего. */
export const METER_MIN_DB = -40;
/** Верхний край: немного выше нуля, чтобы перегрузка была видна, а не упиралась. */
export const METER_MAX_DB = 6;

export type MeterZone = "safe" | "warn" | "over";

/**
 * Сколько строк каналов измеритель занимает ВСЕГДА.
 *
 * Число постоянное, а не «сколько каналов пришло с последнего опроса», и это
 * главное свойство блока. Его высота входит в расчёт высоты панелей над ним:
 * стоило одному ответу прийти пустым — измеритель исчезал, и весь интерфейс
 * переезжал на три строки. Данные приходят рывками, раскладка так вести себя
 * не должна.
 */
export const METER_CHANNEL_ROWS = 2;

/** Строки каналов плюс строка шкалы. */
export const METER_ROWS = METER_CHANNEL_ROWS + 1;

/** Тише этого — тишина: с этого значения полоса пустая. */
export const METER_FLOOR_DB = -120;

/**
 * Зона по уровню.
 *
 * Граница жёлтой зоны — не ноль, а -6 dB: к нулю сигнал подходит уже с
 * предупреждением, иначе индикатор сообщает о перегрузке ровно тогда, когда
 * сделать с ней ничего нельзя.
 */
export function zoneOf(db: number): MeterZone {
  if (db >= -1) return "over";
  if (db >= -6) return "warn";
  return "safe";
}

/** Сколько сегментов горит при таком уровне. */
export function litSegments(db: number, segments: number): number {
  if (segments <= 0 || !Number.isFinite(db)) return 0;
  const clamped = Math.max(METER_MIN_DB, Math.min(METER_MAX_DB, db));
  const ratio = (clamped - METER_MIN_DB) / (METER_MAX_DB - METER_MIN_DB);
  return Math.round(ratio * segments);
}

/** Уровень, которому соответствует сегмент — по нему красим шкалу. */
export function segmentDb(index: number, segments: number): number {
  if (segments <= 1) return METER_MIN_DB;
  const ratio = index / (segments - 1);
  return METER_MIN_DB + ratio * (METER_MAX_DB - METER_MIN_DB);
}

/**
 * Удержание пика с медленным спадом.
 *
 * Метка пика — главное, ради чего смотрят на измеритель: мгновенный столбик
 * скачет слишком быстро, чтобы разглядеть максимум. Метка подпрыгивает мгновенно
 * и опускается медленно, поэтому короткий всплеск остаётся видимым.
 *
 * Спад задаётся в децибелах за такт, а не долей: шкала логарифмическая, и
 * умножение давало бы разную скорость в разных частях шкалы.
 */
export function decayPeak(previous: number, current: number, fallDbPerTick: number): number {
  if (!Number.isFinite(previous)) return current;
  if (current >= previous) return current;
  return Math.max(current, previous - Math.abs(fallDbPerTick));
}

/**
 * Подписи шкалы под измерителем.
 *
 * Возвращает строку, в которой отметки стоят на своих местах по шкале. Рисовать
 * их «на глаз» нельзя: подпись, съехавшая на пару символов, врёт о том, где
 * проходит граница.
 */
export function scaleRow(segments: number, marks: readonly number[] = [-30, -20, -10, -5, 0]): string {
  if (segments <= 0) return "";
  const row = Array.from({ length: segments }, () => " ");

  for (const db of marks) {
    const label = db === 0 ? "0" : String(db);
    const position = litSegments(db, segments) - 1;
    // Подпись ставим так, чтобы её ПРАВЫЙ край совпал с отметкой: иначе «-30»
    // уползает вправо от того деления, которое подписывает.
    const start = Math.max(0, Math.min(segments - label.length, position - label.length + 1));
    for (let i = 0; i < label.length; i += 1) row[start + i] = label[i]!;
  }

  return row.join("");
}
