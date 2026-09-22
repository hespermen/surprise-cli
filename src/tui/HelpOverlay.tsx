/**
 * Справка по клавишам.
 *
 * Сочетания плеера намеренно совпадают с сайтом (src/hooks/usePlayerKeyboard.ts):
 * пробел, ←/→ на тридцать секунд, m, n, p. Человек, привыкший к вебу, не должен
 * переучиваться ради терминала.
 *
 * Расходится только одно: ↑/↓ на сайте меняют громкость, а здесь ходят по
 * списку — в интерфейсе со списками это сильнее любой другой привычки.
 * Громкость взята на + и −.
 */

import { Box, Text } from "ink";
import React from "react";

import { theme } from "./theme.ts";

const GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Навигация",
    rows: [
      ["j / k, ↑ / ↓", "по списку"],
      ["g / G", "в начало / в конец"],
      ["PgUp / PgDn", "на десять строк"],
      ["Tab / Shift+Tab", "следующая / предыдущая панель"],
      ["h / l", "панель разделов / список"],
      ["1 … 9", "сразу в раздел"],
      ["Enter", "открыть или играть"],
      ["f", "в избранное и обратно"],
      ["/", "поиск"],
    ],
  },
  {
    title: "Плеер — как на сайте",
    rows: [
      ["space", "пауза"],
      ["← / →", "назад / вперёд 30 секунд"],
      ["m", "звук выключить / включить"],
      ["n / p", "следующий / предыдущий"],
      ["r", "вернуться в эфир"],
      ["+ / −", "громкость (на сайте это ↑/↓, здесь они заняты списком)"],
    ],
  },
  {
    title: "Прочее",
    rows: [
      ["?", "эта справка"],
      ["раздел «Настройки»", "тема и язык интерфейса"],
      ["q", "выход"],
    ],
  },
];

export function HelpOverlay({ width }: { width: number }): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={2}
      paddingY={1}
      width={width}
    >
      <Text bold color={theme.accent}>
        Управление
      </Text>

      {GROUPS.map((group) => (
        <Box key={group.title} flexDirection="column" marginTop={1}>
          <Text bold color={theme.accentDim}>
            {group.title}
          </Text>
          {group.rows.map(([keys, what]) => (
            <Box key={keys}>
              <Text color={theme.accent}>{keys.padEnd(18)}</Text>
              <Text color={theme.muted}>{what}</Text>
            </Box>
          ))}
        </Box>
      ))}

      <Box marginTop={1}>
        <Text color={theme.muted}>Любая клавиша — закрыть</Text>
      </Box>
    </Box>
  );
}
