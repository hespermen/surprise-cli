/**
 * Левая колонка: разделы.
 *
 * Разделы и их порядок повторяют навигацию сайта — человек, знающий surprise.fm,
 * не должен заново учить, где что лежит.
 */

import { Box, Text } from "ink";
import React from "react";

import { fit, theme } from "./theme.ts";

export interface SectionItem {
  id: string;
  label: string;
  /** Требует входа: гостю показываем, но помечаем и не даём открыть. */
  needsAuth?: boolean;
  /** Разделительная черта перед пунктом — группирует список. */
  group?: string;
}

export function Sidebar({
  sections,
  activeId,
  selectedIndex,
  focused,
  hasAuth,
  width,
  height,
}: {
  sections: readonly SectionItem[];
  activeId: string;
  selectedIndex: number;
  focused: boolean;
  hasAuth: boolean;
  width: number;
  height: number;
}): React.ReactElement {
  const inner = Math.max(8, width - 4);
  let lastGroup: string | undefined;

  // Прокрутка: разделов больше, чем строк, на низком терминале.
  const from = Math.min(Math.max(0, selectedIndex - Math.floor(height / 2)), Math.max(0, sections.length - height));
  const visible = sections.slice(from, from + height);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.borderActive : theme.border}
      paddingX={1}
      width={width}
    >
      <Text bold color={focused ? theme.accent : theme.muted}>
        Разделы
      </Text>

      {visible.map((section, offset) => {
        const index = from + offset;
        const isActive = section.id === activeId;
        const isSelected = index === selectedIndex;
        const locked = section.needsAuth && !hasAuth;

        const groupChanged = section.group !== undefined && section.group !== lastGroup;
        lastGroup = section.group;

        return (
          <React.Fragment key={section.id}>
            {groupChanged ? (
              <Text color={theme.muted}>{"─".repeat(inner)}</Text>
            ) : null}
            <Text
              color={locked ? theme.muted : isActive ? theme.accent : undefined}
              bold={isActive}
              backgroundColor={isSelected && focused ? theme.selectionBg : undefined}
            >
              {/* Активный раздел помечен слева, выбранный — подсветкой: пока
                  ходишь по списку, видно и где ты, и что открыто. */}
              {isActive ? "▸ " : "  "}
              {fit(section.label + (locked ? " ·" : ""), inner - 2)}
            </Text>
          </React.Fragment>
        );
      })}
    </Box>
  );
}
