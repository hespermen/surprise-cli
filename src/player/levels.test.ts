import assert from "node:assert/strict";
import test from "node:test";

import { SILENCE_DB, levelToRatio, parseLevels } from "./levels.ts";

/** Ответ mpv снят с живого прогона — ключи и формат ровно такие. */
const SAMPLE = {
  "lavfi.astats.1.Peak_level": "-10.785798",
  "lavfi.astats.1.RMS_level": "-22.148688",
  "lavfi.astats.1.Flat_factor": "0.000000",
  "lavfi.astats.2.Peak_level": "-10.745922",
  "lavfi.astats.2.RMS_level": "-22.308845",
  "lavfi.astats.Overall.Peak_level": "-10.745922",
  "lavfi.astats.Overall.RMS_level": "-22.228028",
};

test("parseLevels: читает суммарные и поканальные уровни", () => {
  const levels = parseLevels(SAMPLE);
  assert.equal(levels.rmsDb, -22.228028);
  assert.equal(levels.peakDb, -10.745922);
  assert.deepEqual(levels.channelsDb, [-22.148688, -22.308845]);
});

test("parseLevels: каналы идут по номеру, а не по порядку ключей", () => {
  // Порядок ключей в объекте не гарантирован, а левый и правый канал путать
  // нельзя — картинка перестанет соответствовать звуку.
  const shuffled = {
    "lavfi.astats.2.RMS_level": "-30",
    "lavfi.astats.10.RMS_level": "-10",
    "lavfi.astats.1.RMS_level": "-20",
  };
  assert.deepEqual(parseLevels(shuffled).channelsDb, [-20, -30, -10]);
});

test("parseLevels: без суммарного значения берётся худший канал, а не ноль", () => {
  // Ноль в dBFS — это МАКСИМАЛЬНАЯ громкость. Подставить его вместо
  // отсутствующего значения значило бы показать тишину как клиппинг.
  const levels = parseLevels({
    "lavfi.astats.1.RMS_level": "-40",
    "lavfi.astats.2.RMS_level": "-35",
  });
  assert.equal(levels.rmsDb, -35);
  assert.equal(levels.peakDb, -35);
});

test("parseLevels: тишина и бесконечности зажимаются", () => {
  // astats на полной тишине отдаёт -inf; без зажима шкала уезжает в никуда.
  const levels = parseLevels({ "lavfi.astats.Overall.RMS_level": "-inf" });
  assert.equal(levels.rmsDb, SILENCE_DB);
});

test("parseLevels: значения выше нуля не пропускаются", () => {
  // 0 dBFS — потолок. Всё, что выше, — артефакт измерения, и шкала от него
  // переполнилась бы.
  assert.equal(parseLevels({ "lavfi.astats.Overall.RMS_level": "3.5" }).rmsDb, 0);
});

test("parseLevels: мусор и пустота дают тишину, а не падение", () => {
  for (const bad of [null, undefined, "строка", 42, {}, { "lavfi.astats.1.RMS_level": "нет" }]) {
    const levels = parseLevels(bad);
    assert.equal(levels.rmsDb, SILENCE_DB, JSON.stringify(bad));
    assert.deepEqual(levels.channelsDb, []);
  }
});

test("levelToRatio: тишина — ноль, максимум — единица", () => {
  assert.equal(levelToRatio(SILENCE_DB), 0);
  assert.equal(levelToRatio(0), 1);
  assert.equal(levelToRatio(-1000), 0, "ниже порога не уходим в минус");
  assert.equal(levelToRatio(Number.NaN), 0);
});

test("levelToRatio: растёт монотонно", () => {
  let previous = -1;
  for (let db = SILENCE_DB; db <= 0; db += 5) {
    const ratio = levelToRatio(db);
    assert.ok(ratio >= previous, `на ${db} dB доля уменьшилась`);
    assert.ok(ratio >= 0 && ratio <= 1, `доля вне диапазона на ${db} dB`);
    previous = ratio;
  }
});
