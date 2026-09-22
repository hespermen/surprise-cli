import assert from "node:assert/strict";
import test from "node:test";

import { expiresAtFromToken, isExpired, parseJwt } from "./jwt.ts";

function makeToken(payload: Record<string, unknown>): string {
  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.signature`;
}

test("parseJwt: достаёт sub, exp, role и email", () => {
  const token = makeToken({ sub: "user-1", exp: 1800000000, role: "authenticated", email: "a@b.c" });
  assert.deepEqual(parseJwt(token), {
    sub: "user-1",
    exp: 1800000000,
    role: "authenticated",
    email: "a@b.c",
  });
});

test("parseJwt: base64url со спецсимволами разбирается", () => {
  // '-' и '_' в base64url — не то же самое, что '+' и '/' в base64. Если их не
  // заменить, Buffer молча вернёт мусор, и sub окажется неверным.
  const token = makeToken({ sub: "ffff>>>?~~~", exp: 1 });
  assert.equal(parseJwt(token).sub, "ffff>>>?~~~");
});

test("parseJwt: мусор не роняет процесс, а даёт пустые claims", () => {
  for (const bad of [null, undefined, "", "не-jwt", "a.b", "a.!!!!.c"]) {
    const claims = parseJwt(bad as string);
    assert.equal(claims.sub, null);
    assert.equal(claims.exp, null);
  }
});

test("parseJwt: нечисловой exp отбрасывается", () => {
  assert.equal(parseJwt(makeToken({ sub: "u", exp: "скоро" })).exp, null);
});

test("expiresAtFromToken: без exp подставляет час вперёд", () => {
  const now = Math.floor(Date.now() / 1000);
  const value = expiresAtFromToken(makeToken({ sub: "u" }));
  assert.ok(value >= now + 3595 && value <= now + 3605, `получили ${value}`);
});

test("isExpired: запас срабатывает до фактического истечения", () => {
  const now = 1_000_000;
  assert.equal(isExpired(now + 300, 120, now), false, "пять минут — ещё рано");
  assert.equal(isExpired(now + 120, 120, now), true, "ровно на границе — уже пора");
  assert.equal(isExpired(now + 60, 120, now), true, "внутри запаса — пора");
  assert.equal(isExpired(now - 10, 120, now), true, "просрочен — пора");
});
