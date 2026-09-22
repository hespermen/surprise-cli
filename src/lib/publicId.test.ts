import assert from "node:assert/strict";
import test from "node:test";

import { parseEntityParam, parseSurpriseLink } from "./publicId.ts";

test("parseEntityParam: число — это public_id, остальное — slug", () => {
  assert.deepEqual(parseEntityParam("837393"), { isNumeric: true, publicId: 837393, slug: null });
  assert.deepEqual(parseEntityParam("shuliko-surprise-fm"), {
    isNumeric: false,
    publicId: null,
    slug: "shuliko-surprise-fm",
  });
});

test("parseEntityParam: slug, начинающийся с цифр, остаётся слагом", () => {
  // «2026-01-01-mix» — не public_id: числовым считается только полностью
  // числовой параметр, иначе резолвер ушёл бы искать несуществующий id.
  assert.deepEqual(parseEntityParam("2026-mix"), { isNumeric: false, publicId: null, slug: "2026-mix" });
});

test("parseEntityParam: пустой параметр", () => {
  assert.deepEqual(parseEntityParam(undefined), { isNumeric: false, publicId: null, slug: null });
  // Пустая строка даёт slug:"" — ровно как в первоисточнике (`param ?? null`
  // пустую строку не гасит). Порт повторяет оригинал, а не улучшает его
  // втихую: расхождение всплыло бы там, где его никто не ждёт.
  assert.deepEqual(parseEntityParam(""), { isNumeric: false, publicId: null, slug: "" });
});

test("parseSurpriseLink: выпуск по числовому id и по слагу", () => {
  assert.deepEqual(parseSurpriseLink("https://surprise.fm/episodes/837393"), {
    kind: "show",
    param: { isNumeric: true, publicId: 837393, slug: null },
  });
  assert.deepEqual(parseSurpriseLink("https://surprise.fm/episodes/shuliko-surprise-fm"), {
    kind: "show",
    param: { isNumeric: false, publicId: null, slug: "shuliko-surprise-fm" },
  });
});

test("parseSurpriseLink: синонимы релиза ведут к одной сущности", () => {
  // В интернете живут все три формы — ссылка из чужого сообщения может быть любой.
  for (const url of [
    "https://surprise.fm/release/12",
    "https://surprise.fm/releases/12",
    "https://surprise.fm/store/releases/12",
  ]) {
    assert.equal(parseSurpriseLink(url)?.kind, "release", url);
  }
});

test("parseSurpriseLink: www, http и ссылка без схемы", () => {
  // Из мессенджера часто прилетает голое «surprise.fm/...».
  assert.equal(parseSurpriseLink("surprise.fm/episodes/1")?.kind, "show");
  assert.equal(parseSurpriseLink("http://www.surprise.fm/episodes/1")?.kind, "show");
  assert.equal(parseSurpriseLink("HTTPS://SURPRISE.FM/episodes/1")?.kind, "show");
});

test("parseSurpriseLink: query и якорь не мешают", () => {
  assert.deepEqual(parseSurpriseLink("https://surprise.fm/episodes/837393?utm_source=tg#t=120")?.param, {
    isNumeric: true,
    publicId: 837393,
    slug: null,
  });
});

test("parseSurpriseLink: чужой домен и просто текст — не ссылка", () => {
  // Это не ошибка, а сигнал «считай ввод поисковым запросом»: `surprise play
  // shuliko` — законный вызов.
  assert.equal(parseSurpriseLink("https://example.com/episodes/1"), null);
  assert.equal(parseSurpriseLink("shuliko"), null);
  assert.equal(parseSurpriseLink(""), null);
  assert.equal(parseSurpriseLink("   "), null);
});

test("parseSurpriseLink: домен-подделка не проходит", () => {
  // surprise.fm.evil.tld и notsurprise.fm не должны считаться нашими.
  assert.equal(parseSurpriseLink("https://surprise.fm.evil.tld/episodes/1"), null);
  assert.equal(parseSurpriseLink("https://notsurprise.fm/episodes/1"), null);
});

test("parseSurpriseLink: раздел без идентификатора", () => {
  assert.equal(parseSurpriseLink("https://surprise.fm/episodes"), null);
  assert.equal(parseSurpriseLink("https://surprise.fm/"), null);
});

test("parseSurpriseLink: трек магазина по uuid", () => {
  const parsed = parseSurpriseLink("https://surprise.fm/store/track/2c9b0e4a-1111-2222-3333-444455556666");
  assert.equal(parsed?.kind, "track");
  assert.equal(parsed?.param.slug, "2c9b0e4a-1111-2222-3333-444455556666");
});
