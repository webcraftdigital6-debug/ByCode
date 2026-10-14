// Вспомогательные функции для валидаторов задач.
import { countNonShadowBlocks } from "../workspaceUtils";
import type { ValidationResult } from "./types";

export function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p"))
    .map((p) => (p.textContent || "").trim())
    .filter((s) => s.length > 0);
}

export function getVisibleOutputLines(): string[] {
  const out = document.getElementById("output") as HTMLDivElement | null;
  return collectPrintedLines(out);
}

export function getVarFieldText(b: any): string {
  try {
    const f = typeof b?.getField === "function" ? b.getField("VAR") : null;
    const t = typeof f?.getText === "function" ? f.getText() : "";
    return String(t || "");
  } catch {
    return "";
  }
}

export function tryGetAssignedNumber(setBlock: any): number | null {
  try {
    const target =
      typeof setBlock?.getInputTargetBlock === "function"
        ? setBlock.getInputTargetBlock("VALUE")
        : null;
    if (!target || (target as any).type !== "math_number") return null;
    const raw =
      typeof (target as any).getFieldValue === "function"
        ? (target as any).getFieldValue("NUM")
        : undefined;
    if (raw === undefined || raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasAncestorOfType(block: any, type: string): boolean {
  let p = typeof block.getParent === "function" ? block.getParent() : null;
  while (p) {
    if ((p as any).type === type) return true;
    p = typeof p.getParent === "function" ? p.getParent() : null;
  }
  return false;
}

/**
 * Проверяет, есть ли внутри блока (в любой вложенности, включая входы-значения)
 * блок указанного типа. Нужен для проверок вида «условие «если» собрано вызовом
 * функции» — там блоки связаны через value-входы, а не через родительские цепочки.
 */
export function containsDescendantOfType(block: any, type: string): boolean {
  const children =
    typeof block?.getChildBlocks === "function" ? (block.getChildBlocks() as any[]) : [];
  for (const child of children) {
    if (!child) continue;
    if ((child as any).type === type) return true;
    if (containsDescendantOfType(child, type)) return true;
  }
  return false;
}

/**
 * Ученик написал программу в панели кода и не собирал блоков: рабочая область
 * пуста. Такие решения проверяются по выводу — см. ok-выражения валидаторов.
 */
export function typedCodeMode(ws: unknown): boolean {
  return countNonShadowBlocks(ws) === 0;
}

/**
 * Верное решение без блоков получает верхнюю шкалу звёзд. «Оптимальность»
 * сборки по блокам в режиме кода оценить нечем, а решение, написанное кодом,
 * не должно быть наказано по сравнению с оптимальной блоковой сборкой.
 */
export function applyCodeModeStars(
  result: ValidationResult,
  ws: unknown
): ValidationResult {
  if (!result.ok || !typedCodeMode(ws)) return result;
  return { ok: true, stars: 3 };
}

/**
 * Форма вывода для режима «код в редакторе», где ответ зависит от чисел,
 * которые выбрал сам ученик: сверять значение не с чем, но строка обязана быть
 * числом без постороннего текста («99», «-3.5», «7,5»), а не «любой строкой с цифрой».
 */
export function printsBareNumber(lines: string[]): boolean {
  return lines.some((l) => /^-?\d+(?:[.,]\d+)?$/.test(l.trim()));
}
