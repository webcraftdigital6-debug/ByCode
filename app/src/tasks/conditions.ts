// Задачи группы «conditions»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { getAppLang } from "../localization";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText, tryGetAssignedNumber } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateFirstCondition(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let hasSetTemperature = false;
  let hasGetTemperature = false;
  let hasIf = false;
  let hasCompare = false;
  let hasGreaterThanZero = false;
  let hasPrint = false;
  let tempValue: number | null = null;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set") {
      hasSetTemperature = true;
      const n = tryGetAssignedNumber(b);
      if (n !== null) tempValue = n;
    }

    if (t === "variables_get") hasGetTemperature = true;

    if (t === "controls_if") hasIf = true;
    if (t === "logic_compare") {
      hasCompare = true;
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "GT" || op === "GTE") {
          const left =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("A")
              : null;
          const right =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("B")
              : null;
          const isTemp = (x: any) =>
            x && (x as any).type === "variables_get" && getVarFieldText(x) === "temperature";
          const isZero = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "0";
          };
          if ((isTemp(left) && isZero(right)) || (isZero(left) && isTemp(right))) {
            hasGreaterThanZero = true;
          }
        }
      } catch {}
    }

    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const hasWarmOutput = lines.some((l) => l.trim().toLowerCase().includes("the weather is warm"));

  const ok =
    nonShadowBlocks.length === 0
      ? hasWarmOutput
      : hasSetTemperature && hasGetTemperature && hasIf && hasCompare && hasPrint && hasWarmOutput;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = hasGreaterThanZero && hasIf && hasCompare;
    if (usedCore && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateEvenOrOdd(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lang = getAppLang();
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

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let n: number | null = null;
  let hasSetNumber = false;
  let hasGetNumber = false;
  let hasPrint = false;
  let usedIf = false;
  let usedIfElse = false;
  let usedCompare = false;
  let usedModulo = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetNumber = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) n = assigned;
    }
    if (t === "variables_get") hasGetNumber = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_if") {
      usedIf = true;
      try {
        if (typeof (b as any).getInput === "function") {
          const hasElseInput = !!(b as any).getInput("ELSE");
          if (hasElseInput) usedIfElse = true;
        }
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "math_arithmetic") {
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (String(op).toUpperCase().includes("MOD")) usedModulo = true;
      } catch {}
    }
  }

  const ok = (() => {
    if (blocks.length === 0) {
      const hasAnyParity = normalized.some(
        (l) =>
          l.includes("the number is even") ||
          l.includes("the number is odd") ||
          l.includes("число чётное") ||
          l.includes("число четное") ||
          l.includes("число нечётное") ||
          l.includes("число нечетное")
      );
      return hasAnyParity;
    }
    if (!hasSetNumber || !hasGetNumber || !hasPrint) return false;
    if (n === null) return false;
    const parity = n % 2 === 0 ? "even" : "odd";
    const enExpected = `the number is ${parity}`.toLowerCase();
    const ruExpected =
      parity === "even" ? ["число чётное", "число четное"] : ["число нечётное", "число нечетное"];
    const hasEn = normalized.includes(enExpected);
    const hasRu = ruExpected.some((s) => normalized.includes(s));
    if (lang === "ru") return hasRu || hasEn;
    return hasEn || hasRu;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedIfElse && usedCompare && usedModulo;
    if (usedCore && count <= 10) stars = 3;
    else if ((usedIf || usedCompare || usedModulo) && count <= 14) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateTimeOfDay(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lang = getAppLang();
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

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let hour: number | null = null;
  let hasSetHour = false;
  let hasGetHour = false;
  let hasPrint = false;

  let ifBlocksCount = 0;
  let hasElseIfChain = false;
  let hasElseBranch = false;

  let usedCompare = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetHour = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) hour = assigned;
    }
    if (t === "variables_get") hasGetHour = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_if") {
      ifBlocksCount += 1;
      try {
        if (typeof (b as any).getInput === "function") {
          let elseIfCount = 0;
          for (let i = 1; i < 10; i++) {
            if ((b as any).getInput(`IF${i}`)) elseIfCount += 1;
            else break;
          }
          if (elseIfCount >= 2) hasElseIfChain = true;
          if ((b as any).getInput("ELSE")) hasElseBranch = true;
        }
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
  }

  const expectedKey = (() => {
    if (hour === null) return null;
    if (hour >= 6 && hour <= 11) return "morning";
    if (hour >= 12 && hour <= 17) return "afternoon";
    if (hour >= 18 && hour <= 22) return "evening";
    return "night";
  })();

  const ok = (() => {
    if (blocks.length === 0) {
      const hasAnyGreeting = normalized.some(
        (l) =>
          l.includes("good morning") ||
          l.includes("good afternoon") ||
          l.includes("good evening") ||
          l.includes("good night") ||
          l.includes("доброе утро") ||
          l.includes("добрый день") ||
          l.includes("добрый вечер") ||
          l.includes("спокойной ночи") ||
          l.includes("доброй ночи")
      );
      return hasAnyGreeting;
    }
    if (!hasSetHour || !hasGetHour || !hasPrint) return false;
    if (!expectedKey) return false;
    const enExpected =
      expectedKey === "morning"
        ? "good morning"
        : expectedKey === "afternoon"
          ? "good afternoon"
          : expectedKey === "evening"
            ? "good evening"
            : "good night";
    const ruExpected =
      expectedKey === "morning"
        ? ["доброе утро"]
        : expectedKey === "afternoon"
          ? ["добрый день"]
          : expectedKey === "evening"
            ? ["добрый вечер"]
            : ["спокойной ночи", "доброй ночи"];

    const hasEn = normalized.some((l) => l.includes(enExpected));
    const hasRu = ruExpected.some((s) => normalized.some((l) => l.includes(s)));
    if (lang === "ru") return hasRu || hasEn;
    return hasEn || hasRu;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = ifBlocksCount === 1 && hasElseIfChain && hasElseBranch && usedCompare;
    if (usedCore && count <= 18) stars = 3;
    else if (count <= 26) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

function logicBlockTypes(ws: Blockly.WorkspaceSvg): string[] {
  try {
    return getNonShadowBlocks(ws).map((b) => (b as any).type);
  } catch {
    return [];
  }
}

function logicCountOf(types: string[], type: string): number {
  return types.filter((t) => t === type).length;
}

async function validateLogicAndOrNot(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = logicBlockTypes(ws);
  const yes = outputLines.filter((l) => l.trim() === "YES").length;
  const no = outputLines.filter((l) => l.trim() === "NO").length;
  const ok =
    logicCountOf(types, "logic_operation") >= 2 &&
    logicCountOf(types, "logic_negate") >= 1 &&
    yes === 1 &&
    no === 2;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 20)
      stars = 3; // 3 × (если + два блока вывода) + логика + сравнения
    else if (count <= 26) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

/** Число блоков «… и …» / «… или …» с нужным режимом (OP = AND или OR). */
function logicOperationCount(ws: Blockly.WorkspaceSvg, op: string): number {
  try {
    return getNonShadowBlocks(ws).filter(
      (b: any) => b.type === "logic_operation" && String(b.getFieldValue("OP")) === op
    ).length;
  } catch {
    return 0;
  }
}

async function validateLogicGateCheck(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = logicBlockTypes(ws);
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  const ok =
    logicOperationCount(ws, "AND") >= 1 &&
    logicOperationCount(ws, "OR") >= 1 &&
    logicCountOf(types, "logic_negate") >= 1 &&
    logicCountOf(types, "controls_if") >= 3 &&
    logicCountOf(types, "logic_compare") >= 5 &&
    logicCountOf(types, "variables_set") >= 2 &&
    lines.slice(0, 3).join(",") === "YES,NO,YES" &&
    lines.length === 3;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 30) stars = 3;
    else if (count <= 38) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateLogicTernary(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = logicBlockTypes(ws);
  const ternary = logicCountOf(types, "logic_ternary");
  const ok =
    ternary >= 2 &&
    logicCountOf(types, "logic_null") >= 1 &&
    logicCountOf(types, "text_isEmpty") >= 1 &&
    outputLines.includes("MORE") &&
    outputLines.includes("EMPTY") &&
    outputLines.includes("NO VALUE");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (ternary >= 3 && count <= 13)
      stars = 3; // три блока вывода + три тернарных + их условия
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const conditionsTasks: Pick<
  TaskRegistry,
  | "first_condition"
  | "even_or_odd"
  | "time_of_day"
  | "logic_and_or_not"
  | "logic_gate_check"
  | "logic_ternary_task"
> = {
  first_condition: {
    id: "first_condition",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 10: Первое условие" : "Task 10: First condition"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>temperature</strong> и сохраните в неё какое-либо число. Задача: проверьте, что температура выше нуля. Если это так — выведите фразу <strong>"The weather is warm"</strong>. Если нет — не выводите ничего.'
        : 'Create a variable <strong>temperature</strong> and store any number in it. Task: check that the temperature is above zero. If yes, print <strong>"The weather is warm"</strong>. If not, print nothing.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную temperature и присвойте ей число больше нуля (например, 25).\n2. В категории «Логика» возьмите блок «если».\n3. В условие блока вложите сравнение: блок «>» из «Логика» — влево переменную temperature, вправо число 0.\n4. Внутрь блока «если» вложите «Вывести … цвет …» с фразой The weather is warm и нажмите «▶», затем «Проверить решение»."
        : "Step by step:\n1. Create a variable temperature and set it to a number greater than zero (e.g. 25).\n2. In the Logic category take the “if” block.\n3. Put a comparison in the condition: a “>” block from Logic — temperature on the left, 0 on the right.\n4. Put “Print … color …” with the phrase The weather is warm inside the “if” block, press “▶”, then “Check solution”.",
    validate: validateFirstCondition,
  },
  even_or_odd: {
    id: "even_or_odd",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 11: Чётное или нечётное" : "Task 11: Even or Odd"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>number</strong> и сохраните в неё любое целое число. Напишите программу, которая определяет, является ли число <strong>чётным</strong> или <strong>нечётным</strong>, и выводит сообщение:<br><br>Если число чётное, выведите <strong>"Число чётное"</strong> (или <strong>"The number is even"</strong>).<br>Если число нечётное, выведите <strong>"Число нечётное"</strong> (или <strong>"The number is odd"</strong>).'
        : 'Create a variable <strong>number</strong> and store any integer in it. Determine whether the number is <strong>even</strong> or <strong>odd</strong>, and print a message:<br><br>If even, print <strong>"The number is even"</strong>.<br>If odd, print <strong>"The number is odd"</strong>.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную number и присвойте ей целое число.\n2. Возьмите блок «если … иначе» из «Логика» (нажмите шестерёнку и добавьте «иначе»).\n3. Условие чётности: из «Математики» блок «остаток от … ÷ …» (number ÷ 2) и сравнение равно 0 из «Логика». Или блок «нечётное?/чётное?» из «Математики».\n4. В ветку «если» вложите «Вывести … цвет …» с «The number is even», в «иначе» — с «The number is odd»."
        : "Step by step:\n1. Create a variable number and set it to any integer.\n2. Take the “if … else” block from Logic (click the gear and add “else”).\n3. Even check: “remainder of … ÷ …” (number ÷ 2) from Math compared to 0 with “=” from Logic, or the “is even” block from Math.\n4. Put “Print … color …” with “The number is even” in the if branch and “The number is odd” in the else branch.",
    validate: validateEvenOrOdd,
  },
  time_of_day: {
    id: "time_of_day",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 15: Время суток" : "Task 15: Time of Day"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>hour</strong> и сохраните в неё текущий час (число от <strong>0</strong> до <strong>23</strong>). Напишите программу, которая определяет время суток и выводит сообщение:<br><br>Если <strong>hour</strong> от <strong>6</strong> до <strong>11</strong> → <strong>"Good morning!"</strong><br>Если <strong>hour</strong> от <strong>12</strong> до <strong>17</strong> → <strong>"Good afternoon!"</strong><br>Если <strong>hour</strong> от <strong>18</strong> до <strong>22</strong> → <strong>"Good evening!"</strong><br>Иначе → <strong>"Good night!"</strong>'
        : 'Create a variable <strong>hour</strong> and store the current hour (0 to 23). Determine the time of day and print:<br><br>If <strong>hour</strong> is 6..11 → <strong>"Good morning!"</strong><br>If 12..17 → <strong>"Good afternoon!"</strong><br>If 18..22 → <strong>"Good evening!"</strong><br>Else → <strong>"Good night!"</strong>',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную hour и присвойте ей число от 0 до 23 (например, 9).\n2. Возьмите блок «если» из «Логика», нажмите шестерёнку и добавьте два «иначе если» и один «иначе».\n3. Проверка диапазона: блок «и» из «Логика» объединяет два сравнения — «hour ≥ 6» и «hour ≤ 11». Аналогично для 12..17 и 18..22.\n4. В каждую ветку вставьте «Вывести … цвет …»: «Good morning!», «Good afternoon!», «Good evening!», в «иначе» — «Good night!».\n5. Запустите код и проверьте вывод."
        : "Step by step:\n1. Create a variable hour and set it to a number from 0 to 23 (e.g. 9).\n2. Take the “if” block from Logic, click the gear and add two “else if” and one “else”.\n3. Range check: the “and” block from Logic combines two comparisons — “hour ≥ 6” and “hour ≤ 11”. The same for 12..17 and 18..22.\n4. Put “Print … color …” in each branch: “Good morning!”, “Good afternoon!”, “Good evening!”, and “Good night!” in else.\n5. Run the code and check the output.",
    validate: validateTimeOfDay,
  },
  logic_and_or_not: {
    id: "logic_and_or_not",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 12: И, ИЛИ, НЕ" : "Task 12: AND, OR, NOT"),
    description: (lang) =>
      lang === "ru"
        ? `Условия можно объединять. Число <strong>14</strong> уже «знает» компьютер — проверьте три утверждения и напечатайте по строке на каждое: <strong>YES</strong>, если утверждение верно, и <strong>NO</strong>, если неверно.<br><br>1) «14 больше 10 <strong>И</strong> 14 меньше 12» — блок «… и …»;<br>2) «14 больше 20 <strong>ИЛИ</strong> 14 меньше 15» — блок «… или …»;<br>3) <strong>НЕ</strong> «14 больше 13» — блок «не …».<br><br>Правильный вывод — три строки: <strong>NO</strong>, <strong>YES</strong>, <strong>NO</strong>.<br><br>«И» требует, чтобы выполнились <strong>обе</strong> части; «ИЛИ» довольствуется <strong>одной</strong>; «НЕ» переворачивает ответ. Про слова YES и NO: их печатают буквами, чтобы вывод не зависел от языка интерфейса.<br><br>★★★ — три проверки собраны блоками «и», «или» и «не».`
        : `Conditions combine. The computer already knows the number <strong>14</strong> — check three statements and print one line each: <strong>YES</strong> when the statement holds, <strong>NO</strong> when it does not.<br><br>1) “14 is greater than 10 <strong>AND</strong> 14 is less than 12” — the “… and …” block;<br>2) “14 is greater than 20 <strong>OR</strong> 14 is less than 15” — the “… or …” block;<br>3) <strong>NOT</strong> “14 is greater than 13” — the “not …” block.<br><br>The correct output is three lines: <strong>NO</strong>, <strong>YES</strong>, <strong>NO</strong>.<br><br>AND needs <strong>both</strong> parts to hold; OR is happy with <strong>one</strong>; NOT flips the answer. YES and NO are printed in capital letters so the output does not depend on the interface language.<br><br>★★★ — all three checks are built with the and, or and not blocks.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Возьмите «если … иначе» (в «Логика» нажмите шестерёнку блока «если» и включите «иначе»). Условие соберите блоком «… и …»: в левую часть — сравнение «14 > 10», в правую — «14 < 12». Сравнения — блок «= … > …» из «Логика», числа в него вставляются серыми подсказками.\n2. В ветку «если» положите «Вывести … цвет …» с текстом YES, в ветку «иначе» — с текстом NO. Запустите: 14 не меньше 12, значит правильная ветка — «иначе», вывод NO.\n3. Поставьте ниже ещё один «если … иначе», а условие сложите из блока «… или …»: «14 > 20» или «14 < 15». Первая часть ложна, вторая истинна → ИЛИ даёт истину → YES.\n4. И ещё один «если … иначе»: возьмите «не …» и вложите в него сравнение «14 > 13» (оно истинно). «не» переворачивает → NO.\n5. Проверьте вывод: NO, YES, NO — ровно три строки, именно в таком порядке.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. Take “if … else” (in Logic click the gear of the “if” block and enable “else”). Build the condition with the “… and …” block: left side the comparison “14 > 10”, right side “14 < 12”. Comparisons come from the “= … > …” block in Logic; the numbers drop in as grey shadow fields.\n2. Put “Print … color …” with YES into the if branch and another with NO into the else branch. Run: 14 is not less than 12, so the else branch wins and the output is NO.\n3. Add another “if … else” below it and build its condition from the “… or …” block: “14 > 20” or “14 < 15”. The first part is false, the second true → OR is true → YES.\n4. One more “if … else”: take “not …” and put the comparison “14 > 13” (true) inside it. NOT flips it → NO.\n5. Check the output: NO, YES, NO — exactly three lines in that order.\n6. Press “Check solution”.`,
    infoTopics: ["boolean_logic"],
    validate: validateLogicAndOrNot,
  },
  logic_gate_check: {
    id: "logic_gate_check",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 13: Пропуск в Гильдию" : "Task 13: Guild Entry Check",
    description: (lang) =>
      lang === "ru"
        ? `Разминка следопыта: в Гильдию пускают, только если выполнены два условия сразу. Создайте переменную <strong>level</strong> со значением <strong>20</strong> и переменную <strong>reputation</strong> со значением <strong>60</strong>.<br><br>Напечатайте три строки — <strong>YES</strong>, если условие выполнено, и <strong>NO</strong>, если нет:<br>1) «уровень &ge; 15 <strong>И</strong> репутация <strong>больше</strong> 50» → <strong>YES</strong>;<br>2) «уровень &ge; 30 <strong>ИЛИ</strong> репутация &ge; 100» → <strong>NO</strong>;<br>3) <strong>НЕ</strong> «уровень меньше 10» → <strong>YES</strong>.<br><br>Каждую строку собирайте блоком «если … иначе», а условие — блоками «… и …», «… или …» и «не …» из «Логика». Сравнения берите из блока «= … &gt; …» и подставляйте в него переменные.<br><br>Правильный вывод — три строки по порядку: <strong>YES</strong>, <strong>NO</strong>, <strong>YES</strong>.<br><br><strong>Зачем переменные:</strong> в прошлой задаче числа стояли прямо в блоках, а здесь значения живут в переменных. Герой качается — и проверка сама подхватывает новые числа, стоит поменять level или reputation.<br><br>★★★ — все три условия собраны «и», «или» и «не» по переменным.`
        : `A scout warm-up: the Guild lets you in only when two conditions hold at once. Create the variable <strong>level</strong> with the value <strong>20</strong> and the variable <strong>reputation</strong> with the value <strong>60</strong>.<br><br>Print three lines — <strong>YES</strong> when the statement holds, <strong>NO</strong> when it does not:<br>1) “level &ge; 15 <strong>AND</strong> reputation is <strong>greater than</strong> 50” → <strong>YES</strong>;<br>2) “level &ge; 30 <strong>OR</strong> reputation &ge; 100” → <strong>NO</strong>;<br>3) <strong>NOT</strong> “level is less than 10” → <strong>YES</strong>.<br><br>Build each line with the “if … else” block, and the condition with the “… and …”, “… or …” and “not …” blocks from Logic. Take the comparisons from the “= … &gt; …” block and put the variables into it.<br><br>The correct output is three lines in order: <strong>YES</strong>, <strong>NO</strong>, <strong>YES</strong>.<br><br><strong>Why variables:</strong> in the previous task the numbers sat right inside the blocks; here the values live in variables. The hero levels up and the check picks the new numbers up as soon as you change level or reputation.<br><br>★★★ — all three conditions combine variables with and, or and not.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную level и присвойте ей 20; создайте reputation и присвойте ей 60.\n2. Возьмите «если … иначе» (нажмите шестерёнку блока «если» и включите «иначе»). Условие — блок «… и …»: слева сравнение «level &ge; 15», справа «reputation &gt; 50». Сравнения — из блока «= … &gt; …», в левое поле переменная, в правое — число.\n3. В ветку «если» поставьте «Вывести … цвет …» с YES, в «иначе» — с NO. 20 &ge; 15 и 60 &gt; 50: обе части истинны, значит «и» истинно → YES.\n4. Поставьте ниже ещё один «если … иначе», но с блоком «… или …»: «level &ge; 30» и «reputation &ge; 100». Обе части ложны → ИЛИ ложно → NO.\n5. И ещё один «если … иначе»: блок «не …», а внутрь него сравнение «level &lt; 10». Оно ложно, «не» переворачивает ответ → YES.\n6. Сверьте вывод: YES, NO, YES — ровно три строки в этом порядке, и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable level and set it to 20; create reputation and set it to 60.\n2. Take the “if … else” block (click the gear on “if” and enable “else”). The condition is the “… and …” block: on the left the comparison “level &ge; 15”, on the right “reputation &gt; 50”. Comparisons come from the “= … &gt; …” block — variable in the left slot, number in the right one.\n3. Put “Print … color …” with YES into the if branch and another with NO into the else branch. 20 &ge; 15 and 60 &gt; 50: both parts are true, so AND is true → YES.\n4. Add another “if … else” below it and use the “… or …” block there: “level &ge; 30” and “reputation &ge; 100”. Both parts are false → OR is false → NO.\n5. One more “if … else”: the “not …” block with the comparison “level &lt; 10” inside it. That comparison is false, and NOT flips it → YES.\n6. Check the output: YES, NO, YES — exactly three lines in that order — then press “Check solution”.`,
    infoTopics: ["boolean_logic"],
    validate: validateLogicGateCheck,
  },
  logic_ternary_task: {
    id: "logic_ternary_task",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 14: Выбор без «если»" : "Task 14: Choosing without if",
    description: (lang) =>
      lang === "ru"
        ? `Блок «если» занимает место и просит ветки. Часто вместо него хватает <strong>тернарного выбора</strong> — блока, который сам является значением: «выбрать по условию: если истина — одно, если ложь — другое». Напечатайте три строки:<br><br>1) «7 больше 3» → выбрать <strong>MORE</strong>, иначе LESS;<br>2) блок <strong>«… пуст»</strong> для пустого текста «» → выбрать <strong>EMPTY</strong>, иначе NOT EMPTY;<br>3) создайте переменную <strong>answer</strong> и <strong>не присваивайте</strong> ей ничего; сравните её с блоком <strong>«ничто»</strong> (null) → выбрать <strong>NO VALUE</strong>, иначе HAS VALUE.<br><br>Правильный вывод: <strong>MORE</strong>, <strong>EMPTY</strong>, <strong>NO VALUE</strong> — и ни одного блока «если».<br><br>★★★ — все три строки собраны блоками «выбрать по», без «если».`
        : `The “if” block takes space and demands branches. Often a <strong>ternary choice</strong> is enough — a block that is itself a value: “test a condition: if true take one thing, if false take the other”. Print three lines:<br><br>1) “7 is greater than 3” → pick <strong>MORE</strong>, otherwise LESS;<br>2) the <strong>“… is empty”</strong> block applied to the empty text “” → pick <strong>EMPTY</strong>, otherwise NOT EMPTY;<br>3) create a variable <strong>answer</strong> and <strong>do not assign</strong> it anything; compare it with the <strong>“null”</strong> block → pick <strong>NO VALUE</strong>, otherwise HAS VALUE.<br><br>The correct output: <strong>MORE</strong>, <strong>EMPTY</strong>, <strong>NO VALUE</strong> — and not a single “if” block.<br><br>★★★ — all three lines use the “test … if true … if false …” block, no “if”.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Логика» найдите блок «выбрать по … | если истина … | если ложь …» — это тернарный выбор. Он короче блока «если» и вставляется внутрь других блоков, потому что сам является значением.\n2. В поле «выбрать по» — сравнение «7 > 3», в «если истина» — текст MORE, в «если ложь» — LESS. Вложите весь блок в «Вывести … цвет …». Запустите: MORE.\n3. Поставьте ниже ещё один блок «выбрать по»: условие — блок «… пуст» из «Текст» с пустым текстом внутри, «если истина» — EMPTY, «если ложь» — NOT EMPTY.\n4. И ещё один «выбрать по»: создайте переменную answer (категория «Переменные») и больше ничего ей не присваивайте. Условие — сравнение «answer = ничто»: блок «= … > …» из «Логика», слева переменная, справа блок «ничто».\n5. «если истина» — NO VALUE, «если ложь» — HAS VALUE. Запустите: сравнение истинно, потому что значения у переменной нет.\n6. Проверьте вывод (MORE, EMPTY, NO VALUE) и нажмите «Проверить решение».`
        : `Step by step:\n1. In the Logic category find the “test … | if true … | if false …” block — that is the ternary choice. It is shorter than the “if” command and it fits inside other blocks because it is itself a value.\n2. The “test” field takes the comparison “7 > 3”, “if true” takes the text MORE, “if false” takes LESS. Wrap the whole block in “Print … color …”. Run: MORE.\n3. Add another “test” block below it: the condition is the “… is empty” block from Text with an empty text inside, “if true” EMPTY, “if false” NOT EMPTY.\n4. One more “test” block: create the variable answer (Variables category) and never assign it anything. The condition is “answer = null”: the “= … > …” block from Logic, the variable on the left, the “null” block on the right.\n5. “if true” NO VALUE, “if false” HAS VALUE. Run: the comparison is true because the variable holds no value.\n6. Check the output (MORE, EMPTY, NO VALUE) and press “Check solution”.`,
    infoTopics: ["ternary_null"],
    validate: validateLogicTernary,
  },
};
