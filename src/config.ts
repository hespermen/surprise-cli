/**
 * Константы окружения CLI.
 *
 * ANON_KEY — тот же публичный ключ, что вшит в бандл сайта и в Chrome-расширение
 * (.env.production, role=anon). Секретом он не является: им пользуется каждый
 * посетитель surprise.fm, а доступ режет RLS. Держим литералом ровно по той же
 * причине, что и extension/src/config.ts — чтобы у CLI не появлялся отдельный шаг
 * сборки с переменными окружения.
 */
export const SUPABASE_URL = process.env.SURPRISE_API_URL ?? "https://api.surprise.fm";

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

/** Как подписываемся в User-Agent и x-client-info. */
export const CLIENT_NAME = "surprise-cli";
export const CLIENT_VERSION = "0.1.0";

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
