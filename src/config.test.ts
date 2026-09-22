import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { CLIENT_NAME } from "./config.ts";

async function manifest(): Promise<{ name: string; version: string }> {
  return JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
}

/**
 * Имя клиента обязано совпадать с именем пакета.
 *
 * Разойдись они — и сервер увидит в x-client-info одно, а установлено будет
 * другое. Именно так и вышло: пакет переименовали из surprise-fm в
 * surprise-cli, оба ставили команду `surprise`, оба отвечали «0.1.0», и понять,
 * какой из них запускается, было нечем.
 */
test("имя клиента совпадает с именем пакета", async () => {
  assert.equal(CLIENT_NAME, (await manifest()).name);
});

/**
 * Версия пакета обязана двигаться.
 *
 * Запасное значение в config.ts — только для запуска из исходников; в собранный
 * файл сборка подставляет настоящую. Проверяем, что настоящая не осталась той,
 * с которой всё начиналось: неизменная версия лишает единственного способа
 * отличить обновлённую установку от застрявшей.
 */
test("версия пакета ушла от начальной", async () => {
  const { version } = await manifest();
  assert.match(version, /^\d+\.\d+\.\d+$/, `странная версия: ${version}`);
  assert.notEqual(version, "0.1.0", "версия не менялась с самого первого выпуска");
});
