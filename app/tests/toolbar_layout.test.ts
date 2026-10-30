import { describe, expect, it } from "vitest";
import { applyToolbarColumns } from "../src/ui/toolbarLayout";

/**
 * jsdom не выполняет раскладку, поэтому размеры проставляем вручную через
 * `offsetWidth`/`clientWidth`. Расстояние между колонками задаёт CSS, а в
 * тесте берётся запасной уровень 6 px (как в `.editor-controls.compact`).
 */
function button(width: number, id?: string): HTMLElement {
  const el = document.createElement("button");
  if (id) el.id = id;
  Object.defineProperty(el, "offsetWidth", { configurable: true, value: width });
  return el;
}

function toolbar(clientWidth: number, count = 13): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "editor-controls compact";
  Object.defineProperty(grid, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });
  const groups = [0, 1].map(() => {
    const group = document.createElement("div");
    group.className = "toolbar-group";
    grid.appendChild(group);
    return group;
  });
  for (let i = 0; i < count; i++) {
    const width = i === 4 ? 40 : 30;
    groups[i < 6 ? 0 : 1].appendChild(button(width, `btn${i}`));
  }
  // Скрытая кнопка: в раскладку она не входит, но место в DOM занимает —
  // ровно так же ведут себя кнопки, которые приложение прячет по плану тарифа.
  const hidden = button(30, "btnHidden");
  hidden.style.display = "none";
  groups[0].appendChild(hidden);
  return grid;
}

describe("applyToolbarColumns", () => {
  it("оставляет один ряд, когда кнопки влезают целиком", () => {
    // 6 кнопок по 30 px + widest 40 px: один ряд требует 13*40 + 12*6 = 592 px
    expect(applyToolbarColumns(toolbar(700))).toBe(13);
  });

  it("при сужении кладёт кнопки в два ровных ряда (7 + 6)", () => {
    expect(applyToolbarColumns(toolbar(500))).toBe(7);
  });

  it("при дальнейшем сужении переходит на три ряда (5 + 5 + 3)", () => {
    expect(applyToolbarColumns(toolbar(300))).toBe(5);
  });

  it("пишет выбранное число в --toolbar-cols", () => {
    const grid = toolbar(300);
    applyToolbarColumns(grid);
    expect(grid.style.getPropertyValue("--toolbar-cols")).toBe("5");
  });

  it("не меняет раскладку, пока тулбар не отрендерен", () => {
    const grid = toolbar(0);
    expect(applyToolbarColumns(grid)).toBe(0);
    expect(grid.style.getPropertyValue("--toolbar-cols")).toBe("");
  });

  it("считает колонки по видимым кнопкам, без скрытых", () => {
    // 13 кнопок + одна скрытая: при 592 px хватает ровно одного ряда
    expect(applyToolbarColumns(toolbar(592))).toBe(13);
  });
});
