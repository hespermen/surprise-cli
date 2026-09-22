/**
 * Визуализатор: бегущая история громкости.
 *
 * Каждый столбик — момент времени, высота — реальный уровень звука в этот
 * момент. Данные считает mpv фильтром astats на том потоке, который сейчас
 * звучит; ничего не дорисовывается и не выдумывается. Поэтому на паузе картинка
 * замирает, а в тишине падает — так и должно быть.
 *
 * История, а не мгновенный столбик: одиночная полоска дёргается и читается как
 * шум, а лента показывает форму музыки — где спад, где вступила бочка.
 */

import { Box, Text } from "ink";
import React from "react";

import { levelToRatio } from "../player/levels.ts";
import type { Palette } from "./theme.ts";

/** Символы снизу вверх: восьмая часть клетки, четверть, и так до целой. */
const BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

export function Visualizer({
  history,
  palette,
  width,
}: {
  /** Уровни в dBFS, слева направо по времени. */
  history: readonly number[];
  palette: Palette;
  width: number;
}): React.ReactElement | null {
  if (width < 8) return null;

  const visible = history.slice(-width);
  // Пока данных мало, лента растёт слева направо, а не прыгает по экрану.
  const padded = [...Array<number>(Math.max(0, width - visible.length)).fill(Number.NEGATIVE_INFINITY), ...visible];

  const cells = padded.map((db) => {
    const ratio = levelToRatio(db);
    if (ratio <= 0) return { glyph: " ", loud: false };
    const index = Math.min(BLOCKS.length - 1, Math.max(0, Math.round(ratio * (BLOCKS.length - 1))));
    // Громкое подсвечиваем иначе: иначе лента читается плоской, и пики теряются
    // ровно там, где они интереснее всего.
    return { glyph: BLOCKS[index] ?? " ", loud: ratio > 0.72 };
  });

  return (
    <Box>
      <Text color={palette.accent}>
        {cells.map((cell) => (cell.loud ? "" : cell.glyph)).join("")}
      </Text>
      {/* Две накладывающиеся строки не сложить в одном Text с разными цветами
          без разбиения на куски, поэтому громкие идут отдельным слоем поверх
          пробелов — терминал сам соберёт их в одну строку. */}
      <Box marginLeft={-cells.length}>
        <Text color={palette.playing} bold>
          {cells.map((cell) => (cell.loud ? cell.glyph : " ")).join("")}
        </Text>
      </Box>
    </Box>
  );
}
