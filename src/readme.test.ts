import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function doc(name: string): Promise<string> {
  return readFile(new URL(`../${name}`, import.meta.url), "utf8");
}

/**
 * Два перевода одного документа расходятся молча.
 *
 * Правка попадает в тот файл, который был открыт, а второй остаётся как был —
 * и замечают это, когда кто-то по английской версии делает то, чего в ней уже
 * не написано. Проверка грубая нарочно: она не сверяет текст, а требует, чтобы
 * у обоих файлов совпадал СКЕЛЕТ. Добавил раздел в один — добавь и в другой.
 */
test("русский и английский README одной структуры", async () => {
  const [ru, en] = await Promise.all([doc("README.md"), doc("README.en.md")]);

  const headings = (text: string) =>
    text.split("\n").filter((line) => /^#{2,3} /.test(line)).map((line) => line.match(/^#+/)![0]);

  assert.deepEqual(
    headings(en),
    headings(ru),
    "разделы разошлись: уровни и их число обязаны совпадать",
  );

  const blocks = (text: string) => (text.match(/^```/gm) ?? []).length;
  assert.equal(blocks(en), blocks(ru), "число блоков с кодом разошлось");

  const tables = (text: string) => (text.match(/^\|---/gm) ?? []).length;
  assert.equal(tables(en), tables(ru), "число таблиц разошлось");
});

/** Переводы ссылаются друг на друга: иначе английскую версию просто не найдут. */
test("README ссылаются друг на друга", async () => {
  assert.match(await doc("README.md"), /README\.en\.md/);
  assert.match(await doc("README.en.md"), /README\.md/);
});
