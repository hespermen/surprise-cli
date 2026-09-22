/**
 * Логотип станции в шапке.
 *
 * Сам рисунок живёт в ui/logo.ts — его же печатает простой `surprise radio`.
 *
 * Логотип СТАТИЧЕН, и это решение, а не упрощение.
 *
 * Анимация красила каждый символ отдельным элементом — 265 узлов на пять строк, —
 * и перерисовывала их пять раз в секунду. Перерисовка в ink идёт всем деревом
 * сразу, поэтому вместе с логотипом заново собирались списки, подробности и
 * измеритель: экран заметно вздрагивал. Украшение стоило дороже, чем всё
 * остальное на экране вместе взятое.
 *
 * Теперь строка логотипа — один элемент, и перерисовка случается только когда
 * меняется что-то по делу.
 */

import { Box, Text } from "ink";
import React from "react";

import { LOGO_HEIGHT, logoRows } from "../ui/logo.ts";
import { colorEnabled } from "../ui/term.ts";
import { theme } from "./theme.ts";

export { LOGO_HEIGHT };

export function Logo({ width }: { width: number }): React.ReactElement | null {
  const rows = logoRows(width);
  if (!rows) return null;

  return (
    <Box flexDirection="column" paddingX={1}>
      {rows.map((row, index) => (
        // Одна строка — один элемент. Раньше здесь был элемент на каждый символ,
        // и их было больше, чем во всём остальном интерфейсе.
        <Text key={index} bold color={colorEnabled() ? theme.muted : undefined}>
          {row}
        </Text>
      ))}
    </Box>
  );
}
