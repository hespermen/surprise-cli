/**
 * Точка входа surprise-cli.
 *
 * Шебанг сюда НЕ ставим: его добавляет esbuild баннером при сборке. Два шебанга
 * подряд — синтаксическая ошибка, а не безобидный дубль.
 *
 * Разбор аргументов руками, без commander и yargs: команд немного, а лишняя
 * зависимость в CLI — это лишний вес в `npx` и лишний апдейт в безопасности.
 */

import { libraryCommand, playlistCommand } from "./commands/library.ts";
import { loginCommand } from "./commands/login.ts";
import { playCommand } from "./commands/play.ts";
import { radioCommand } from "./commands/radio.ts";
import { tuiCommand } from "./commands/tui.ts";
import { logoutCommand, whoamiCommand } from "./commands/session.ts";
import { CLIENT_NAME, CLIENT_VERSION } from "./config.ts";
import { bold, cyan, dim, red } from "./ui/term.ts";

const USAGE = `${bold("surprise")} — SURPRISE.FM в терминале

${bold("Команды")}
  ${cyan("surprise")}                              полноэкранный интерфейс
  ${cyan("radio")} [--json]                          играть эфир
  ${cyan("play")} <ссылка|запрос> [--json]          играть выпуск
  ${cyan("library")} [раздел] [--json]              своя библиотека
  ${cyan("playlist")} [название] [--json]           содержимое плейлиста
  ${cyan("login")} [--email] [--no-open] [--force]   войти в аккаунт
  ${cyan("whoami")} [--json]                         кто вошёл
  ${cyan("logout")}                                  выйти

${bold("Флаги")}
  --json        машиночитаемый вывод
  --version     версия
  --help        эта справка

${dim("Разделы библиотеки: playlists, likes, finds, saved, following.")}
${dim("Вход по умолчанию — через Telegram: в терминале появится QR и ссылка на бота.")}
${dim("По SSH удобнее сканировать QR телефоном — браузер для этого не нужен.")}
`;

async function main(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(USAGE);
    return 0;
  }
  if (!command || command === "tui") return tuiCommand();
  if (command === "--version" || command === "-v") {
    // Имя пакета в ответе обязательно. Старый пакет назывался surprise-fm и
    // ставил ту же команду `surprise`; оба отвечали «0.1.0», и понять, какой
    // из них запустился, было нельзя — обновление «не помогало» молча.
    process.stdout.write(`${CLIENT_NAME} ${CLIENT_VERSION}\n`);
    return 0;
  }

  switch (command) {
    case "radio":
      return radioCommand(rest);
    case "play":
      return playCommand(rest);
    case "library":
    case "lib":
      return libraryCommand(rest);
    case "playlist":
      return playlistCommand(rest);
    case "login":
      return loginCommand(rest);
    case "whoami":
      return whoamiCommand(rest);
    case "logout":
      return logoutCommand();
    default:
      process.stderr.write(`${red("Неизвестная команда:")} ${command}\n\n${USAGE}`);
      return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`${red("Ошибка:")} ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
