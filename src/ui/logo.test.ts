import assert from "node:assert/strict";
import { test } from "node:test";

import { LOGO_HEIGHT, LOGO_ROWS, LOGO_WIDTH, logoRows } from "./logo.ts";

test("логотип ровно той высоты, под которую считает раскладка", () => {
  assert.equal(LOGO_ROWS.length, LOGO_HEIGHT);
});

/**
 * Все строки одной ширины.
 *
 * Строка короче остальных — это дыра в знаке, а длиннее — выход за отведённое
 * место: в полноэкранном интерфейсе под логотип отведено ровно LOGO_WIDTH
 * колонок, и лишняя утащила бы за собой перенос на новую строку.
 */
test("все строки логотипа одинаковой ширины", async () => {
  const { default: stringWidth } = await import("string-width");
  const widths = new Set(LOGO_ROWS.map((row) => stringWidth(row)));
  assert.deepEqual([...widths], [LOGO_WIDTH], `ширины разъехались: ${[...widths].join(", ")}`);
});

/** Рисунок собран из той же сетки, что и рамки: её терминал рисует сам. */
test("логотип нарисован блочными символами", () => {
  for (const char of new Set(LOGO_ROWS.join(""))) {
    if (char === " ") continue;
    const code = char.codePointAt(0)!;
    assert.ok(
      code >= 0x2500 && code <= 0x259f,
      `«${char}» (U+${code.toString(16).toUpperCase()}) вне Box Drawing и Block Elements`,
    );
  }
});

/** Обрезанный логотип читается как сломанный интерфейс, а не как логотип. */
test("в узком окне логотипа нет вовсе", () => {
  assert.equal(logoRows(LOGO_WIDTH + 2)?.length, LOGO_HEIGHT);
  assert.equal(logoRows(LOGO_WIDTH + 1), null);
  assert.equal(logoRows(10), null);
});
