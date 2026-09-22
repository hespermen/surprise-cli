/**
 * Общий каркас воспроизведения для не-TUI команд.
 *
 * Живая строка состояния, горячие клавиши и корректное завершение нужны и
 * эфиру, и выпуску, и треку магазина. Раньше это жило внутри команды radio;
 * вынесено, чтобы вторая команда не начала копировать её целиком — вместе с
 * ошибками вроде забытого снятия raw-режима.
 */

import type { AudioBackend, PlaybackStatus } from "../player/backend.ts";
import { bold, dim, green, isInteractive, red, terminalWidth, yellow } from "./term.ts";

export interface PlaybackKeys {
  /** Вернуть true, если клавиша обработана. */
  onKey?: (key: string) => boolean | void;
}

export interface PlaybackSession {
  /** Напечатать строку поверх живого статуса. */
  say: (text: string) => void;
  /** Перерисовать строку состояния немедленно. */
  redraw: () => void;
  /** Завершить сеанс с этим кодом возврата. */
  finish: (code: number) => void;
  /** Промис, разрешающийся кодом возврата. */
  done: Promise<number>;
}

export interface PlaybackOptions {
  backend: AudioBackend;
  /** Строка описания того, что играет. Вызывается на каждой отрисовке. */
  describe: () => string;
  /** Позиция и длительность для показа; по умолчанию — из бэкенда. */
  progress?: () => { position: number | null; total: number | null };
  /** Что делать перед выходом (снять присутствие, дописать статистику). */
  cleanup?: () => Promise<void>;
  /**
   * Файл доиграл сам. По умолчанию — завершить сеанс: иначе команда висела бы
   * с мёртвым плеером, ничего не проигрывая и никак этого не показывая.
   * Очередь переопределит это, чтобы перейти к следующему треку.
   */
  onEnded?: () => void;
  /** Дополнительные клавиши поверх стандартных. */
  keys?: PlaybackKeys;
  /** Подсказка по управлению, печатается при старте. */
  hint?: string;
  /** Формат времени и полосы. */
  render: (state: PlaybackStatus, position: number | null, total: number | null, width: number) => string;
}

const STATUS_INTERVAL_MS = 1_000;

export function startPlayback(options: PlaybackOptions): PlaybackSession {
  const { backend } = options;

  let stopping = false;
  let statusLineOpen = false;
  const timers: NodeJS.Timeout[] = [];

  const clearStatusLine = () => {
    if (!statusLineOpen) return;
    process.stdout.write(`\r${" ".repeat(Math.max(0, terminalWidth() - 1))}\r`);
    statusLineOpen = false;
  };

  const say = (text: string) => {
    clearStatusLine();
    process.stdout.write(`${text}\n`);
  };

  const redraw = () => {
    // Без TTY живая строка бессмысленна: в файле или пайпе она превратится в
    // ленту одинаковых строк с управляющими символами.
    if (stopping || !process.stdout.isTTY) return;
    const state = backend.status();
    const { position, total } = options.progress?.() ?? {
      position: state.positionSec,
      total: state.durationSec,
    };
    const width = terminalWidth();
    process.stdout.write(`\r${" ".repeat(Math.max(0, width - 1))}\r${options.render(state, position, total, width)}`);
    statusLineOpen = true;
  };

  let resolveDone: (code: number) => void = () => {};
  const done = new Promise<number>((resolve) => {
    resolveDone = resolve;
  });

  const finish = (code: number) => {
    if (stopping) return;
    stopping = true;

    void (async () => {
      for (const timer of timers) clearInterval(timer);
      clearStatusLine();

      // Raw-режим обязан сниматься на любом пути выхода: иначе терминал
      // остаётся без эха и человек чинит его вслепую командой reset.
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();

      await backend.stop().catch(() => {});
      await options.cleanup?.().catch(() => {});
      resolveDone(code);
    })();
  };

  // Слушатели вешаются ЗДЕСЬ, а команда загружает адрес уже после возврата из
  // startPlayback.
  //
  // Порядок принципиален: раньше команда делала backend.load() до подписки, и
  // плеер, умерший сразу после запуска, отправлял 'exit' в пустоту. Симптом был
  // такой: команда честно печатала название выпуска и висела молча, ничего не
  // проигрывая — позиция навсегда оставалась null, потому что процесса уже не
  // было. Поймано на машине без звуковой карты, где ffplay падает мгновенно.
  backend.on("error", (error) => say(`${red("Плеер:")} ${error.message}`));
  backend.on("exit", ({ code }) => {
    say(`${red("Плеер завершился")}${code === null ? "" : ` (код ${code})`}.`);
    finish(1);
  });
  backend.on("ended", () => {
    if (options.onEnded) options.onEnded();
    else finish(0);
  });

  timers.push(setInterval(redraw, STATUS_INTERVAL_MS));

  if (options.hint) say(dim(options.hint));

  process.on("SIGINT", () => finish(0));
  process.on("SIGTERM", () => finish(0));

  if (isInteractive()) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (key: string) => {
      if (options.keys?.onKey?.(key)) return;
      switch (key) {
        case " ":
          void backend.setPaused(!backend.status().paused).then(redraw);
          break;
        case "q":
        case "\u0003": // В raw-режиме Ctrl+C сигналом не приходит — ловим сами.
          finish(0);
          break;
        default:
          break;
      }
    });
  }

  return { say, redraw, finish, done };
}

/** Значок состояния: играем, на паузе, буферизуемся. */
export function stateMark(state: PlaybackStatus): string {
  if (state.paused) return yellow("⏸");
  if (state.idle) return dim("…");
  return green("▶");
}

export function titleLine(text: string): string {
  return bold(text);
}
