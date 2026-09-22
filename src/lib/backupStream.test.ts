import assert from "node:assert/strict";
import test from "node:test";

import {
  firstEntryFromPlaylist,
  forceHttps,
  needsPlaylistResolve,
  normalizeBackupMode,
  resolveBackupActive,
  resolveLiveStreamUrl,
} from "./backupStream.ts";

test("normalizeBackupMode: неизвестное значение — это 'auto'", () => {
  assert.equal(normalizeBackupMode("on"), "on");
  assert.equal(normalizeBackupMode("off"), "off");
  for (const value of ["auto", "", "ON", "что-то", null, undefined]) {
    assert.equal(normalizeBackupMode(value as string), "auto");
  }
});

test("resolveBackupActive: 'on' и 'off' сильнее наличия эфира", () => {
  assert.equal(resolveBackupActive("on", false), true);
  assert.equal(resolveBackupActive("off", true), false);
  assert.equal(resolveBackupActive("auto", true), true);
  assert.equal(resolveBackupActive("auto", false), false);
});

test("resolveLiveStreamUrl: выбирает по флагу", () => {
  const args = { primaryUrl: "https://a/primary", backupUrl: "https://b/backup" };
  assert.equal(resolveLiveStreamUrl({ ...args, active: false }), "https://a/primary");
  assert.equal(resolveLiveStreamUrl({ ...args, active: true }), "https://b/backup");
});

test("needsPlaylistResolve: только .m3u и .m3u8", () => {
  assert.equal(needsPlaylistResolve("https://a/radio.mp3"), false);
  assert.equal(needsPlaylistResolve("https://a/listen.m3u"), true);
  assert.equal(needsPlaylistResolve("https://a/index.m3u8"), true);
});

test("firstEntryFromPlaylist: пропускает комментарии и пустые строки", () => {
  const body = "#EXTM3U\n\n#EXTINF:-1\nhttps://radio.example/stream.mp3\nhttps://second\n";
  assert.equal(firstEntryFromPlaylist(body), "https://radio.example/stream.mp3");
  assert.equal(firstEntryFromPlaylist("#EXTM3U\n#только комментарии\n"), null);
  assert.equal(firstEntryFromPlaylist(""), null);
});

test("forceHttps: поднимает http, не трогая остальное", () => {
  assert.equal(forceHttps("http://radio/stream"), "https://radio/stream");
  assert.equal(forceHttps("https://radio/stream"), "https://radio/stream");
  // Подстрока http:// внутри пути — не схема, её трогать нельзя.
  assert.equal(forceHttps("https://proxy/?url=http://inner"), "https://proxy/?url=http://inner");
});
