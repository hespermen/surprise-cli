import assert from "node:assert/strict";
import test from "node:test";

import { describeFailure } from "./failure.ts";

test("describeFailure: нет звукового устройства — говорим об этом прямо", () => {
  // Регрессия: ffplay без звуковой карты выходит с КОДОМ 0, будто доиграл.
  // Часовой выпуск «заканчивался» за полсекунды, а человек видел только
  // «Остановлено.» и не имел ни одного способа понять почему.
  const alsa = [
    "ALSA lib confmisc.c:855:(parse_card) cannot find card '0'",
    "ALSA lib conf.c:5205:(_snd_config_evaluate) function snd_func_card_inum returned error: No such file or directory",
  ].join("\n");
  const message = describeFailure(alsa, "ffplay");
  assert.match(message, /звуковое устройство/);
  assert.match(message, /ffplay/);
});

test("describeFailure: коды HTTP переводятся в понятную причину", () => {
  assert.match(describeFailure("HTTP error 403 Forbidden", "ffplay"), /403/);
  assert.match(describeFailure("Server returned 404 Not Found", "ffplay"), /404/);
});

test("describeFailure: «not found» без кода — это битый файл, а не 404", () => {
  // Ловушка, на которой этот тест и поймал ошибку: «moov atom not found»
  // классифицировалось как HTTP 404, и человек шёл проверять ссылку вместо
  // файла. Текст статуса встречается в сообщениях, к HTTP отношения не
  // имеющих, — опознаём по самому коду.
  for (const text of ["moov atom not found", "Stream not found", "Invalid data found when processing input"]) {
    assert.match(describeFailure(text, "ffplay"), /повреждён|не аудио/, text);
  }
});

test("describeFailure: незнакомая ошибка — последняя содержательная строка", () => {
  // Целиком лог ffmpeg показывать бессмысленно, но и глотать его нельзя.
  const message = describeFailure("первая строка\n\nчто-то пошло не так\n\n", "ffplay");
  assert.equal(message, "ffplay: что-то пошло не так");
});

test("describeFailure: пустой stderr — всё равно осмысленный текст", () => {
  const message = describeFailure("   \n  ", "ffplay");
  assert.match(message, /ничего не проиграв/);
});
