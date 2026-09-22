import assert from "node:assert/strict";
import { test } from "node:test";

import { LANGS, setLang, t, tf } from "./i18n.ts";

test("подстановка значений в перевод", () => {
  setLang("ru");
  assert.equal(
    tf("tooSmall.need", { cols: 104, rows: 44, haveCols: 80, haveRows: 24 }),
    "Нужно хотя бы 104×44, сейчас 80×24.",
  );
  setLang("en");
  assert.match(tf("tooSmall.need", { cols: 104, rows: 44, haveCols: 80, haveRows: 24 }), /104×44/);
  setLang("ru");
});

/** Забытое значение оставляет скобки на месте — это видно, а пустота нет. */
test("непереданное значение не превращается в пустоту", () => {
  setLang("ru");
  assert.match(tf("tooSmall.need", { cols: 104 }), /\{rows\}/);
});

/** Словари обязаны совпадать ключ в ключ, иначе на чужом языке будет дыра. */
test("во всех языках одинаковый набор ключей", () => {
  setLang("ru");
  const keys = ["tooSmall.title", "tooSmall.need", "tooSmall.how", "hint.bar"] as const;
  for (const lang of LANGS) {
    setLang(lang.id);
    for (const key of keys) {
      const value = t(key);
      assert.ok(value && value.trim().length > 0, `${lang.id}: пустой ключ ${key}`);
    }
  }
  setLang("ru");
});
