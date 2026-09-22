/**
 * Выбор live-потока: основной или резервный.
 *
 * Порт из src/lib/backupStream.ts сайта. Копия, а не импорт через «@/» — та же
 * конвенция, что у extension/src/lib/radio.ts: тянуть за пределы cli/ значит
 * тянуть tsconfig и зависимости сайта. Функции чистые и короткие, дублирование
 * дешевле связывания. При правке первоисточника — синхронизировать здесь.
 */

export type BackupMode = "auto" | "on" | "off";

/** Любое неизвестное/пустое значение трактуем как 'auto' (безопасный дефолт). */
export function normalizeBackupMode(value: string | null | undefined): BackupMode {
  return value === "on" || value === "off" ? value : "auto";
}

/** Активен ли резервный поток прямо сейчас. */
export function resolveBackupActive(mode: BackupMode, hasCurrentEfir: boolean): boolean {
  if (mode === "on") return true;
  if (mode === "off") return false;
  return hasCurrentEfir; // 'auto'
}

/** Какой URL играть для основной станции. */
export function resolveLiveStreamUrl(args: { active: boolean; primaryUrl: string; backupUrl: string }): string {
  return args.active ? args.backupUrl : args.primaryUrl;
}

/**
 * Плейлист (.m3u/.m3u8) отдаёт не звук, а список адресов.
 *
 * mpv развернул бы его сам, но нам URL нужен и для показа, и для ffplay-ветки,
 * которая этого не умеет. Поэтому решаем на нашей стороне, ровно как resolveStreamUrl
 * в playerStore сайта. http→https: по http поток из приложения не пойдёт.
 */
export function needsPlaylistResolve(url: string): boolean {
  return url.endsWith(".m3u") || url.endsWith(".m3u8");
}

export function firstEntryFromPlaylist(body: string): string | null {
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line && !line.startsWith("#")) return line;
  }
  return null;
}

export function forceHttps(url: string): string {
  return url.replace(/^http:\/\//, "https://");
}
