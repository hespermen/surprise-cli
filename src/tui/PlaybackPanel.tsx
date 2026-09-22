/**
 * Верхняя панель: что играет, в каком состоянии, где по времени.
 */

import { Box, Text } from "ink";
import React from "react";

import { formatDuration } from "../lib/format.ts";
import type { PlaybackStatus } from "../player/backend.ts";
import { bar, fit, theme } from "./theme.ts";

export interface PlaybackInfo {
  title: string;
  subtitle: string | null;
  /** Строка под заголовком: описание выпуска или название релиза. */
  note: string | null;
  position: number | null;
  total: number | null;
  /** Имя аудио-бэкенда — как «device» у спотифаевского плеера. */
  backend: string;
  volume: number;
  /** Пометка режима доступа: превью, бесплатное прослушивание. */
  badge: string | null;
  /** Играем бесконечный поток — перемотка и шкала не имеют смысла. */
  live: boolean;
}

function mark(state: PlaybackStatus): { glyph: string; color: string } {
  if (state.paused) return { glyph: "⏸", color: theme.paused };
  if (state.idle) return { glyph: "…", color: theme.muted };
  return { glyph: "▶", color: theme.playing };
}

export function PlaybackPanel({
  info,
  state,
  width,
}: {
  info: PlaybackInfo;
  state: PlaybackStatus;
  width: number;
}): React.ReactElement {
  const { glyph, color } = mark(state);
  const inner = Math.max(20, width - 4);

  const clock = info.live
    ? formatDuration(info.position)
    : `${formatDuration(info.position)} / ${formatDuration(info.total)}`;

  // Шкала занимает всё, что осталось от времени. Для эфира её нет вовсе:
  // у бесконечного потока конца не существует, и полоса врала бы.
  const barWidth = Math.max(0, inner - clock.length - 2);
  const progress = info.live ? "" : bar(info.position, info.total, barWidth);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.border} paddingX={1}>
      <Box>
        <Text color={color}>{glyph} </Text>
        <Text bold>{fit(info.title, inner - 2 - (info.badge ? info.badge.length + 3 : 0))}</Text>
        {info.badge ? <Text color={theme.paused}> · {info.badge}</Text> : null}
      </Box>

      {info.subtitle ? (
        <Text color={theme.accentDim}>{fit(info.subtitle, inner)}</Text>
      ) : null}

      {info.note ? <Text color={theme.muted}>{fit(info.note, inner)}</Text> : null}

      <Box marginTop={1}>
        <Text color={theme.muted}>
          плеер: {info.backend} │ том: {info.volume}%{info.live ? " │ эфир" : ""}
        </Text>
      </Box>

      <Box>
        {progress ? <Text color={theme.accent}>{progress} </Text> : null}
        <Text color={theme.muted}>{clock}</Text>
      </Box>
    </Box>
  );
}
