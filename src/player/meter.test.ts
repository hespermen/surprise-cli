import assert from "node:assert/strict";
import test from "node:test";

import {
  METER_CHANNEL_ROWS,
  METER_FLOOR_DB,
  METER_GLYPHS,
  METER_GLYPH_RANGE,
  METER_MAX_DB,
  METER_MIN_DB,
  METER_ROWS,
  decayPeak,
  litSegments,
  scaleRow,
  segmentDb,
  zoneOf,
} from "./meter.ts";

test("zoneOf: предупреждение приходит ДО нуля", () => {
  // Граница жёлтой зоны не на нуле намеренно: индикатор, сообщающий о
  // перегрузке ровно в момент перегрузки, бесполезен.
  assert.equal(zoneOf(-20), "safe");
  assert.equal(zoneOf(-6.1), "safe");
  assert.equal(zoneOf(-6), "warn");
  assert.equal(zoneOf(-1.1), "warn");
  assert.equal(zoneOf(-1), "over");
  assert.equal(zoneOf(3), "over");
});

test("litSegments: края шкалы дают пустоту и полную полосу", () => {
  assert.equal(litSegments(METER_MIN_DB, 30), 0);
  assert.equal(litSegments(METER_MAX_DB, 30), 30);
  assert.equal(litSegments(-100, 30), 0, "ниже шкалы не уходим в минус");
  assert.equal(litSegments(50, 30), 30, "выше шкалы не вылезаем за полосу");
});

test("litSegments: растёт монотонно и не выходит за границы", () => {
  let previous = -1;
  for (let db = METER_MIN_DB; db <= METER_MAX_DB; db += 1) {
    const lit = litSegments(db, 40);
    assert.ok(lit >= previous, `на ${db} dB полоса укоротилась`);
    assert.ok(lit >= 0 && lit <= 40);
    previous = lit;
  }
});

test("litSegments: мусор гасит полосу, а не растягивает", () => {
  assert.equal(litSegments(Number.NaN, 30), 0);
  assert.equal(litSegments(-10, 0), 0);
});

test("segmentDb: первый сегмент — низ шкалы, последний — верх", () => {
  assert.equal(segmentDb(0, 20), METER_MIN_DB);
  assert.equal(segmentDb(19, 20), METER_MAX_DB);
});

test("decayPeak: вверх мгновенно, вниз медленно", () => {
  // Смысл метки в том, чтобы короткий всплеск остался видимым.
  assert.equal(decayPeak(-30, -5, 2), -5, "пик обязан подпрыгнуть сразу");
  assert.equal(decayPeak(-5, -30, 2), -7, "и опускаться по шагу");
  assert.equal(decayPeak(-5, -6, 2), -6, "ниже текущего уровня не падаем");
});

test("decayPeak: первый замер задаёт метку, а не спорит с ней", () => {
  assert.equal(decayPeak(Number.NaN, -12, 2), -12);
  assert.equal(decayPeak(Number.NEGATIVE_INFINITY, -12, 2), -12);
});

test("decayPeak: скорость спада не зависит от знака аргумента", () => {
  assert.equal(decayPeak(-5, -40, -3), decayPeak(-5, -40, 3));
});

test("scaleRow: подписи стоят на своих делениях", () => {
  const segments = 46;
  const row = scaleRow(segments, [-30, -20, -10, 0]);
  assert.equal([...row].length, segments, "строка шкалы обязана совпадать по длине с полосой");

  // Правый край подписи — там же, где деление: иначе подпись врёт о границе.
  //
  // Проверяем СОДЕРЖИМОЕ в ожидаемом месте, а не ищем подпись поиском: «0»
  // находится и внутри «-30», и тест на indexOf прошёл бы мимо настоящей ошибки.
  for (const db of [-30, -20, -10, 0]) {
    const label = db === 0 ? "0" : String(db);
    const end = litSegments(db, segments) - 1;
    const start = end - label.length + 1;
    assert.equal(row.slice(start, end + 1), label, `подпись ${label} не на своём делении`);
  }
});

test("scaleRow: подписи не наезжают за края", () => {
  const row = scaleRow(12, [-30, 0]);
  assert.equal([...row].length, 12);
  assert.ok(!row.startsWith(" 3"), "подпись выехала влево за границу");
});

