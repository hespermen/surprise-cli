/**
 * Строка подсказок под плеером.
 *
 * Подсказки отбрасываются ЦЕЛИКОМ, а не режутся по месту. Обрезание по ширине
 * давало «q — вых…»: последняя подсказка превращалась в обрывок, причём именно
 * та, без которой из программы не выйти. Лучше показать шесть подсказок
 * полностью, чем семь, из которых последняя нечитаема.
 */

import { t, type MessageKey } from "./i18n.ts";
import { fit } from "./theme.ts";

const SEPARATOR = " · ";

/**
 * Порядок показа — привычный, порядок важности — отдельный.
 *
 * Первыми уходят перемещение и избранное: о них догадываются сами или узнают
 * из помощи. Последними — помощь и выход: это две двери, через которые человек
 * попадает ко всему остальному и уходит, когда надоело. Остаться без них в
 * узком окне значит остаться запертым.
 */
const HINTS: ReadonlyArray<{ key: MessageKey; weight: number }> = [
  { key: "key.commands", weight: 3 },
  { key: "key.panels", weight: 6 },
  { key: "key.list", weight: 5 },
  { key: "key.play", weight: 4 },
  { key: "key.favourite", weight: 7 },
  { key: "key.help", weight: 2 },
  { key: "key.quit", weight: 1 },
];

/** Подсказки, помещающиеся в ширину, в привычном порядке. */
export function hintBar(width: number): string {
  if (width <= 0) return "";

  const kept = HINTS.map((hint, index) => ({ ...hint, index, text: t(hint.key) }));

  // Убираем по одной, начиная с наименее важной, пока строка не поместится.
  while (kept.length > 1 && joined(kept).length > width) {
    let weakest = 0;
    for (let i = 1; i < kept.length; i += 1) {
      if (kept[i]!.weight > kept[weakest]!.weight) weakest = i;
    }
    kept.splice(weakest, 1);
  }

  // Одна-единственная подсказка шире окна — только здесь обрезаем по месту:
  // выбора уже нет, а пустая строка сообщила бы ещё меньше.
  return fit(joined(kept), width);
}

function joined(hints: ReadonlyArray<{ index: number; text: string }>): string {
  return [...hints]
    .sort((left, right) => left.index - right.index)
    .map((hint) => hint.text)
    .join(SEPARATOR);
}
