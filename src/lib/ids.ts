/**
 * Идентификаторы слушателя.
 *
 * Их два, и путать их нельзя — на сайте это тоже две разные вещи:
 *
 *   listenerId  — устойчивый, живёт между запусками (в localStorage у сайта, в
 *                 файле у нас). По нему считается квота бесплатных прослушиваний
 *                 трека. Потеряли — квота начислилась заново, то есть это дырка.
 *   sessionId   — на один запуск. По нему дедуплицируются события прослушивания
 *                 и держится присутствие в эфире.
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { configDir } from "../net/session.ts";

function listenerIdPath(): string {
  return process.env.SURPRISE_LISTENER_ID_PATH ?? join(configDir(), "listener-id");
}

let cachedListenerId: string | null = null;

export async function getListenerId(): Promise<string> {
  if (cachedListenerId) return cachedListenerId;

  const path = listenerIdPath();
  try {
    const stored = (await readFile(path, "utf8")).trim();
    if (stored) {
      cachedListenerId = stored;
      return stored;
    }
  } catch {
    // Файла ещё нет — заведём ниже.
  }

  const created = randomUUID();
  try {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, created, { encoding: "utf8", mode: 0o600 });
  } catch {
    // Не смогли записать (только чтение, нет прав) — работаем с разовым
    // значением. Хуже, чем постоянное, но лучше, чем отказ играть.
  }
  cachedListenerId = created;
  return created;
}

const SESSION_ID = randomUUID();

/** Идентификатор запуска. Постоянен в пределах процесса и только его. */
export function getSessionId(): string {
  return SESSION_ID;
}
