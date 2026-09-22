/**
 * Вход прямо в интерфейсе: QR, ссылка и ожидание подтверждения.
 *
 * Раньше `/login` просто советовал выйти и набрать команду в оболочке. Это
 * перекладывало работу на человека посреди задачи — он пришёл слушать, а его
 * отправляли перезапускать программу.
 */

import { Box, Text } from "ink";
import React from "react";

import { fit, theme } from "./theme.ts";

export type LoginPhase =
  | { kind: "starting" }
  | { kind: "waiting"; url: string; qr: string | null; secondsLeft: number }
  | { kind: "failed"; error: string };

export function LoginOverlay({ phase, width }: { phase: LoginPhase; width: number }): React.ReactElement {
  const inner = Math.max(30, width - 6);

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
        Вход через Telegram
      </Text>

      {phase.kind === "starting" ? (
        <Box marginTop={1}>
          <Text color={theme.muted}>Готовим ссылку…</Text>
        </Box>
      ) : phase.kind === "failed" ? (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.danger}>{fit(phase.error, inner)}</Text>
          <Text color={theme.muted}>Esc — закрыть</Text>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {/* QR печатается построчно: ink не переносит длинные строки внутри
              Text, а блочные символы кода переносить нельзя — он перестанет
              считываться. Если терминал узкий, renderQr вернул null, и остаётся
              ссылка — она рабочая сама по себе. */}
          {phase.qr
            ? phase.qr.split("\n").map((line, index) => <Text key={index}>{line}</Text>)
            : (
              <Text color={theme.muted}>
                Терминал узковат для QR — откройте ссылку или растяните окно
              </Text>
            )}

          <Box marginTop={1} flexDirection="column">
            <Text color={theme.muted}>Отсканируйте QR телефоном или откройте ссылку:</Text>
            <Text color={theme.accent}>{fit(phase.url, inner)}</Text>
            <Text color={theme.muted}>
              Затем нажмите Start у бота. Ждём подтверждения · {phase.secondsLeft} с
            </Text>
            <Text color={theme.muted}>Esc — отменить вход</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
