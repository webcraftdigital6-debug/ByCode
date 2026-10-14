// Задачи группы «loops»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import {
  getVisibleOutputLines,
  getVarFieldText,
  tryGetAssignedNumber,
  escapeRe,
  hasAncestorOfType,
  typedCodeMode,
} from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateFirstLoop(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const numericLines = lines
    .map((l) => {
      const n = Number(l);
      return Number.isInteger(n) ? n : null;
    })
    .filter((v): v is number => v !== null);

  const expected = Array.from({ length: 11 }, (_, i) => i);

  const ok = (() => {
    if (numericLines.length < expected.length) return false;
    for (let start = 0; start <= numericLines.length - expected.length; start++) {
      let matches = true;
      for (let i = 0; i < expected.length; i++) {
        if (numericLines[start + i] !== expected[i]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  })();

  const tryGetInputNumber = (block: any, inputName: string): number | null => {
    try {
      const target =
        typeof block?.getInputTargetBlock === "function"
          ? block.getInputTargetBlock(inputName)
          : null;
      if (!target) return null;
      if ((target as any).type !== "math_number") return null;
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
  };

  let usedFor = false;
  let forFromOk = false;
  let forToOk = false;
  let forByOk = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_for") {
      usedFor = true;
      try {
        const from = tryGetInputNumber(b, "FROM");
        const to = tryGetInputNumber(b, "TO");
        const by = tryGetInputNumber(b, "BY");
        if (from === 0) forFromOk = true;
        if (to === 10) forToOk = true;
        if (by === 1) forByOk = true;
      } catch {}
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedFor && hasPrint && forFromOk && forToOk && forByOk;
    if (usedCore && count <= 8) stars = 3;
    else if (usedFor && hasPrint && count <= 12) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSum1ToN(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let n: number | null = null;
  let hasSetN = false;
  let hasGetN = false;
  let hasPrint = false;

  let usedFor = false;
  let usedAccumulator = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetN = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) n = assigned;
    }
    if (t === "variables_get") hasGetN = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_for") usedFor = true;

    if (t === "variables_set" && getVarFieldText(b) === "sum") usedAccumulator = true;
    if (t === "variables_set" && getVarFieldText(b) === "total") usedAccumulator = true;
  }

  const expected = (() => {
    if (n === null) return null;
    if (n < 1) return null;
    return (n * (n + 1)) / 2;
  })();

  // В режиме кода N выбирает ученик, но сумма 1…N бывает только треугольной
  // (1, 3, 6, 10, 15, 21…), поэтому вывод проверяется по значению, а не «на цифру».
  const triangularLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!/^\d{1,6}$/.test(trimmed)) return false;
    const root = (Math.sqrt(8 * Number(trimmed) + 1) - 1) / 2;
    return Number.isInteger(root) && root >= 1;
  };

  const codeMode = typedCodeMode(ws);
  const valueRe = expected === null ? null : new RegExp(`(^|\\b)${escapeRe(String(expected))}(\\b|$)`);
  const outputOk = codeMode
    ? lines.some(triangularLine)
    : valueRe !== null && lines.some((l) => valueRe.test(l));
  const structureOk = hasSetN && hasGetN && hasPrint;

  const ok = outputOk && (codeMode || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedFor && usedAccumulator;
    if (usedCore && count <= 14) stars = 3;
    else if (count <= 20) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateGuessGame(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);
  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );

  const blocks = getNonShadowBlocks(ws);

  let hasSetSecret = false;
  let hasGetSecret = false;
  let hasSetGuess = false;
  let hasGetGuess = false;
  let usedInputNumber = false;
  let usedWhile = false;
  let usedIf = false;
  let usedElseIf = false;
  let usedElse = false;
  let usedCompare = false;
  let hasEq = false;
  let hasLt = false;
  let hasGt = false;
  let hasNeq = false;
  let hasPrint = false;

  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetSecret = true;
      hasSetGuess = true;
    }
    if (t === "variables_get") {
      hasGetSecret = true;
      hasGetGuess = true;
    }

    if (t === "py_input_number") usedInputNumber = true;
    if (t === "controls_whileUntil") usedWhile = true;
    if (t === "controls_if") {
      usedIf = true;
      try {
        if (typeof (b as any).getInput === "function") {
          let elseIfCount = 0;
          for (let i = 1; i < 10; i++) {
            if ((b as any).getInput(`IF${i}`)) elseIfCount += 1;
            else break;
          }
          if (elseIfCount >= 1) usedElseIf = true;
          if ((b as any).getInput("ELSE")) usedElse = true;
        }
      } catch {}
    }
    if (t === "logic_compare") {
      usedCompare = true;
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "EQ") hasEq = true;
        if (op === "LT") hasLt = true;
        if (op === "GT") hasGt = true;
        if (op === "NEQ") hasNeq = true;
      } catch {}
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const saidHigher = normalized.some(
    (l) => l.includes("загаданное число больше") || l.includes("higher")
  );
  const saidLower = normalized.some(
    (l) => l.includes("загаданное число меньше") || l.includes("lower")
  );
  const saidCongrats = normalized.some(
    (l) => l.includes("поздравляем") || l.includes("congrat")
  );
  const hasFeedbackText = saidHigher || saidLower || saidCongrats;

  // В режиме кода блоки недоступны, поэтому требуем полный игровой цикл:
  // подсказку «больше/меньше» и приветствие победителя.
  const codeMode = typedCodeMode(ws);
  const outputOk = codeMode
    ? (saidHigher || saidLower) && saidCongrats
    : hasFeedbackText || (hasGetSecret && hasGetGuess);
  const structureOk = hasPrint && usedIf && usedCompare;

  const ok = outputOk && (codeMode || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      usedWhile && usedIf && usedElseIf && usedElse && usedInputNumber && hasEq && hasLt && hasGt;
    if (usedCore && count <= 26) stars = 3;
    else if (usedWhile && usedIf && usedCompare && count <= 34) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateMultTable(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);

  const rowRe = /^(\d+)\s*[×*xх]\s*(\d+)\s*=\s*(\d+)$/;

  let validRows = 0;
  for (const l of lines) {
    const m = l.match(rowRe);
    if (m) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      const z = Number(m[3]);
      if (x * y === z) validRows++;
    }
  }

  const hasRow = (a: number, b: number) =>
    lines.some((l) => {
      const m = l.match(rowRe);
      if (!m) return false;
      return Number(m[1]) === a && Number(m[2]) === b && Number(m[3]) === a * b;
    });

  // Полная таблица 1..5 — это 25 строк; требуем почти все и ключевые примеры
  const ok = validRows >= 20 && hasRow(2, 3) && hasRow(4, 5) && hasRow(5, 5);

  const tryGetInputNumber = (block: any, inputName: string): number | null => {
    try {
      const target =
        typeof block?.getInputTargetBlock === "function"
          ? block.getInputTargetBlock(inputName)
          : null;
      if (!target) return null;
      if ((target as any).type !== "math_number") return null;
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
  };

  let usedFor = 0;
  let nestedFor = false;
  let forFromOk = false;
  let forToOk = false;
  let forByOk = false;
  let usedMultiply = false;
  let usedJoin = false;
  let usedPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_for") {
      usedFor++;
      let p = typeof b.getParent === "function" ? b.getParent() : null;
      while (p) {
        if ((p as any).type === "controls_for") {
          nestedFor = true;
          break;
        }
        p = typeof p.getParent === "function" ? p.getParent() : null;
      }
      try {
        const from = tryGetInputNumber(b, "FROM");
        const to = tryGetInputNumber(b, "TO");
        const by = tryGetInputNumber(b, "BY");
        if (from === 1) forFromOk = true;
        if (to === 5) forToOk = true;
        if (by === 1) forByOk = true;
      } catch {}
    }
    if (t === "math_arithmetic") {
      const op =
        typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("OP") : undefined;
      if (op === "MULTIPLY") usedMultiply = true;
    }
    if (t === "text_join") usedJoin = true;
    if (t === "text_print" || t === "add_text") usedPrint = true;
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore =
      nestedFor && usedMultiply && usedJoin && usedPrint && forFromOk && forToOk && forByOk;
    if (usedCore && count <= 20) stars = 3;
    else if (nestedFor && usedMultiply && usedJoin && usedPrint && count <= 28) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateFirstEvenBreak(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);

  // Задача требует вывести ровно одно число — первое чётное (8).
  // Если цикл не прерван, в вывод попадут и последующие чётные (2) — это не ок.
  const numericLines = lines.map((l) => Number(l)).filter((n) => Number.isFinite(n));
  const ok = numericLines.length === 1 && numericLines[0] === 8;

  let usedLoop = false;
  let usedIf = false;
  let usedBreak = false;
  let usedEvenCheck = false;
  let usedModulo = false;
  let usedCompare = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (
      t === "controls_forEach" ||
      t === "controls_for" ||
      t === "controls_repeat" ||
      t === "controls_whileUntil"
    ) {
      usedLoop = true;
    }
    if (t === "controls_if") usedIf = true;
    if (t === "controls_flow_statements") {
      const op =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("FLOW")
          : undefined;
      if (String(op).toUpperCase() === "BREAK") usedBreak = true;
    }
    if (t === "math_number_property") {
      const prop =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("PROPERTY")
          : undefined;
      if (String(prop).toUpperCase().includes("EVEN")) usedEvenCheck = true;
    }
    if (t === "math_modulo") usedModulo = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const evenCheck = usedEvenCheck || (usedModulo && usedCompare);
  const usedCore = usedLoop && usedIf && evenCheck && hasPrint;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    // Минимальное решение ~16 блоков (6 чисел списка тоже считаются)
    if (usedCore && usedBreak && count <= 17) stars = 3;
    else if (usedCore && count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateDiceRolls(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  const nums = lines.map((l) => Number(l));
  // Ровно 10 бросков, каждый — целое 1…6 (значения случайны,
  // поэтому проверяем форму и диапазон, а не конкретные числа)
  const rollsOk = lines.length === 10 && nums.every((n) => Number.isInteger(n) && n >= 1 && n <= 6);

  let usedRepeat = false;
  let usedAnyLoop = false;
  let usedRandomInt = false;
  let usedPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_repeat_ext" || t === "controls_repeat") {
      usedRepeat = true;
      usedAnyLoop = true;
    }
    if (t === "controls_for" || t === "controls_whileUntil" || t === "controls_forEach") {
      usedAnyLoop = true;
    }
    if (t === "math_random_int") usedRandomInt = true;
    if (t === "text_print" || t === "add_text") usedPrint = true;
  }

  const ok = blocks.length === 0 ? rollsOk : usedAnyLoop && usedRandomInt && usedPrint && rollsOk;

  const count = blocks.length;
  let stars = 0;
  if (ok) {
    if (usedRepeat && usedRandomInt && usedPrint && count <= 8) stars = 3;
    else if (usedAnyLoop && count <= 14) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

/**
 * Цикл «пока»: счётчик шагов печатает 0, 1, 2, 3, 4 и останавливается на 5.
 * Направление сравнения проверять не нужно — неверный знак дал бы другой вывод.
 */
async function validateLoopWhileCount(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  const expected = ["0", "1", "2", "3", "4"];
  const outputOk = lines.length === expected.length && expected.every((v, i) => lines[i] === v);

  let usedWhile = false;
  let usedCompare = false;
  let usedChange = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_whileUntil") usedWhile = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "math_change") usedChange = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = outputOk && (typedCodeMode(ws) || (usedWhile && hasPrint));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedWhile && usedCompare && usedChange && hasPrint && count <= 14) stars = 3;
    else if (usedWhile && hasPrint && count <= 20) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

/**
 * Цикл «пока не» с вводом: программа спрашивает число, пока ответ не окажется
 * в диапазоне 1…5. Засчитывается только ввод, который стоит ВНУТРИ цикла —
 * иначе программа задаст вопрос один раз и цикл не закончится никогда.
 */
async function validateLoopWhileInput(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  const last = lines.length ? Number(lines[lines.length - 1]) : NaN;
  const acceptedOk = Number.isInteger(last) && last >= 1 && last <= 5;

  let usedWhile = false;
  let reasksInsideLoop = false;
  let usedCompare = false;
  let usedLogic = false;
  let usedInputNumber = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_whileUntil") usedWhile = true;
    if (t === "py_input_number") {
      usedInputNumber = true;
      if (hasAncestorOfType(b, "controls_whileUntil")) reasksInsideLoop = true;
    }
    if (t === "logic_compare") usedCompare = true;
    if (t === "logic_operation" || t === "logic_negate") usedLogic = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok =
    acceptedOk &&
    (typedCodeMode(ws) ||
      (usedWhile && usedInputNumber && reasksInsideLoop && usedCompare && hasPrint));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedLogic && count <= 16) stars = 3;
    else if (count <= 22) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

/**
 * Мини-игра «Охота за кладом»: цикл крутится, пока случайная комната — не пляж.
 * Вывод — найденная комната и число попыток; проверка фиксирует, что пляж
 * напечатан ровно один раз (значит блок вывода стоял после цикла, а не внутри).
 */
async function validateTreasureHunt(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  const beachCount = lines.filter((l) => /^sunny beach$/i.test(l)).length;
  const last = lines.length ? Number(lines[lines.length - 1]) : NaN;
  const outputOk = beachCount === 1 && Number.isInteger(last) && last >= 1 && lines.length >= 2;

  let usedWhile = false;
  let usedList = false;
  let usedRandomItem = false;
  let usedChange = false;
  let usedCompare = false;
  let hasPrint = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "controls_whileUntil") usedWhile = true;
    if (t === "lists_create_with") usedList = true;
    if (t === "lists_getIndex") {
      const where =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("WHERE")
          : undefined;
      if (where === "RANDOM") usedRandomItem = true;
    }
    if (t === "math_change") usedChange = true;
    if (t === "logic_compare") usedCompare = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const usedCore = usedWhile && usedList && usedRandomItem && usedChange && usedCompare && hasPrint;
  const ok = outputOk && (typedCodeMode(ws) || usedCore);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 22) stars = 3;
    else if (count <= 30) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

export const loopsTasks: Pick<
  TaskRegistry,
  | "first_loop"
  | "sum_1_to_n"
  | "guess_game"
  | "mult_table"
  | "first_even_break"
  | "dice_rolls"
  | "loop_while_count"
  | "loop_while_input"
  | "proj_treasure_hunt"
> = {
  first_loop: {
    id: "first_loop",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 16: Первый цикл" : "Task 16: First Loop"),
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу, которая выводит в консоль все числа от <strong>0</strong> до <strong>10</strong> (включительно), каждое число с новой строки."
        : "Write a program that prints all numbers from <strong>0</strong> to <strong>10</strong> (inclusive), one per line.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Циклы» возьмите блок «цикл по i от … до … с шагом …».\n2. Впишите границы: от 0 до 10, шаг 1.\n3. Внутрь цикла вложите «Вывести … цвет …» и перетащите в него переменную i из «Переменные».\n4. Запустите код — в выводе появятся числа от 0 до 10 (каждое с новой строки). Нажмите «Проверить решение»."
        : "Step by step:\n1. In the Loops category take the “count with i from … to … by …” block.\n2. Set the bounds: from 0 to 10, step 1.\n3. Put “Print … color …” inside the loop and drag the variable i from Variables into it.\n4. Run the code — the numbers 0 through 10 appear in the output. Press “Check solution”.",
    infoTopics: ["for_loop"],
    validate: validateFirstLoop,
  },
  sum_1_to_n: {
    id: "sum_1_to_n",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 18: Сумма чисел" : "Task 18: Sum of Numbers"),
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу, которая вычисляет сумму всех целых чисел от <strong>1</strong> до <strong>N</strong>, где <strong>N</strong> сохранено в переменной <strong>n</strong>.<br><br>Пример: при <strong>n = 5</strong> нужно вывести <strong>15</strong>, при <strong>n = 10</strong> — <strong>55</strong>."
        : "Write a program that computes the sum of all integers from <strong>1</strong> to <strong>N</strong>, where <strong>N</strong> is stored in the variable <strong>n</strong>.<br><br>Example: for <strong>n = 5</strong> print <strong>15</strong>, for <strong>n = 10</strong> print <strong>55</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную n и присвойте ей число (например, 5 или 10).\n2. Создайте переменную-аккумулятор sum и присвойте ей 0.\n3. Возьмите блок «цикл по i от … до … с шагом …», впишите от 1 до n, шаг 1.\n4. Внутри цикла вложите «увеличить sum на i» (блок «увеличить … на …» из «Математика» с переменной i в качестве приращения).\n5. После цикла вложите sum в «Вывести … цвет …»: при n=5 получится 15, при n=10 — 55."
        : "Step by step:\n1. Create a variable n and set it to a number (e.g. 5 or 10).\n2. Create an accumulator variable sum and set it to 0.\n3. Take the “count with i from … to … by …” loop, from 1 to n, step 1.\n4. Inside the loop put “change sum by i” (the “change … by …” block from Math with variable i as the delta).\n5. After the loop put sum into “Print … color …”: n=5 gives 15, n=10 gives 55.",
    infoTopics: ["for_loop"],
    validate: validateSum1ToN,
  },
  guess_game: {
    id: "guess_game",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 53: Игра «Угадай число»" : "Task 53: Number Guessing Game",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте программу, в которой компьютер <strong>загадывает</strong> число от <strong>1</strong> до <strong>10</strong> (сохраните его в переменной <strong>secret</strong>), а пользователь пытается его угадать.<br><br>Используйте переменную <strong>guess</strong> для догадки. В цикле спрашивайте число у пользователя и сообщайте:<br>— если догадка меньше секрета: <strong>"Загаданное число больше!"</strong><br>— если догадка больше секрета: <strong>"Загаданное число меньше!"</strong><br>— если равно: <strong>"Поздравляем! Вы угадали число!"</strong>.'
        : 'Create a program where the computer chooses a number from <strong>1</strong> to <strong>10</strong> (store it in <strong>secret</strong>), and the user tries to guess it.<br><br>Use <strong>guess</strong> for the user\'s guess. In a loop, ask for a number and print:<br>— if guess is lower: <strong>"The secret number is higher!"</strong><br>— if guess is higher: <strong>"The secret number is lower!"</strong><br>— if equal: <strong>"Congratulations! You guessed the number!"</strong><br><br>Use the <strong>py_input_number</strong> block (Text) for input.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную secret и присвойте ей число от 1 до 10.\n2. Создайте переменную guess. Используйте блок «Ввод числа» из «Текст», чтобы спросить число у пользователя, и присвойте результат guess.\n3. Возьмите блок «повторять, пока …» из «Циклы» с условием «guess ≠ secret».\n4. Внутри цикла: блок «если / иначе если / иначе» (шестерёнка → добавить секции) — если guess < secret вывести «Загаданное число больше!», если guess > secret — «Загаданное число меньше!», иначе — «Поздравляем! Вы угадали число!».\n5. В ветках «меньше/больше» запрашивайте новую догадку через «Ввод числа»."
        : "Step by step:\n1. Create variable secret and set it to a number from 1 to 10.\n2. Create variable guess. Use the “numeric input” block from Text to ask the user for a number and assign it to guess.\n3. Take the “repeat while …” block from Loops with condition “guess ≠ secret”.\n4. Inside the loop: an “if / else if / else” block (gear → add sections) — if guess < secret print “The secret number is higher!”, if guess > secret print “The secret number is lower!”, else print “Congratulations! You guessed the number!”.\n5. In the lower/higher branches ask for a new guess via “numeric input”.",
    infoTopics: ["while_until"],
    validate: validateGuessGame,
  },
  mult_table: {
    id: "mult_table",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 19: Таблица умножения" : "Task 19: Multiplication table",
    description: (lang) =>
      lang === "ru"
        ? "Выведите таблицу умножения для чисел от <strong>1</strong> до <strong>5</strong>: каждая строка — один пример, например:<br><strong>2 × 3 = 6</strong><br><strong>5 × 5 = 25</strong><br><br>Для этого используйте <strong>вложенные циклы</strong>: внешний цикл перебирает первый множитель (от 1 до 5), внутренний — второй (от 1 до 5). Для каждой пары (i, j) выведите строку вида <strong>i × j = результат</strong>.<br><br><strong>Подсказка:</strong> соберите строку примера блоком <strong>«создать текст из»</strong> (Текст): переменная i, символ ×, переменная j, знак = и результат умножения (блок «+ − × ÷» из «Математика» с операцией ×)."
        : "Print the multiplication table for numbers from <strong>1</strong> to <strong>5</strong>: each line is one equation, for example:<br><strong>2 × 3 = 6</strong><br><strong>5 × 5 = 25</strong><br><br>Use <strong>nested loops</strong>: the outer loop goes over the first factor (1 to 5), the inner loop over the second (1 to 5). For each pair (i, j) print a line like <strong>i × j = result</strong>.<br><br><strong>Tip:</strong> build the line with the <strong>“create text with”</strong> block (Text): variable i, symbol ×, variable j, the = sign and the product (the “+ − × ÷” block from Math with the × operation).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В «Циклы» возьмите блок «цикл по i от … до … с шагом …» (от 1 до 5, шаг 1) — внешний цикл, первый множитель.\n2. Внутрь внешнего цикла положите второй блок «цикл по j от … до … с шагом …» (от 1 до 5, шаг 1) — внутренний цикл, второй множитель.\n3. Внутри внутреннего цикла соберите строку примера блоком «создать текст из» (Текст): переменная i, символ ×, переменная j, знак = и результат i × j (блок «+ − × ÷» с операцией ×).\n4. Вложите эту строку в «Вывести … цвет …» — каждая пара (i, j) печатается с новой строки.\n5. Запустите код: в окне вывода будет 25 строк — от «1 × 1 = 1» до «5 × 5 = 25». Нажмите «Проверить решение»."
        : "Step by step:\n1. In Loops take the “count with i from … to … by …” block (1 to 5, step 1) — the outer loop, the first factor.\n2. Put a second “count with j from … to … by …” block (1 to 5, step 1) inside the outer loop — the inner loop, the second factor.\n3. Inside the inner loop build the line with the “create text with” block (Text): variable i, symbol ×, variable j, the = sign and the product i × j (the “+ − × ÷” block with the × operation).\n4. Put this line into the “Print … color …” block — each pair (i, j) is printed on a new line.\n5. Run the code: the output shows 25 lines — from “1 × 1 = 1” to “5 × 5 = 25”. Press “Check solution”.",
    infoTopics: ["nested_loops", "string_concat"],
    validate: validateMultTable,
  },
  first_even_break: {
    id: "first_even_break",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 38: Найди первое чётное" : "Task 38: Find the first even",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[7, 3, 8, 5, 2, 9]</code> и сохраните его в переменную <strong>list</strong>. Переберите элементы циклом и, как только встретится <strong>чётное</strong> число, выведите его и <strong>прервите цикл</strong>: в окне вывода должно появиться только <strong>8</strong>.<br><br><strong>Что такое «прервать цикл»:</strong> блок <strong>«прервать цикл»</strong> (категория «Циклы») немедленно останавливает цикл — программа продолжается с первого блока после цикла. Это классический паттерн «поиск с ранним выходом».<br><br>Проверить чётность можно блоком <strong>«чётное»</strong> из «Математика» (выберите «чётное» в выпадающем списке) или сравнением «остаток от n ÷ 2 = 0»."
        : "Create the list <code>[7, 3, 8, 5, 2, 9]</code> and store it in <strong>list</strong>. Loop over the items and as soon as you meet an <strong>even</strong> number, print it and <strong>break out of the loop</strong>: the output must show only <strong>8</strong>.<br><br><strong>What “break” means:</strong> the <strong>“break out of loop”</strong> block (Loops category) stops the loop immediately — the program continues right after the loop. This is the classic “search with early exit” pattern.<br><br>To check parity use the <strong>“is even”</strong> block from Math (choose “even” in the dropdown) or the comparison “remainder of n ÷ 2 = 0”.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 7 3 8 5 2 9» (блок из «Списки»).\n2. В «Циклы» возьмите блок «для каждого элемента n в списке …» и вложите в его поле переменную list.\n3. Внутрь цикла положите «если» из «Логика» с условием «чётное»: блок из «Математика» (в выпадающем списке выберите «чётное»), в его поле — переменная n. Альтернатива: «остаток от n ÷ 2 = 0».\n4. В ветку «если» добавьте «Вывести … цвет …» с переменной n.\n5. Сразу после «Вывести … цвет …» в той же ветке «если» поставьте блок «прервать цикл» из «Циклы» — после первого чётного цикл остановится, и 2 не будет выведено.\n6. Запустите код: в окне вывода только 8. Нажмите «Проверить решение»."
        : "Step by step:\n1. Create a variable list and set it to “create list with 7 3 8 5 2 9” (a Lists block).\n2. In Loops take the “for each item n in list …” block and put variable list into its field.\n3. Inside the loop place an “if” from Logic with the condition “is even”: the Math block (choose “even” in the dropdown) with variable n in its field. Alternative: “remainder of n ÷ 2 = 0”.\n4. In the if branch add “Print … color …” with variable n.\n5. Right after it, in the same if branch, put the “break out of loop” block from Loops — after the first even number the loop stops, so 2 is never printed.\n6. Run the code: the output shows only 8. Press “Check solution”.",
    infoTopics: ["break_continue"],
    validate: validateFirstEvenBreak,
  },
  dice_rolls: {
    id: "dice_rolls",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 17: Кубик" : "Task 17: The Dice"),
    description: (lang) =>
      lang === "ru"
        ? "Напишите программу-«кубик»: <strong>повторите 10 раз</strong> бросок игральной кости, то есть выведите в окно вывода <strong>10 случайных целых чисел от 1 до 6</strong> (каждое с новой строки).<br><br>Используйте блок <strong>«повторить … раз»</strong> (Циклы) и блок <strong>«выдать случайное от … до …»</strong> (Математика).<br><br><strong>Поэкспериментируйте:</strong> запустите программу несколько раз — каждый раз выпадают новые числа. Предсказать их заранее нельзя, и проверка это учитывает: ей важно, чтобы было ровно 10 чисел и все от 1 до 6."
        : "Write a “dice” program: <strong>repeat 10 times</strong> a die roll, i.e. print <strong>10 random whole numbers from 1 to 6</strong> (one per line).<br><br>Use the <strong>“repeat … times”</strong> block (Loops) and the <strong>“random integer from … to …”</strong> block (Math).<br><br><strong>Experiment:</strong> run the program a few times — every run rolls new numbers. They can't be predicted, and the check knows it: it only requires exactly 10 numbers, each from 1 to 6.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Циклы» возьмите блок «повторить … раз» и впишите 10.\n2. В категории «Математика» возьмите «выдать случайное от … до …» и впишите 1 и 6.\n3. Внутрь цикла вложите «Вывести … цвет …», а в него — блок случайного числа.\n4. Нажмите «▶» — в выводе появится 10 чисел от 1 до 6.\n5. Нажмите «Проверить решение»."
        : "Step by step:\n1. In the Loops category take the “repeat … times” block and set it to 10.\n2. In the Math category take “random integer from … to …” and set 1 and 6.\n3. Inside the loop put “Print … color …”, and into it the random number block.\n4. Press “▶” — the output shows 10 numbers from 1 to 6.\n5. Press “Check solution”.",
    infoTopics: ["repeat_n_times", "random_numbers"],
    validate: validateDiceRolls,
  },
  loop_while_count: {
    id: "loop_while_count",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 21: Счётчик до предела" : "Task 21: Counter to the Limit",
    description: (lang) =>
      lang === "ru"
        ? `Цикл <strong>«повторять, пока …»</strong> крутится, пока условие истинно, — сколько именно раз, заранее неизвестно. Создайте переменную <strong>step</strong> со значением <strong>0</strong> и напечатайте пять строк: <strong>0</strong>, <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, <strong>4</strong>.<br><br>1) Возьмите <strong>«повторять, пока …»</strong> (Циклы) и поставьте условие <code>step &lt; 5</code> — блок «сравнить» из «Логика».<br>2) Внутрь цикла положите «Вывести … цвет …» с переменной <strong>step</strong>.<br>3) Сразу после него поставьте <strong>«увеличить step на 1»</strong> (Математика). Без него условие никогда не станет ложным, и цикл замкнётся навсегда.<br><br><strong>Чем это отличается от «цикла по i»:</strong> там число повторов известно заранее, а здесь программа сама решает, когда остановиться. Так устроены игры («пока здоровье &gt; 0») и загрузка файла («пока не скачано 100 %»).<br><br>★★★ — цикл «пока», сравнение и «увеличить на 1», а не готовый цикл со счётчиком.`
        : `The <strong>“repeat while …”</strong> loop runs as long as its condition is true — nobody knows in advance how many times. Create the variable <strong>step</strong> set to <strong>0</strong> and print five lines: <strong>0</strong>, <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, <strong>4</strong>.<br><br>1) Take <strong>“repeat while …”</strong> (Loops) and set the condition <code>step &lt; 5</code> — the “compare” block from Logic.<br>2) Put “Print … color …” with the variable <strong>step</strong> inside the loop.<br>3) Right after it place <strong>“change step by 1”</strong> (Math). Without it the condition never becomes false and the loop runs forever.<br><br><strong>How is this different from “count with i”?</strong> There the number of repeats is known upfront; here the program decides when to stop. That is how games work (“while health &gt; 0”) and file downloads (“until 100 %”).<br><br>★★★ — a “while” loop, a comparison and “change by 1” instead of a ready-made counting loop.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную step и блок «присвоить step …» со значением 0.\n2. Из «Циклы» возьмите «повторять, пока …»: это блок с выпадающим списком — оставьте режим «повторять, пока».\n3. В поле условия поставьте «сравнить» из «Логика»: слева — переменная step, справа — число 5, знак «&lt;».\n4. В слот «выполнить» положите «Вывести … цвет …» с переменной step внутрь.\n5. Под печать в том же слоте поставьте «увеличить step на 1» из «Математика» и впишите 1.\n6. Нажмите «▶»: в выводе 0, 1, 2, 3, 4. Убедитесь, что пятерки нет, и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable step and a “set step to …” block holding 0.\n2. From Loops take “repeat while …” — it has a dropdown; keep the “while” mode.\n3. Into its condition slot put the “compare” block from Logic: variable step on the left, number 5 on the right, sign “&lt;”.\n4. Put “Print … color …” with the variable step inside the “do” slot.\n5. Under it, in the same slot, place “change step by 1” from Math and type 1.\n6. Press “▶”: the output shows 0, 1, 2, 3, 4. Make sure there is no 5, then press “Check solution”.`,
    infoTopics: ["while_until"],
    validate: validateLoopWhileCount,
  },
  loop_while_input: {
    id: "loop_while_input",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 22: Назови число от 1 до 5" : "Task 22: Name a Number from 1 to 5",
    description: (lang) =>
      lang === "ru"
        ? `Программа задаёт вопрос, пока не получит подходящий ответ. Создайте переменную <strong>guess</strong> и присвойте ей блок <strong>«Ввод числа»</strong> — это первый вопрос.<br><br>1) Возьмите <strong>«повторять, пока не …»</strong> (Циклы). Условие выхода: число подходит — «guess ≥ 1» <strong>И</strong> «guess ≤ 5»; сложите два сравнения блоком «И» из «Логика».<br>2) Внутрь цикла обязательно положите <strong>ещё один</strong> блок «присвоить guess …» с «Ввод числа» — иначе программа не спросит повторно и цикл никогда не закончится.<br>3) После цикла напечатайте значение <strong>guess</strong>.<br><br><strong>Как запустить:</strong> нажмите «▶», введите <code>9</code> и подтвердите — программа спросит снова; введите <code>4</code>. В выводе появится одна строка: <strong>4</strong>.<br><br><strong>Зачем вопрос до цикла:</strong> условие проверяется до первой попытки, поэтому переменную нужно заполнить заранее. Программисты называют это «первичный ввод» (priming read).<br><br>★★★ — «повторять, пока не», ввод внутри цикла и условие из двух сравнений, соединённых «И».`
        : `A program that keeps asking until it gets an acceptable answer. Create the variable <strong>guess</strong> and set it to the <strong>“numeric input”</strong> block — that is the first question.<br><br>1) Take <strong>“repeat until …”</strong> (Loops). The exit condition is “the number fits”: “guess ≥ 1” <strong>AND</strong> “guess ≤ 5” — join the two comparisons with the “and” block from Logic.<br>2) Inside the loop you must place <strong>another</strong> “set guess to …” block with “numeric input” — otherwise the program never asks again and the loop never ends.<br>3) After the loop print the value of <strong>guess</strong>.<br><br><strong>How to run:</strong> press “▶”, type <code>9</code> and confirm — the program asks again; then type <code>4</code>. The output shows one line: <strong>4</strong>.<br><br><strong>Why ask before the loop:</strong> the condition is checked before the first attempt, so the variable has to hold a value already. Programmers call this a priming read.<br><br>★★★ — “repeat until”, input inside the loop, and a condition built from two comparisons joined by “and”.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную guess и блок «присвоить guess …», а в поле значения положите «Ввод числа» из «Текст».\n2. Возьмите «повторять, пока …» и переключите его выпадающий список на «повторять, пока не».\n3. Соберите условие: «сравнить» с «≥» (guess и 1), «сравнить» с «≤» (guess и 5), и соедините их блоком «И» из «Логика». Весь этот бутерброд — в поле условия цикла.\n4. Внутрь цикла поставьте второй блок «присвоить guess …» с «Ввод числа» — это повторный вопрос.\n5. После цикла — «Вывести … цвет …» с переменной guess.\n6. Нажмите «▶», введите 9, затем 4: вывод — одна строка 4. Нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable guess and a “set guess to …” block; put the “numeric input” block from Text into its value slot.\n2. Take “repeat while …” and switch its dropdown to “repeat until …”.\n3. Build the condition: a “compare” block with “≥” (guess and 1), another with “≤” (guess and 5), joined by the “and” block from Logic. Put the whole thing into the loop condition slot.\n4. Inside the loop place a second “set guess to …” block with “numeric input” — that is the repeated question.\n5. After the loop add “Print … color …” with the variable guess.\n6. Press “▶”, type 9, then 4: the output is one line, 4. Press “Check solution”.`,
    infoTopics: ["while_until", "user_input"],
    validate: validateLoopWhileInput,
  },
  proj_treasure_hunt: {
    id: "proj_treasure_hunt",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 54: Охота за кладом" : "Task 54: Treasure Hunt",
    description: (lang) =>
      lang === "ru"
        ? `Мини-игра собирает всё вместе: список, случайность, цикл «пока» и счётчик. Герой наугад обходит комнаты, пока не найдёт клад.<br><br>1) Создайте переменную <strong>rooms</strong> со списком <code>dark cave</code>, <code>old castle</code>, <code>green forest</code>, <code>sunny beach</code>.<br>2) Создайте <strong>tries</strong> = <strong>0</strong> и <strong>room</strong> = пустой текст.<br>3) Возьмите <strong>«повторять, пока …»</strong> с условием «room НЕ равно <code>sunny beach</code>». Внутрь цикла: «увеличить tries на 1», затем «присвоить room =» и блок <strong>«в списке rooms взять произвольный»</strong>.<br>4) После цикла напечатайте две строки: <strong>room</strong>, затем <strong>tries</strong>.<br><br>Клад будет найден, как только из четырёх комнат выпадет пляж — обычно за 2–4 попытки, но сколько именно, никто не знает. Поэтому здесь и нужен цикл «пока», а не «повторить 4 раза».<br><br><strong>Что проверяет проверка:</strong> последняя строка обязана быть настоящим числом попыток, а пляж напечатан ровно один раз — значит печать стоит после цикла, а не внутри него.<br><br>★★★ — цикл «пока», случайный выбор из списка, счётчик попытки и две печати после цикла.`
        : `This mini-game puts everything together: a list, randomness, a “while” loop and a counter. The hero wanders through rooms at random until he finds the treasure.<br><br>1) Create the variable <strong>rooms</strong> holding the list <code>dark cave</code>, <code>old castle</code>, <code>green forest</code>, <code>sunny beach</code>.<br>2) Create <strong>tries</strong> = <strong>0</strong> and <strong>room</strong> = empty text.<br>3) Take <strong>“repeat while …”</strong> with the condition “room IS NOT EQUAL TO <code>sunny beach</code>”. Inside the loop: “change tries by 1”, then “set room to” the <strong>“in list rooms get random item”</strong> block.<br>4) After the loop print two lines: <strong>room</strong>, then <strong>tries</strong>.<br><br>The treasure is found as soon as the beach comes up out of the four rooms — usually in 2 to 4 tries, but no one knows the exact number. That is why a “while” loop belongs here, not “repeat 4 times”.<br><br><strong>What the check looks at:</strong> the last line must be a real number of tries, and the beach must be printed exactly once — so the printing sits after the loop, not inside it.<br><br>★★★ — a “while” loop, a random pick from a list, an attempt counter and two prints after the loop.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную rooms и присвойте ей «создать список из» четырёх текстов: dark cave, old castle, green forest, sunny beach.\n2. Создайте tries = 0 и room = пустой текст (блок «создать текст из» без частей или просто поле с пустой строкой).\n3. Возьмите «повторять, пока …» (режим «пока») и поставьте условие «сравнить» со знаком «≠»: слева переменная room, справа текст sunny beach.\n4. Внутрь цикла: «увеличить tries на 1», затем «присвоить room …», а в поле значения — «в списке … взять …» с переменной rooms и режимом «произвольный».\n5. После цикла две печати: «Вывести … цвет …» с room и такой же блок с tries.\n6. Нажмите «▶» и запускайте несколько раз, пока не надоест: первая строка — sunny beach, вторая — число попыток. Нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable rooms and set it to “create list with” four texts: dark cave, old castle, green forest, sunny beach.\n2. Create tries = 0 and room = an empty text (an empty “create text with” block works too).\n3. Take “repeat while …” (the “while” mode) and set the condition to a “compare” block with “≠”: variable room on the left, the text sunny beach on the right.\n4. Inside the loop: “change tries by 1”, then “set room to …” with the “in list … get …” block, the list being rooms and the mode “random item”.\n5. After the loop two prints: “Print … color …” with room, and the same block with tries.\n6. Press “▶” and run it a few times: the first line is sunny beach, the second is the number of tries. Press “Check solution”.`,
    infoTopics: ["while_until", "list_random_choice", "random_numbers"],
    validate: validateTreasureHunt,
  },
};