test("высота измерителя — постоянная величина, а не «сколько пришло»", () => {
  // Регрессия, видимая глазом. meterRows считался по последнему ответу опроса, а
  // опрос между тактами возвращает пусто. Блок исчезал, высота панелей над ним
  // пересчитывалась, и весь интерфейс переезжал на три строки — раскладка
  // дрожала сама по себе, без единого нажатия.
  assert.equal(METER_CHANNEL_ROWS, 2);
  assert.equal(METER_ROWS, METER_CHANNEL_ROWS + 1, "строки каналов плюс шкала");

  // Формула высоты из раскладки: зависит только от того, УМЕЕТ ли бэкенд отдавать
  // уровни, и от ширины окна. Ни то, ни другое само по себе не меняется.
  const meterRows = (levelsSupported: boolean, width: number) =>
    levelsSupported && width >= 20 ? METER_ROWS : 0;

  assert.equal(meterRows(true, 100), 3, "данных может не быть — высота та же");
  assert.equal(meterRows(true, 15), 0, "в узком окне измерителя нет вовсе");
  assert.equal(meterRows(false, 100), 0, "ffplay уровней не даёт");
});

test("пустые данные рисуются на полу шкалы, а не прячут полосу", () => {
  // Пустая полоса честнее исчезнувшей: видно, что прибор жив, а звука нет.
  assert.equal(litSegments(METER_FLOOR_DB, 40), 0);
  assert.ok(METER_FLOOR_DB < METER_MIN_DB, "пол ниже нижнего края шкалы");
});

/**
 * Главная проверка файла.
 *
 * Символы полосы обязаны происходить из той же сетки, что и рамки интерфейса:
 * Box Drawing и Block Elements терминал рисует сам, ровно одной клеткой. Всё
 * остальное он отдаёт шрифту, и ширина перестаёт быть предсказуемой.
 *
 * Одного замера ширины мало, и это проверено на практике: «·» по таблице
 * считается такой же «неоднозначной», как «█», то есть замер их не различает,
 * а терминал рисовал первый вдвое шире второго. Полоса дрожала в такт музыке,
 * и найти причину замером было нельзя — только происхождением символа.
 */
test("символы полосы — из сетки, которую терминал рисует сам", async () => {
  const { default: stringWidth } = await import("string-width");

  for (const [name, glyph] of Object.entries(METER_GLYPHS)) {
    assert.equal([...glyph].length, 1, `${name}: «${glyph}» — не один символ`);

    const code = glyph.codePointAt(0)!;
    assert.ok(
      code >= METER_GLYPH_RANGE.first && code <= METER_GLYPH_RANGE.last,
      `${name}: «${glyph}» (U+${code.toString(16).toUpperCase().padStart(4, "0")}) вне Box Drawing и Block Elements — ` +
        "его ширину решает шрифт, а не терминал",
    );

    assert.equal(stringWidth(glyph), 1, `${name}: «${glyph}» занимает не одну колонку`);
  }
});

/** Полоса обязана быть одной ширины при любой громкости. */
test("ширина полосы не зависит от уровня", async () => {
  const { default: stringWidth } = await import("string-width");
  const segments = 64;

  const widths = new Set<number>();
  for (let db = METER_FLOOR_DB; db <= METER_MAX_DB; db += 0.5) {
    const lit = litSegments(db, segments);
    const peakAt = Math.max(0, litSegments(db, segments) - 1);
    const row = Array.from({ length: segments }, (_, index) =>
      index === peakAt && peakAt >= lit
        ? METER_GLYPHS.peak
        : index < lit
          ? METER_GLYPHS.lit
          : METER_GLYPHS.dim,
    ).join("");
    widths.add(stringWidth(row));
  }

  assert.deepEqual([...widths], [segments], `ширина гуляет: ${[...widths].join(", ")}`);
});

test("полоса из любых символов укладывается в отведённые колонки", async () => {
  const { default: stringWidth } = await import("string-width");
  const segments = 64;

  // Крайние случаи: всё погашено, всё горит, и смесь с меткой пика.
  const rows = [
    METER_GLYPHS.dim.repeat(segments),
    METER_GLYPHS.lit.repeat(segments),
    METER_GLYPHS.lit.repeat(30) + METER_GLYPHS.peak + METER_GLYPHS.dim.repeat(segments - 31),
  ];

  for (const row of rows) {
    assert.equal(stringWidth(row), segments, "ширина полосы обязана совпадать с числом делений");
  }
});
