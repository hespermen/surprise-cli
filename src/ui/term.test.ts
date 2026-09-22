import assert from "node:assert/strict";
import test from "node:test";

import { renderQr, visibleWidth } from "./term.ts";

const BOT_URL = `https://telegram.me/SurpriseAppBot?start=auth_${"x".repeat(43)}`;

test("visibleWidth: не считает ANSI-раскраску", () => {
  assert.equal(visibleWidth("abc"), 3);
  assert.equal(visibleWidth("\u001B[32mabc\u001B[39m"), 3);
  assert.equal(visibleWidth("\u001B[1m\u001B[31m██\u001B[39m\u001B[22m"), 2);
});

test("renderQr: в широком терминале рисует КРУПНЫЙ код", async () => {
  // Крупный модуль — две клетки против полклетки у мелкого, площадь вчетверо.
  // Телефон на мелком спотыкается: сглаживание шрифта размывает границы.
  const previous = process.stdout.columns;
  Object.defineProperty(process.stdout, "columns", { value: 120, configurable: true });
  try {
    const qr = await renderQr(BOT_URL);
    assert.ok(qr);
    const lines = qr.split("\n");
    const widest = lines.reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
    // У крупного строк примерно столько же, сколько колонок делённых на два:
    // модуль занимает две клетки в ширину и одну в высоту.
    assert.ok(widest >= 60, `ожидали крупный код, получили ширину ${widest}`);
    assert.ok(lines.length >= widest / 2 - 2, "похоже, всё-таки мелкий вариант");
  } finally {
    Object.defineProperty(process.stdout, "columns", { value: previous, configurable: true });
  }
});

test("renderQr: помещается в обычные 80 колонок", async () => {
  // Регрессия: ширину мерили через .length вместе с escape-последовательностями,
  // выходило 874 «колонки», и QR не показывался ни в одном терминале.
  const previous = process.stdout.columns;
  Object.defineProperty(process.stdout, "columns", { value: 80, configurable: true });
  try {
    const qr = await renderQr(BOT_URL);
    assert.ok(qr, "QR должен отрисоваться при ширине 80");
    const widest = qr.split("\n").reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
    assert.ok(widest <= 80, `QR занял ${widest} колонок`);
  } finally {
    Object.defineProperty(process.stdout, "columns", { value: previous, configurable: true });
  }
});

test("renderQr: в узком терминале возвращает null, а не обрезанный QR", async () => {
  // Обрезанный по краю QR не считывается камерой — показать его хуже, чем не
  // показать: человек будет наводить телефон на заведомо нерабочий код.
  const previous = process.stdout.columns;
  Object.defineProperty(process.stdout, "columns", { value: 20, configurable: true });
  try {
    assert.equal(await renderQr(BOT_URL), null);
  } finally {
    Object.defineProperty(process.stdout, "columns", { value: previous, configurable: true });
  }
});
