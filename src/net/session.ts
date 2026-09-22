/**
 * Хранилище сессии: ~/.config/surprise-fm/session.json, права 0600.
 *
 * Почему тут столько возни вокруг простого JSON-файла.
 *
 * GoTrue РОТИРУЕТ refresh_token: успешное обновление делает старый токен
 * недействительным. У расширения хватало кэша промиса в одном service worker'е,
 * но CLI живёт иначе — человек запускает `surprise` в двух вкладках терминала,
 * и это нормальный сценарий, а не край. Два процесса, одновременно увидевшие
 * протухший access_token, отправят два refresh с ОДНИМ И ТЕМ ЖЕ токеном:
 * первый обновит сессию, второй получит отказ и разлогинит человека в обоих
 * окнах. Поэтому обновление идёт под межпроцессным локом, а запись — атомарная.
 */

import { randomBytes } from "node:crypto";
import { mkdir, open, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface Session {
  access_token: string;
  refresh_token: string;
  /** Unix-время в секундах, когда протухает access_token. */
  expires_at: number;
  user_id: string;
}

export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.trim() ? xdg : join(homedir(), ".config");
  return join(base, "surprise-fm");
}

export function sessionPath(): string {
  return process.env.SURPRISE_SESSION_PATH ?? join(configDir(), "session.json");
}

function lockPath(): string {
  return `${sessionPath()}.lock`;
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.access_token === "string" && v.access_token.length > 0 &&
    typeof v.refresh_token === "string" && v.refresh_token.length > 0 &&
    typeof v.expires_at === "number" && Number.isFinite(v.expires_at) &&
    typeof v.user_id === "string"
  );
}

export async function readSession(): Promise<Session | null> {
  try {
    const raw = await readFile(sessionPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    // Файла нет, он битый или нечитаемый — во всех трёх случаях «сессии нет».
    return null;
  }
}

/**
 * Атомарная запись: temp в ТОЙ ЖЕ директории + rename.
 *
 * Директория та же не для красоты: rename атомарен только внутри одной
 * файловой системы. Через /tmp на другом устройстве он стал бы copy+unlink,
 * то есть появилось бы окно, в котором другой процесс прочитает половину файла.
 *
 * mode 0o600 передаём в writeFile, а не chmod'ом после: иначе между созданием
 * файла и сменой прав токен на мгновение читаем всей системой.
 */
export async function writeSession(session: Session): Promise<void> {
  const target = sessionPath();
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  const tmp = `${target}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(session, null, 2), { encoding: "utf8", mode: 0o600 });
    await rename(tmp, target);
  } catch (error) {
    await rm(tmp, { force: true }).catch(() => {});
    throw error;
  }
}

export async function clearSession(): Promise<void> {
  await rm(sessionPath(), { force: true });
}

/** Через сколько лок считается брошенным (процесс убит, не успел прибрать). */
const LOCK_STALE_MS = 30_000;
const LOCK_POLL_MS = 50;

async function breakStaleLock(path: string): Promise<void> {
  try {
    const info = await stat(path);
    if (Date.now() - info.mtimeMs > LOCK_STALE_MS) await unlink(path);
  } catch {
    // Лок исчез сам, пока мы на него смотрели — ровно то, чего мы и ждали.
  }
}

/**
 * Выполнить fn, держа межпроцессный лок.
 *
 * Лок — файл, созданный с флагом 'wx': создание-если-не-существует атомарно на
 * уровне ядра, отдельной проверки existsSync (которая всегда гонка) не нужно.
 *
 * timeoutMs истёк — НЕ падаем, а выполняем fn без лока. Держатель лока мог
 * умереть так, что stale-детектор ещё не сработал, и в этом случае отказать
 * человеку во входе хуже, чем рискнуть лишним refresh.
 */
export async function withSessionLock<T>(fn: () => Promise<T>, timeoutMs = 5_000): Promise<T> {
  const path = lockPath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });

  const deadline = Date.now() + timeoutMs;
  let held = false;

  while (Date.now() < deadline) {
    try {
      const handle = await open(path, "wx", 0o600);
      await handle.writeFile(String(process.pid));
      await handle.close();
      held = true;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await breakStaleLock(path);
      await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_MS));
    }
  }

  try {
    return await fn();
  } finally {
    if (held) await rm(path, { force: true }).catch(() => {});
  }
}
