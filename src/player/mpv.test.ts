import assert from "node:assert/strict";
import { chmod } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { MpvBackend } from "./mpv.ts";
import { BackendUnavailableError, clampVolume } from "./backend.ts";

const FAKE_MPV = fileURLToPath(new URL("./fixtures/fake-mpv.mjs", import.meta.url));

await chmod(FAKE_MPV, 0o755);

/** Дождаться условия, не завися от конкретных таймингов сокета. */
async function until(predicate: () => boolean, timeoutMs = 4_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("условие не выполнилось за отведённое время");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("clampVolume: держит громкость в допустимом диапазоне", () => {
  assert.equal(clampVolume(50), 50);
  assert.equal(clampVolume(-20), 0);
  assert.equal(clampVolume(1000), 130);
  assert.equal(clampVolume(Number.NaN), 100);
  assert.equal(clampVolume(72.6), 73);
});

test("mpv: property-change доезжают до состояния", async () => {
  const backend = new MpvBackend(FAKE_MPV);
  try {
    await backend.start();
    await backend.load("https://example.test/track.mp3");
    await until(() => backend.status().durationSec !== null);

    await until(() => backend.status().positionSec === 0.4);
    const state = backend.status();
    assert.equal(state.durationSec, 212.5);
    // Последняя пришедшая позиция, а не первая: mpv шлёт 0 при открытии файла и
    // только потом настоящие значения.
    assert.equal(state.positionSec, 0.4);
    assert.equal(state.idle, false);
  } finally {
    await backend.stop();
  }
});

test("mpv: ответ, разорванный на два чанка, собирается обратно", async () => {
  // Регрессия на сборку буфера: сокет не обещает целых строк, и наивный
  // JSON.parse(chunk) разваливается ровно на длинных ответах.
  process.env.FAKE_MPV_SPLIT = "1";
  const backend = new MpvBackend(FAKE_MPV);
  try {
    await backend.start();
    await backend.load("https://example.test/track.mp3");
    await until(() => backend.status().durationSec === 212.5);
  } finally {
    await backend.stop();
    delete process.env.FAKE_MPV_SPLIT;
  }
});

test("mpv: пауза отражается в состоянии", async () => {
  const backend = new MpvBackend(FAKE_MPV);
  try {
    await backend.start();
    await backend.load("https://example.test/track.mp3");
    await backend.setPaused(true);
    assert.equal(backend.status().paused, true);
    await backend.setPaused(false);
    assert.equal(backend.status().paused, false);
  } finally {
    await backend.stop();
  }
});

test("mpv: end-file reason=eof поднимает 'ended'", async () => {
  process.env.FAKE_MPV_EOF = "1";
  const backend = new MpvBackend(FAKE_MPV);
  let ended = 0;
  backend.on("ended", () => { ended += 1; });
  try {
    await backend.start();
    await backend.load("https://example.test/track.mp3");
    await until(() => ended > 0);
    assert.equal(ended, 1);
  } finally {
    await backend.stop();
    delete process.env.FAKE_MPV_EOF;
  }
});

test("mpv: собственная остановка НЕ выглядит как падение плеера", async () => {
  // Иначе очередь на событии exit перескочила бы трек при каждом переключении.
  const backend = new MpvBackend(FAKE_MPV);
  let exits = 0;
  backend.on("exit", () => { exits += 1; });

  await backend.start();
  await backend.load("https://example.test/track.mp3");
  await backend.stop();
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.equal(exits, 0);
});

test("mpv: открыл файл, но часы не идут — говорим об этом, а не молчим вечно", async () => {
  // Регрессия. mpv без звукового устройства файл ОТКРЫВАЕТ и присылает
  // time-pos = 0 ровно один раз, после чего часы стоят навсегда: ни падения, ни
  // сообщения, строка состояния вечно на `--:--`. Первая версия сторожа
  // снималась на этом нуле — то есть ровно на том случае, который ловила.
  // Признак настоящего воспроизведения — что позиция СДВИНУЛАСЬ.
  process.env.FAKE_MPV_STUCK = "1";
  process.env.SURPRISE_MPV_WATCHDOG_MS = "300";
  const backend = new MpvBackend(FAKE_MPV);
  const errors: string[] = [];
  backend.on("error", (error) => errors.push(error.message));

  try {
    await backend.start();
    await backend.load("https://example.test/track.mp3");
    await until(() => errors.length > 0, 3_000);
    assert.match(errors[0] ?? "", /звуковое устройство|ничего не проигра/);
  } finally {
    await backend.stop();
    delete process.env.FAKE_MPV_STUCK;
    delete process.env.SURPRISE_MPV_WATCHDOG_MS;
  }
});

test("mpv: идущие часы сторожа не будят", async () => {
  process.env.SURPRISE_MPV_WATCHDOG_MS = "300";
  const backend = new MpvBackend(FAKE_MPV);
  const errors: string[] = [];
  backend.on("error", (error) => errors.push(error.message));

  try {
    await backend.start();
    await backend.load("https://example.test/track.mp3");
    await new Promise((resolve) => setTimeout(resolve, 900));
    assert.deepEqual(errors, [], "сторож сработал на нормальном воспроизведении");
  } finally {
    await backend.stop();
    delete process.env.SURPRISE_MPV_WATCHDOG_MS;
  }
});

test("mpv: отсутствующий бинарь даёт внятную ошибку, а не зависание", async () => {
  const backend = new MpvBackend("/nonexistent/mpv-которого-нет");
  await assert.rejects(backend.start(), (error: unknown) => {
    assert.ok(error instanceof BackendUnavailableError, `получили ${String(error)}`);
    return true;
  });
  await backend.stop();
});

test("mpv: команда без запущенного процесса отклоняется, а не висит", async () => {
  const backend = new MpvBackend(FAKE_MPV);
  await assert.rejects(backend.seek(10, "absolute"), /mpv не запущен/);
});
