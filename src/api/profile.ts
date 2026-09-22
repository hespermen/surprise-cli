/**
 * Профиль текущего пользователя.
 *
 * profiles читается публично (RLS `USING (true)`), поэтому хватает обычного
 * REST-запроса под своим токеном — отдельная edge-функция не нужна.
 */

import { authHeaders, request, restUrl } from "../net/http.ts";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  telegram_username: string | null;
  avatar_url: string | null;
}

export async function fetchProfile(accessToken: string, userId: string): Promise<Profile | null> {
  const params = new URLSearchParams({
    select: "id,username,display_name,telegram_username,avatar_url",
    id: `eq.${userId}`,
    limit: "1",
  });
  const rows = (await request(restUrl(`profiles?${params}`), {
    headers: authHeaders(accessToken),
  })) as Profile[] | null;
  return rows?.[0] ?? null;
}

/**
 * Активна ли платная подписка (supporter).
 *
 * Условия ровно те же, что в supabase/functions/_shared/supporterStatus.ts:
 * статус active ИЛИ trialing (триал — полноценный премиум) и непросроченный
 * период. Сортировка с limit(1), а не одиночная строка: у человека бывает
 * несколько живых подписок сразу (триал, код, ручной грант), и запрос «ровно
 * одна» на них ломается, молча разжалуя подписчика.
 *
 * Значение показательное: реальное решение о выдаче полного трека принимает
 * сервер внутри store-stream, CLI им ничего не гейтит.
 */
export async function isSupporter(accessToken: string, userId: string): Promise<boolean> {
  const params = new URLSearchParams({
    select: "id,current_period_end",
    user_id: `eq.${userId}`,
    status: "in.(active,trialing)",
    current_period_end: `gt.${new Date().toISOString()}`,
    order: "current_period_end.desc",
    limit: "1",
  });
  try {
    const rows = (await request(restUrl(`supporter_subscriptions?${params}`), {
      headers: authHeaders(accessToken),
    })) as unknown[] | null;
    return (rows?.length ?? 0) > 0;
  } catch {
    // Не смогли проверить — не повод падать: это украшение вывода whoami.
    return false;
  }
}

/** Как показывать человека: @username, иначе имя, иначе telegram, иначе id. */
export function profileLabel(profile: Profile | null, userId: string): string {
  if (!profile) return userId;
  if (profile.username) return `@${profile.username}`;
  if (profile.display_name) return profile.display_name;
  if (profile.telegram_username) return `@${profile.telegram_username}`;
  return userId;
}
