import assert from "node:assert/strict";
import { test } from "node:test";

import { hintBar } from "./hints.ts";
import { LANGS, setLang, t } from "./i18n.ts";

const WIDE = 200;

test("в широком окне показаны все подсказки", () => {
  setLang("ru");
  const bar = hintBar(WIDE);
  for (const key of ["key.commands", "key.panels", "key.list", "key.play", "key.favourite", "key.help", "key.quit"] as const) {
    assert.ok(bar.includes(t(key)), `нет подсказки ${key}`);
  }
});

/**
 * Главная проверка файла.
 *
 * Строка не должна вылезать за отведённое место НИ на одном языке и ни при
 * какой ширине: вылезшая строка переносится на вторую, и раскладка, которая
 * отвела под подсказки ровно одну строку, съезжает целиком.
 */
test("строка никогда не шире отведённого", async () => {
  const { default: stringWidth } = await import("string-width");
  for (const lang of LANGS) {
    setLang(lang.id);
    for (let width = 1; width <= 220; width += 1) {
      assert.ok(
        stringWidth(hintBar(width)) <= width,
        `${lang.id}, ширина ${width}: «${hintBar(width)}»`,
      );
    }
  }
  setLang("ru");
});

/** Обрывков вроде «q — вых…» быть не должно: подсказка либо есть, либо нет. */
test("подсказки отбрасываются целиком, а не режутся", () => {
  setLang("ru");
  for (let width = 20; width <= 220; width += 1) {
    const bar = hintBar(width);
    for (const part of bar.split(" · ")) {
      assert.ok(!part.includes("…"), `ширина ${width}: обрывок «${part}»`);
    }
  }
});

/** Две двери — помощь и выход — остаются до последнего. */
test("в узком окне сохраняются помощь и выход", () => {
  setLang("ru");
  const narrow = hintBar(30);
  assert.ok(narrow.includes(t("key.quit")), `нет выхода: «${narrow}»`);
  assert.ok(narrow.includes(t("key.help")), `нет помощи: «${narrow}»`);
});

/** Порядок показа привычный и не зависит от того, что выбросили. */
test("оставшиеся подсказки идут в исходном порядке", () => {
  setLang("ru");
  for (let width = 20; width <= 220; width += 5) {
    const parts = hintBar(width).split(" · ");
    const positions = parts.map((part) =>
      ["key.commands", "key.panels", "key.list", "key.play", "key.favourite", "key.help", "key.quit"].findIndex(
        (key) => t(key as never) === part,
      ),
    );
    const sorted = [...positions].sort((left, right) => left - right);
    assert.deepEqual(positions, sorted, `ширина ${width}: порядок сбит`);
  }
});

/** Чем шире окно, тем больше подсказок — и никогда наоборот. */
test("число подсказок растёт вместе с шириной", () => {
  setLang("ru");
  let previous = 0;
  for (let width = 20; width <= 220; width += 1) {
    const count = hintBar(width).split(" · ").length;
    assert.ok(count >= previous, `ширина ${width}: было ${previous}, стало ${count}`);
    previous = count;
  }
});
