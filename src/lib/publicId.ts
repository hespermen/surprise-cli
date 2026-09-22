/**
 * Разбор ссылок и идентификаторов surprise.fm.
 *
 * Порт `parseEntityParam` из src/lib/publicId.ts плюс разбор полного URL — он
 * нужен только CLI: на сайте маршрутизатор уже отдал готовый параметр, а нам
 * человек вставляет ссылку из браузера целиком.
 *
 * Ключевое правило первоисточника: параметр может быть И числовым public_id, И
 * слагом. Резолвить обязаны оба вида — ссылки обоих видов живут в интернете.
 */

export interface EntityParam {
  isNumeric: boolean;
  publicId: number | null;
  slug: string | null;
}

export function parseEntityParam(param?: string): EntityParam {
  const isNumeric = !!param && /^\d+$/.test(param);
  return {
    isNumeric,
    publicId: isNumeric ? Number(param) : null,
    slug: isNumeric ? null : (param ?? null),
  };
}

export type EntityKind = "show" | "release" | "track" | "artist" | "author" | "playlist" | "list" | "program";

export interface ParsedLink {
  kind: EntityKind;
  param: EntityParam;
}

/**
 * Какой сущности принадлежит путь.
 *
 * Список снят с маршрутов src/App.tsx. Синонимы реальны: у релизов живут и
 * /release/, и /releases/, и /store/releases/ — ссылка из чужого сообщения может
 * оказаться любой из них.
 */
const ROUTES: Array<{ prefixes: string[]; kind: EntityKind }> = [
  { prefixes: ["episodes"], kind: "show" },
  { prefixes: ["release", "releases"], kind: "release" },
  { prefixes: ["artist"], kind: "artist" },
  { prefixes: ["author"], kind: "author" },
  { prefixes: ["playlist"], kind: "playlist" },
  { prefixes: ["lists"], kind: "list" },
  { prefixes: ["shows"], kind: "program" },
];

/**
 * Разобрать ссылку на surprise.fm.
 *
 * null — это «не ссылка на наш сайт», и вызывающий трактует ввод как поисковый
 * запрос. Именно поэтому здесь не бросается исключение: `surprise play shuliko`
 * — совершенно законный вызов.
 */
export function parseSurpriseLink(input: string): ParsedLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    // Позволяем и «surprise.fm/episodes/123» без схемы — из мессенджера часто
    // прилетает именно так.
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "surprise.fm") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // /store/releases/<slug> и /store/track/<uuid>: служебный префикс пропускаем.
  const path = segments[0] === "store" ? segments.slice(1) : segments;
  const [head, tail] = path;
  if (!head || !tail) return null;

  if (head === "track") return { kind: "track", param: parseEntityParam(tail) };

  const route = ROUTES.find((candidate) => candidate.prefixes.includes(head));
  return route ? { kind: route.kind, param: parseEntityParam(tail) } : null;
}
