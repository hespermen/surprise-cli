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

/**
 * Предел числа делений.
 *
 * Полоса тянется во всю ширину окна: измеритель на полэкрана читается хуже —
 * при тех же децибелах на деление приходится вдвое больше, и мелкие изменения
 * уровня просто не видны. Предел нужен лишь на случай очень широкого окна,
 * где дальше дробить шкалу уже бессмысленно.
 */
export const METER_MAX_SEGMENTS = 160;

/** Тише этого — тишина: с этого значения полоса пустая. */
export const METER_FLOOR_DB = -120;

/**
 * Диапазон символов, которым можно доверять.
 *
 * Box Drawing (U+2500–257F) и Block Elements (U+2580–259F) терминалы рисуют
 * САМИ, своей сеткой, а не шрифтом: ровно одна клетка на символ, одинаково у
 * всех. На этом держатся рамки любого текстового интерфейса.
 *
 * Всё, что снаружи диапазона, отдаётся шрифту — и ширина становится его делом.
 */
export const METER_GLYPH_RANGE = { first: 0x2500, last: 0x259f } as const;

/**
 * Символы полосы. Все — из METER_GLYPH_RANGE, и это проверяет тест.
 *
 * Правило выстрадано дважды. Погашенным делением был сначала «▪» (Geometric
 * Shapes), потом «·» (Latin-1) — и оба раза терминал рисовал их ВДВОЕ шире
 * залитого «█». Полоса из 64 делений растягивалась на 128 колонок, а её ширина
 * менялась вместе с музыкой: чем громче, тем больше узких «█» вместо широких
 * погашенных. Экран дрожал в такт звуку.
 *
 * Проверять ширину библиотекой оказалось мало: и «·», и «█» числятся
 * «неоднозначными» по восточноазиатской таблице, то есть библиотека считает их
 * одинаковыми, а терминал — нет. Надёжно здесь не измерение, а происхождение
 * символа: из той же сетки, что и рамки вокруг.
 */
export const METER_GLYPHS = {
  /** Горящее деление. */
  lit: "█",
  /** Метка удержания пика. */
  peak: "┃",
} as const;

/**
 * Погашенная часть полосы — пустота.
 *
 * Деления запаса убраны намеренно: на широком окне их больше сотни в строке,
 * они занимают весь экран и спорят за внимание с тем единственным, что здесь
 * важно, — где сейчас уровень. Пустое место показывает запас ничуть не хуже,
 * а глаз цепляется за границу залитого, а не за россыпь точек.
 *
 * Пробел — ещё и единственный символ, чья ширина не зависит ни от шрифта, ни
 * от настроек терминала. После двух промахов подряд это не лишнее.
 */
export const METER_BLANK = " ";

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


/** Первое деление, которому соответствует уровень не ниже db. */
function segmentAtDb(db: number, segments: number): number {
  if (segments <= 1) return 0;
  const ratio = (db - METER_MIN_DB) / (METER_MAX_DB - METER_MIN_DB);
  return Math.max(0, Math.min(segments, Math.ceil(ratio * (segments - 1))));
}

/** Кусок полосы одного цвета. */
export interface MeterRun {
  text: string;
  /** Зона задаёт цвет; у пустоты цвета нет. */
  zone: MeterZone | null;
}

/**
 * Полоса, разложенная на однотонные куски.
 *
 * Раньше каждое деление было отдельным элементом — больше сотни на строку,
 * и все они перерисовывались десять раз в секунду. Кусками выходит пять
 * элементов вместо ста семнадцати при том же изображении.
 *
 * Сумма длин кусков ВСЕГДА равна числу делений — это проверяет тест. На этом
 * держится неподвижность строки: полоса обязана занимать одинаковое место при
 * любой громкости, иначе всё под ней дёргается в такт музыке.
 */
export function meterRuns(db: number, peakDb: number, segments: number): MeterRun[] {
  if (segments <= 0) return [];

  const lit = litSegments(db, segments);
  const runs: MeterRun[] = [];

  // Залитая часть раскладывается по зонам: запас, предупреждение, перегрузка.
  const zones: ReadonlyArray<{ zone: MeterZone; end: number }> = [
    { zone: "safe", end: segmentAtDb(-6, segments) },
    { zone: "warn", end: segmentAtDb(-1, segments) },
    { zone: "over", end: segments },
  ];

  let cursor = 0;
  for (const { zone, end } of zones) {
    const stop = Math.min(lit, end);
    if (stop > cursor) {
      runs.push({ text: METER_GLYPHS.lit.repeat(stop - cursor), zone });
      cursor = stop;
    }
  }

  // Метка пика видна только когда она ВЫШЕ залитого: внутри полосы её всё
  // равно не разглядеть, а смысл метки в том, чтобы показать недавний максимум.
  const peakAt = Math.max(0, litSegments(peakDb, segments) - 1);
  if (peakAt >= lit && peakAt < segments) {
    if (peakAt > lit) runs.push({ text: METER_BLANK.repeat(peakAt - lit), zone: null });
    runs.push({ text: METER_GLYPHS.peak, zone: zoneOf(segmentDb(peakAt, segments)) });
    cursor = peakAt + 1;
  } else {
    cursor = lit;
  }

  if (segments > cursor) runs.push({ text: METER_BLANK.repeat(segments - cursor), zone: null });
  return runs;
}
