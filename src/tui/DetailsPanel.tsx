/**
 * Правая нижняя панель: подробности выбранного элемента.
 *
 * Показывает то, что выбрано в списке, а не то, что играет. Это разные вещи:
 * человек листает каталог и читает про выпуск, не прерывая текущего.
 */

import { Box, Text } from "ink";
import React from "react";

import { formatDuration } from "../lib/format.ts";
import type { TracklistItem } from "../api/shows.ts";
import { fit, padTo, theme } from "./theme.ts";

export interface Details {
  title: string;
  subtitle: string | null;
  /** Строки «поле: значение» — длительность, дата, жанры. */
  facts: Array<[string, string]>;
  description: string | null;
  /** Треклист, если он есть у выбранного. */
  tracklist: readonly TracklistItem[];
  /** Индекс играющего трека в треклисте, -1 — не играет этот выпуск. */
  playingTrack: number;
}

/**
 * Перенос описания по словам.
 *
 * Обрезать описание одной строкой жалко — это единственное место, где виден
 * рассказ про выпуск. Но и переносить посимвольно нельзя: слова рвутся и текст
 * перестаёт читаться.
 */
function wrap(text: string, width: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if ([...current].length + 1 + [...word].length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);

  const trimmed = lines.slice(0, maxLines);
  const last = trimmed[trimmed.length - 1];
  // Текст не влез — показываем это многоточием, а не обрывом на полуслове.
  if (last && lines.length >= maxLines && words.length > 0) {
    trimmed[trimmed.length - 1] = fit(`${last} …`, width);
  }
  return trimmed;
}

export function DetailsPanel({
  details,
  focused,
  width,
  height,
}: {
  details: Details | null;
  focused: boolean;
  width: number;
  height: number;
}): React.ReactElement {
  const inner = Math.max(16, width - 4);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.borderActive : theme.border}
      paddingX={1}
      width={width}
      flexGrow={1}
    >
      {!details ? (
        <Text color={theme.muted}>Выберите что-нибудь в списке</Text>
      ) : (
        <>
          <Text bold>{fit(details.title, inner)}</Text>
          {details.subtitle ? (
            <Text color={theme.accentDim}>{fit(details.subtitle, inner)}</Text>
          ) : null}

          {details.facts.length > 0 ? (
            <Box marginTop={1} flexDirection="column">
              {details.facts.map(([label, value]) => (
                <Text key={label} color={theme.muted}>
                  {padTo(label, 13)} {fit(value, inner - 14)}
                </Text>
              ))}
            </Box>
          ) : null}

          {details.description ? (
            <Box marginTop={1} flexDirection="column">
              {wrap(details.description, inner, 3).map((line, index) => (
                <Text key={index} color={theme.muted}>
                  {line}
                </Text>
              ))}
            </Box>
          ) : null}

          {details.tracklist.length > 0 ? (
            <Box marginTop={1} flexDirection="column">
              <Text color={theme.accent}>Треклист · {details.tracklist.length}</Text>
              {/* Показываем окно вокруг играющего трека, а не начало списка:
                  в часовом миксе начало перестаёт быть интересным через минуту. */}
              {visibleTracks(details, Math.max(1, height - 12)).map(({ item, index }) => (
                <Text
                  key={item.id}
                  color={index === details.playingTrack ? theme.playing : theme.muted}
                  bold={index === details.playingTrack}
                >
                  {index === details.playingTrack ? "▸" : " "}
                  {padTo(formatDuration(item.timestamp_sec), 8)}
                  {fit([item.artist, item.title].filter(Boolean).join(" — ") || "—", inner - 10)}
                </Text>
              ))}
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
}

function visibleTracks(details: Details, count: number): Array<{ item: TracklistItem; index: number }> {
  const items = details.tracklist;
  const anchor = details.playingTrack >= 0 ? details.playingTrack : 0;
  const from = Math.min(Math.max(0, anchor - 1), Math.max(0, items.length - count));
  return items.slice(from, from + count).map((item, offset) => ({ item, index: from + offset }));
}
