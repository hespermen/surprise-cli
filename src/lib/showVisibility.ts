/**
 * Видимость выпуска. Порт нужной части src/lib/showVisibility.ts.
 *
 * Взято только то, что касается чтения: редакторские переходы статусов CLI не
 * делает и делать не должен.
 */

export type ShowStatus = "draft" | "unlisted" | "published" | "scheduled" | "archived";

/**
 * Архив не показывают НИКОМУ — включая админов и автора выпуска.
 *
 * RLS этого не делает и не должен: политика намеренно пускает админа и автора,
 * иначе админка не прочитает архив. Поэтому фильтр живёт в запросах клиента. Для
 * CLI это значит ровно одно: свой список выпусков мы обязаны фильтровать сами,
 * иначе у админа в терминале появятся выпуски, которых на сайте нет.
 *
 * Значение готово для PostgREST: `.not("status", "in", ARCHIVED_FILTER)`.
 */
export const SITE_HIDDEN_STATUSES: ShowStatus[] = ["archived"];
export const ARCHIVED_FILTER = `(${SITE_HIDDEN_STATUSES.join(",")})`;

export function isHiddenFromSite(status: ShowStatus | string | null | undefined): boolean {
  return !!status && SITE_HIDDEN_STATUSES.includes(status as ShowStatus);
}

/** Открывается ли выпуск по прямой ссылке. Отражает RLS (published + unlisted). */
export function isReachableByLink(status: ShowStatus | string | null | undefined): boolean {
  return status === "published" || status === "unlisted";
}
