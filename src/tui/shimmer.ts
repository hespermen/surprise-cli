/**
 * Бегущий блик по логотипу.
 *
 * Вместо статичной радуги — светлая полоса, которая проходит по буквам слева
 * направо и гаснет к краям. Радуга красит каждую колонку своим цветом и стоит
 * на месте: движение в ней только кажущееся, от смены оттенка. Блик же именно
 * ДВИЖЕТСЯ, и глаз читает это как перелив, а не как мигание.
 *
 * Логика вынесена в чистые функции: анимацию удобно проверять числами, а не
 * глазами по скриншоту.
 */

/** Насколько ярко светится колонка: 0 — базовый цвет, 1 — центр блика. */
export function beamIntensity(column: number, beam: number, halfWidth: number): number {
  if (halfWidth <= 0) return 0;
  const distance = Math.abs(column - beam);
  if (distance >= halfWidth) return 0;
  // Косинусная шапка вместо линейной: у линейной виден излом на краях полосы,
  // и блик читается как движущийся прямоугольник.
  return (Math.cos((distance / halfWidth) * Math.PI) + 1) / 2;
}

/**
 * Положение блика для кадра.
 *
 * Полоса выходит за левый край и уходит за правый, поэтому диапазон шире самого
 * логотипа: иначе она появлялась бы и исчезала прямо на буквах.
 *
 * Между проходами — пауза: непрерывно бегающий блик превращается в мельтешение
 * на периферии зрения и мешает читать то, ради чего человек сюда пришёл.
 */
export function beamPosition(frame: number, width: number, halfWidth: number, pauseFrames = 14): number | null {
  const travel = width + halfWidth * 2;
  const cycle = travel + pauseFrames;
  const step = frame % cycle;
  if (step >= travel) return null;
  return step - halfWidth;
}

/**
 * Смешать два цвета.
 *
 * ratio = 0 — первый, 1 — второй. Нужен, чтобы блик не был «включён/выключен»:
 * резкая граница света выглядит как артефакт отрисовки.
 */
export function mixHex(from: string, to: string, ratio: number): string {
  const clamp = Math.min(1, Math.max(0, ratio));
  const parse = (hex: string): [number, number, number] => {
    const value = hex.replace("#", "");
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ];
  };

  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * clamp).toString(16).padStart(2, "0");

  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}
