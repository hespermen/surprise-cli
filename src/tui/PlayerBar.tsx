/**
 * Нижняя строка плеера — видна всегда, в любом разделе.
 *
 * Компактно, одной-двумя строками: место на экране принадлежит спискам, а не
 * плееру. Но состояние должно читаться не приглядываясь, поэтому значок,
 * название и время идут в фиксированном порядке и не переезжают.
 */

import { Box, Text } from "ink";
import React from "react";

import { formatDuration } from "../lib/format.ts";
import type { PlaybackStatus } from "../player/backend.ts";
import { bar, fit, theme } from "./theme.ts";

export interface PlayerBarProps {
  title: string;
  subtitle: string | null;
  position: number | null;
  total: number | null;
  /** Бесконечный поток: шкалы нет, у него нет конца. */
  live: boolean;
  state: PlaybackStatus;
  backend: string;
  volume: number;
  /** Пометка режима доступа: превью, бесплатное прослушивание. */
  badge: string | null;
  width: number;
}

export function PlayerBar({
  title,
  subtitle,
  position,
  total,
  live,
  state,
  backend,
  volume,
  badge,
  width,
}: PlayerBarProps): React.ReactElement {
  const inner = Math.max(24, width - 4);

  const glyph = state.paused ? "⏸" : state.idle ? "…" : "▶";
  const glyphColor = state.paused ? theme.paused : state.idle ? theme.muted : theme.playing;

  const clock = live ? formatDuration(position) : `${formatDuration(position)} / ${formatDuration(total)}`;
  const meta = `${backend} · ${volume}%${live ? " · эфир" : ""}`;

  // Название ужимаем под то, что осталось от времени и метаданных: перенос
  // строки в плеере ломал бы всю раскладку снизу.
  const headWidth = Math.max(10, inner - clock.length - meta.length - 6);
  const barWidth = Math.max(0, inner - clock.length - meta.length - headWidth - 6);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={1} width={width}>
      <Box>
        <Text color={glyphColor} bold>
          {glyph}{" "}
        </Text>
        <Text bold>{fit(title, Math.max(10, inner - meta.length - 6))}</Text>
        {badge ? <Text color={theme.paused}> {badge}</Text> : null}
        <Box flexGrow={1} justifyContent="flex-end">
          <Text color={theme.muted}>{meta}</Text>
        </Box>
      </Box>

      {subtitle ? <Text color={theme.accentDim}>{fit(subtitle, inner)}</Text> : null}

      {/* Прогресс отдельной строкой во всю ширину.
          Раньше он делил строку с названием, временем и метаданными и
          сжимался до огрызка в несколько символов — то есть переставал
          отвечать на свой единственный вопрос «сколько осталось». */}
      <Box>
        <Text color={theme.accent} bold>
          {formatDuration(position)}
        </Text>
        <Text> </Text>
        {live ? (
          <Text color={theme.playing}>{"━".repeat(Math.max(0, inner - 16))}</Text>
        ) : (
          <Text color={theme.accent}>{bar(position, total, Math.max(4, inner - 18))}</Text>
        )}
        <Text> </Text>
        <Text color={theme.muted}>{live ? "" : formatDuration(total)}</Text>
      </Box>
    </Box>
  );
}
