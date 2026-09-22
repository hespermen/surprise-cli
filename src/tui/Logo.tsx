/**
 * Логотип станции в шапке.
 *
 * Рисуется блочными символами, а не картинкой: терминал картинок не показывает,
 * а из тех, что показывают, каждый делает это по-своему (kitty, iTerm2, sixel —
 * три несовместимых протокола). Блоки работают везде одинаково.
 *
 * По буквам проходит светлая полоса. Раньше здесь была радуга — каждая колонка
 * своим оттенком, — но она стоит на месте: движение в ней только кажущееся, от
 * смены цвета. Блик именно ДВИЖЕТСЯ, и глаз читает это как перелив.
 */

import { Box, Text } from "ink";
import React from "react";

import { colorEnabled } from "../ui/term.ts";
import { beamIntensity, beamPosition, mixHex } from "./shimmer.ts";

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

/**
 * Знак станции: залитый квадрат с тёмной буквой внутри.
 *
 * Собирается из пиксельной сетки, а не пишется готовыми символами. Причина в
 * высоте: на логотип отведено пять строк, а букве нужны поля сверху и снизу,
 * иначе она упирается в край квадрата. Половинные блоки дают десять пиксельных
 * рядов в тех же пяти строках — этого хватает и на букву, и на поля.
 *
 * Единица — залитая часть квадрата, ноль — сама буква (она тёмная, как на
 * фирменном знаке).
 */
const MARK_PIXELS = [
  "11111111",
  "10000001",
  "10000001",
  "10111111",
  "10000001",
  "10000001",
  "11111101",
  "10000001",
  "10000001",
  "11111111",
] as const;

/** Пара пиксельных рядов в одну строку символов. */
function packRows(top: string, bottom: string): string {
  let out = "";
  for (let column = 0; column < top.length; column += 1) {
    const upper = top[column] === "1";
    const lower = bottom[column] === "1";
    // Полный блок, верхняя половина, нижняя половина, пусто.
    out += upper && lower ? "█" : upper ? "▀" : lower ? "▄" : " ";
  }
  return out;
}

const MARK: string[] = [];
for (let row = 0; row < MARK_PIXELS.length; row += 2) {
  MARK.push(packRows(MARK_PIXELS[row]!, MARK_PIXELS[row + 1]!));
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

/** Базовый цвет букв и цвет в центре блика. */
const BASE = "#6f7480";
const GLOW = "#ffffff";
/** Ширина полосы в колонках, в каждую сторону от центра. */
const BEAM_HALF = 9;

export function Logo({ frame, width }: { frame: number; width: number }): React.ReactElement | null {
  // Не влезает — не показываем: обрезанный логотип выглядит как сломанный
  // интерфейс.
  if (width < LOGO_WIDTH + 2) return null;

  if (!colorEnabled()) {
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

  const beam = beamPosition(frame, LOGO_WIDTH, BEAM_HALF);

  return (
    <Box flexDirection="column" paddingX={1}>
      {ROWS.map((row, rowIndex) => (
        <Box key={rowIndex}>
          {[...row].map((char, columnIndex) => {
            if (char === " ") return <Text key={columnIndex}> </Text>;

            // Строки чуть сдвинуты друг относительно друга: полоса идёт под
            // наклоном, а не строго вертикально — ровная выглядит как шов.
            const intensity =
              beam === null ? 0 : beamIntensity(columnIndex + rowIndex * 2, beam, BEAM_HALF);

            return (
              <Text key={columnIndex} bold color={mixHex(BASE, GLOW, intensity)}>
                {char}
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
