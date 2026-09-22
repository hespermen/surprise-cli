/**
 * Строка ввода команд и подсказка по ним.
 *
 * Подсказка появляется сразу при открытии строки, а не после набора: вопрос
 * «а что тут вообще можно» возникает раньше, чем желание что-то напечатать.
 */

import { Box, Text } from "ink";
import React from "react";

import type { CommandSpec } from "./commands.ts";
import { fit, padTo, theme } from "./theme.ts";

export function CommandLine({
  input,
  suggestions,
  highlighted,
  width,
  error,
  maxSuggestions,
}: {
  input: string;
  suggestions: readonly CommandSpec[];
  highlighted: number;
  width: number;
  error: string | null;
  /** Сколько подсказок поместится — считает раскладка, см. computeLayout. */
  maxSuggestions: number;
}): React.ReactElement {
  const inner = Math.max(24, width - 4);

  // Сколько подсказок показать, решает раскладка: она одна знает, сколько
  // строк осталось. Возьми палитра больше — она выдавила бы за край экрана
  // список под ней, то есть ровно то, ради чего её открыли.
  const visible = suggestions.slice(0, Math.max(1, maxSuggestions));

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1} width={width}>
      <Box>
        <Text color={theme.accent} bold>
          /
        </Text>
        <Text>{fit(input.replace(/^\//, ""), inner - 3)}</Text>
        <Text color={theme.accent}>▌</Text>
      </Box>

      {error ? (
        <Text color={theme.danger}>{fit(error, inner)}</Text>
      ) : visible.length === 0 ? (
        <Text color={theme.muted}>Такой команды нет — Esc, чтобы закрыть</Text>
      ) : (
        visible.map((command, index) => (
          <Box key={command.name}>
            <Text
              color={index === highlighted ? theme.accent : theme.muted}
              bold={index === highlighted}
              backgroundColor={index === highlighted ? theme.selectionBg : undefined}
            >
              {padTo(`/${command.name}${command.arg ? ` ${command.arg}` : ""}`, 22)}
              {fit(command.hint, inner - 23)}
            </Text>
          </Box>
        ))
      )}

      <Text color={theme.muted}>Tab — подставить · Enter — выполнить · Esc — закрыть</Text>
    </Box>
  );
}
