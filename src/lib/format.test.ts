import assert from "node:assert/strict";
import test from "node:test";

import { formatDuration, pad, progressBar, truncate } from "./format.ts";

test("formatDuration: часы появляются только когда они есть", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(9), "0:09");
  assert.equal(formatDuration(252), "4:12");
  assert.equal(formatDuration(3600), "1:00:00");
  assert.equal(formatDuration(3852), "1:04:12");
  // Выпуски бывают по три часа — проверяем, что не переполняется.
  assert.equal(formatDuration(11_045), "3:04:05");
});

test("formatDuration: неизвестная длительность — прочерк, а не 0:00", () => {
  // Ноль означал бы «трек нулевой длины»; у живого потока длительности просто нет.
  for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(formatDuration(value as number), "--:--");
  }
});

test("formatDuration: отрицательное время зажимается в ноль", () => {
  assert.equal(formatDuration(-5), "0:00");
});

test("truncate: режет по символам, а не по UTF-16 единицам", () => {
  assert.equal(truncate("Shuliko", 20), "Shuliko");
  assert.equal(truncate("SURPRISE.FM w/ Shuliko", 10), "SURPRISE.…");
  // Кириллица и эмодзи: slice по .length разорвал бы суррогатную пару и оставил
  // в выводе битый символ.
  assert.equal(truncate("Привет мир", 6), "Приве…");
  assert.equal([...truncate("🎵🎵🎵🎵", 3)].length, 3);
  assert.equal(truncate("что угодно", 1), "…");
  assert.equal(truncate("что угодно", 0), "");
});

test("pad: дополняет по видимой длине", () => {
  assert.equal(pad("ab", 5), "ab   ");
  assert.equal(pad("абв", 5), "абв  ");
  assert.equal(pad("длиннее", 3), "длиннее");
});

test("progressBar: живой поток шкалы не получает", () => {
  // У эфира конца нет — рисовать шкалу нечестно, она врала бы о позиции.
  assert.equal(progressBar(30, null, 20), "");
  assert.equal(progressBar(30, 0, 20), "");
});

test("progressBar: заполнение соответствует доле", () => {
  assert.equal(progressBar(0, 100, 10), "──────────");
  assert.equal(progressBar(50, 100, 10), "━━━━━──────".slice(0, 10));
  assert.equal([...progressBar(100, 100, 10)].length, 10);
  assert.equal(progressBar(100, 100, 10), "━".repeat(10));
});

test("progressBar: позиция вне диапазона не ломает ширину", () => {
  // Часы клиента и сервера расходятся — позиция больше длительности реальна.
  assert.equal([...progressBar(500, 100, 10)].length, 10);
  assert.equal([...progressBar(-10, 100, 10)].length, 10);
  assert.equal(progressBar(null, 100, 10), "─".repeat(10));
});
