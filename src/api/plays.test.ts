import assert from "node:assert/strict";
import test from "node:test";

import { ANALYTICS_DEDUPE_MS, ListenCounter, PlayDeduper } from "./plays.ts";

test("PlayDeduper: повторный засчёт в окне не проходит", () => {
  const deduper = new PlayDeduper();
  const start = 1_000_000;

  assert.equal(deduper.claim("store_track", "t1", start), true);
  assert.equal(deduper.claim("store_track", "t1", start + 1_000), false);
  assert.equal(deduper.claim("store_track", "t1", start + ANALYTICS_DEDUPE_MS - 1), false);
  assert.equal(deduper.claim("store_track", "t1", start + ANALYTICS_DEDUPE_MS), true, "окно прошло — можно снова");
});

test("PlayDeduper: разные сущности и разные типы не мешают друг другу", () => {
  const deduper = new PlayDeduper();
  const now = 1_000_000;

  assert.equal(deduper.claim("store_track", "t1", now), true);
  assert.equal(deduper.claim("store_track", "t2", now), true);
  // Один и тот же id может встретиться в разных типах — ключ обязан включать тип.
  assert.equal(deduper.claim("show_audio", "t1", now), true);
  assert.equal(deduper.claim("show_audio", "t1", now), false);
});

test("ListenCounter: пауза не набивает прослушанное", () => {
  // Иначе оставленный на ночь терминал «прослушает» выпуск восемь раз.
  const counter = new ListenCounter();
  counter.start(0);
  counter.pause(10_000);

  assert.equal(counter.listenedMs(10_000), 10_000);
  // Час на паузе — счётчик стоит.
  assert.equal(counter.listenedMs(3_610_000), 10_000);

  counter.start(3_610_000);
  assert.equal(counter.listenedMs(3_615_000), 15_000);
});

test("ListenCounter: повторный start не сбрасывает и не удваивает счёт", () => {
  const counter = new ListenCounter();
  counter.start(0);
  counter.start(5_000); // «лишний» вызов из обработчика события
  assert.equal(counter.listenedMs(10_000), 10_000);
});

test("ListenCounter: повторная пауза не вычитает время дважды", () => {
  const counter = new ListenCounter();
  counter.start(0);
  counter.pause(10_000);
  counter.pause(20_000);
  assert.equal(counter.listenedMs(30_000), 10_000);
});

test("ListenCounter: секунды — это те же миллисекунды", () => {
  const counter = new ListenCounter();
  counter.start(0);
  assert.equal(counter.listenedSec(31_500), 31.5);
});

test("ListenCounter: reset обнуляет всё", () => {
  const counter = new ListenCounter();
  counter.start(0);
  counter.reset();
  assert.equal(counter.listenedMs(10_000), 0);
});
