/**
 * Разбор JWT без проверки подписи.
 *
 * Подпись здесь проверять НЕ нужно и незачем: токен мы получили от сервера по
 * TLS и храним у себя, а любое реальное решение о доступе принимает сервер при
 * каждом запросе. Нам из токена нужны только две вещи — кто мы (sub) и когда
 * обновляться (exp), то есть подсказки для себя, а не гарантии.
 *
 * Порт из extension/src/lib/auth.ts (userIdFromToken / expiresAtFromToken),
 * обёрнутый в один проход и без throw на кривом вводе.
 */

export interface JwtClaims {
  sub: string | null;
  exp: number | null;
  role: string | null;
  email: string | null;
}

const EMPTY: JwtClaims = { sub: null, exp: null, role: null, email: null };

function decodeSegment(segment: string): unknown {
  // base64url → base64. Padding Buffer.from добавляет сам, но '-'/'_' — нет.
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(base64, "base64").toString("utf8");
  return JSON.parse(json);
}

export function parseJwt(token: string | null | undefined): JwtClaims {
  if (!token) return EMPTY;
  const segment = token.split(".")[1];
  if (!segment) return EMPTY;

  let payload: unknown;
  try {
    payload = decodeSegment(segment);
  } catch {
    // Обрезанный или не-JWT токен. Вернуть пустые claims честнее, чем упасть:
    // вызывающий и так обязан пережить «сессии нет».
    return EMPTY;
  }
  if (!payload || typeof payload !== "object") return EMPTY;

  const p = payload as Record<string, unknown>;
  return {
    sub: typeof p.sub === "string" ? p.sub : null,
    exp: typeof p.exp === "number" && Number.isFinite(p.exp) ? p.exp : null,
    role: typeof p.role === "string" ? p.role : null,
    email: typeof p.email === "string" ? p.email : null,
  };
}

/** Когда протухает токен. Час от текущего момента — если в токене срока нет. */
export function expiresAtFromToken(token: string): number {
  return parseJwt(token).exp ?? Math.floor(Date.now() / 1000) + 3600;
}

/**
 * Протух ли токен с поправкой на запас. Запас нужен, чтобы не уйти в запрос с
 * токеном, который истечёт по дороге.
 */
export function isExpired(expiresAt: number, marginSec: number, nowSec = Math.floor(Date.now() / 1000)): boolean {
  return expiresAt - nowSec <= marginSec;
}
