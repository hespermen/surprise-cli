/**
 * Тонкая обёртка над fetch для Supabase: REST, edge-функции и GoTrue.
 *
 * Supabase-js сюда не тянем намеренно. Нужно около десятка эндпоинтов, а взамен
 * пришлось бы тащить зависимость, которая сама управляет сессией — то есть ровно
 * то, что у CLI должно быть под нашим контролем (см. комментарий про ротацию
 * refresh_token в net/session.ts). Extension пришёл к тому же решению.
 */

import { ANON_KEY, CLIENT_NAME, CLIENT_VERSION, SUPABASE_URL } from "../config.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Сеть не ответила вовсе: таймаут, DNS, обрыв. Это НЕ отказ сервера. */
export class NetworkError extends Error {
  // Поле объявлено явно, а не parameter property: Node снимает типы «в лоб» и
  // на `constructor(..., readonly cause)` падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
  readonly reason: unknown;

  constructor(message: string, reason?: unknown) {
    super(message);
    this.name = "NetworkError";
    this.reason = reason;
  }
}

export function anonHeaders(): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    "x-client-info": `${CLIENT_NAME}/${CLIENT_VERSION}`,
  };
}

export function authHeaders(accessToken: string): Record<string, string> {
  return { ...anonHeaders(), Authorization: `Bearer ${accessToken}` };
}

/**
 * Достать осмысленное сообщение из ответа Supabase.
 *
 * Форм у ошибки несколько: edge-функции кладут её в `error`, GoTrue — в
 * `error_description` или `msg`, PostgREST — в `message`. Проверяем все, иначе
 * человек увидит голое «HTTP 400».
 */
/**
 * Сколько чужого текста готовы показать.
 *
 * Не-JSON в ответе — это обычно страница прокси или WAF, а они иногда
 * возвращают эхом заголовки запроса. Печатать такое целиком значит вывалить
 * человеку на экран простыню, в которой может оказаться и его собственный
 * Authorization. Двухсот символов хватает, чтобы понять, кто ответил.
 */
const MAX_ERROR_TEXT = 200;

function clip(text: string): string {
  const trimmed = text.trim();
  return trimmed.length <= MAX_ERROR_TEXT ? trimmed : `${trimmed.slice(0, MAX_ERROR_TEXT)}…`;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return clip(body);
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    for (const key of ["error_description", "error", "message", "msg", "hint"]) {
      const value = b[key];
      if (typeof value === "string" && value.trim()) return clip(value);
    }
  }
  return fallback;
}

/**
 * Потолок на тело ответа.
 *
 * `res.text()` буферизует всё, что пришлёт та сторона, — а та сторона может
 * оказаться не нашей (подменённый адрес, прокси, просто сломанный сервер).
 * Четыре мегабайта с запасом перекрывают любой наш ответ: самый большой — это
 * список выпусков, и он на два порядка меньше.
 */
const MAX_BODY_BYTES = 4 * 1024 * 1024;

async function readBody(res: Response): Promise<unknown> {
  const length = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    throw new NetworkError(
      `Ответ слишком большой (${Math.round(length / 1024 / 1024)} МБ). Наш API столько не отдаёт.`,
    );
  }

  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  /** Сколько РАЗ повторять при сетевом сбое и 5xx. 0 — не повторять. */
  retries?: number;
  signal?: AbortSignal;
  /**
   * Идти ли за редиректом. По умолчанию НЕТ — см. комментарий у `once`.
   *
   * Включать только там, где редирект — нормальная часть работы: у раздачи
   * аудио и плейлистов он штатный, у нашего API его не бывает.
   */
  followRedirects?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Один запрос. Тело читаем ВСЕГДА, а не только при res.ok: Supabase кладёт в
 * 4xx осмысленный JSON, и именно там лежит причина — например, лимит опросов
 * входа отвечает 429 с текстом, который надо показать человеку.
 */
async function once(url: string, options: RequestOptions): Promise<unknown> {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    followRedirects = false,
  } = options;

  const timeout = AbortSignal.timeout(timeoutMs);
  const composed = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: Response;
  try {
    // За редиректами НЕ идём по умолчанию.
    //
    // Заголовок Authorization браузерный fetch при переходе на чужой origin
    // снимает сам, а вот ТЕЛО запроса при 307 и 308 пересылает как есть. У нас
    // в теле ездят пароль с почтой (auth.ts, вход) и refresh_token (там же,
    // обновление сессии) — то есть один ответ «308 Location: …» от
    // скомпрометированного или просто криво настроенного прокси уводил бы
    // учётные данные на указанный им хост.
    //
    // GoTrue на /auth/v1/token не редиректит никогда, PostgREST тоже. Так что
    // запрет ничего не ломает, а редкие места, где редирект штатный (раздача
    // аудио, плейлисты), включают его явным followRedirects.
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: composed,
      redirect: followRedirects ? "follow" : "manual",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new NetworkError("Сеть недоступна или сервер не ответил", error);
  }

  // Редирект при запрете — отдельная, внятная ошибка.
  //
  // Без неё это был бы «HTTP 308» с пустым телом: сообщение, по которому никто
  // не догадается, что произошло и почему. А произошло нечто, о чём стоит
  // узнать: наш API не редиректит, значит отвечает не он.
  if (!followRedirects && res.status >= 300 && res.status < 400) {
    throw new ApiError(
      res.status,
      null,
      `Сервер ответил редиректом (${res.status}) на ${new URL(url).host}. ` +
        "Наш API так не отвечает — проверьте SURPRISE_API_URL и сеть между вами и сервером.",
    );
  }

  const parsed = await readBody(res);
  if (!res.ok) throw new ApiError(res.status, parsed, messageFromBody(parsed, `HTTP ${res.status}`));
  return parsed;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);

/**
 * Запрос с повтором. Повторяем только то, что имеет смысл повторять: сетевой
 * сбой и «шлюз прилёг». 4xx не повторяем никогда — ответ не изменится, а для
 * 429 повтор прямо вреден.
 */
export async function request(url: string, options: RequestOptions = {}): Promise<unknown> {
  const retries = options.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await once(url, options);
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof NetworkError ||
        (error instanceof ApiError && RETRYABLE_STATUS.has(error.status));
      if (!retryable || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    }
  }
  throw lastError;
}

export function functionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

export function restUrl(path: string): string {
  return `${SUPABASE_URL}/rest/v1/${path}`;
}

export function authUrl(path: string): string {
  return `${SUPABASE_URL}/auth/v1/${path}`;
}

/** Вызов edge-функции. Все они принимают POST с JSON-телом. */
export function callFunction<T = unknown>(
  name: string,
  body: unknown = {},
  init: { accessToken?: string | null; timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  return request(functionUrl(name), {
    method: "POST",
    headers: init.accessToken ? authHeaders(init.accessToken) : anonHeaders(),
    body,
    timeoutMs: init.timeoutMs,
    retries: init.retries,
  }) as Promise<T>;
}

/**
 * Kong рубит запрос с URL длиннее ~8 КБ, а `.in()` со списком id упирается в
 * этот предел незаметно — на «слишком большой» библиотеке. Поэтому любые выборки
 * по списку идентификаторов идут через чанки.
 */
export function chunk<T>(items: readonly T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
