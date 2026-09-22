/**
 * Измеритель уровня: полоса на канал, зоны и метка пика.
 *
 * Уровни НАСТОЯЩИЕ — их считает mpv фильтром astats на звучащем потоке. Прибор,
 * показывающий выдуманные числа, хуже отсутствующего: по нему принимают решения
 * («тихо ли», «не перегружено ли»), и врать здесь нельзя.
 *
 * Зоны и шкала — как у любого аппаратного индикатора: запас слева, жёлтая зона
 * перед нулём, красная выше. Смысл в том, чтобы понять состояние одним взглядом,
 * а для этого границы должны стоять там, где их привыкли видеть.
 */

import { Box, Text } from "ink";
import React from "react";

import {
  METER_CHANNEL_ROWS,
  METER_FLOOR_DB,
  METER_MAX_SEGMENTS,
  meterRuns,
  scaleRow,
} from "../player/meter.ts";
import { theme } from "./theme.ts";

/** Подписи каналов. */
function channelLabel(index: number, total: number): string {
  if (total === 1) return index === 0 ? "M" : " ";
  return index === 0 ? "L" : "R";
}

/** Цвета зон: запас, подход к нулю, перегрузка. */
const ZONE_COLORS = { safe: "green", warn: "yellow", over: "red" } as const;

function MeterRow({
  label,
  db,
  peakDb,
  segments,
}: {
  label: string;
  db: number;
  peakDb: number;
  segments: number;
}): React.ReactElement {
  // Полоса собирается однотонными кусками, а не по делению на элемент: кусков
  // выходит пять вместо сотни с лишним, и перерисовывается строка заметно
  // спокойнее. Разбиение и его неизменная ширина проверяются тестами.
  const runs = meterRuns(db, peakDb, segments);

  return (
    <Box>
      <Text color={theme.muted}>{label} </Text>
      {runs.map((run, index) => (
        <Text key={index} color={run.zone ? ZONE_COLORS[run.zone] : undefined} bold={!!run.zone}>
          {run.text}
        </Text>
      ))}
    </Box>
  );
}

export function LevelMeter({
  channelsDb,
  peaksDb,
  width,
}: {
  channelsDb: readonly number[];
  peaksDb: readonly number[];
  width: number;
}): React.ReactElement | null {
  // Два символа на подпись канала плюс поля рамки и «dB» у шкалы.
  const segments = Math.max(0, Math.min(METER_MAX_SEGMENTS, width - 8));
  if (segments < 12) return null;

  // Ровно METER_CHANNEL_ROWS строк, сколько бы каналов ни пришло: недостающие
  // рисуем на нуле, лишние не показываем. Пустой ответ опроса — обычное дело
  // между тактами, и он не повод перестраивать экран.
  const rows = Array.from({ length: METER_CHANNEL_ROWS }, (_, index) => ({
    label: channelLabel(index, Math.max(1, channelsDb.length)),
    db: channelsDb[index] ?? METER_FLOOR_DB,
    peak: peaksDb[index] ?? channelsDb[index] ?? METER_FLOOR_DB,
  }));

  return (
    <Box flexDirection="column" paddingX={1}>
      {rows.map((row, index) => (
        <MeterRow
          key={index}
          label={row.label}
          db={row.db}
          peakDb={row.peak}
          segments={segments}
        />
      ))}
      <Box>
        <Text color={theme.muted}>{"  "}</Text>
        <Text color={theme.muted}>{scaleRow(segments)}</Text>
        <Text color={theme.muted}> dB</Text>
      </Box>
    </Box>
  );
}
