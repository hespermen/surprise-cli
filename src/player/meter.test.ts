import assert from "node:assert/strict";
import test from "node:test";

import { METER_MAX_DB, METER_MIN_DB, decayPeak, litSegments, scaleRow, segmentDb, zoneOf } from "./meter.ts";

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
