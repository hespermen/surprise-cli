import assert from "node:assert/strict";
import test from "node:test";

import { PREVIEW_FALLBACK_SEC, PREVIEW_START_RATIO, previewCutoff, previewWindow } from "./previewWindow.ts";

test("previewWindow: по умолчанию начинается с 25% длительности", () => {
  // Первые полминуты электронного трека — интро и раскачка, по ним релиз не
  // оценить, поэтому превью попадает в тело трека.
  const window = previewWindow({ duration: 400 });
  assert.equal(window.startSec, Math.floor(400 * PREVIEW_START_RATIO));
  assert.equal(window.durationSec, PREVIEW_FALLBACK_SEC);
  assert.equal(window.endSec, window.startSec + PREVIEW_FALLBACK_SEC);
});

test("previewWindow: ручная настройка важнее расчёта", () => {
  const window = previewWindow({ duration: 400, preview_start_sec: 120, preview_duration_sec: 45 });
  assert.equal(window.startSec, 120);
  assert.equal(window.durationSec, 45);
  assert.equal(window.endSec, 165);
});

test("previewWindow: ноль в preview_start_sec — это «не настраивали»", () => {
  // Так почти у всех треков в базе. Приняв ноль за осознанный старт с нуля, мы
  // вернули бы превью к интро ровно там, где его хотели избежать.
  const window = previewWindow({ duration: 400, preview_start_sec: 0 });
  assert.equal(window.startSec, 100);
});

test("previewWindow: трек короче превью звучит целиком", () => {
  const window = previewWindow({ duration: 20 });
  assert.deepEqual(window, { startSec: 0, durationSec: 20, endSec: 20 });
});

test("previewWindow: превью не упирается в тишину на конце", () => {
  // Старт прижимается к хвосту, чтобы 30 секунд реально звучали.
  const window = previewWindow({ duration: 100, preview_start_sec: 95 });
  assert.equal(window.startSec, 70);
  assert.equal(window.endSec, 100);
});

test("previewWindow: неизвестная длительность — играем с начала", () => {
  for (const duration of [null, undefined, 0, -10, Number.NaN]) {
    const window = previewWindow({ duration: duration as number });
    assert.deepEqual(window, { startSec: 0, durationSec: PREVIEW_FALLBACK_SEC, endSec: PREVIEW_FALLBACK_SEC }, String(duration));
  }
});

test("previewWindow: гарантии держатся на всём диапазоне длительностей", () => {
  // Те же инварианты, что у первоисточника: окно всегда внутри трека и непустое.
  for (let duration = 1; duration <= 3_600; duration += 7) {
    const window = previewWindow({ duration });
    assert.ok(window.startSec >= 0, `start < 0 при duration=${duration}`);
    assert.ok(window.durationSec > 0, `пустое окно при duration=${duration}`);
    assert.ok(
      window.startSec + window.durationSec <= Math.max(duration, PREVIEW_FALLBACK_SEC),
      `окно вышло за трек при duration=${duration}`,
    );
    assert.equal(window.endSec, window.startSec + window.durationSec);
  }
});

test("previewCutoff: чужая позиция от прошлого трека не обрывает превью", () => {
  // Регрессия, из-за которой музыка не играла вовсе. Позиция между загрузкой и
  // первым отсчётом принадлежит ПРЕДЫДУЩЕМУ файлу: после часа эфира это тысячи
  // секунд против тридцати секунд окна — обрыв срабатывал мгновенно.
  assert.deepEqual(previewCutoff(3600, 84, false), { stop: false, armed: false });
});

test("previewCutoff: обрыв только после позиции внутри окна", () => {
  // Дойти до конца можно лишь побывав до него.
  const first = previewCutoff(54, 84, false);
  assert.deepEqual(first, { stop: false, armed: true });
  assert.deepEqual(previewCutoff(84, 84, first.armed), { stop: true, armed: true });
  assert.deepEqual(previewCutoff(90, 84, first.armed), { stop: true, armed: true });
});

test("previewCutoff: без окна и без позиции ничего не происходит", () => {
  assert.deepEqual(previewCutoff(100, null, true), { stop: false, armed: true });
  assert.deepEqual(previewCutoff(null, 84, true), { stop: false, armed: true });
});
