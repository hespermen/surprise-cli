/**
 * Уровни звука для визуализатора.
 *
 * Значения НАСТОЯЩИЕ: mpv считает их фильтром astats прямо на том потоке,
 * который сейчас звучит, и отдаёт через af-metadata. Рисовать анимацию «под
 * музыку», не имея данных, было бы обманом — картинка жила бы своей жизнью и
 * расходилась со звуком на первой же паузе.
 *
 * Разбор вынесен сюда отдельно от бэкенда: это чистое преобразование строк в
 * числа, и проверять его надо без mpv.
 */

/** Тише этого считаем тишиной: ниже -60 dBFS человеческое ухо уже ничего не ловит. */
export const SILENCE_DB = -60;

export interface AudioLevels {
  /** Среднеквадратичный уровень в dBFS: воспринимаемая громкость. */
  rmsDb: number;
  /** Пиковый уровень в dBFS: мгновенный максимум. */
  peakDb: number;
  /** По каналам, слева направо. Пусто, если каналов не видно. */
  channelsDb: number[];
}

const SILENT: AudioLevels = { rmsDb: SILENCE_DB, peakDb: SILENCE_DB, channelsDb: [] };

function toDb(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(parsed)) return null;
  // astats на полной тишине отдаёт -inf, а после парсинга — очень большое
  // отрицательное число. Зажимаем, иначе шкала уезжает в бесконечность.
  return Math.max(SILENCE_DB, Math.min(0, parsed));
}

/**
 * Разбор ответа `af-metadata/<label>`.
 *
 * Ключи выглядят как `lavfi.astats.1.RMS_level` (канал), `lavfi.astats.Overall.
 * RMS_level` (суммарно). Номера каналов идут с единицы и зависят от раскладки,
 * поэтому собираем их по порядку, а не по именам.
 */
export function parseLevels(metadata: unknown): AudioLevels {
  if (!metadata || typeof metadata !== "object") return SILENT;
  const entries = metadata as Record<string, unknown>;

  const channels: Array<{ index: number; db: number }> = [];
  let overallRms: number | null = null;
  let overallPeak: number | null = null;

  for (const [key, raw] of Object.entries(entries)) {
    const match = /^lavfi\.astats\.(Overall|\d+)\.(RMS_level|Peak_level)$/.exec(key);
    if (!match) continue;
    const [, scope, kind] = match;
    const db = toDb(raw);
    if (db === null) continue;

    if (scope === "Overall") {
      if (kind === "RMS_level") overallRms = db;
      else overallPeak = db;
      continue;
    }
    if (kind === "RMS_level") channels.push({ index: Number(scope), db });
  }

  channels.sort((a, b) => a.index - b.index);
  const channelsDb = channels.map((channel) => channel.db);

  // Суммарного значения может не быть (моно, старый ffmpeg) — берём худший
  // случай из каналов, а не ноль: ноль означал бы максимальную громкость.
  const rmsDb = overallRms ?? (channelsDb.length ? Math.max(...channelsDb) : SILENCE_DB);
  const peakDb = overallPeak ?? rmsDb;

  return { rmsDb, peakDb, channelsDb };
}

/**
 * Уровень в долю от нуля до единицы — для высоты столбика.
 *
 * Шкала dBFS логарифмическая и отрицательная: тишина -60, максимум 0. Линейное
 * растягивание этого диапазона даёт вялую картинку — музыка живёт в верхней
 * трети, и столбики почти не двигаются. Поэтому поднимаем нижнюю границу до
 * порога слышимости и слегка выгибаем кривую.
 */
export function levelToRatio(db: number, floorDb = SILENCE_DB): number {
  if (!Number.isFinite(db)) return 0;
  const clamped = Math.max(floorDb, Math.min(0, db));
  const linear = (clamped - floorDb) / (0 - floorDb);
  return Math.pow(linear, 1.6);
}
