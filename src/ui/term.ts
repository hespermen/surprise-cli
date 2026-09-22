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
  // Сначала пробуем КРУПНЫЙ код: каждый модуль — две клетки в ширину и целая в
  // высоту. Мелкий вариант рисует модуль полклетки, и камера телефона на нём
  // спотыкается: сглаживание шрифта размывает границы, а запаса на ошибку почти
  // нет. Разница в площади модуля — вчетверо, и сканируется он совсем иначе.
  //
  // Поля (margin) обязаны быть не меньше двух модулей: «тихая зона» — часть
  // стандарта, без неё декодер не находит границу кода на фоне терминала.
  for (const options of [
    { small: false, margin: 2 },
    { small: true, margin: 2 },
  ] as const) {
    let rendered: string;
    try {
      rendered = await QRCode.toString(text, {
        type: "terminal",
        errorCorrectionLevel: "M",
        ...options,
      });
    } catch {
      return null;
    }

    const trimmed = rendered.replace(/\n+$/, "");
    const widest = trimmed
      .split("\n")
      .reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
    if (widest <= terminalWidth()) return trimmed;
  }

  // Не влез даже мелкий: обрезанный по краю код не считывается, и показать его
  // хуже, чем не показать. Вызывающий оставит ссылку — она рабочая сама по себе.
  return null;
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

/** Сколько нужно, чтобы интерфейс с логотипом поместился целиком. */
// Размер снят с раскладки, которая читается комфортно, а не придуман.
//
// Ширина: строка подсказки внизу занимает 99 колонок, плюс поля — 101 это
// абсолютный минимум, при котором её не режет. Берём 125: запас на более
// длинную подсказку после перевода и, главное, простор измерителю уровня —
// его полоса тянется во всю ширину, и чем она длиннее, тем мельче различимое
// изменение громкости.
//
// Высота: логотип 5, измеритель 3, плеер 5, подсказка 1 — четырнадцать строк
// занято всегда, и ещё одна остаётся свободной (см. SPARE_ROW в раскладке).
// Остальное делят список и подробности; на 45 строках списку достаётся 13
// строк данных, подробностям — 13, и обе панели выглядят наполненными.
export const MIN_ROWS = 45;
export const MIN_COLS = 125;

/**
 * Попросить терминал стать больше, если он мал.
 *
 * Последовательность CSI 8 ; строки ; колонки t — стандартная и понятна xterm,
 * iTerm2, kitty, Alacritty, WezTerm и большинству прочих. Кто её не знает,
 * молча проигнорирует: это escape-код, а не команда, и сломать им ничего нельзя.
 *
 * Просим ТОЛЬКО когда окно меньше нужного, и только один раз при запуске.
 * Раздвигать и без того большое окно — навязчивость: человек сам выбрал размер.
 *
 * Отключается SURPRISE_NO_RESIZE=1 — менять чужое окно без права вето нельзя,
 * в тайловом оконном менеджере это ещё и бессмысленно.
 */
export function requestTerminalSize(rows = MIN_ROWS, columns = MIN_COLS): void {
  if (!process.stdout.isTTY) return;
  if (process.env.SURPRISE_NO_RESIZE === "1") return;

  const currentRows = process.stdout.rows ?? 0;
  const currentColumns = process.stdout.columns ?? 0;
  if (currentRows >= rows && currentColumns >= columns) return;

  process.stdout.write(`\u001B[8;${Math.max(rows, currentRows)};${Math.max(columns, currentColumns)}t`);
}
