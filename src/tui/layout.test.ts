import assert from "node:assert/strict";
import { test } from "node:test";

import { MIN_ROWS } from "../ui/term.ts";
import { MIN_BODY, MIN_USABLE_ROWS, SPARE_ROW, computeLayout } from "./layout.ts";

const LOGO = 5;
const METER = 3;

function layoutAt(height: number, options: Partial<{ hasLevels: boolean; commandOpen: boolean }> = {}) {
  return computeLayout({
    height,
    hasLevels: options.hasLevels ?? true,
    commandOpen: options.commandOpen ?? false,
    logoHeight: LOGO,
    meterHeight: METER,
  });
}

/**
 * Главный тест файла.
 *
 * Кадр обязан быть НИЖЕ окна хотя бы на строку. Занятое ровно по высоте окно
 * переводит ink в режим полной перерисовки: он гасит экран целиком по десять
 * раз в секунду, и интерфейс трясётся. Разницу в одну строку на глаз не увидеть,
 * поэтому её и проверяет тест.
 */
test("кадр всегда оставляет в окне свободную строку", () => {
  for (let height = 5; height <= 120; height += 1) {
    for (const hasLevels of [true, false]) {
      for (const commandOpen of [true, false]) {
        const layout = layoutAt(height, { hasLevels, commandOpen });
        // Не помещается — интерфейс не рисуется вовсе, и занимать ему нечего.
        if (!layout.fits) continue;
        assert.ok(
          layout.totalRows <= height - SPARE_ROW,
          `окно ${height}, уровни=${hasLevels}, команды=${commandOpen}: кадр ${layout.totalRows} строк`,
        );
      }
    }
  }
});

test("на рекомендованной высоте видно и логотип, и измеритель", () => {
  // Высота берётся из того же места, что и запрос размера окна при запуске:
  // разойдись эти числа — и рекомендованный размер перестал бы быть тем, под
  // который посчитана раскладка.
  const layout = layoutAt(MIN_ROWS);
  assert.equal(layout.showLogo, true);
  assert.equal(layout.showMeter, true);
  assert.equal(layout.totalRows, MIN_ROWS - SPARE_ROW);
});

/**
 * Тело делится нацело при ЛЮБОЙ высоте.
 *
 * Иначе итог кадра расходится с тем, что рисуется: нижние ограничения панелей
 * срабатывают молча, тело вырастает сверх выделенного, а проверка вместимости
 * этого не замечает — самый неприятный вид ошибки, потому что числа сходятся.
 */
test("список и подробности делят тело без остатка", () => {
  for (let height = 20; height <= 120; height += 1) {
    const layout = layoutAt(height);
    assert.equal(
      layout.listBox + layout.detailsBox,
      layout.bodyHeight,
      `окно ${height}: ${layout.listBox} + ${layout.detailsBox} ≠ ${layout.bodyHeight}`,
    );
    assert.ok(layout.bodyHeight >= MIN_BODY);
  }
});

/**
 * Чем выше окно, тем больше видно данных.
 *
 * Проверяется на высотах, где логотип и измеритель УЖЕ показаны: ниже них
 * список законно ужимается в тот момент, когда включается очередной блок, и
 * это не скачок, а разменянное место.
 */
test("список растёт вместе с окном, когда всё уже на экране", () => {
  // Порог берём из самой раскладки, а не вписываем числом: он сдвинется вместе
  // с высотой логотипа, и прибитый к коду порог тихо перестал бы что-то значить.
  const from = Array.from({ length: 120 }, (_, index) => index + 1).find((height) => {
    const layout = layoutAt(height);
    return layout.showLogo && layout.showMeter;
  });
  assert.ok(from && from <= MIN_ROWS, `всё на экране только с ${from} строк`);

  let previous = 0;
  for (let height = from!; height <= 120; height += 1) {
    const { listHeight, showLogo, showMeter } = layoutAt(height);
    assert.ok(showLogo && showMeter, `окно ${height}: ожидались логотип и измеритель`);
    assert.ok(listHeight >= previous, `окно ${height}: список ужался с ${previous} до ${listHeight}`);
    previous = listHeight;
  }
});

/** Обычный терминал 80×24 обязан работать, в том числе с открытой палитрой. */
test("в окне 80×24 помещается всё, включая строку команд", () => {
  for (const commandOpen of [true, false]) {
    for (const hasLevels of [true, false]) {
      const layout = layoutAt(24, { commandOpen, hasLevels });
      assert.equal(layout.fits, true, `команды=${commandOpen}, уровни=${hasLevels}`);
      assert.ok(layout.totalRows <= 23);
    }
  }
});

/** Граница проходит там, где заявлено, — и объявляется честно. */
test("ниже порога раскладка признаёт, что не помещается", () => {
  assert.equal(layoutAt(MIN_USABLE_ROWS, { commandOpen: false }).fits, true);
  assert.equal(layoutAt(MIN_USABLE_ROWS - 1, { commandOpen: false }).fits, false);
});

/** Палитра ужимается, а не выдавливает список за край экрана. */
test("строка команд подстраивает число подсказок под окно", () => {
  const roomy = layoutAt(MIN_ROWS, { commandOpen: true });
  assert.equal(roomy.commandSuggestions, 8);

  const tight = layoutAt(24, { commandOpen: true });
  assert.ok(tight.commandSuggestions >= 1 && tight.commandSuggestions < 8, `${tight.commandSuggestions}`);

  assert.equal(layoutAt(MIN_ROWS, { commandOpen: false }).commandRows, 0);
});

/** Тесно — отключаем по очереди, а не выдавливаем за экран. */
test("в низком окне сначала пропадает логотип, потом измеритель", () => {
  const withBoth = layoutAt(MIN_ROWS);
  assert.ok(withBoth.showLogo && withBoth.showMeter);

  const tight = layoutAt(22);
  assert.equal(tight.showLogo, false, "логотип уходит первым");

  const tiny = layoutAt(20);
  assert.equal(tiny.showMeter, false, "измеритель уходит вторым");
});

test("без уровней измерителя нет ни при какой высоте", () => {
  for (const height of [24, 44, 80, 120]) {
    assert.equal(layoutAt(height, { hasLevels: false }).showMeter, false);
  }
});

/** Открытая строка команд забирает много места — логотип ей уступает. */
test("строка команд прячет логотип", () => {
  assert.equal(layoutAt(MIN_ROWS, { commandOpen: true }).showLogo, false);
});
