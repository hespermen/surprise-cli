import assert from "node:assert/strict";
import test from "node:test";

import { currentTrackIndex, type TracklistItem } from "./shows.ts";
import { ARCHIVED_FILTER, isHiddenFromSite, isReachableByLink } from "../lib/showVisibility.ts";

function item(position: number, timestamp: number | null, end: number | null = null): TracklistItem {
  return {
    id: `t${position}`,
    position,
    timestamp_sec: timestamp,
    end_timestamp_sec: end,
    artist: `Артист ${position}`,
    title: `Трек ${position}`,
    is_identified: true,
  };
}

const TRACKLIST: TracklistItem[] = [item(1, 0), item(2, 180), item(3, 420), item(4, 900)];

test("currentTrackIndex: находит трек по позиции", () => {
  assert.equal(currentTrackIndex(TRACKLIST, 0), 0);
  assert.equal(currentTrackIndex(TRACKLIST, 179), 0);
  assert.equal(currentTrackIndex(TRACKLIST, 180), 1, "ровно на границе — уже следующий");
  assert.equal(currentTrackIndex(TRACKLIST, 500), 2);
  assert.equal(currentTrackIndex(TRACKLIST, 10_000), 3, "после последнего таймкода — последний трек");
});

test("currentTrackIndex: без позиции и на пустом треклисте — ничего", () => {
  assert.equal(currentTrackIndex(TRACKLIST, null), -1);
  assert.equal(currentTrackIndex([], 100), -1);
});

test("currentTrackIndex: не опирается на end_timestamp_sec", () => {
  // end_timestamp_sec заполнен не везде. Если бы подсветка гасла там, где его
  // нет, между треками появлялись бы дыры — а трек в этот момент играет.
  const sparse = [item(1, 0, 60), item(2, 180, null), item(3, 420, null)];
  assert.equal(currentTrackIndex(sparse, 100), 0, "пауза после конца первого — он всё ещё текущий");
  assert.equal(currentTrackIndex(sparse, 300), 1);
});

test("currentTrackIndex: треки без таймкода не сбивают счёт", () => {
  // Нераспознанные строки приходят с timestamp_sec=null и стоят в хвосте
  // сортировки — они не должны обрывать поиск раньше времени.
  const mixed = [item(1, 0), item(2, 240)];
  assert.equal(currentTrackIndex(mixed, 300), 1);
});

test("ARCHIVED_FILTER: готов к подстановке в PostgREST", () => {
  assert.equal(ARCHIVED_FILTER, "(archived)");
});

test("isHiddenFromSite: архив скрыт, остальное нет", () => {
  assert.equal(isHiddenFromSite("archived"), true);
  for (const status of ["published", "unlisted", "draft", "scheduled", null, undefined]) {
    assert.equal(isHiddenFromSite(status), false, String(status));
  }
});

test("isReachableByLink: по ссылке открываются published и unlisted", () => {
  assert.equal(isReachableByLink("published"), true);
  assert.equal(isReachableByLink("unlisted"), true);
  assert.equal(isReachableByLink("draft"), false);
  assert.equal(isReachableByLink("archived"), false);
});
