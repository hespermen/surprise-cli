/**
 * Раскладка главного экрана по вертикали.
 *
 * Вынесена из App отдельной чистой функцией не ради красоты: единственный способ
 * убедиться, что интерфейс помещается в окно, — посчитать его высоту, а не
 * посмотреть на него. Глаз не отличает кадр в 43 строки от кадра в 44, а
 * разница между ними — между спокойным экраном и трясущимся.
 */

/** Рамка, заголовок, подзаголовок, прогресс. */
export const PLAYER_ROWS = 5;
/** Строка подсказок под плеером. */
export const HINT_ROWS = 1;
/**
 * Строка команд: рамка, поле ввода и напоминание о клавишах внизу.
 *
 * Сами подсказки считаются отдельно, потому что их число подгоняется под
 * свободное место. Фиксированная высота палитры означала бы, что в невысоком
 * окне она выдавит за край то, ради чего её открыли, — список под ней.
 */
export const COMMAND_CHROME = 4;
export const COMMAND_MAX_SUGGESTIONS = 8;
/** Палитра без единой подсказки бессмысленна: это уже не палитра. */
export const COMMAND_MIN_SUGGESTIONS = 1;

/**
 * Минимумы панелей тела.
 *
 * Сумма именно такая, какой обязана быть: при bodyHeight = MIN_BODY нижние
 * ограничения списка и подробностей срабатывают ОДНОВРЕМЕННО и дают ровно
 * MIN_BODY. Разойдись эти числа — и тело молча выросло бы сверх выделенного,
 * а расчёт высоты начал бы врать в ту сторону, которую труднее всего заметить.
 */
export const MIN_LIST_BOX = 7;
export const MIN_DETAILS_BOX = 5;
export const MIN_BODY = MIN_LIST_BOX + MIN_DETAILS_BOX;

/**
 * Одна строка окна НИКОГДА не занимается.
 *
 * Это главное правило всего файла. ink сравнивает высоту кадра с высотой окна и
 * при `кадр >= окно` перестаёт обновлять экран по частям: он гасит весь экран
 * целиком и рисует заново. Раскладка занимала окно ровно, строка в строку, —
 * и полная очистка случалась на КАЖДОМ кадре, десять раз в секунду. Снаружи это
 * выглядит не как «ink выбрал другой режим вывода», а как трясущийся интерфейс:
 * содержимое моргает и прыгает, и причину в коде раскладки никто не ищет.
 *
 * Одна незанятая строка убирает весь эффект: кадр обновляется разницей, и экран
 * стоит неподвижно.
 */
export const SPARE_ROW = 1;

/** Ниже этого главный экран не помещается никакими ухищрениями. */
export const MIN_USABLE_ROWS = PLAYER_ROWS + HINT_ROWS + MIN_BODY + SPARE_ROW;

export interface LayoutInput {
  /** Высота окна терминала в строках. */
  height: number;
  /** Отдаёт ли плеер уровни звука: без них измерителя нет. */
  hasLevels: boolean;
  /** Открыта ли строка команд. */
  commandOpen: boolean;
  /** Высота логотипа. */
  logoHeight: number;
  /** Высота измерителя. */
  meterHeight: number;
}

export interface Layout {
  showLogo: boolean;
  showMeter: boolean;
  /** Высота тела — списка вместе с подробностями. */
  bodyHeight: number;
  listBox: number;
  /** Строк данных внутри списка, без рамки и заголовка. */
  listHeight: number;
  detailsBox: number;
  /** Высота строки команд вместе с рамкой; ноль, когда она закрыта. */
  commandRows: number;
  /** Сколько подсказок поместится в палитру. */
  commandSuggestions: number;
  /**
   * Помещается ли экран в окно.
   *
   * Когда нет — показать обрезанный интерфейс хуже, чем сказать об этом прямо:
   * не помещающийся кадр заставляет терминал прокручиваться, и человек видит
   * трясущуюся кашу вместо понятного «сделайте окно выше».
   */
  fits: boolean;
  /** Сколько строк займёт кадр целиком. Проверяется тестом. */
  totalRows: number;
}

export function computeLayout({
  height,
  hasLevels,
  commandOpen,
  logoHeight,
  meterHeight,
}: LayoutInput): Layout {
  const budget = height - SPARE_ROW;
  const base = PLAYER_ROWS + HINT_ROWS;

  // Палитра команд подстраивается под окно: ей достаётся всё, что остаётся
  // сверх обязательного тела, но не больше, чем есть подсказок.
  const room = budget - base - MIN_BODY - COMMAND_CHROME;
  const commandSuggestions = commandOpen
    ? Math.max(0, Math.min(COMMAND_MAX_SUGGESTIONS, room))
    : 0;
  const commandRows = commandOpen ? COMMAND_CHROME + commandSuggestions : 0;

  const fixedRows = base + commandRows;

  // Части отключаются по очереди — сначала логотип, потом измеритель, — а не
  // выдавливают друг друга за край экрана.
  const showMeter = hasLevels && budget - fixedRows - meterHeight >= MIN_BODY + 2;
  const meterRows = showMeter ? meterHeight : 0;
  const showLogo = !commandOpen && budget - fixedRows - meterRows - logoHeight >= MIN_BODY + 4;
  const logoRows = showLogo ? logoHeight : 0;

  const bodyHeight = Math.max(MIN_BODY, budget - fixedRows - meterRows - logoRows);
  // Список и подробности делят тело НАЦЕЛО: остаток ушёл бы в незанятую строку,
  // и рамки разъехались бы на ряд.
  const listBox = Math.max(MIN_LIST_BOX, Math.round(bodyHeight * 0.55));
  const detailsBox = Math.max(MIN_DETAILS_BOX, bodyHeight - listBox);

  return {
    showLogo,
    showMeter,
    commandRows,
    commandSuggestions,
    fits:
      budget - fixedRows >= MIN_BODY &&
      (!commandOpen || commandSuggestions >= COMMAND_MIN_SUGGESTIONS),
    bodyHeight,
    listBox,
    listHeight: Math.max(3, listBox - 4),
    detailsBox,
    // Считаем по тому, что РЕАЛЬНО рисуется: по listBox и detailsBox, а не по
    // bodyHeight. Разойдись они из-за нижних ограничений — и итог получился бы
    // меньше настоящего кадра, то есть проверка на вместимость прошла бы там,
    // где интерфейс уже не помещается.
    totalRows: logoRows + listBox + detailsBox + meterRows + fixedRows,
  };
}
