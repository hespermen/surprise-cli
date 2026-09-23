/**
 * Константы окружения CLI.
 *
 * ANON_KEY — тот же публичный ключ, что вшит в бандл сайта и в Chrome-расширение
 * (.env.production, role=anon). Секретом он не является: им пользуется каждый
 * посетитель surprise.fm, а доступ режет RLS. Держим литералом ровно по той же
 * причине, что и extension/src/config.ts — чтобы у CLI не появлялся отдельный шаг
 * сборки с переменными окружения.
 */
export const DEFAULT_API_URL = "https://api.surprise.fm";

/**
 * Хосты, которым можно говорить по незашифрованному http.
 *
 * Только петля. Отладка против локального Supabase — законная нужда, и гонять
 * её через самоподписанный сертификат было бы издевательством; трафик при этом
 * не покидает машину, перехватывать его негде.
 */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Проверка адреса бэкенда.
 *
 * На этот адрес уходит всё, что вообще стоит красть: заголовок с токеном
 * доступа, refresh_token в теле обновления сессии, почта с паролем при входе.
 * Раньше переменная принималась как есть — а значит, строчки `export
 * SURPRISE_API_URL=http://…` в чужой инструкции, в общем CI или в дописанном
 * `.bashrc` хватало, чтобы всё это ушло на сторону, да ещё и открытым текстом.
 *
 * Функция ЧИСТАЯ и возвращает ошибку значением, а не бросает: разбор адреса
 * происходит при загрузке модуля, а исключение оттуда печатается стеком
 * вместо внятной фразы.
 */
export function checkApiUrl(raw: string): { url: string } | { error: string } {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return { error: "SURPRISE_API_URL пуст" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: `SURPRISE_API_URL не похож на адрес: ${trimmed}` };
  }

  if (parsed.protocol === "https:") return { url: trimmed };

  if (parsed.protocol === "http:") {
    if (LOOPBACK_HOSTS.has(parsed.hostname)) return { url: trimmed };
    return {
      error:
        `SURPRISE_API_URL=${trimmed} — незашифрованный http на внешний хост. ` +
        "Туда ушли бы токен доступа и пароль открытым текстом. Нужен https (http допустим только для localhost).",
    };
  }

  return { error: `SURPRISE_API_URL: схема ${parsed.protocol} не поддерживается, нужен https` };
}

const apiUrlOverride = process.env.SURPRISE_API_URL
  ? checkApiUrl(process.env.SURPRISE_API_URL)
  : null;

/**
 * Что не так с адресом — или null, если всё в порядке.
 *
 * Молча откатиться на адрес по умолчанию было бы хуже ошибки: человек думает,
 * что говорит со своим сервером, а плеер ходит на боевой. Поэтому запуск
 * прерывается — проверку делает index.ts перед первой командой.
 */
export const API_URL_ERROR = apiUrlOverride && "error" in apiUrlOverride ? apiUrlOverride.error : null;

export const SUPABASE_URL =
  apiUrlOverride && "url" in apiUrlOverride ? apiUrlOverride.url : DEFAULT_API_URL;

export const ANON_KEY =
  process.env.SURPRISE_ANON_KEY ??
  "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogImFub24iLCAiaXNzIjogInN1cGFiYXNlIiwgImlhdCI6IDE3NzMxNzc2NjIsICJleHAiOiAxOTMwODU3NjYyfQ.KtNNkx_X33kDoDXBh1hiqDlvF660-0mil45pJlL8UvE";

export const SITE_ORIGIN = "https://surprise.fm";

/**
 * Запасной поток: play обязан работать, даже когда station_settings недоступны.
 * То же значение, что у расширения.
 */
export const FALLBACK_STREAM = "https://radio.surprise.fm/listen/surprise/radio.mp3";

/** Как часто спрашиваем «что играет» — столько же опрашивает расширение. */
export const NOWPLAYING_INTERVAL_MS = 20_000;

/** Присутствие слушателя в эфире; реже нельзя — на сервере TTL присутствия. */
export const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Как подписываемся в User-Agent и x-client-info.
 *
 * Подставляются сборкой из package.json, а не пишутся здесь руками. Вторая
 * копия версии однажды разойдётся с первой — и разошлась: пакет переименовали,
 * а версия так и осталась 0.1.0 на два с лишним десятка выпусков. Отличить по
 * ней обновлённую установку от застрявшей было нельзя.
 *
 * Объявления ниже — запасные значения для запуска из исходников без сборки
 * (тесты, `node --experimental-strip-types`). В собранном файле их не остаётся.
 */
declare const __CLIENT_NAME__: string | undefined;
declare const __CLIENT_VERSION__: string | undefined;

export const CLIENT_NAME = typeof __CLIENT_NAME__ === "string" ? __CLIENT_NAME__ : "surprise-cli";
export const CLIENT_VERSION = typeof __CLIENT_VERSION__ === "string" ? __CLIENT_VERSION__ : "0.0.0-dev";

/**
 * Как клиент представляется при входе.
 *
 * Сервер по этому значению выбирает способ входа: терминалу нужна ветка без
 * редиректа, потому что принять его некуда. Значение переопределяется
 * переменной окружения — это отладочная возможность, и менять его без причины
 * не стоит: статистика входов перестанет отличать терминал от остальных
 * клиентов, а прав это всё равно не добавляет.
 */
export const PLATFORM_HINT = process.env.SURPRISE_PLATFORM_HINT ?? "cli";
