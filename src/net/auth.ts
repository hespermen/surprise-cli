/**
 * Вход и поддержание сессии.
 *
 * Схема входа взята один-в-один из Chrome-расширения (extension/src/lib/auth.ts):
 * telegram-login-start отдаёт nonce + poll_secret + ссылку на бота, человек жмёт
 * Start в Telegram, telegram-login-poll возвращает пару токенов GoTrue.
 *
 * По устройству это обычный device flow: nonce играет роль кода устройства, а
 * poll_secret — доказательства, что сессию забирает тот самый клиент, который
 * вход начал (nonce уходит в Telegram открытым текстом и навсегда остаётся в
 * истории чата, поэтому одного его мало). В отличие от браузерных OAuth-флоу
 * здесь не нужен локальный loopback-порт — значит вход не ломается по SSH и в
 * контейнере, где открывать браузер попросту некуда.
 */

import { ANON_KEY, PLATFORM_HINT } from "../config.ts";
import { ApiError, NetworkError, anonHeaders, authUrl, callFunction, request } from "./http.ts";
import { expiresAtFromToken, isExpired, parseJwt } from "./jwt.ts";
import { clearSession, readSession, withSessionLock, writeSession, type Session } from "./session.ts";

/** Обновляем заранее: иначе первый же запрос упрётся в протухший токен. */
const REFRESH_MARGIN_SEC = 120;

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export function toSession(tokens: TokenPair): Session {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAtFromToken(tokens.access_token),
    user_id: parseJwt(tokens.access_token).sub ?? "",
  };
}

// ── Вход через Telegram ──

export interface PendingLogin {
  nonce: string;
  pollSecret: string;
  url: string;
  /** Unix-время в секундах. */
  expiresAt: number;
}

interface StartResponse {
  method?: string;
  nonce?: string;
  poll_secret?: string;
  url?: string;
  expires_in?: number;
  error?: string;
}

export class TelegramUnavailableError extends Error {
  constructor() {
    super("Вход через Telegram недоступен — войдите по почте: surprise login --email");
    this.name = "TelegramUnavailableError";
  }
}

/**
 * Начало входа.
 *
 * platform:"cli" критичен: pickLoginMethod на сервере пускает в bot-ветку только
 * известные ему платформы, а всем прочим отдаёт oauth — БЕЗ poll_secret. Если
 * правка с "cli" ещё не доехала до прода, честно говорим об этом и предлагаем
 * почту, а не уводим человека в редирект, который ему некуда принять.
 */
export async function startTelegramLogin(): Promise<PendingLogin> {
  const data = await callFunction<StartResponse>("telegram-login-start", {
    mode: "login",
    platform: PLATFORM_HINT,
  });

  if (data.method !== "bot" || !data.nonce || !data.poll_secret || !data.url) {
    throw new TelegramUnavailableError();
  }

  return {
    nonce: data.nonce,
    pollSecret: data.poll_secret,
    url: data.url,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 300),
  };
}

/**
 * Вход через браузер — основной способ.
 *
 * Терминалу некуда принять редирект: Telegram OAuth пускает return_to только на
 * домен, прописанный в BotFather, а localhost туда не добавить. Поэтому сессию
 * не ловят — её ЗАБИРАЮТ: сервер заводит nonce, человек подтверждает вход на
 * странице /cli уже вошедшим аккаунтом, а терминал опрашивает тот же
 * telegram-login-poll и получает токены.
 *
 * Короткий код нужен для случая «ссылка открылась в другом браузере»: он виден
 * и здесь, и на странице, и подтверждать вход, не сверив его, нельзя — ссылку
 * мог прислать кто угодно.
 */
export interface BrowserLogin extends PendingLogin {
  /** Код для сверки с тем, что показывает страница. */
  code: string;
}

interface CliStartResponse {
  nonce?: string;
  poll_secret?: string;
  url?: string;
  code?: string;
  expires_in?: number;
  error?: string;
}

/** Похоже ли, что функции просто нет на сервере. */
function looksNotDeployed(error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 404 || error.status === 503)) return true;
  const text = error instanceof Error ? error.message : String(error);
  // Edge-рантайм на отсутствующую функцию отвечает не 404, а ошибкой загрузки
  // воркера. Человеку это ничего не говорит, а причина ровно одна — не выкачено.
  return /worker boot error|appropriate entrypoint|InvalidWorkerCreation|BOOT_ERROR/i.test(text);
}

export class LoginNotDeployedError extends Error {
  constructor() {
    super("Этот способ входа ещё не выкачен на сервер");
    this.name = "LoginNotDeployedError";
  }
}

export async function startBrowserLogin(): Promise<BrowserLogin> {
  let data: CliStartResponse;
  try {
    data = await callFunction<CliStartResponse>("cli-login-start", {});
  } catch (error) {
    if (looksNotDeployed(error)) throw new LoginNotDeployedError();
    throw error;
  }
  if (!data.nonce || !data.poll_secret || !data.url) {
    throw new Error(data.error || "Сервер не выдал ссылку для входа");
  }
  return {
    nonce: data.nonce,
    pollSecret: data.poll_secret,
    url: data.url,
    code: data.code ?? "",
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 300),
  };
}

export type PollResult =
  | { status: "pending" }
  | { status: "ok"; session: Session; isNew: boolean }
  | { status: "expired" }
  | { status: "failed"; error: string };

