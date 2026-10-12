// Задачи группы «lists»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateListForEach(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expectedList = [1, 2, 3, 4, 5];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expectedList.length; start++) {
      let ok = true;
      for (let i = 0; i < expectedList.length; i++) {
        if (numericLines[start + i] !== expectedList[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  const hasSum = lines.some((l) => /(^|\b)15(\b|$)/.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;
  let hasPrint = false;

  let usedMathChange = false;
  let usedArithmetic = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = hasSequence && hasSum && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedForEach && usedListCreate && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 16) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSublistForEach(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = [3, 4, 5, 6, 7];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let ok = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  let usedListCreate = false;
  let usedGetSublist = false;
  let usedForEach = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "lists_getSublist") usedGetSublist = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = hasSequence && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedListCreate && usedGetSublist && usedForEach;
    if (usedCore && count <= 16) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEven(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = [2, 4, 6, 8, 10];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let ok = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  const hasSum = lines.some((l) => /(^|\b)30(\b|$)/.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;

  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;
  let hasPrint = false;

  let usedMathChange = false;
  let usedArithmetic = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasSequence && hasSum && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedListCreate &&
      usedForEach &&
      usedIf &&
      usedEvenCheck &&
      (usedMathChange || usedArithmetic);
    if (usedCore && count <= 20) stars = 3;
    else if (count <= 28) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenMinMax(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isFinite(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = [2, 4, 6, 8, 10];
  const hasSequence = (() => {
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let ok = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  })();

  const hasMin = lines.some((l) => /(^|\b)(min|минимум|мин)\s*[:=]?\s*2(\b|$)/i.test(l));
  const hasMax = lines.some((l) => /(^|\b)(max|максимум|макс)\s*[:=]?\s*10(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;
  let usedMathOnList = false;
  let usedMin = false;
  let usedMax = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
    if (t === "math_on_list") {
      usedMathOnList = true;
      const mode =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP") || (b as any).getFieldValue("MODE")
          : undefined;
      if (String(mode).toUpperCase().includes("MIN")) usedMin = true;
      if (String(mode).toUpperCase().includes("MAX")) usedMax = true;
    }
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasSequence && hasMin && hasMax && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedForEach && usedIf && usedEvenCheck && usedMathOnList;
    if (usedCore && count <= 28) stars = 3;
    else if (count <= 40) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenAvg(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasCount = lines.some((l) => /(^|\b)count\s*[:=]?\s*5(\b|$)/i.test(l));
  const hasSum = lines.some((l) => /(^|\b)sum\s*[:=]?\s*30(\b|$)/i.test(l));
  const hasAvg = lines.some((l) => /(^|\b)avg\s*[:=]?\s*6(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;

  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;
  let hasSetCount = false;
  let hasGetCount = false;
  let hasSetAvg = false;
  let hasGetAvg = false;

  let hasPrint = false;
  let usedMathChange = false;
  let usedArithmetic = false;
  let usedDivide = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;
    if (t === "variables_set" && (v === "count" || v === "cnt")) hasSetCount = true;
    if (t === "variables_get" && (v === "count" || v === "cnt")) hasGetCount = true;
    if (t === "variables_set" && (v === "avg" || v === "average" || v === "mean")) hasSetAvg = true;
    if (t === "variables_get" && (v === "avg" || v === "average" || v === "mean")) hasGetAvg = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") {
      usedArithmetic = true;
      const op =
        typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("OP") : undefined;
      if (String(op).toUpperCase().includes("DIVIDE")) usedDivide = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasCount && hasSum && hasAvg && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedForEach && usedIf && usedEvenCheck && usedDivide && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 26) stars = 3;
    else if (count <= 36) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListFilterEvenMedian(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasCount = lines.some((l) => /(^|\b)count\s*[:=]?\s*5(\b|$)/i.test(l));
  const hasMedian = lines.some((l) => /(^|\b)(median|медиана)\s*[:=]?\s*6(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedForEach = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;
  let usedLength = false;
  let usedGetIndex = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_forEach") usedForEach = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }
    if (t === "lists_length") usedLength = true;
    if (t === "lists_getIndex") usedGetIndex = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasCount && hasMedian && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedForEach && usedIf && usedEvenCheck && usedLength && usedGetIndex;
    if (usedCore && count <= 32) stars = 3;
    else if (count <= 44) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListSumEvenPositions(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasSum = lines.some((l) => /(^|\b)sum\s*[:=]?\s*19(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedFor = false;
  let usedIf = false;
  let usedModulo = false;
  let usedCompare = false;
  let usedIsEven = false;
  let usedGetIndex = false;
  let hasPrint = false;

  let hasSetList = false;
  let hasGetList = false;
  let hasSetSum = false;
  let hasGetSum = false;

  let usedMathChange = false;
  let usedArithmetic = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "controls_for") usedFor = true;
    if (t === "controls_if") usedIf = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY") ||
            (b as any).getFieldValue("PROP") ||
            (b as any).getFieldValue("OP")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedIsEven = true;
    }
    if (t === "lists_getIndex") usedGetIndex = true;

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
    if (t === "variables_set" && (v === "sum" || v === "total")) hasSetSum = true;
    if (t === "variables_get" && (v === "sum" || v === "total")) hasGetSum = true;

    if (t === "math_change") usedMathChange = true;
    if (t === "math_arithmetic") usedArithmetic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedEvenCheck = usedIsEven || (usedModulo && usedCompare);

  const ok = hasSum && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedFor && usedIf && usedEvenCheck && usedGetIndex && (usedMathChange || usedArithmetic);
    if (usedCore && count <= 26) stars = 3;
    else if (count <= 38) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateListSortMinMax(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const hasMin = lines.some((l) => /(^|\b)min\s*[:=]?\s*1(\b|$)/i.test(l));
  const hasMax = lines.some((l) => /(^|\b)max\s*[:=]?\s*9(\b|$)/i.test(l));

  let usedListCreate = false;
  let usedSort = false;
  let usedGetIndex = false;
  let hasPrint = false;
  let hasSetList = false;
  let hasGetList = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "lists_create_with") usedListCreate = true;
    if (t === "lists_sort") usedSort = true;
    if (t === "lists_getIndex") usedGetIndex = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    const v = getVarFieldText(b);
    if (t === "variables_set" && (v === "list" || v === "numbers")) hasSetList = true;
    if (t === "variables_get" && (v === "list" || v === "numbers")) hasGetList = true;
  }

  const ok = hasMin && hasMax && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedSort && usedGetIndex;
    if (usedCore && count <= 13) stars = 3;
    else if (count <= 20) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

function listBlockTypes(ws: Blockly.WorkspaceSvg): string[] {
  try {
    return getNonShadowBlocks(ws).map((b) => (b as any).type);
  } catch {
    return [];
  }
}

function listCountOf(types: string[], type: string): number {
  return types.filter((t) => t === type).length;
}

/**
 * Число блоков lists_getIndex с нужным режимом (MODE) и способом
 * позиционирования (WHERE): GET/REMOVE/GET_REMOVE × FIRST/LAST/AT/RANDOM.
 */
function countGetIndexWhere(ws: Blockly.WorkspaceSvg, modes: string[], wheres: string[]): number {
  try {
    return getNonShadowBlocks(ws).filter((b: any) => {
      if (b.type !== "lists_getIndex") return false;
      return (
        modes.includes(String(b.getFieldValue("MODE"))) &&
        wheres.includes(String(b.getFieldValue("WHERE")))
      );
    }).length;
  } catch {
    return 0;
  }
}

/** Число блоков lists_setIndex в нужном режиме: SET (заменить) или INSERT (вставить). */
function countSetIndexModes(ws: Blockly.WorkspaceSvg, modes: string[]): number {
  try {
    return getNonShadowBlocks(ws).filter(
      (b: any) => b.type === "lists_setIndex" && modes.includes(String(b.getFieldValue("MODE")))
    ).length;
  } catch {
    return 0;
  }
}

/** Предметы серии «Магический инвентарь»: вывод не зависит от языка интерфейса. */
const INV_START = ["sword", "shield", "potion"];
const INV_SMITH = ["rusty dagger", "wooden shield"];
const INV_CHEST = ["gold coin", "map"];
const INV_TRADE = ["mana potion", "broken helmet", "lucky amulet"];
const INV_LOOT = ["wolf pelt", "rusty sword", "sharp fang", "healing root"];
const INV_TOOLS = ["hammer", "saw", "chisel"];
const POOL_WEAPONS = ["bow of wind", "fire staff", "titan sword"];
const POOL_ARMORS = ["leather vest", "steel plate", "wizard cloak"];
const POOL_ARTIFACTS = ["dragon ring", "amulet of immortality", "mana sphere"];
const ELIXIR = "elixir of strength";

function outputLinesTrimmed(outputLines: string[]): string[] {
  return outputLines.map((l) => l.trim()).filter(Boolean);
}

async function validateListInventoryIndex(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const reads = countGetIndexWhere(ws, ["GET"], ["FIRST", "LAST", "FROM_START"]);
  const ok =
    listCountOf(types, "lists_create_with") >= 1 &&
    listCountOf(types, "lists_length") >= 1 &&
    reads >= 3 &&
    lines.includes("3") &&
    INV_START.every((item) => lines.includes(item));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 20) stars = 3;
    else if (count <= 26) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListInventoryReplace(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const sets = countSetIndexModes(ws, ["SET"]);
  const reads = countGetIndexWhere(ws, ["GET"], ["FIRST", "LAST", "FROM_START"]);
  const ok =
    listCountOf(types, "lists_create_with") >= 1 &&
    sets >= 1 &&
    reads >= 2 &&
    lines.includes("2") &&
    lines.includes("steel sword") &&
    lines.includes("wooden shield");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 18) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListInventoryAdd(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const ok =
    countSetIndexModes(ws, ["INSERT"]) >= 1 &&
    listCountOf(types, "lists_length") >= 2 &&
    countGetIndexWhere(ws, ["GET"], ["LAST"]) >= 1 &&
    lines.includes("2") &&
    lines.includes("3") &&
    lines.includes("magic scroll");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 18) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListInventoryRemove(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const ok =
    listCountOf(types, "lists_indexOf") >= 1 &&
    countGetIndexWhere(
      ws,
      ["GET_REMOVE", "REMOVE"],
      ["FIRST", "LAST", "FROM_START", "FROM_END", "RANDOM"]
    ) >= 1 &&
    listCountOf(types, "lists_length") >= 1 &&
    lines.includes("broken helmet") &&
    lines.includes("mana potion") &&
    lines.includes("lucky amulet") &&
    lines.includes("2");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 24) stars = 3;
    else if (count <= 32) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListInventoryRandom(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const picks = countGetIndexWhere(ws, ["GET", "GET_REMOVE"], ["RANDOM"]);
  const allFromPool = lines.length >= 5 && lines.every((l) => INV_LOOT.includes(l));
  const ok =
    listCountOf(types, "controls_repeat_ext") >= 1 &&
    picks >= 1 &&
    listCountOf(types, "lists_create_with") >= 1 &&
    allFromPool;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (picks >= 1 && count <= 14) stars = 3;
    else if (count <= 20) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateProjInventory(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const pool = [...POOL_WEAPONS, ...POOL_ARMORS, ...POOL_ARTIFACTS];
  const picks = countGetIndexWhere(ws, ["GET"], ["RANDOM"]);
  const gold = lines
    .map((l) => Number(l))
    .filter((n) => Number.isInteger(n))
    .some((n) => n >= 50 && n <= 200);
  const itemLines = lines.filter((l) => pool.includes(l)).length;

  const structural =
    listCountOf(types, "lists_create_with") >= 4 &&
    picks >= 4 &&
    countSetIndexModes(ws, ["INSERT"]) >= 1 &&
    countSetIndexModes(ws, ["SET"]) >= 1 &&
    listCountOf(types, "lists_length") >= 1 &&
    listCountOf(types, "math_random_int") >= 1;

  const ok = structural && gold && itemLines >= 3 && lines.includes(ELIXIR) && lines.includes("4");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 60) stars = 3;
    else if (count <= 76) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListSplitJoin(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = listBlockTypes(ws);
  const ok =
    listCountOf(types, "lists_split") >= 2 &&
    listCountOf(types, "controls_forEach") >= 1 &&
    outputLines.includes("10") &&
    outputLines.includes("20") &&
    outputLines.includes("30") &&
    outputLines.includes("10-20-30");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 10)
      stars = 3; // список в переменной + цикл + обратная склейка
    else if (count <= 14) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListOperations(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = listBlockTypes(ws);
  const ok =
    listCountOf(types, "lists_reverse") >= 1 &&
    listCountOf(types, "lists_repeat") >= 1 &&
    listCountOf(types, "lists_length") >= 1 &&
    listCountOf(types, "lists_indexOf") >= 1 &&
    outputLines.includes("3") &&
    outputLines.includes("2") &&
    outputLines.includes("1") &&
    outputLines.includes("5");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 13) stars = 3;
    else if (count <= 17) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

/**
 * Число вложенных обращений к списку: blocks lists_getIndex, в value-вход VALUE
 * которого уже поставлен ещё один lists_getIndex. Так проверяют доступ к ячейке
 * двумерного данных вида «строка → элемент».
 */
function countNestedGetIndex(ws: Blockly.WorkspaceSvg): number {
  try {
    return getNonShadowBlocks(ws).filter((b: any) => {
      if (b.type !== "lists_getIndex") return false;
      const inner =
        typeof b.getInputTargetBlock === "function" ? b.getInputTargetBlock("VALUE") : null;
      return !!inner && (inner as any).type === "lists_getIndex";
    }).length;
  } catch {
    return 0;
  }
}

async function validateListUntilEmpty(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const pops = countGetIndexWhere(ws, ["GET_REMOVE"], ["FIRST", "FROM_START"]);
  const takes = countGetIndexWhere(ws, ["REMOVE"], ["FIRST", "FROM_START", "LAST"]);
  const outputOk =
    lines.length === INV_TOOLS.length && INV_TOOLS.every((item, i) => lines[i] === item);

  const ok =
    outputOk &&
    listCountOf(types, "controls_whileUntil") >= 1 &&
    listCountOf(types, "lists_isEmpty") >= 1 &&
    pops + takes >= 1;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (pops >= 1 && count <= 12) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateListGrid(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLinesTrimmed(outputLines);
  const types = listBlockTypes(ws);
  const builds = listCountOf(types, "lists_create_with");
  const reads = listCountOf(types, "lists_getIndex");
  const nested = countNestedGetIndex(ws);
  const outputOk = lines.length === 3 && lines[0] === "E" && lines[1] === "C" && lines[2] === "G";

  const ok = outputOk && builds >= 4 && reads >= 6 && nested >= 3;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 24) stars = 3;
    else if (count <= 34) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const listsTasks: Pick<
  TaskRegistry,
  | "list_inventory_index"
  | "list_inventory_replace"
  | "list_inventory_add"
  | "list_inventory_remove"
  | "list_inventory_random"
  | "proj_inventory"
  | "list_foreach"
  | "sublist_foreach"
  | "list_filter_even"
  | "list_filter_even_min_max"
  | "list_filter_even_avg"
  | "list_filter_even_median"
  | "list_sum_even_positions"
  | "list_sort_min_max"
  | "list_split_join"
  | "list_operations"
  | "list_until_empty"
  | "list_grid"
> = {
  list_foreach: {
    id: "list_foreach",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 29: Список и цикл forEach" : "Task 29: List and forEach",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и сохраните его в переменную <strong>list</strong> (можно <strong>numbers</strong>).<br><br>Затем используйте блок из Циклы <strong>«для каждого элемента i в списке»</strong> — это и есть <strong>forEach</strong>. Внутри цикла:<br>1) выведите текущий элемент (каждый с новой строки)<br>2) посчитайте сумму элементов в переменной <strong>sum</strong> и выведите сумму после цикла (должно получиться <strong>15</strong>).<br><br><strong>Важно:</strong> список может хранить не только числа, но и текст (строки), а иногда даже смешанные значения. А цикл <strong>forEach</strong> удобен именно для <strong>перебора элементов списка</strong>: он «идёт по списку» и даёт вам текущий элемент, в отличие от циклов <strong>for</strong> со счётчиком (когда вы управляете индексами/границами вручную) или <strong>while</strong> (когда повторяем, пока условие истинно)."
        : "Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and store it in <strong>list</strong> (or <strong>numbers</strong>).<br><br>Then use the Loops block <strong>“for each item i in list”</strong> — this is the <strong>forEach</strong> idea. Inside the loop:<br>1) print the current item (one per line)<br>2) compute the sum in <strong>sum</strong> and print the final sum after the loop (it should be <strong>15</strong>).<br><br><strong>Note:</strong> a list can store not only numbers but also text (strings), and sometimes even mixed values. The <strong>forEach</strong> loop is great specifically for <strong>iterating over list elements</strong>: it walks through the list and gives you the current item, unlike a counter-based <strong>for</strong> (where you manage indexes/bounds) or <strong>while</strong> (repeat while a condition is true).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5» (блок из «Списки»).\n2. Создайте переменную sum = 0.\n3. В «Циклы» возьмите «для каждого элемента i в списке …».\n4. В поле списка вложите переменную list.\n5. Внутри цикла: «Вывести … цвет …» с i и «увеличить sum на i».\n6. После цикла выведите sum — должно получиться 15."
        : "Step by step:\n1. Create a variable list and assign “create list with 1 2 3 4 5” (a Lists block) to it.\n2. Create variable sum = 0.\n3. Take “for each item i in list …” from Loops.\n4. Put variable list into the list slot.\n5. Inside the loop: “Print … color …” with i, and “change sum by i”.\n6. After the loop print sum — it should be 15.",
    validate: validateListForEach,
  },
  sublist_foreach: {
    id: "sublist_foreach",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 30: Подсписок и forEach" : "Task 30: Sublist and forEach",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем возьмите из него <strong>подсписок</strong> с элементами <strong>3, 4, 5, 6, 7</strong> (то есть часть списка) и сохраните в переменную <strong>sub</strong>.<br><br>Используйте блок <strong>«для каждого элемента i в списке»</strong> (Циклы), чтобы вывести элементы подсписка <strong>sub</strong> по одному (каждый с новой строки)."
        : "Create a list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Then take a <strong>sublist</strong> containing <strong>3, 4, 5, 6, 7</strong> (a part of the list) and store it in <strong>sub</strong>.<br><br>Use the <strong>“for each item i in list”</strong> block (Loops) to print items of <strong>sub</strong> one per line.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5 6 7 8 9 10» (блок из «Списки»).\n2. Возьмите блок «взять подсписок с № … по № …» из «Списки» — укажите с 3 по 7, а в поле списка вложите переменную list.\n3. Присвойте результат переменной sub.\n4. Возьмите «для каждого элемента i в списке …» из «Циклы», в поле списка вложите переменную sub.\n5. Внутри цикла выводите i через «Вывести … цвет …» — появятся 3 4 5 6 7."
        : "Step by step:\n1. Create a variable list and assign “create list with 1 2 3 4 5 6 7 8 9 10” (a Lists block) to it.\n2. Take the “get sub-list from # … to # …” block from Lists — set 3 to 7, and put list into the list slot.\n3. Assign the result to variable sub.\n4. Take “for each item i in list …” from Loops, put variable sub into the list slot.\n5. Inside the loop print i with “Print … color …” — you get 3 4 5 6 7.",
    validate: validateSublistForEach,
  },
  list_filter_even: {
    id: "list_filter_even",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 31: Фильтрация списка" : "Task 31: List filtering"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем используйте блок из Циклы <strong>«для каждого элемента i в списке»</strong>, чтобы перебрать элементы. Внутри цикла с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа и:<br>1) выведите каждое чётное число (каждое с новой строки)<br>2) посчитайте сумму чётных чисел в переменной <strong>sum</strong><br><br>После цикла выведите сумму. Должны получиться числа: <strong>2 4 6 8 10</strong> и сумма <strong>30</strong>."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Then use the Loops block <strong>“for each item i in list”</strong> to iterate. Inside the loop, use an <strong>if</strong> to keep only <strong>even</strong> numbers and:<br>1) print each even number (one per line)<br>2) compute the sum of even numbers in <strong>sum</strong><br><br>After the loop, print the sum. You should get: <strong>2 4 6 8 10</strong> and the sum <strong>30</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5 6 7 8 9 10», создайте sum = 0.\n2. Возьмите «для каждого элемента i в списке …» из «Циклы», в список вложите переменную list.\n3. Внутри цикла: блок «если» из «Логика».\n4. Условие чётности: «остаток от i ÷ 2» (Математика) равен 0 (Логика) — или блок «чётное?» из Математики.\n5. В ветку «если»: «Вывести … цвет …» с i и «увеличить sum на i».\n6. После цикла выведите sum — получится 30."
        : "Step by step:\n1. Create a variable list with “create list with 1 2 3 4 5 6 7 8 9 10”, and sum = 0.\n2. Take “for each item i in list …” from Loops, put variable list into it.\n3. Inside the loop: an “if” block from Logic.\n4. Even check: “remainder of i ÷ 2” (Math) equals 0 (Logic) — or the “is even” block from Math.\n5. In the if branch: “Print … color …” with i, and “change sum by i”.\n6. After the loop print sum — it becomes 30.",
    validate: validateListFilterEven,
  },
  list_filter_even_min_max: {
    id: "list_filter_even_min_max",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 32: Min/Max среди чётных" : "Task 32: Min/Max among evens",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента i в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Чётные числа добавляйте в новый список <strong>evens</strong> и выводите каждое чётное число (каждое с новой строки).<br><br>После цикла найдите и выведите:<br>— <strong>min=2</strong> (минимум среди чётных)<br>— <strong>max=10</strong> (максимум среди чётных)<br><br>Подсказка: используйте блок <strong>Математика → «сумма списка»</strong> и в выпадающем списке выберите MIN/MAX для списка evens."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate using <strong>“for each item i in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. Add even numbers to a new list <strong>evens</strong> and print each even number (one per line).<br><br>After the loop, find and print:<br>— <strong>min=2</strong> (minimum among evens)<br>— <strong>max=10</strong> (maximum among evens)<br><br>Hint: use <strong>Math → “math on list”</strong> with MIN/MAX on the evens list.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list со списком 1..10 и пустой список evens: «создать список из» (Списки) без элементов.\n2. «для каждого элемента i в списке …» по переменной list.\n3. Внутри: «если» с проверкой чётности i (остаток от i ÷ 2 равен 0 или «чётное?»).\n4. В ветку «если»: выведите i и блок «вставить в конец»: возьмите его из «Списки» (блок «вставить в …»), в поле списка — evens, а значением — i.\n5. После цикла: из «Математика» возьмите «сумма списка», в выпадающем списке выберите «наименьшее в списке», вложите evens и выведите как min=2.\n6. Вторым блоком выберите «наибольшее в списке» и выведите как max=10."
        : "Step by step:\n1. Create a variable list with 1..10 and an empty list evens: use “create list with” (Lists) with no items.\n2. “for each item i in list …” over the list variable.\n3. Inside: an “if” with the even check for i (remainder of i ÷ 2 equals 0 or “is even”).\n4. In the if branch: print i and add i to the end of evens (Lists → insert block, list slot = evens, value = i).\n5. After the loop: take “math on list” from Math, pick “minimum of list” in the dropdown, put evens in, and print it as min=2.\n6. Second block: pick “maximum of list” and print it as max=10.",
    validate: validateListFilterEvenMinMax,
  },
  list_filter_even_avg: {
    id: "list_filter_even_avg",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 34: Количество и среднее" : "Task 34: Count and average",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента i в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Для чётных чисел нужно посчитать:<br>— <strong>sum</strong> (сумма чётных)<br>— <strong>count</strong> (сколько чётных чисел)<br>— <strong>avg</strong> (среднее): <code>avg = sum / count</code><br><br>Выведите результат тремя строками:<br><strong>count=5</strong><br><strong>sum=30</strong><br><strong>avg=6</strong>"
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate using <strong>“for each item i in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. For even numbers compute:<br>— <strong>sum</strong> (sum of evens)<br>— <strong>count</strong> (how many evens)<br>— <strong>avg</strong> (average): <code>avg = sum / count</code><br><br>Print three lines:<br><strong>count=5</strong><br><strong>sum=30</strong><br><strong>avg=6</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list со списком 1..10, переменные sum = 0 и count = 0.\n2. «для каждого элемента i в списке …» по переменной list.\n3. Внутри: «если» с проверкой чётности i (остаток от i ÷ 2 равен 0).\n4. В ветку «если»: «увеличить sum на i» и «увеличить count на 1».\n5. После цикла: переменная avg = sum ÷ count (блок «+ − × ÷» из «Математика», операция ÷).\n6. Выведите три строки: «Вывести … цвет …» с результатами count=5, sum=30, avg=6."
        : "Step by step:\n1. Create a variable list with 1..10, and variables sum = 0, count = 0.\n2. “for each item i in list …” over the list variable.\n3. Inside: an “if” with the even check for i (remainder of i ÷ 2 equals 0).\n4. In the if branch: “change sum by i” and “change count by 1”.\n5. After the loop: variable avg = sum ÷ count (a “+ − × ÷” block from Math with ÷).\n6. Print three lines with “Print … color …”: count=5, sum=30, avg=6.",
    validate: validateListFilterEvenAvg,
  },
  list_filter_even_median: {
    id: "list_filter_even_median",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 35: Средний элемент чётных" : "Task 35: Middle even element",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Затем переберите список блоком <strong>«для каждого элемента i в списке»</strong> и с помощью <strong>если/иначе</strong> отберите только <strong>чётные</strong> числа. Чётные числа добавляйте в новый список <strong>evens</strong>.<br><br>После цикла выведите 2 строки:<br><strong>count=5</strong> (сколько чётных чисел в evens)<br><strong>median=6</strong> (средний элемент списка evens — для 5 элементов это 3‑й)."
        : "Create the list <code>[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]</code> and store it in <strong>list</strong>.<br><br>Iterate with <strong>“for each item i in list”</strong> and use an <strong>if</strong> to keep only <strong>even</strong> numbers. Add evens into a new list <strong>evens</strong>.<br><br>After the loop print 2 lines:<br><strong>count=5</strong> (how many evens in evens)<br><strong>median=6</strong> (the middle element of evens — for 5 elements it's the 3rd).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list со списком 1..10 и пустой список evens («создать список из» без элементов).\n2. «для каждого элемента i в списке …» по переменной list.\n3. Внутри: «если» с проверкой чётности i.\n4. В ветку «если»: вставьте i в конец evens (Списки → «вставить в» с полем evens и значением i).\n5. После цикла: count — блок «длина evens» (Списки). Выведите count=5.\n6. Средний элемент: блок «взять № …» (Списки) с индексом 3 в evens — это 6. Выведите median=6."
        : "Step by step:\n1. Create a variable list with 1..10 and an empty list evens (“create list with” with no items).\n2. “for each item i in list …” over the list variable.\n3. Inside: an “if” with the even check for i.\n4. In the if branch: insert i at the end of evens (Lists → “insert into” with evens and value i).\n5. After the loop: count — the “length of evens” block (Lists). Print count=5.\n6. Middle element: “get item # …” (Lists) with index 3 in evens — that is 6. Print median=6.",
    validate: validateListFilterEvenMedian,
  },
  list_sum_even_positions: {
    id: "list_sum_even_positions",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 36: Сумма на чётных позициях" : "Task 36: Sum at even positions",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[10, 1, 8, 2, 7, 3, 6, 4, 5, 9]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Посчитайте сумму элементов на <strong>чётных позициях</strong> (позиции считаем как 1‑я, 2‑я, 3‑я…). То есть нужно сложить элементы на позициях <strong>2, 4, 6, 8, 10</strong>.<br><br>Выведите результат строкой: <strong>sum=19</strong>"
        : "Create the list <code>[10, 1, 8, 2, 7, 3, 6, 4, 5, 9]</code> and store it in <strong>list</strong>.<br><br>Compute the sum of elements at <strong>even positions</strong> (positions are 1st, 2nd, 3rd…). That means add elements at positions <strong>2, 4, 6, 8, 10</strong>.<br><br>Print: <strong>sum=19</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 10 1 8 2 7 3 6 4 5 9», создайте sum = 0.\n2. Возьмите «цикл по i от … до … с шагом …» из «Циклы» (от 1 до 10, шаг 1).\n3. Внутри: «если» с проверкой «i чётное» (блок «остаток от i ÷ 2» из «Математика» равен 0 из «Логика» или блок «чётное?»).\n4. В ветку «если»: возьмите элемент — «№ …» (Списки) с номером i в списке list, и прибавьте к sum («увеличить sum на …»).\n5. После цикла выведите «Вывести … цвет …» результат — получится sum=19."
        : "Step by step:\n1. Create a variable list with “create list with 10 1 8 2 7 3 6 4 5 9”, and sum = 0.\n2. Take “count with i from … to … by …” from Loops (1 to 10, step 1).\n3. Inside: an “if” checking “i is even” (remainder of i ÷ 2 from Math equals 0 from Logic, or the “is even” block).\n4. In the if branch: get the element — “item # …” (Lists) with number i in list, and add it to sum (“change sum by …”).\n5. After the loop print the result with “Print … color …” — it becomes sum=19.",
    validate: validateListSumEvenPositions,
  },
  list_sort_min_max: {
    id: "list_sort_min_max",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 33: Сортировка списка" : "Task 33: List sorting"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[9, 3, 7, 1, 5]</code> и сохраните его в переменную <strong>list</strong>.<br><br>Отсортируйте список блоком <strong>«сортировать числовая по возрастанию»</strong>. После сортировки выведите две строки:<br><strong>min=1</strong><br><strong>max=9</strong>.<br><br><strong>Что значит слово sort:</strong> <code>sort</code> переводится как «сортировать». В программировании это значит «упорядочить элементы по правилу». Для сортировки по возрастанию список <code>[9, 3, 7, 1, 5]</code> превращается в <code>[1, 3, 5, 7, 9]</code>."
        : "Create the list <code>[9, 3, 7, 1, 5]</code> and store it in <strong>list</strong>.<br><br>Sort it using the block <strong>“sort numeric ascending”</strong>. After sorting, print two lines:<br><strong>min=1</strong><br><strong>max=9</strong>.<br><br><strong>What sort means:</strong> <code>sort</code> means “to order items by a rule”. With ascending order, <code>[9, 3, 7, 1, 5]</code> becomes <code>[1, 3, 5, 7, 9]</code>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 9 3 7 1 5» (блок из «Списки»).\n2. В «Списки» возьмите блок «сортировать числовая по возрастанию», в его поле вложите переменную list, результат присвойте переменной sorted.\n3. В «Списки» возьмите блок «№ …» (взять элемент), в поле списка — sorted, номер 1. Это min.\n4. Для max в том же блоке выберите «№ с конца» и укажите 1 — это 9.\n5. Выведите две строки через «Вывести … цвет …»: min=1 и max=9."
        : "Step by step:\n1. Create a variable list with “create list with 9 3 7 1 5” (a Lists block).\n2. In Lists take “sort numeric ascending”, put variable list inside, and assign the result to variable sorted.\n3. Take “get item # 1” (Lists) with sorted as the list — that's min.\n4. For max use “get item # 1 from end” on sorted.\n5. Print two lines with “Print … color …”: min=1 and max=9.",
    infoTopics: ["sorting"],
    validate: validateListSortMinMax,
  },
  list_split_join: {
    id: "list_split_join",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 51: Разделить и склеить" : "Task 51: Split and Join"),
    description: (lang) =>
      lang === "ru"
        ? `Одна строка может хранить несколько значений — их разделяют запятыми (так устроены CSV-файлы и таблицы). Научитесь превращать текст в список и обратно.<br><br>1. Создайте переменную <strong>parts</strong> и присвойте её результат блока <strong>«сделать список из текста … с разделителем …»</strong>: текст — <code>10,20,30</code>, разделитель — <code>,</code><br>2. Блоком <strong>«для каждого элемента … в …»</strong> пройдите по списку parts и напечатайте каждый элемент — получится три строки: <strong>10</strong>, <strong>20</strong>, <strong>30</strong>.<br>3. Тем же блоком, но в режиме <strong>«собрать текст из списка …»</strong> со разделителем <code>-</code>, напечатайте четвёртую строку: <strong>10-20-30</strong>.<br><br>Слово <strong>split</strong> значит «разделять», <strong>join</strong> — «соединять». После разделения элементы — это ТЕКСТ, даже если выглядят как числа: «10» + 1 даст «101», а не 11.<br><br>★★★ — список создан один раз и лежит в переменной, его используют и для цикла, и для склейки.`
        : `One line of text can hold several values, separated by commas (that is how CSV files and spreadsheets work). Learn to turn text into a list and back.<br><br>1. Create a variable <strong>parts</strong> and set it to the result of the <strong>“make list from text … with delimiter …”</strong> block: text <code>10,20,30</code>, delimiter <code>,</code><br>2. Use <strong>“for each item … in …”</strong> to walk the list parts and print every item — three lines: <strong>10</strong>, <strong>20</strong>, <strong>30</strong>.<br>3. With the same block in mode <strong>“make text from list …”</strong> and the delimiter <code>-</code>, print a fourth line: <strong>10-20-30</strong>.<br><br><strong>Split</strong> means “cut apart”, <strong>join</strong> means “connect”. After splitting the items are TEXT even when they look like numbers: “10” + 1 gives “101”, not 11.<br><br>★★★ — the list is built once, kept in a variable, and reused for both the loop and the join.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную parts («Переменные») и блок «присвоить parts …».\n2. Из «Списки» возьмите «сделать список из текста … с разделителем …»: в первое поле — текст 10,20,30, во второе — запятая. Вложите его в «присвоить».\n3. Из «Циклы» возьмите «для каждого element … в …», а в поле списка поставьте переменную parts (создайте её через меню «Создать переменную» или из категории «Переменные»).\n4. Внутрь цикла положите «Вывести … цвет …» с переменной element. Запустите: три строки 10, 20, 30.\n5. Для четвёртой строки возьмите ещё один блок «сделать список из текста …», переключите его выпадающий список в режим «собрать текст из списка …», в поле списка — переменная parts, разделитель — дефис. Вложите в «Вывести … цвет …».\n6. Проверьте вывод: 10, 20, 30, 10-20-30 — и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable parts (Variables) and a “set parts to …” block.\n2. From Lists take “make list from text … with delimiter …”: put the text 10,20,30 in the first field and a comma in the second. Drop it into the “set” block.\n3. From Loops take “for each element … in …” and put the variable parts into its list field (create the loop variable in the same dropdown).\n4. Inside the loop place “Print … color …” with the loop variable. Run: three lines 10, 20, 30.\n5. For the fourth line take another “make list from text …” block, switch its dropdown to “make text from list …”, put variable parts in the list field and a hyphen as the delimiter. Wrap it in “Print … color …”.\n6. Check the output: 10, 20, 30, 10-20-30 — then press “Check solution”.`,
    infoTopics: ["split_join"],
    validate: validateListSplitJoin,
  },
  list_operations: {
    id: "list_operations",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 52: Переворот, повтор и позиция"
        : "Task 52: Reverse, Repeat and Position",
    description: (lang) =>
      lang === "ru"
        ? `Список можно развернуть, собрать из одного элемента и обыскать. Напечатайте пять строк:<br><br>1) элементы списка <code>[1, 2, 3]</code> <strong>в обратном порядке</strong>, по одному на строку → <strong>3</strong>, <strong>2</strong>, <strong>1</strong> (блок «изменить порядок на обратный …» + «для каждого элемента …»);<br>2) <strong>длина</strong> списка, который блок «создать список из элемента …, повторяющегося … раз» собрал из текста <code>ха</code> и числа <strong>5</strong> → <strong>5</strong>;<br>3) <strong>позиция</strong> числа 2 в списке <code>[1, 2, 3]</code> — блок «в списке … найти первое вхождение элемента …» → <strong>2</strong>.<br><br>Блоки — в категории «Списки». И переворот, и «повторить» создают <strong>новый</strong> список: исходный остаётся целым.<br><br><strong>Про позиции:</strong> Blockly считает с 1 (первый элемент — это 1), а если элемента нет — возвращает 0. Языки программирования считают с 0. Об этом — раздел «Операции со списками» под заданием.<br><br>★★★ — все три приёма выполнены своими блоками.`
        : `A list can be reversed, built from a single item, and searched. Print five lines:<br><br>1) the items of <code>[1, 2, 3]</code> <strong>in reverse order</strong>, one per line → <strong>3</strong>, <strong>2</strong>, <strong>1</strong> (the “reverse …” block plus “for each item …”);<br>2) the <strong>length</strong> of the list that “create list with item … repeated … times” built from the text <code>ха</code> and the number <strong>5</strong> → <strong>5</strong>;<br>3) the <strong>position</strong> of the number 2 in <code>[1, 2, 3]</code> — the “in list … find first occurrence of item …” block → <strong>2</strong>.<br><br>All these blocks are in the Lists category. Both reverse and repeat build a <strong>new</strong> list, leaving the original intact.<br><br><strong>About positions:</strong> Blockly counts from 1 (the first item is 1) and returns 0 when the item is absent. Programming languages count from 0 — see the “List operations” note below.<br><br>★★★ — all three tricks use their own block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Из «Списки» возьмите «изменить порядок на обратный …» и вложите в него «создать список из …» с элементами 1, 2, 3.\n2. Полученный список поставьте в поле блока «для каждого element … в …» (Циклы), а внутрь цикла положите «Вывести … цвет …» с переменной element. Запустите: 3, 2, 1.\n3. Возьмите «создать список из элемента …, повторяющегося … раз»: элемент — текст ха, количество — 5. Оберните его блоком «длина …» (Списки) и напечатайте: получится 5.\n4. Возьмите «в списке … найти первое вхождение элемента …»: в поле списка — «создать список из 1 2 3», в поле элемента — 2. Напечатайте: получится 2, потому что Blockly считает с 1.\n5. Проверьте вывод: 3, 2, 1, 5, 2 — и нажмите «Проверить решение».`
        : `Step by step:\n1. From Lists take “reverse …” and put a “create list with …” block inside it holding the items 1, 2, 3.\n2. Place that list into the field of a “for each element … in …” block (Loops) and put “Print … color …” with the loop variable inside the loop. Run: 3, 2, 1.\n3. Take “create list with item … repeated … times”: the item is the text ха, the count is 5. Wrap it in “length of …” (Lists) and print it: you get 5.\n4. Take “in list … find first occurrence of item …”: the list field gets “create list with 1 2 3”, the item field gets 2. Print it: you get 2, because Blockly counts from 1.\n5. Check the output: 3, 2, 1, 5, 2 — then press “Check solution”.`,
    infoTopics: ["list_operations"],
    validate: validateListOperations,
  },
  list_inventory_index: {
    id: "list_inventory_index",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 23: Ячейки инвентаря" : "Task 23: Inventory Cells"),
    description: (lang) =>
      lang === "ru"
        ? `Одна переменная хранит одно значение, а список — целую горсть предметов. Создайте переменную <strong>inventory</strong> и присвойте ей блок «создать список из» трёх предметов: <code>sword</code>, <code>shield</code>, <code>potion</code>.<br><br>Напечатайте 4 строки:<br>1) <strong>длина</strong> списка → <strong>3</strong>;<br>2) <strong>первый</strong> элемент → <strong>sword</strong>;<br>3) элемент <strong>№ 2</strong> → <strong>shield</strong>;<br>4) <strong>последний</strong> элемент → <strong>potion</strong>.<br><br><strong>Как считать номера:</strong> Blockly нумерует ячейки с 1, поэтому первый предмет — это № 1. Языки программирования считают с 0, и там тот же предмет стоит под индексом 0. Обратиться к ячейке можно и по номеру, и готовым режимом «первый» / «последний».<br><br>★★★ — длина и три разных обращения к ячейкам.`
        : `One variable holds a single value, while a list holds a whole handful of items. Create the variable <strong>inventory</strong> and set it to the “create list with” block holding three items: <code>sword</code>, <code>shield</code>, <code>potion</code>.<br><br>Print four lines:<br>1) the <strong>length</strong> of the list → <strong>3</strong>;<br>2) the <strong>first</strong> item → <strong>sword</strong>;<br>3) item <strong># 2</strong> → <strong>shield</strong>;<br>4) the <strong>last</strong> item → <strong>potion</strong>.<br><br><strong>How to count:</strong> Blockly numbers the cells from 1, so the first item is #1. Programming languages count from 0 and there the same item sits at index 0. You can address a cell by number or with the ready-made “first” / “last” modes.<br><br>★★★ — the length plus three different ways to read a cell.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную inventory («Переменные» → «Создать переменную») и блок «присвоить inventory …».\n2. В поле значения положите «создать список из» (Списки): добавьте три ячейки и впишите в них тексты sword, shield, potion.\n3. Возьмите «длина …» (Списки), вложите в него переменную inventory и поставьте весь блок в «Вывести … цвет …» → получится 3.\n4. Добавьте ниже блок «в списке … взять …» (Списки): в поле списка — inventory, первый выпадающий список — «взять», второй — «первый». Напечатайте его: sword.\n5. Скопируйте тот же блок, но во втором выпадающем списке выберите «№» и впишите 2 → shield.\n6. Скопируйте его ещё раз: «взять» + «последний» → potion.\n7. Сверьте вывод: 3, sword, shield, potion — и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable inventory (Variables → “Create variable”) and a “set inventory to …” block.\n2. Put the “create list with” block (Lists) into its value slot: add three fields and type the texts sword, shield, potion.\n3. Take “length of …” (Lists), put the inventory variable inside it and wrap the whole thing in “Print … color …” → 3.\n4. Add the “in list … get …” block (Lists) below: list slot = inventory, first dropdown = “get”, second = “first”. Print it: sword.\n5. Copy that block, but choose “item #” in the second dropdown and type 2 → shield.\n6. Copy it once more: “get” + “last” → potion.\n7. Check the output: 3, sword, shield, potion — then press “Check solution”.`,
    infoTopics: ["list_indexing"],
    validate: validateListInventoryIndex,
  },
  list_inventory_replace: {
    id: "list_inventory_replace",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 24: Модернизация оружия" : "Task 24: Upgrading the Weapon",
    description: (lang) =>
      lang === "ru"
        ? `Кузнец меняет старый клинок на новый. Создайте переменную <strong>inventory</strong> со списком <code>rusty dagger</code>, <code>wooden shield</code>.<br><br>Замените <strong>первый</strong> элемент на текст <code>steel sword</code> блоком <strong>«в списке … присвоить … = …»</strong>: режим «присвоить», позиция «№ 1».<br><br>Затем напечатайте 3 строки:<br>1) <strong>длина</strong> списка → <strong>2</strong>;<br>2) элемент <strong>№ 1</strong> → <strong>steel sword</strong>;<br>3) элемент <strong>№ 2</strong> → <strong>wooden shield</strong>.<br><br><strong>Замена или вставка?</strong> «присвоить» переписывает значение уже существующей ячейки — длина не меняется. «вставить в» добавляет новый элемент и делает список длиннее. Это два режима одного и того же блока.<br><br>★★★ — замена сделана блоком «присвоить», а не пересозданием списка.`
        : `The blacksmith swaps the old blade for a new one. Create the variable <strong>inventory</strong> holding <code>rusty dagger</code>, <code>wooden shield</code>.<br><br>Replace the <strong>first</strong> item with the text <code>steel sword</code> using the <strong>“in list … set item … = …”</strong> block: mode “set”, position “# 1”.<br><br>Then print three lines:<br>1) the <strong>length</strong> of the list → <strong>2</strong>;<br>2) item <strong># 1</strong> → <strong>steel sword</strong>;<br>3) item <strong># 2</strong> → <strong>wooden shield</strong>.<br><br><strong>Replace or insert?</strong> “set” rewrites the value of an existing cell — the length stays the same. “insert at” adds a new item and makes the list longer. Both are modes of the same block.<br><br>★★★ — the replacement uses the “set” block instead of rebuilding the list.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную inventory и присвойте ей «создать список из» двух текстов: rusty dagger, wooden shield.\n2. Из «Списки» возьмите «в списке … присвоить … = …». В поле списка — переменная inventory.\n3. Первый выпадающий список оставьте в режиме «присвоить», во втором выберите «№» и впишите 1.\n4. В поле «=» поставьте текст steel sword. Это команда, она ничего не печатает — просто стоит в ряду блоков.\n5. Напечатайте три строки блоками «Вывести … цвет …»: «длина …» (получится 2), «взять № 1» (steel sword) и «взять № 2» (wooden shield).\n6. Сверьте вывод: 2, steel sword, wooden shield — и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable inventory and set it to “create list with” two texts: rusty dagger, wooden shield.\n2. From Lists take “in list … set item … = …”. The list slot holds the inventory variable.\n3. Keep the first dropdown on “set”, choose “item #” in the second one and type 1.\n4. Put the text steel sword into the “=” slot. This block is a command: it prints nothing, it just sits in the stack of blocks.\n5. Print three lines with “Print … color …”: “length of …” (2), “get item # 1” (steel sword) and “get item # 2” (wooden shield).\n6. Check the output: 2, steel sword, wooden shield — then press “Check solution”.`,
    infoTopics: ["list_indexing", "list_add_remove"],
    validate: validateListInventoryReplace,
  },
  list_inventory_add: {
    id: "list_inventory_add",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 25: Находка в сундуке" : "Task 25: Find in the Chest",
    description: (lang) =>
      lang === "ru"
        ? `Герой находит сундук — предметов становится больше. Создайте переменную <strong>inventory</strong> со списком <code>gold coin</code>, <code>map</code>.<br><br>1) Напечатайте <strong>длину</strong> списка до находки → <strong>2</strong>.<br>2) Добавьте в <strong>конец</strong> списка текст <code>magic scroll</code> блоком <strong>«в списке … вставить в … = …»</strong>: режим «вставить в», позиция «последний».<br>3) Напечатайте <strong>длину</strong> после находки → <strong>3</strong>.<br>4) Напечатайте <strong>последний</strong> элемент → <strong>magic scroll</strong>.<br><br>Длина печатается двумя разными блоками «длина …»: первый считает два предмета, второй — уже три.<br><br><strong>Что важно знать:</strong> добавление в конец не трогает существующие ячейки, поэтому gold coin остаётся под № 1. Так работает append в любом языке: список растёт, а старые элементы стоят на месте.<br><br>★★★ — длина до добавления и после выведена отдельными блоками «Вывести … цвет …».`
        : `The hero finds a chest — the item count grows. Create the variable <strong>inventory</strong> holding <code>gold coin</code>, <code>map</code>.<br><br>1) Print the <strong>length</strong> of the list before the find → <strong>2</strong>.<br>2) Add the text <code>magic scroll</code> to the <strong>end</strong> with the <strong>“in list … insert at … = …”</strong> block: mode “insert at”, position “last”.<br>3) Print the <strong>length</strong> after the find → <strong>3</strong>.<br>4) Print the <strong>last</strong> item → <strong>magic scroll</strong>.<br><br>The length is printed with two different “length of …” blocks: the first counts two items, the second already counts three.<br><br><strong>What matters:</strong> adding to the end does not touch the existing cells, so gold coin stays at #1. Every language behaves the same way: the list grows while the old items keep their places.<br><br>★★★ — the length before and after the addition are two separate “Print … color …” blocks.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную inventory и присвойте ей «создать список из» текстов gold coin и map.\n2. Поставьте «Вывести … цвет …» с блоком «длина …» (Списки), внутри — переменная inventory. Вывод: 2.\n3. Находка. Возьмите тот же блок «в списке …», переключите первый выпадающий список на «вставить в», второй — на «последний». В поле «=» — текст magic scroll.\n4. Добавьте ниже ещё один «длина …» с inventory — теперь получится 3, потому что предмет добавился.\n5. И «в списке inventory взять последний» → magic scroll.\n6. Сверьте вывод: 2, 3, magic scroll — именно в таком порядке, и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable inventory and set it to “create list with” the texts gold coin and map.\n2. Put “Print … color …” around a “length of …” block (Lists) holding the inventory variable. Output: 2.\n3. The find. Take the same “in list …” block, switch the first dropdown to “insert at” and the second to “last”. Put the text magic scroll into the “=” slot.\n4. Add another “length of …” with inventory below — this time it is 3, because one item was added.\n5. Then “in list inventory get last” → magic scroll.\n6. Check the output: 2, 3, magic scroll in that order — then press “Check solution”.`,
    infoTopics: ["list_add_remove"],
    validate: validateListInventoryAdd,
  },
  list_inventory_remove: {
    id: "list_inventory_remove",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 26: Торговля с купцом" : "Task 26: Trading with the Merchant",
    description: (lang) =>
      lang === "ru"
        ? `У купца можно и купить, и продать. Создайте переменную <strong>inventory</strong> со списком <code>mana potion</code>, <code>broken helmet</code>, <code>lucky amulet</code> и продайте шлем.<br><br>1) Найдите позицию предмета <code>broken helmet</code> блоком <strong>«в списке … найти первое вхождение элемента …»</strong> и напечатайте её → <strong>2</strong>.<br>2) <strong>Удалите</strong> элемент с этой позиции блоком <strong>«в списке … взять и удалить …»</strong> и напечатайте удалённый предмет → <strong>broken helmet</strong>.<br>3) Напечатайте <strong>длину</strong> оставшегося списка → <strong>2</strong>.<br>4) Напечатайте <strong>первый</strong> и <strong>последний</strong> оставшиеся предметы → <strong>mana potion</strong> и <strong>lucky amulet</strong>.<br><br>В выводе пять строк: <strong>2</strong>, <strong>broken helmet</strong>, <strong>2</strong>, <strong>mana potion</strong>, <strong>lucky amulet</strong>.<br><br><strong>Два режима на выбор:</strong> «взять и удалить» отдаёт предмет наружу — его можно напечатать, а «удалить» просто убирает ячейку. После удаления позиции сдвигаются: то, что было № 3, становится № 2.<br><br>★★★ — позиция найдена блоком «найти вхождение», а не вписана от руки.`
        : `A merchant both buys and sells. Create the variable <strong>inventory</strong> holding <code>mana potion</code>, <code>broken helmet</code>, <code>lucky amulet</code> and sell the helmet.<br><br>1) Find the position of <code>broken helmet</code> with the <strong>“in list … find first occurrence of item …”</strong> block and print it → <strong>2</strong>.<br>2) <strong>Remove</strong> the item at that position with <strong>“in list … get remove …”</strong> and print the removed item → <strong>broken helmet</strong>.<br>3) Print the <strong>length</strong> of what is left → <strong>2</strong>.<br>4) Print the <strong>first</strong> and the <strong>last</strong> remaining items → <strong>mana potion</strong> and <strong>lucky amulet</strong>.<br><br>The output has five lines: <strong>2</strong>, <strong>broken helmet</strong>, <strong>2</strong>, <strong>mana potion</strong>, <strong>lucky amulet</strong>.<br><br><strong>Two modes:</strong> “get remove” hands the item back so you can print it, while plain “remove” only drops the cell. After a removal the positions shift: what used to be #3 becomes #2.<br><br>★★★ — the position comes from the “find occurrence” block instead of being typed by hand.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную inventory и присвойте ей список из трёх текстов: mana potion, broken helmet, lucky amulet.\n2. Возьмите «в списке … найти первое вхождение элемента …» (Списки): в поле списка — inventory, в поле элемента — текст broken helmet. Вложите блок в «Вывести … цвет …» → 2.\n3. Далее блок «в списке … взять и удалить …»: первый выпадающий список — «взять и удалить», второй — «№», а в поле номера вложите блок поиска из шага 2 (или впишите 2). Напечатайте результат → broken helmet.\n4. Потом «длина …» с inventory → 2, потому что один предмет ушёл.\n5. В конце «взять первый» и «взять последний» из inventory → mana potion и lucky amulet.\n6. Сверьте вывод: 2, broken helmet, 2, mana potion, lucky amulet — и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable inventory and set it to a list of three texts: mana potion, broken helmet, lucky amulet.\n2. Take “in list … find first occurrence of item …” (Lists): list slot = inventory, item slot = the text broken helmet. Wrap it in “Print … color …” → 2.\n3. Next, the “in list … get remove …” block: first dropdown “get remove”, second “item #”, and into the number slot drop the search block from step 2 (or just type 2). Print the result → broken helmet.\n4. Then “length of …” with inventory → 2, because one item is gone.\n5. Finally “get first” and “get last” of inventory → mana potion and lucky amulet.\n6. Check the output: 2, broken helmet, 2, mana potion, lucky amulet — then press “Check solution”.`,
    infoTopics: ["list_add_remove"],
    validate: validateListInventoryRemove,
  },
  list_inventory_random: {
    id: "list_inventory_random",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 27: Дроп из монстра" : "Task 27: Monster Loot"),
    description: (lang) =>
      lang === "ru"
        ? `Случайность делает игру живой: из монстра выпадает разный лут. Создайте переменную <strong>loot</strong> со списком <code>wolf pelt</code>, <code>rusty sword</code>, <code>sharp fang</code>, <code>healing root</code>.<br><br>Возьмите <strong>«повторить … раз»</strong> (Циклы) с числом <strong>5</strong> и положите внутрь «Вывести … цвет …» с блоком <strong>«в списке loot взять произвольный»</strong> — это случайный выбор одного элемента.<br><br>В окне вывода окажется 5 строк, и каждая обязана быть одним из четырёх предметов. Какой именно выпадет — предсказать нельзя.<br><br><strong>Чем это отличается от «выдать случайное от … до …»:</strong> тот блок из «Математика» даёт случайное ЧИСЛО, а «произвольный» элемент сразу берёт значение из списка — индексы считать не нужно.<br><br>★★★ — случайный выбор сделан режимом «произвольный», а не случайным числом.`
        : `Randomness keeps a game alive: a monster drops different loot. Create the variable <strong>loot</strong> holding <code>wolf pelt</code>, <code>rusty sword</code>, <code>sharp fang</code>, <code>healing root</code>.<br><br>Take <strong>“repeat … times”</strong> (Loops) with <strong>5</strong> and put inside it “Print … color …” with <strong>“in list loot get random”</strong> — that is picking one element at random.<br><br>The output shows five lines and every one of them must be one of the four items. Which exact item appears cannot be predicted.<br><br><strong>How it differs from “pick random … to …”:</strong> the Math block returns a random NUMBER, while the “random” item mode takes a value straight out of the list — no index maths needed.<br><br>★★★ — the random pick uses the “random” mode, not a random number.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную loot и присвойте ей «создать список из» четырёх текстов: wolf pelt, rusty sword, sharp fang, healing root.\n2. Из «Циклы» возьмите «повторить … раз» и впишите 5.\n3. Из «Списки» возьмите «в списке … взять …»: в поле списка — переменная loot, во втором выпадающем списке выберите «произвольный».\n4. Внутрь цикла поставьте «Вывести … цвет …», а в него — блок случайного выбора из шага 3.\n5. Запустите несколько раз: каждый запуск даёт новые строки, но все они — предметы из loot.\n6. Нажмите «Проверить решение»: проверка смотрит, что строк ровно пять и каждая есть в списке.`
        : `Step by step:\n1. Create the variable loot and set it to “create list with” four texts: wolf pelt, rusty sword, sharp fang, healing root.\n2. From Loops take “repeat … times” and type 5.\n3. From Lists take “in list … get …”: put the loot variable into the list slot and choose “random” in the second dropdown.\n4. Inside the loop place “Print … color …” and drop the random pick block from step 3 into it.\n5. Run it a few times: every run prints new lines, but all of them are items of loot.\n6. Press “Check solution”: the check only requires five lines, each one being an item of the list.`,
    infoTopics: ["list_random_choice"],
    validate: validateListInventoryRandom,
  },
  list_until_empty: {
    id: "list_until_empty",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 28: Разбор инвентаря" : "Task 28: Emptying the Knapsack",
    description: (lang) =>
      lang === "ru"
        ? `Когда предметов в рюкзаке неизвестно сколько, цикл не считают заранее, а крутятся, пока что-то остаётся. Создайте переменную <strong>tools</strong> со списком <code>hammer</code>, <code>saw</code>, <code>chisel</code>.<br><br>1) Возьмите <strong>«повторять, пока не …»</strong> (Циклы) и поставьте условие <strong>«tools пуст»</strong>: блок <strong>«… пуст»</strong> из «Списки», а в него вложите переменную tools.<br>2) Внутрь цикла положите «Вывести … цвет …» с блоком <strong>«в списке tools взять и удалить первый»</strong> — он одновременно отдаёт предмет наружу и убирает его из списка.<br><br>В окне вывода получится три строки: <strong>hammer</strong>, <strong>saw</strong>, <strong>chisel</strong>.<br><br><strong>Почему цикл заканчивается:</strong> каждый шаг делает список короче, поэтому условие «пуст» рано или поздно становится истинным. Если просто брать элемент, не удаляя его, список не меняется — и цикл повторяется вечно.<br><br>★★★ — «взять и удалить» внутри цикла «повторять, пока не пуст».`
        : `When you do not know how many items a knapsack holds, you do not count the repeats in advance — you loop until it runs out. Create the variable <strong>tools</strong> holding the list <code>hammer</code>, <code>saw</code>, <code>chisel</code>.<br><br>1) Take <strong>“repeat until …”</strong> (Loops) and set its condition to <strong>“tools is empty”</strong>: the <strong>“… is empty”</strong> block from Lists with the tools variable inside it.<br>2) Inside the loop place “Print … color …” with the block <strong>“in list tools remove item first”</strong> — it hands the item out and deletes it from the list at the same time.<br><br>The output gets three lines: <strong>hammer</strong>, <strong>saw</strong>, <strong>chisel</strong>.<br><br><strong>Why the loop ends:</strong> every step makes the list shorter, so the “is empty” condition eventually becomes true. If you only read an item without removing it, the list never changes and the loop runs forever.<br><br>★★★ — a “get and remove” block inside a “repeat until empty” loop.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную tools и присвойте ей «создать список из» трёх текстов: hammer, saw, chisel.\n2. Из «Циклы» возьмите «повторять, пока …» и переключите выпадающий список на «повторять, пока не».\n3. В поле условия поставьте блок «… пуст» из «Списки», а в него — переменную tools.\n4. Из «Списки» возьмите «в списке … взять …» и переключите его первый выпадающий список на режим «взять и удалить», второй — на «первый». В поле списка — переменная tools.\n5. Внутрь цикла положите «Вывести … цвет …», а в него — блок из шага 4.\n6. Нажмите «▶»: в выводе hammer, saw, chisel по порядку. Нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable tools and set it to “create list with” the three texts hammer, saw, chisel.\n2. From Loops take “repeat while …” and switch its dropdown to “repeat until …”.\n3. Into the condition slot put the “… is empty” block from Lists with the tools variable in it.\n4. From Lists take “in list … get …”, switch its first dropdown to “get and remove” and the second one to “first”. The list slot holds the tools variable.\n5. Inside the loop place “Print … color …” and drop the block from step 4 into it.\n6. Press “▶”: the output reads hammer, saw, chisel in that order. Press “Check solution”.`,
    infoTopics: ["while_until", "list_is_empty", "list_add_remove"],
    validate: validateListUntilEmpty,
  },
  list_grid: {
    id: "list_grid",
    difficulty: "basic",
    title: (lang) => lang === "ru" ? "Задача 37: Поле 3×3" : "Task 37: The 3×3 Grid",
    description: (lang) =>
      lang === "ru"
        ? `Один список — это ряд ячеек, а список внутри списка — целая таблица со строками и столбцами. Создайте переменную <strong>grid</strong> и присвойте ей блок «создать список из» трёх ячеек, а в каждую ячейку вложите <strong>свой</strong> блок «создать список из» с тремя текстами: <code>A B C</code>, <code>D E F</code>, <code>G H I</code>.<br><br>Напечатайте три строки, сначала взяв строку, а затем элемент внутри неё:<br>1) <strong>центр поля</strong> — строка № 2, элемент № 2 → <strong>E</strong>;<br>2) <strong>правый верхний угол</strong> — строка № 1, элемент № 3 → <strong>C</strong>;<br>3) <strong>левый нижний угол</strong> — строка № 3, элемент № 1 → <strong>G</strong>.<br><br>Блок <strong>«в списке … взять № …»</strong> понадобится ДВАЖДЫ на каждую строку: внешний берёт строку из grid, вложенный — элемент из этой строки.<br><br><strong>Где это встречается:</strong> таблицы и электронные листы, морской бой, экран телефона по пикселям, игровое поле. В текстах программ такая запись короче: <code>grid[1][2]</code>.<br><br>★★★ — поле собрано из списков-строк, и каждая ячейка получена двойным обращением.`
        : `One list is a row of cells, and a list inside a list is a whole table with rows and columns. Create the variable <strong>grid</strong> and set it to the “create list with” block of three cells; into every cell put <strong>another</strong> “create list with” block holding three texts: <code>A B C</code>, <code>D E F</code>, <code>G H I</code>.<br><br>Print three lines, taking a row first and then an item inside that row:<br>1) the <strong>centre of the field</strong> — row #2, item #2 → <strong>E</strong>;<br>2) the <strong>top right corner</strong> — row #1, item #3 → <strong>C</strong>;<br>3) the <strong>bottom left corner</strong> — row #3, item #1 → <strong>G</strong>.<br><br>You need the <strong>“in list … get item # …”</strong> block TWICE per line: the outer one takes a row out of grid, the nested one takes an item out of that row.<br><br><strong>Where this shows up:</strong> tables and spreadsheets, the game Battleship, a phone screen per pixel, a board in a game. In a text language the same access is shorter: <code>grid[1][2]</code>.<br><br>★★★ — the field is built from row-lists and every cell comes from a nested lookup.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную grid и блок «присвоить grid …».\n2. В поле значения положите «создать список из» трёх ячеек, а каждую ячейку замените своим блоком «создать список из» с тремя текстами: первая — A, B, C; вторая — D, E, F; третья — G, H, I.\n3. Возьмите «в списке … взять …» с режимом «№» и числом 2, а в поле списка вложите такой же блок: «в списке grid взять № 2». В поле «=» внешнего блока — № 2. Иначе: внешний блок берёт строку (№ 2), внутренний берёт из неё элемент (№ 2).\n4. Полученную конструкцию вложите в «Вывести … цвет …» — напечатайте E.\n5. Продублируйте конструкцию и меняйте номера: сначала строка № 1 и элемент № 3 (C), затем строка № 3 и элемент № 1 (G).\n6. Сверьте вывод: E, C, G — и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable grid and a “set grid to …” block.\n2. Put “create list with” three cells into its value slot and replace every cell with its own “create list with” block of three texts: first row — A, B, C; second — D, E, F; third — G, H, I.\n3. Take an “in list … get item # …” block with the number 2, and into its list slot put another such block reading “in list grid get item # 2”. The outer block takes the row, the inner one takes the item from it.\n4. Wrap that construction in “Print … color …” — it prints E.\n5. Duplicate the construction and change the numbers: row #1 with item #3 (C), then row #3 with item #1 (G).\n6. Check the output: E, C, G — then press “Check solution”.`,
    infoTopics: ["nested_lists", "list_indexing"],
    validate: validateListGrid,
  },
  proj_inventory: {
    id: "proj_inventory",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 55: Магический инвентарь" : "Task 55: The Magic Inventory",
    description: (lang) =>
      lang === "ru"
        ? `Проект собирает всё, что вы узнали про списки, и обходится без циклов. Соберите стартовое снаряжение героя.<br><br>1) Создайте три пула: <strong>weapons</strong> = <code>bow of wind</code>, <code>fire staff</code>, <code>titan sword</code>; <strong>armors</strong> = <code>leather vest</code>, <code>steel plate</code>, <code>wizard cloak</code>; <strong>artifacts</strong> = <code>dragon ring</code>, <code>amulet of immortality</code>, <code>mana sphere</code>.<br>2) Соберите <strong>inventory</strong> блоком «создать список из» трёх ячеек, а в каждую вложите «взять произвольный» из своего пула — снаряжение выпадает случайно.<br>3) Напечатайте три предмета inventory по номерам 1, 2 и 3.<br>4) Создайте переменную <strong>gold</strong> со случайным числом от <strong>50</strong> до <strong>200</strong> (блок «выдать случайное от … до …») и напечатайте её — это четвёртая строка.<br>5) Герой нашёл сундук: добавьте в <strong>конец</strong> inventory случайный артефакт (режим «вставить в … последний»), не печатайте его.<br>6) Первый предмет устарел: замените ячейку № 1 на текст <code>elixir of strength</code> и напечатайте её — пятая строка.<br>7) Напечатайте <strong>длину</strong> финального списка — шестая строка, <strong>4</strong>.<br><br>★★★ — проект использует случайный выбор, вставку в конец и замену по индексу.`
        : `This project pulls together everything you learned about lists and uses no loops at all. Build the starting gear of a hero.<br><br>1) Create three pools: <strong>weapons</strong> = <code>bow of wind</code>, <code>fire staff</code>, <code>titan sword</code>; <strong>armors</strong> = <code>leather vest</code>, <code>steel plate</code>, <code>wizard cloak</code>; <strong>artifacts</strong> = <code>dragon ring</code>, <code>amulet of immortality</code>, <code>mana sphere</code>.<br>2) Build <strong>inventory</strong> with the “create list with” block of three cells, and put a “get random item” from the matching pool into each cell — the gear is rolled at random.<br>3) Print the three items of inventory by numbers 1, 2 and 3.<br>4) Create the variable <strong>gold</strong> with a random whole number from <strong>50</strong> to <strong>200</strong> (the “pick random … to …” block) and print it — line four.<br>5) The hero finds a chest: append a random artifact to the <strong>end</strong> of inventory (mode “insert at … last”), without printing it.<br>6) The first item is out of date: replace cell #1 with the text <code>elixir of strength</code> and print that cell — line five.<br>7) Print the <strong>length</strong> of the final list — line six, <strong>4</strong>.<br><br>★★★ — the project uses a random pick, an append at the end and a replace by index.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Три пула. Создайте переменные weapons, armors, artifacts и присвойте каждой «создать список из» трёх текстов из условия.\n2. Inventory. Создайте переменную inventory; в поле значения — «создать список из» трёх ячеек, и каждую ячейку замените блоком «в списке … взять …» с режимом «произвольный» (в поле списка — нужный пул).\n3. Поставьте три блока «Вывести … цвет …» с «в списке inventory взять № 1», «№ 2» и «№ 3».\n4. Создайте переменную gold и присвойте ей «выдать случайное от 50 до 200» (Математика). Напечатайте gold.\n5. Сундук. Блок «в списке inventory вставить в последний = …», а в поле «=» — «в списке artifacts взять произвольный».\n6. Замена. Блок «в списке inventory присвоить № 1 = elixir of strength», сразу после него печать «взять № 1» — получится elixir of strength.\n7. Длина. Последний блок — «Вывести … цвет …» с «длина inventory»: предметов стало четыре, значит 4.\n8. Запустите и сверьте шесть строк: три предмета, число от 50 до 200, elixir of strength и 4. Нажмите «Проверить решение».`
        : `Step by step:\n1. Three pools. Create the variables weapons, armors and artifacts, and set each to “create list with” the three texts from the task.\n2. Inventory. Create the variable inventory; into its value slot put “create list with” three cells and replace every cell with an “in list … get …” block set to “random” (the list slot holds the matching pool).\n3. Add three “Print … color …” blocks with “in list inventory get item # 1”, “# 2” and “# 3”.\n4. Create the variable gold and set it to “pick random 50 to 200” (Math). Print gold.\n5. The chest. Use “in list inventory insert at last = …” and put “in list artifacts get random” into the “=” slot.\n6. The swap. Use “in list inventory set item # 1 = elixir of strength” and right after it print “get item # 1” — the line reads elixir of strength.\n7. Length. End with “Print … color …” around “length of inventory”: there are four items now, so it prints 4.\n8. Run it and check six lines: three items, a number from 50 to 200, elixir of strength and 4. Press “Check solution”.`,
    infoTopics: ["list_indexing", "list_add_remove", "list_random_choice"],
    validate: validateProjInventory,
  },
};
