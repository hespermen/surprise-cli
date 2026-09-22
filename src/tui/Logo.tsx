/**
 * Логотип станции в шапке.
 *
 * Рисуется блочными символами, а не картинкой: терминал картинок не показывает,
 * а из тех, что показывают, каждый делает это по-своему (kitty, iTerm2, sixel —
 * три несовместимых протокола). Блоки работают везде одинаково.
 *
 * Цвет бежит по буквам волной. Волна идёт по КОЛОНКАМ, а не по буквам целиком:
 * так переход виден внутри каждой буквы и читается как перелив, а не как
 * мигание отдельных символов.
 */

import { Box, Text } from "ink";
import React from "react";

import { colorEnabled } from "../ui/term.ts";

/**
 * Блочный шрифт, пять строк высотой.
 *
 * Только те символы, что есть в названии станции: полный алфавит здесь был бы
 * мёртвым кодом, а его никто не проверяет.
 */
const GLYPHS: Record<string, readonly string[]> = {
  S: ["███", "█  ", "███", "  █", "███"],
  U: ["█ █", "█ █", "█ █", "█ █", "███"],
  R: ["███", "█ █", "███", "█ █", "█ █"],
  P: ["███", "█ █", "███", "█  ", "█  "],
  I: ["███", " █ ", " █ ", " █ ", "███"],
  E: ["███", "█  ", "███", "█  ", "███"],
  F: ["███", "█  ", "███", "█  ", "█  "],
  M: ["█ █", "███", "███", "█ █", "█ █"],
  ".": ["   ", "   ", "   ", "   ", " █ "],
  " ": ["  ", "  ", "  ", "  ", "  "],
};

const WORDMARK = "SURPRISE.FM";
export const LOGO_HEIGHT = 5;

/** Знак станции — буква в рамке, как на сайте. */
const MARK = ["┌───┐", "│▛▀▘│", "│▚▄▖│", "│▙▄▟│", "└───┘"];

/**
 * Оттенок в hex.
 *
 * Своя реализация вместо библиотеки: нужен ровно один переход HSL→RGB на
 * насыщенности и яркости, зафиксированных под тёмный терминал. Тянуть ради
 * этого зависимость в пакет, который гордится их отсутствием, не стоит.
 */
function hueToHex(hue: number): string {
  const h = ((hue % 360) + 360) % 360;
  const saturation = 0.72;
  const lightness = 0.62;

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;

  const [r, g, b] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];

  const channel = (value: number) =>
    Math.round((value + m) * 255).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Сборка строк логотипа: знак, пробел, слово. */
function buildRows(): string[] {
  const rows: string[] = [];
  for (let line = 0; line < LOGO_HEIGHT; line += 1) {
    const word = [...WORDMARK]
      .map((char) => GLYPHS[char]?.[line] ?? "   ")
      .join(" ");
    rows.push(`${MARK[line] ?? ""}  ${word}`);
  }
  return rows;
}

const ROWS = buildRows();
const LOGO_WIDTH = Math.max(...ROWS.map((row) => [...row].length));

export function Logo({ frame, width }: { frame: number; width: number }): React.ReactElement | null {
  // Не влезает — не показываем: обрезанный логотип выглядит как сломанный
  // интерфейс, а места он занимает пять строк из тридцати.
  if (width < LOGO_WIDTH + 2) return null;

  if (!colorEnabled()) {
    // Без цвета перелив бессмыслен, но сам логотип уместен.
    return (
      <Box flexDirection="column" paddingX={1}>
        {ROWS.map((row, index) => (
          <Text key={index} bold>
            {row}
          </Text>
        ))}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {ROWS.map((row, rowIndex) => (
        <Box key={rowIndex}>
          {[...row].map((char, columnIndex) => (
            <Text
              key={columnIndex}
              bold
              // Волна идёт по колонкам и чуть смещается по строкам — иначе
              // перелив выглядел бы плоской вертикальной полосой.
              color={char === " " ? undefined : hueToHex(frame * 6 + columnIndex * 7 + rowIndex * 4)}
            >
              {char}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
