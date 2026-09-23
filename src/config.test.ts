import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { CLIENT_NAME, checkApiUrl } from "./config.ts";

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

function ok(raw: string): string {
  const result = checkApiUrl(raw);
  assert.ok("url" in result, `ожидалось, что «${raw}» примут, а вышло: ${JSON.stringify(result)}`);
  return result.url;
}

function rejected(raw: string): string {
  const result = checkApiUrl(raw);
  assert.ok("error" in result, `«${raw}» обязан быть отвергнут, а его приняли`);
  return result.error;
}

test("https принимается", () => {
  assert.equal(ok("https://api.surprise.fm"), "https://api.surprise.fm");
  assert.equal(ok("https://staging.example.org"), "https://staging.example.org");
});

/** Хвостовой слеш — частая опечатка, из неё получались адреса с двойным //. */
test("хвостовые слеши срезаются", () => {
  assert.equal(ok("https://api.surprise.fm/"), "https://api.surprise.fm");
  assert.equal(ok("  https://api.surprise.fm///  "), "https://api.surprise.fm");
});

/**
 * Главная проверка файла.
 *
 * По http на внешний хост уходили бы заголовок с токеном, refresh_token и
 * пароль — открытым текстом, по дороге, которую слушает кто угодно.
 */
test("http на внешний хост отвергается", () => {
  const message = rejected("http://evil.tld");
  assert.match(message, /https/, "в отказе должно быть сказано, что нужен https");
  rejected("http://api.surprise.fm");
  rejected("http://192.168.1.10:8000");
});

/** Отладка против локального Supabase — законная нужда, трафик не покидает машину. */
test("http на петлю разрешён", () => {
  assert.equal(ok("http://localhost:54321"), "http://localhost:54321");
  assert.equal(ok("http://127.0.0.1:54321"), "http://127.0.0.1:54321");
  assert.equal(ok("http://[::1]:54321"), "http://[::1]:54321");
});

test("прочие схемы отвергаются", () => {
  for (const raw of ["file:///etc/passwd", "ftp://example.org", "javascript:alert(1)", "data:,x"]) {
    rejected(raw);
  }
});

test("мусор вместо адреса отвергается", () => {
  for (const raw of ["", "   ", "не адрес", "//example.org", "api.surprise.fm"]) {
    rejected(raw);
  }
});
