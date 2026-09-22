/**
 * Первый запуск: язык, тема, вход.
 *
 * Язык спрашивается ПЕРВЫМ, хотя логичнее казалось бы начать с внешнего вида:
 * всё, что показано дальше, написано на выбранном языке, и выбирать тему по
 * подписям на чужом — плохое начало знакомства.
 *
 * Вход предлагается последним и его можно пропустить. Эфир играет без аккаунта,
 * и требовать логин до первого звука значит просить доверия раньше, чем показал,
 * ради чего.
 */

import { Box, Text } from "ink";
import React from "react";

import { LANGS, t, type Lang } from "./i18n.ts";
import { THEMES } from "./theme.ts";
import { fit, theme } from "./theme.ts";

export type SetupStep = "lang" | "theme" | "login";

/** Подписи шага — на языке, который уже выбран (или на языке по умолчанию). */
const COPY: Record<Lang, Record<string, string>> = {
  ru: {
    welcome: "Добро пожаловать",
    langTitle: "Язык интерфейса",
    themeTitle: "Тема оформления",
    loginTitle: "Войти в аккаунт?",
    loginWhy: "Вход открывает плейлисты, избранное и находки. Эфир играет и без него.",
    loginYes: "Войти сейчас",
    loginLater: "Позже",
    nav: "↑/↓ — выбрать · Enter — дальше",
    step: "шаг",
  },
  en: {
    welcome: "Welcome",
    langTitle: "Interface language",
    themeTitle: "Colour theme",
    loginTitle: "Sign in?",
    loginWhy: "Signing in unlocks playlists, favourites and finds. The live stream works without it.",
    loginYes: "Sign in now",
    loginLater: "Later",
    nav: "↑/↓ to choose · Enter to continue",
    step: "step",
  },
};

export const SETUP_STEPS: readonly SetupStep[] = ["lang", "theme", "login"];

export interface SetupProps {
  step: SetupStep;
  index: number;
  lang: Lang;
  themeId: string;
  /** Выбранная строка текущего шага. */
  selected: number;
  width: number;
}

function optionsFor(step: SetupStep, lang: Lang): Array<{ label: string; hint?: string }> {
  const copy = COPY[lang];
  switch (step) {
    case "lang":
      return LANGS.map((item) => ({ label: item.label }));
    case "theme":
      // Названия тем — имена собственные, их не переводят.
      return THEMES.map((item) => ({ label: item.label }));
    case "login":
      return [{ label: copy.loginYes! }, { label: copy.loginLater! }];
  }
}

export function Setup({ step, index, lang, selected, width }: SetupProps): React.ReactElement {
  const copy = COPY[lang];
  const inner = Math.max(30, width - 6);
  const options = optionsFor(step, lang);

  const title =
    step === "lang" ? copy.langTitle! : step === "theme" ? copy.themeTitle! : copy.loginTitle!;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={3}
      paddingY={1}
      width={width}
    >
      <Text bold color={theme.accent}>
        SURPRISE.FM · {copy.welcome}
      </Text>

      <Box marginTop={1}>
        <Text color={theme.muted}>
          {copy.step} {index + 1}/{SETUP_STEPS.length}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text bold>{fit(title, inner)}</Text>
      </Box>

      {step === "login" ? (
        <Box marginTop={1}>
          <Text color={theme.muted}>{fit(copy.loginWhy!, inner)}</Text>
        </Box>
      ) : null}

      <Box marginTop={1} flexDirection="column">
        {options.map((option, optionIndex) => (
          <Text
            key={option.label}
            color={optionIndex === selected ? theme.accent : undefined}
            bold={optionIndex === selected}
          >
            {optionIndex === selected ? "▸ " : "  "}
            {option.label}
            {/* Тему видно сразу: пока ходишь по списку, палитра уже применена,
                и выбирать приходится не по названию, а по тому, что на экране. */}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.muted}>{copy.nav}</Text>
      </Box>
    </Box>
  );
}
