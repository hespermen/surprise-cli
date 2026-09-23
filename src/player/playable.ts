/**
 * Что вообще можно отдавать плееру.
 *
 * Адреса воспроизведения приходят с сервера: поле `stream_url` в настройках
 * станции, ответы функций show-stream, store-stream и preview-stream, а ещё
 * первая строка плейлиста, который станция назвала своим. Проверялось из всего
 * этого ровно одно — что «http://» поднимут до «https://». Всё прочее
 * проходило насквозь.
 *
 * А проходить было чему. И mpv, и ffplay понимают куда больше схем, чем нужно
 * для музыки: `file://` прочитает локальный файл, `concat:` склеит несколько,
 * у ffmpeg есть ещё десяток протоколов. Строка из базы данных превращалась в
 * чтение чужих файлов на машине слушателя.
 *
 * Проверка стоит у самих плееров, а не у трёх мест, где адреса приходят: так
 * она ловит и те вызовы, которых ещё нет. Это тот случай, когда узкое горлышко
 * полезнее аккуратности на входе.
 */

/** Петля: локальный icecast при отладке — обычное дело, слушать там нечего. */
const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export class UnplayableUrlError extends Error {
  constructor(url: string) {
    super(
      `Отказываемся играть ${url}: плееру отдаём только https. ` +
        "Схемы вроде file: и concat: читают файлы на вашей машине, и в ответе сервера им делать нечего.",
    );
    this.name = "UnplayableUrlError";
  }
}

/** Можно ли отдать этот адрес плееру. */
export function isPlayableUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Не разобралось — значит это не адрес, а голый путь или мусор.
    return false;
  }

  if (parsed.protocol === "https:") return true;
  return parsed.protocol === "http:" && LOOPBACK.has(parsed.hostname);
}

/** То же, но бросает: плееры зовут её первой строкой в load(). */
export function assertPlayable(url: string): void {
  if (!isPlayableUrl(url)) throw new UnplayableUrlError(url);
}
