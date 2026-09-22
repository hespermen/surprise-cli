/**
 * Вход, не выходя из интерфейса.
 *
 * Способа два, и порядок не случаен. Почта с паролем работает всегда и ни от
 * чего не зависит — поэтому она первая. Telegram удобнее, но требует, чтобы
 * сервер пускал клиента в bot-ветку, и когда не пускает, человек упирается в
 * отказ на ровном месте. Предлагать первым то, что может не сработать, — плохой
 * способ знакомства.
 */

import { Box, Text } from "ink";
import React from "react";

import { fit, theme } from "./theme.ts";

export type LoginPhase =
  /** Выбор способа. */
  | { kind: "choose"; index: number }
  | { kind: "email"; email: string; password: string; field: "email" | "password"; busy: boolean }
  | { kind: "starting" }
  | { kind: "waiting"; url: string; qr: string | null; secondsLeft: number }
  | { kind: "failed"; error: string; hint: string | null };

export const LOGIN_METHODS = [
  { id: "email", label: "Почта и пароль", hint: "работает всегда" },
  { id: "telegram", label: "Telegram", hint: "QR или ссылка на бота" },
] as const;

/**
 * Перенос длинного текста по словам.
 *
 * Обрезать сообщение об ошибке одной строкой нельзя: именно в нём написано, что
 * делать дальше, и обрыв на середине («…выйти (q) и `s…») оставляет человека
 * ровно там же, где он застрял.
 */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (!current) current = word;
    else if ([...current].length + 1 + [...word].length <= width) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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
        Вход в SURPRISE.FM
      </Text>

      {phase.kind === "choose" ? (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.muted}>Выберите способ — ↑/↓ и Enter, Esc отменяет</Text>
          <Box marginTop={1} flexDirection="column">
            {LOGIN_METHODS.map((method, index) => (
              <Text
                key={method.id}
                color={index === phase.index ? theme.accent : undefined}
                bold={index === phase.index}
              >
                {index === phase.index ? "▸ " : "  "}
                {method.label}
                <Text color={theme.muted}> — {method.hint}</Text>
              </Text>
            ))}
          </Box>
        </Box>
      ) : phase.kind === "email" ? (
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text color={phase.field === "email" ? theme.accent : theme.muted}>Почта:  </Text>
            <Text>{phase.email}</Text>
            {phase.field === "email" ? <Text color={theme.accent}>▌</Text> : null}
          </Box>
          <Box>
            <Text color={phase.field === "password" ? theme.accent : theme.muted}>Пароль: </Text>
            {/* Пароль не показываем даже владельцу экрана: за спиной бывают люди,
                а терминал часто демонстрируют. */}
            <Text>{"•".repeat(phase.password.length)}</Text>
            {phase.field === "password" ? <Text color={theme.accent}>▌</Text> : null}
          </Box>
          <Box marginTop={1}>
            <Text color={theme.muted}>
              {phase.busy ? "Проверяем…" : "Enter — дальше · Esc — отмена"}
            </Text>
          </Box>
        </Box>
      ) : phase.kind === "starting" ? (
        <Box marginTop={1}>
          <Text color={theme.muted}>Готовим ссылку…</Text>
        </Box>
      ) : phase.kind === "failed" ? (
        <Box marginTop={1} flexDirection="column">
          {wrap(phase.error, inner).map((line, index) => (
            <Text key={index} color={theme.danger}>
              {line}
            </Text>
          ))}
          {phase.hint
            ? wrap(phase.hint, inner).map((line, index) => (
                <Text key={`hint-${index}`} color={theme.muted}>
                  {line}
                </Text>
              ))
            : null}
          <Box marginTop={1}>
            <Text color={theme.muted}>Esc — закрыть</Text>
          </Box>
        </Box>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {/* QR печатается построчно: блочные символы кода переносить нельзя —
              он перестанет считываться. Терминал узкий — остаётся ссылка. */}
          {phase.qr ? (
            phase.qr.split("\n").map((line, index) => <Text key={index}>{line}</Text>)
          ) : (
            <Text color={theme.muted}>Терминал узковат для QR — откройте ссылку</Text>
          )}

          <Box marginTop={1} flexDirection="column">
            <Text color={theme.muted}>Отсканируйте QR телефоном или откройте ссылку:</Text>
            {/* Ссылку НЕ обрезаем: обрезанную нельзя ни скопировать, ни набрать. */}
            {wrap(phase.url, inner).map((line, index) => (
              <Text key={index} color={theme.accent}>
                {line}
              </Text>
            ))}
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

export { fit };
