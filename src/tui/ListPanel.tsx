/**
 * Нижняя панель: список с колонками, подсветкой выбранной строки и отдельной
 * пометкой играющей.
 *
 * Выбранная и играющая строки — разные вещи, и это принципиально: человек ходит
 * по списку, пока играет что-то другое, и обе позиции должны быть видны
 * одновременно.
 */

import { Box, Text } from "ink";
import React from "react";

import { fit, padTo, theme } from "./theme.ts";

export interface Column {
  /** Заголовок колонки. Пустой — для узких служебных столбцов. */
  header: string;
  width: number;
  /** Растягивать ли колонку на остаток ширины. Такая должна быть одна. */
  flex?: boolean;
  value: (row: never, index: number) => string;
}

export interface ListPanelProps<T> {
  title: string;
  rows: readonly T[];
  columns: ReadonlyArray<{
    header: string;
    width: number;
    flex?: boolean;
    value: (row: T, index: number) => string;
  }>;
  selected: number;
  /** Индекс играющей строки, -1 — ни одна. */
  playing: number;
  /** Сколько строк влезает. Список сам прокрутится к выбранной. */
  height: number;
  width: number;
  focused: boolean;
  emptyHint: string;
}

/**
 * Окно прокрутки вокруг выбранной строки.
 *
 * Держим выбранную внутри окна, а не в его центре: при ходьбе вниз по длинному
 * списку центрирование дёргало бы весь список на каждое нажатие.
 */
function windowFor(selected: number, count: number, height: number): { from: number; to: number } {
  if (count <= height) return { from: 0, to: count };
  const half = Math.floor(height / 2);
  const from = Math.min(Math.max(0, selected - half), count - height);
  return { from, to: from + height };
}

export function ListPanel<T>({
  title,
  rows,
  columns,
  selected,
  playing,
  height,
  width,
  focused,
  emptyHint,
}: ListPanelProps<T>): React.ReactElement {
  const inner = Math.max(20, width - 4);

  // Одна колонка забирает остаток ширины: иначе таблица либо не дотягивается до
  // рамки, либо вылезает за неё и ink переносит строку.
  const fixed = columns.reduce((sum, column) => sum + (column.flex ? 0 : column.width) + 1, 0);
  const flexWidth = Math.max(8, inner - fixed);
  const widthOf = (column: ListPanelProps<T>["columns"][number]) =>
    column.flex ? flexWidth : column.width;

  const { from, to } = windowFor(selected, rows.length, height);
  const visible = rows.slice(from, to);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.borderActive : theme.border}
      paddingX={1}
      // Высота задана явно: с flexGrow панели делили остаток по-разному в
      // зависимости от содержимого, и раскладка дышала при каждой смене строки.
      height={height + 4}
    >
      <Box>
        <Text bold color={focused ? theme.accent : theme.muted}>
          {fit(title, inner - 12)}
        </Text>
        {rows.length > height ? (
          <Text color={theme.muted}>
            {"  "}
            {selected + 1}/{rows.length}
          </Text>
        ) : null}
      </Box>

      {rows.length === 0 ? (
        <Text color={theme.muted}>{fit(emptyHint, inner)}</Text>
      ) : (
        <>
          <Box>
            {columns.map((column, index) => (
              <Text key={index} color={theme.muted}>
                {padTo(column.header, widthOf(column))}{" "}
              </Text>
            ))}
          </Box>

          {visible.map((row, offset) => {
            const index = from + offset;
            const isSelected = index === selected;
            const isPlaying = index === playing;

            return (
              <Box key={index}>
                <Text
                  color={isPlaying ? theme.playing : undefined}
                  backgroundColor={isSelected && focused ? theme.selectionBg : undefined}
                  bold={isPlaying}
                  inverse={isSelected && !focused}
                >
                  {columns
                    .map((column) => padTo(column.value(row, index), widthOf(column)))
                    .join(" ")}
                </Text>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
}
