import assert from "node:assert/strict";
import test from "node:test";

import { beamIntensity, beamPosition, mixHex } from "./shimmer.ts";

test("beamIntensity: ярче всего в центре, ноль за краем", () => {
  assert.equal(beamIntensity(10, 10, 6), 1);
  assert.equal(beamIntensity(16, 10, 6), 0, "ровно на границе уже темно");
  assert.equal(beamIntensity(40, 10, 6), 0);
  assert.equal(beamIntensity(4, 10, 6), 0);
});

test("beamIntensity: спадает плавно, без излома", () => {
  // Линейный спад даёт видимый край, и блик читается как движущийся
  // прямоугольник, а не как свет.
  const values = [0, 1, 2, 3, 4, 5].map((offset) => beamIntensity(10 + offset, 10, 6));
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(values[i]! < values[i - 1]!, `на шаге ${i} яркость не убыла`);
    assert.ok(values[i]! >= 0 && values[i]! <= 1);
  }
});

test("beamIntensity: симметричен относительно центра", () => {
  assert.equal(beamIntensity(7, 10, 6), beamIntensity(13, 10, 6));
});

test("beamIntensity: нулевая ширина не ломает расчёт", () => {
  assert.equal(beamIntensity(5, 5, 0), 0);
});

test("beamPosition: проходит весь логотип и уходит за оба края", () => {
  const width = 50;
  const half = 6;
  const start = beamPosition(0, width, half, 10);
  assert.ok(start !== null && start < 0, "блик должен начинаться за левым краем");

  // Где-то в середине цикла он обязан оказаться правее логотипа.
  const positions: number[] = [];
  for (let frame = 0; frame < width + half * 2; frame += 1) {
    const position = beamPosition(frame, width, half, 10);
    if (position !== null) positions.push(position);
  }
  assert.ok(Math.max(...positions) > width, "блик не дошёл до правого края");
});

test("beamPosition: между проходами есть пауза", () => {
  // Непрерывный блик мельтешит на периферии зрения и мешает читать список.
  const width = 20;
  const half = 4;
  const pause = 8;
  const cycle = width + half * 2 + pause;

  const dark = Array.from({ length: cycle }, (_, frame) => beamPosition(frame, width, half, pause)).filter(
    (position) => position === null,
  );
  assert.equal(dark.length, pause);
});

test("beamPosition: цикл повторяется", () => {
  const width = 20;
  const half = 4;
  const cycle = width + half * 2 + 8;
  assert.equal(beamPosition(3, width, half, 8), beamPosition(3 + cycle, width, half, 8));
});

test("mixHex: края диапазона дают исходные цвета", () => {
  assert.equal(mixHex("#000000", "#ffffff", 0), "#000000");
  assert.equal(mixHex("#000000", "#ffffff", 1), "#ffffff");
});

test("mixHex: середина даёт середину, выход за диапазон зажимается", () => {
  assert.equal(mixHex("#000000", "#ffffff", 0.5), "#808080");
  assert.equal(mixHex("#000000", "#ffffff", -3), "#000000");
  assert.equal(mixHex("#000000", "#ffffff", 42), "#ffffff");
});
