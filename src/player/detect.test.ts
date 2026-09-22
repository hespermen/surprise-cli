import assert from "node:assert/strict";
import test from "node:test";

import { NoAudioBackendError, installHint, isAvailable, pickBackend } from "./detect.ts";

test("isAvailable: ffplay определяется, хотя не понимает --version", async (t) => {
  // Регрессия: проверяли всех через `--version`, а инструменты ffmpeg знают
  // только `-version` с одним дефисом и на двойном выходят с кодом 1. Из-за
  // этого установленный ffplay считался отсутствующим, и CLI предлагал ставить
  // плеер поверх уже стоящего.
  if (!(await isAvailable("ffplay"))) {
    t.skip("ffplay в системе нет — проверять нечего");
    return;
  }
  assert.equal(await isAvailable("ffplay"), true);
});

test("isAvailable: несуществующий бинарь — false, без исключения", async () => {
  assert.equal(await isAvailable("/nonexistent/точно-нет-такого"), false);
});

test("pickBackend: без единого плеера падает с понятным текстом", async () => {
  const mpv = process.env.SURPRISE_MPV;
  const ffplay = process.env.SURPRISE_FFPLAY;
  process.env.SURPRISE_MPV = "/nonexistent/mpv";
  process.env.SURPRISE_FFPLAY = "/nonexistent/ffplay";

  try {
    await assert.rejects(pickBackend(), (error: unknown) => {
      assert.ok(error instanceof NoAudioBackendError);
      // В сообщении обязана быть команда установки: «ничего не играет» без
      // объяснения — худший вид отказа.
      assert.match((error as Error).message, /mpv/);
      assert.ok((error as Error).message.includes(installHint()));
      return true;
    });
  } finally {
    if (mpv === undefined) delete process.env.SURPRISE_MPV;
    else process.env.SURPRISE_MPV = mpv;
    if (ffplay === undefined) delete process.env.SURPRISE_FFPLAY;
    else process.env.SURPRISE_FFPLAY = ffplay;
  }
});

test("pickBackend: без mpv берёт ffplay и помечает режим деградированным", async (t) => {
  if (!(await isAvailable("ffplay"))) {
    t.skip("ffplay в системе нет");
    return;
  }
  const mpv = process.env.SURPRISE_MPV;
  process.env.SURPRISE_MPV = "/nonexistent/mpv";

  try {
    const choice = await pickBackend();
    assert.equal(choice.name, "ffplay");
    assert.equal(choice.degraded, true);
    // Интерфейс обязан знать, что громкость менять нечем, а не молча глотать.
    assert.equal(choice.backend.canSetVolume, false);
    assert.equal(choice.backend.positionIsExact, false);
  } finally {
    if (mpv === undefined) delete process.env.SURPRISE_MPV;
    else process.env.SURPRISE_MPV = mpv;
  }
});

test("installHint: подсказка соответствует системе", () => {
  const hint = installHint();
  assert.ok(hint.includes("mpv"), hint);
});