interface PollResponse {
  status?: string;
  session?: TokenPair;
  is_new?: boolean;
  error?: string;
}

/**
 * Один опрос. Анонимный: личность подтверждают nonce + poll_secret, а не JWT.
 *
 * 429 (превышен лимит опросов) прилетает как ApiError, но несёт осмысленное
 * тело — его и показываем. Сетевой сбой трактуем как «пока непонятно», а не как
 * отказ: моргнувший wifi не повод выбрасывать начатый вход.
 */
export async function pollTelegramLogin(pending: PendingLogin): Promise<PollResult> {
  let data: PollResponse;
  try {
    data = await callFunction<PollResponse>(
      "telegram-login-poll",
      { nonce: pending.nonce, poll_secret: pending.pollSecret },
      { retries: 0 },
    );
  } catch (error) {
    if (error instanceof NetworkError) return { status: "pending" };
    if (error instanceof ApiError) {
      const body = error.body as PollResponse | null;
      if (body?.status === "failed") return { status: "failed", error: body.error ?? error.message };
      return { status: "failed", error: error.message };
    }
    throw error;
  }

  if (data.status === "ok" && data.session) {
    return { status: "ok", session: toSession(data.session), isNew: data.is_new === true };
  }
  if (data.status === "expired") return { status: "expired" };
  if (data.status === "failed") return { status: "failed", error: data.error ?? "Не удалось войти" };
  return { status: "pending" };
}

/**
 * Опрос до результата. Интервал растёт 1.5 → 4 с, как на сайте: первые секунды
 * человек уже жмёт Start, дальше частить незачем — функция публичная и на каждый
 * вызов бьёт в БД.
 */
export type SettledPollResult = Exclude<PollResult, { status: "pending" }>;

export async function waitForTelegramLogin(
  pending: PendingLogin,
  options: { onTick?: (secondsLeft: number) => void; signal?: AbortSignal } = {},
): Promise<SettledPollResult> {
  let delayMs = 1_500;

  for (;;) {
    if (options.signal?.aborted) return { status: "failed", error: "Вход отменён" };

    const secondsLeft = pending.expiresAt - Math.floor(Date.now() / 1000);
    if (secondsLeft <= 0) return { status: "expired" };
    options.onTick?.(secondsLeft);

    const result = await pollTelegramLogin(pending);
    if (result.status !== "pending") {
      if (result.status === "ok") await persist(result.session);
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs = Math.min(delayMs + 500, 4_000);
  }
}

// ── Запасной вход: почта и пароль ──

export async function loginWithPassword(email: string, password: string): Promise<Session> {
  const data = (await request(authUrl("token?grant_type=password"), {
    method: "POST",
    headers: anonHeaders(),
    body: { email, password },
    retries: 0,
  })) as Partial<TokenPair> | null;

  if (!data?.access_token || !data.refresh_token) {
    throw new Error("Сервер не вернул токены — попробуйте ещё раз");
  }
  const session = toSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  await persist(session);
  return session;
}

// ── Поддержание сессии ──

async function persist(session: Session): Promise<void> {
  await withSessionLock(() => writeSession(session));
}

/**
 * Обновление токена. Внутрипроцессный single-flight поверх межпроцессного лока.
 *
 * Внутри лока сессия ПЕРЕЧИТЫВАЕТСЯ с диска — это не перестраховка, а суть
 * механизма: пока мы ждали лок, соседний процесс мог уже обновиться, и наш
 * refresh_token успел стать недействительным. Отправить его — значит сжечь
 * свежую сессию и разлогинить человека во всех окнах сразу.
 */
let refreshInFlight: Promise<Session | null> | null = null;

function refreshOnce(stale: Session): Promise<Session | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = withSessionLock(async () => {
    const current = (await readSession()) ?? stale;
    if (!isExpired(current.expires_at, REFRESH_MARGIN_SEC)) return current;

    try {
      const data = (await request(authUrl("token?grant_type=refresh_token"), {
        method: "POST",
        headers: anonHeaders(),
        body: { refresh_token: current.refresh_token },
        retries: 0,
      })) as Partial<TokenPair> | null;

      if (!data?.access_token || !data.refresh_token) {
        await clearSession();
        return null;
      }
      const next = toSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      // Пишем ДО того, как токеном воспользуются: иначе гонка отдаст старый.
      await writeSession(next);
      return next;
    } catch (error) {
      // Сервер отверг токен — сессии больше нет, чистим и просим войти заново.
      if (error instanceof ApiError) {
        await clearSession();
        return null;
      }
      // Сеть моргнула — сессию НЕ трогаем: она, скорее всего, жива.
      return current;
    }
  }).finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/** Валидная сессия или null. Обновляет токен, если тот скоро протухнет. */
export async function getValidSession(): Promise<Session | null> {
  const session = await readSession();
  if (!session) return null;
  if (!isExpired(session.expires_at, REFRESH_MARGIN_SEC)) return session;
  return refreshOnce(session);
}

export async function logout(): Promise<void> {
  const session = await readSession();
  await withSessionLock(() => clearSession());
  if (!session) return;
  // Отзываем токен на сервере; если не вышло — локально мы уже разлогинены.
  await request(authUrl("logout"), {
    method: "POST",
    headers: { ...anonHeaders(), Authorization: `Bearer ${session.access_token}` },
    retries: 0,
  }).catch(() => {});
}

export { ANON_KEY };
