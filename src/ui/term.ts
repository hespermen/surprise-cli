/**
 * Мелочи вокруг терминала: цвет, QR, скрытый ввод, открытие ссылки.
 *
 * Всё здесь обязано деградировать молча. CLI запускают и в пайпе, и по SSH без
 * DISPLAY, и в CI — ни один из этих случаев не должен ронять команду.
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import QRCode from "qrcode";

/**
 * Цвет включаем только для настоящего терминала и с оглядкой на NO_COLOR:
 * в пайпе ANSI-последовательности превращают вывод в мусор для grep и jq.
 */
export const colorEnabled = (): boolean =>
  process.stdout.isTTY === true && !process.env.NO_COLOR && process.env.TERM !== "dumb";

const wrap = (open: string, close: string) => (text: string) =>
  colorEnabled() ? `\u001B[${open}m${text}\u001B[${close}m` : text;

export const bold = wrap("1", "22");
export const dim = wrap("2", "22");
export const red = wrap("31", "39");
export const green = wrap("32", "39");
export const yellow = wrap("33", "39");
export const cyan = wrap("36", "39");

export function terminalWidth(): number {
  return process.stdout.columns ?? 80;
}

/**
 * Сколько колонок занимает строка на экране.
 *
 * Считать через .length нельзя: рендерер QR раскрашивает каждый модуль, и
 * escape-последовательности дают в разы больше символов, чем видно глазу — для
 * ссылки на бота выходило 874 «колонки» вместо 45, и QR не показывался никогда.
 */
export function visibleWidth(line: string): number {
  // eslint-disable-next-line no-control-regex -- ANSI SGR по определению из C0/C1.
  return [...line.replace(/\u001B\[[0-9;]*m/g, "")].length;
}

/**
 * QR ссылки на бота.
 *
 * Зачем вообще QR в терминале: типичный сценарий — человек сидит по SSH на
 * сервере, где нет ни браузера, ни Telegram. Кликнуть ссылку там некуда, зато
 * телефон с Telegram лежит рядом. QR — самый короткий путь от чужого терминала
 * до своего аккаунта.
 *
 * null, если терминал уже, чем QR: обрезанный по краю QR не считывается, и
 * показать его — хуже, чем не показать. Вызывающий в этом случае оставит ссылку.
 */
export async function renderQr(text: string): Promise<string | null> {
  let rendered: string;
  try {
    rendered = await QRCode.toString(text, { type: "terminal", small: true, margin: 1 });
  } catch {
    return null;
  }
  const widest = rendered
    .split("\n")
    .reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
  return widest > terminalWidth() ? null : rendered.replace(/\n+$/, "");
}

/**
 * Открыть ссылку в системе. Best-effort: обещать тут нечего.
 *
 * Отключается флагом, и это не украшение — по SSH открывать нечего, а на
 * сервере без DISPLAY xdg-open печатает ошибку поверх нашего вывода и портит
 * экран ровно в тот момент, когда человек читает инструкцию.
 */
export function openUrl(url: string): void {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const child = spawn(command, [url], { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {
    // Нет такой команды — человек откроет ссылку сам, она напечатана выше.
  }
}

export function isInteractive(): boolean {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}

export async function promptLine(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/**
 * Скрытый ввод пароля.
 *
 * Пароль принципиально не принимается аргументом командной строки: аргументы
 * видны в `ps` другим пользователям машины и оседают в истории шелла навсегда.
 */
export async function promptHidden(question: string): Promise<string> {
  const { stdin, stdout } = process;
  stdout.write(question);

  const wasRaw = stdin.isRaw === true;
  if (stdin.isTTY) stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise<string>((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      stdin.removeListener("data", onData);
      if (stdin.isTTY) stdin.setRawMode(wasRaw);
      stdin.pause();
      stdout.write("\n");
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        switch (char) {
          case "\r":
          case "\n":
            cleanup();
            resolve(value);
            return;
          case "\u0003": // Ctrl+C
            cleanup();
            reject(new Error("Ввод прерван"));
            return;
          case "\u007F": // Backspace
          case "\b":
            value = value.slice(0, -1);
            break;
          default:
            // Управляющие символы в пароль не попадают.
            if (char >= " ") value += char;
        }
      }
    };

    stdin.on("data", onData);
  });
}
