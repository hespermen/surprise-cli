import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { clearSession, readSession, sessionPath, withSessionLock, writeSession, type Session } from "./session.ts";

const SAMPLE: Session = {
  access_token: "access",
  refresh_token: "refresh",
  expires_at: 1_800_000_000,
  user_id: "user-1",
};

async function withTempHome<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "sfm-cli-test-"));
  const previous = process.env.SURPRISE_SESSION_PATH;
  process.env.SURPRISE_SESSION_PATH = join(dir, "nested", "session.json");
  try {
    return await fn(dir);
  } finally {
    if (previous === undefined) delete process.env.SURPRISE_SESSION_PATH;
    else process.env.SURPRISE_SESSION_PATH = previous;
    await rm(dir, { recursive: true, force: true });
  }
}

test("writeSession: создаёт каталог и пишет файл только для владельца", async () => {
  await withTempHome(async () => {
    await writeSession(SAMPLE);
    const info = await stat(sessionPath());
    // Токен в файле, который читает вся система, — это утечка доступа к аккаунту.
    assert.equal(info.mode & 0o777, 0o600);
    assert.deepEqual(await readSession(), SAMPLE);
  });
});

test("writeSession: не оставляет временных файлов", async () => {
  await withTempHome(async () => {
    await writeSession(SAMPLE);
    await writeSession({ ...SAMPLE, access_token: "second" });
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(join(sessionPath(), ".."));
    assert.deepEqual(entries.filter((n) => n.includes(".tmp")), []);
  });
});

test("readSession: битый и неполный файл трактуются как «сессии нет»", async () => {
  await withTempHome(async () => {
    await writeSession(SAMPLE);
    await writeFile(sessionPath(), "{не json");
    assert.equal(await readSession(), null);

    // Неполная запись опаснее битой: с ней код пошёл бы делать запрос с undefined.
    await writeFile(sessionPath(), JSON.stringify({ access_token: "a" }));
    assert.equal(await readSession(), null);
  });
});

test("clearSession: отсутствие файла не ошибка", async () => {
  await withTempHome(async () => {
    await clearSession();
    await clearSession();
    assert.equal(await readSession(), null);
  });
});

test("withSessionLock: параллельные держатели не пересекаются", async () => {
  await withTempHome(async () => {
    let active = 0;
    let maxActive = 0;

    const worker = () =>
      withSessionLock(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 20));
        active -= 1;
      });

    await Promise.all([worker(), worker(), worker()]);
    // Больше одного одновременно — значит два процесса пошли бы обновлять токен
    // одним и тем же refresh_token, и второй сжёг бы сессию первого.
    assert.equal(maxActive, 1);
  });
});

test("withSessionLock: возвращает значение и снимает лок после исключения", async () => {
  await withTempHome(async () => {
    assert.equal(await withSessionLock(async () => 42), 42);

    await assert.rejects(withSessionLock(async () => { throw new Error("сбой"); }), /сбой/);
    // Если бы лок остался висеть, следующий вызов ждал бы таймаут целиком.
    const started = Date.now();
    await withSessionLock(async () => undefined);
    assert.ok(Date.now() - started < 1_000, "лок не был снят после исключения");
  });
});

test("withSessionLock: брошенный лок перехватывается по устареванию", async () => {
  await withTempHome(async () => {
    // Имитируем процесс, убитый в момент удержания лока: файл есть, хозяина нет.
    const stale = `${sessionPath()}.lock`;
    const { mkdir, utimes } = await import("node:fs/promises");
    await mkdir(join(sessionPath(), ".."), { recursive: true });
    await writeFile(stale, "999999");
    const longAgo = new Date(Date.now() - 120_000);
    await utimes(stale, longAgo, longAgo);

    const started = Date.now();
    await withSessionLock(async () => undefined, 3_000);
    assert.ok(Date.now() - started < 2_000, "устаревший лок не перехвачен");
  });
});

/**
 * Выход не должен удалять то, что ему не принадлежит.
 *
 * Путь берётся из SURPRISE_SESSION_PATH, а `rm` по нему делался без разговоров:
 * связка с ~/.ssh/id_rsa и `surprise logout` уничтожала ключ.
 */
test("logout не трогает чужой файл", async () => {
  const dir = await mkdtemp(join(tmpdir(), "surprise-logout-"));
  const target = join(dir, "not-a-session");
  await writeFile(target, "-----BEGIN OPENSSH PRIVATE KEY-----\n", "utf8");

  const previous = process.env.SURPRISE_SESSION_PATH;
  process.env.SURPRISE_SESSION_PATH = target;
  try {
    await assert.rejects(clearSession(), /не файл сессии/);
    assert.equal(await readFile(target, "utf8"), "-----BEGIN OPENSSH PRIVATE KEY-----\n");
  } finally {
    if (previous === undefined) delete process.env.SURPRISE_SESSION_PATH;
    else process.env.SURPRISE_SESSION_PATH = previous;
    await rm(dir, { recursive: true, force: true });
  }
});

/** Свой файл по-прежнему удаляется — иначе выход перестал бы работать. */
test("logout удаляет настоящую сессию", async () => {
  const dir = await mkdtemp(join(tmpdir(), "surprise-logout-ok-"));
  const target = join(dir, "session.json");

  const previous = process.env.SURPRISE_SESSION_PATH;
  process.env.SURPRISE_SESSION_PATH = target;
  try {
    await writeSession({
      access_token: "a",
      refresh_token: "r",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user_id: "u",
    });
    await clearSession();
    await assert.rejects(readFile(target, "utf8"));
  } finally {
    if (previous === undefined) delete process.env.SURPRISE_SESSION_PATH;
    else process.env.SURPRISE_SESSION_PATH = previous;
    await rm(dir, { recursive: true, force: true });
  }
});

/** Файла нет — это нормальный выход, а не ошибка. */
test("logout без файла молча завершается", async () => {
  const dir = await mkdtemp(join(tmpdir(), "surprise-logout-none-"));
  const previous = process.env.SURPRISE_SESSION_PATH;
  process.env.SURPRISE_SESSION_PATH = join(dir, "нет-такого.json");
  try {
    await assert.doesNotReject(clearSession());
  } finally {
    if (previous === undefined) delete process.env.SURPRISE_SESSION_PATH;
    else process.env.SURPRISE_SESSION_PATH = previous;
    await rm(dir, { recursive: true, force: true });
  }
});
