import assert from "node:assert/strict";
import { test } from "node:test";

import { UnplayableUrlError, assertPlayable, isPlayableUrl } from "./playable.ts";

test("обычные адреса воспроизведения проходят", () => {
  for (const url of [
    "https://radio.surprise.fm/listen/surprise/radio.mp3",
    "https://storage.example.org/shows/1.mp3?token=abc",
    "https://cdn.example.org/track.m3u8",
  ]) {
    assert.equal(isPlayableUrl(url), true, `свой адрес отвергли: ${url}`);
  }
});

/**
 * Главная проверка файла.
 *
 * mpv и ffplay понимают куда больше схем, чем нужно для музыки. Адрес приходит
 * из ответа сервера — из поля в базе, — и `file://` превращал бы его в чтение
 * файлов на машине слушателя, а `concat:` позволял склеить несколько.
 */
test("схемы, читающие локальные файлы, отвергаются", () => {
  for (const url of [
    "file:///etc/passwd",
    "file:///home/user/.ssh/id_rsa",
    "concat:/etc/passwd|/etc/shadow",
    "data:audio/mp3;base64,AAAA",
    "ftp://example.org/x.mp3",
    "rtsp://example.org/x",
    "pipe:0",
  ]) {
    assert.equal(isPlayableUrl(url), false, `опасную схему пропустили: ${url}`);
  }
});

/**
 * Заодно закрывается подстановка аргументов.
 *
 * У ffplay адрес идёт последним элементом argv, и строка, начинающаяся с
 * дефиса, подменила бы опцию. Отдельный разделитель для этого не нужен: «-fs»
 * просто не разбирается как адрес.
 */
test("строки, не являющиеся адресом, отвергаются", () => {
  for (const url of ["", "   ", "-fs", "--help", "/etc/passwd", "./local.mp3", "не адрес"]) {
    assert.equal(isPlayableUrl(url), false, `мусор пропустили: ${JSON.stringify(url)}`);
  }
});

/** Локальный icecast при отладке — обычное дело, и слушать там нечего. */
test("http разрешён только на петле", () => {
  assert.equal(isPlayableUrl("http://localhost:8000/stream"), true);
  assert.equal(isPlayableUrl("http://127.0.0.1:8000/stream"), true);
  assert.equal(isPlayableUrl("http://radio.surprise.fm/stream"), false);
  assert.equal(isPlayableUrl("http://evil.tld/stream"), false);
});

/** Ошибка обязана объяснять, что произошло: её увидит человек, а не лог. */
test("отказ внятный", () => {
  assert.throws(
    () => assertPlayable("file:///etc/passwd"),
    (error: unknown) => {
      assert.ok(error instanceof UnplayableUrlError);
      assert.match(error.message, /https/);
      assert.match(error.message, /file:/);
      return true;
    },
  );
  assert.doesNotThrow(() => assertPlayable("https://radio.surprise.fm/x.mp3"));
});
