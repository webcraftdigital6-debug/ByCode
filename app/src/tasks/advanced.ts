// Задачи группы «advanced»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText, typedCodeMode } from "./utils";
import type { TaskRegistry } from "./types";

async function validateNumberAnalyzer(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines().map((l) => l.trim());

  const nonShadowBlocks = getNonShadowBlocks(ws);

  const tryGetAssignedInt = (setBlock: any): number | null => {
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
      if (!Number.isFinite(n)) return null;
      if (!Number.isInteger(n)) return null;
      return n;
    } catch {
      return null;
    }
  };

  let n: number | null = null;
  let hasSetNumber = false;
  let hasGetNumber = false;
  let usedIfElse = false;
  let usedCompare = false;
  let usedModulo = false;
  let hasPrint = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "number") {
      hasSetNumber = true;
      const cand = tryGetAssignedInt(b);
      if (cand !== null) n = cand;
    }
    if (t === "variables_get" && getVarFieldText(b) === "number") hasGetNumber = true;

    if (t === "controls_if") {
      try {
        const elseCount = typeof (b as any).elseCount_ === "number" ? (b as any).elseCount_ : 0;
        const hasElseInput =
          typeof (b as any).getInput === "function" && !!(b as any).getInput("ELSE");
        if (elseCount > 0 || hasElseInput) usedIfElse = true;
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const expected = (() => {
    if (n === null) return null;
    const parity = n % 2 === 0 ? "even" : "odd";
    const sign = n > 0 ? "positive" : n < 0 ? "negative" : "zero";
    return {
      evenLine: `The number is ${parity}`.toLowerCase(),
      signLine: `The number is ${sign}`.toLowerCase(),
      ruEvenLine: n % 2 === 0 ? "Число чётное".toLowerCase() : "Число нечётное".toLowerCase(),
      ruSignLine:
        n > 0
          ? "Число положительное".toLowerCase()
          : n < 0
            ? "Число отрицательное".toLowerCase()
            : "Число равно нулю".toLowerCase(),
    };
  })();

  const normalized = lines.map((l) => l.replace(/[.!]+$/g, "").toLowerCase());

  const hasParityLine = (() => {
    if (!expected) return false;
    return normalized.includes(expected.evenLine) || normalized.includes(expected.ruEvenLine);
  })();

  const hasSignLine = (() => {
    if (!expected) return false;
    return normalized.includes(expected.signLine) || normalized.includes(expected.ruSignLine);
  })();

  // В режиме кода блоков нет, а число ученик выбирает сам: сверяем между собой
  // сами строки-факты (чётность и знак не должны противоречить друг другу).
  const PARITY = new Map<string, "even" | "odd">([
    ["the number is even", "even"],
    ["the number is odd", "odd"],
    ["число чётное", "even"],
    ["число нечётное", "odd"],
  ]);
  const SIGN = new Map<string, "positive" | "negative" | "zero">([
    ["the number is positive", "positive"],
    ["the number is negative", "negative"],
    ["the number is zero", "zero"],
    ["число положительное", "positive"],
    ["число отрицательное", "negative"],
    ["число равно нулю", "zero"],
  ]);
  const said = <T,>(table: Map<string, T>): T[] =>
    normalized.flatMap((l) => {
      const value = table.get(l);
      return value === undefined ? [] : [value];
    });
  const paritySaid = said(PARITY);
  const signSaid = said(SIGN);
  const factPairOk =
    paritySaid.length >= 1 &&
    signSaid.length >= 1 &&
    !(paritySaid.includes("odd") && signSaid.includes("zero"));

  const codeMode = typedCodeMode(ws);
  const outputOk = codeMode ? factPairOk : hasParityLine && hasSignLine;
  const structureOk = hasSetNumber && hasGetNumber && hasPrint && n !== null;

  const ok = outputOk && (codeMode || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedIfElse && usedCompare && usedModulo;
    if (usedCore && count <= 18) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSumArray(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const ok = lines.some((l) => /(^|\b)15(\b|$)/.test(l));

  // Эвристика по звёздам: либо SUM через math_on_list, либо суммирование в цикле forEach
  let usedMathOnList = false;
  let usedForEach = false;
  let usedListCreate = false;
  try {
    const blocks = getNonShadowBlocks(ws);
    for (const b of blocks) {
      const t = (b as any).type;
      if (t === "lists_create_with") usedListCreate = true;
      if (t === "controls_forEach") usedForEach = true;
      if (t === "math_on_list") usedMathOnList = true;
    }
  } catch {}

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedMathOnList && usedListCreate && count <= 6) stars = 3;
    else if (usedForEach && usedListCreate && count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateMinMax(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const hasMin = lines.some((l) => /min\s*[:=]\s*1/i.test(l) || l.trim() === "1");
  const hasMax = lines.some((l) => /max\s*[:=]\s*9/i.test(l) || l.trim() === "9");
  const ok = hasMin && hasMax;

  let usedMathOnList = false;
  let usedMin = false;
  let usedMax = false;
  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    if ((b as any).type === "math_on_list") {
      usedMathOnList = true;
      // в разных версиях Blockly используется поле OP или MODE
      const mode =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP") || (b as any).getFieldValue("MODE")
          : undefined;
      if (String(mode).toUpperCase().includes("MIN")) usedMin = true;
      if (String(mode).toUpperCase().includes("MAX")) usedMax = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedMathOnList && usedMin && usedMax && count <= 8) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateCharFreq(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<{ ok: boolean; stars: number }> {
  const lines = outputLines;
  const need = { a: 3, b: 4, c: 1 } as Record<string, number>;
  const checks = Object.entries(need).map(([ch, n]) =>
    lines.some((l) => new RegExp(`${ch}\\s*[:=]\\s*${n}`, "i").test(l))
  );
  const ok = checks.every(Boolean);

  // Эвристика: желательно использовать блоки словаря или «подсчитать количество»
  let usedDict = false;
  let usedTextCount = false;
  const dictBlocks = getNonShadowBlocks(ws);
  for (const b of dictBlocks) {
    const t = (b as any).type;
    if (t === "dict_create" || t === "dict_set" || t === "dict_get" || t === "dict_has_key") {
      usedDict = true;
    }
    if (t === "text_count") usedTextCount = true;
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if ((usedDict || usedTextCount) && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const advancedTasks: Pick<
  TaskRegistry,
  "a1_number_analyzer" | "sum_array" | "min_max" | "char_freq"
> = {
  a1_number_analyzer: {
    id: "a1_number_analyzer",
    difficulty: "advanced",
    title: (lang) => (lang === "ru" ? "Задача A1: Анализ числа" : "Task A1: Number Analyzer"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>number</strong> и сохраните в неё любое целое число. Программа должна определить и вывести два факта о нём (каждый с новой строки):<br>1) чётное или нечётное (например, <strong>"The number is even"</strong>)<br>2) положительное, отрицательное или ноль (например, <strong>"The number is positive"</strong>).'
        : 'Create a variable <strong>number</strong> and store any integer in it. Print two facts (each on a new line):<br>1) even or odd (e.g. <strong>"The number is even"</strong>)<br>2) positive, negative, or zero (e.g. <strong>"The number is positive"</strong>).',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную number и присвойте ей любое целое число (например, 7 или -4).\n2. Чётность: блок «если/иначе» из «Логика» с условием «остаток от number ÷ 2 = 0» → в ветках «The number is even» / «The number is odd».\n3. Знак: второй блок «если/иначе если/иначе» — сравнение number > 0 → «The number is positive», number < 0 → «The number is negative», иначе → «The number is zero».\n4. Каждая строка выводится через «Вывести … цвет …»."
        : "Step by step:\n1. Create a variable number and set it to any integer (e.g. 7 or -4).\n2. Parity: an “if/else” block from Logic with condition “remainder of number ÷ 2 = 0” → branches print “The number is even” / “The number is odd”.\n3. Sign: a second “if/else if/else” — compare number > 0 → “The number is positive”, number < 0 → “The number is negative”, else → “The number is zero”.\n4. Each line is printed with “Print … color …”.",
    infoTopics: ["console_output"],
    validate: validateNumberAnalyzer,
  },
  sum_array: {
    id: "sum_array",
    difficulty: "advanced",
    title: (lang) => (lang === "ru" ? "Задача A2: Сумма массива" : "Task A2: Array sum"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и выведите их сумму: <strong>15</strong>. Можно использовать блоки из категории Списки/Математика или цикл."
        : "Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and print their sum: <strong>15</strong>. You may use list/math blocks or a loop.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 1 2 3 4 5» (блок из «Списки»).\n2. В «Математика» возьмите блок «сумма списка», в его поле вложите переменную list — он сразу посчитает сумму всех элементов.\n3. Присвойте результат переменной sum.\n4. Выведите sum через «Вывести … цвет …» — получится 15."
        : "Step by step:\n1. Create a variable list with “create list with 1 2 3 4 5” (a Lists block).\n2. In Math take the “sum of list” block and put variable list inside — it computes the sum of all items right away.\n3. Assign the result to variable sum.\n4. Print sum with “Print … color …” — it becomes 15.",
    infoTopics: ["console_output"],
    validate: validateSumArray,
  },
  min_max: {
    id: "min_max",
    difficulty: "advanced",
    title: (lang) => (lang === "ru" ? "Задача A3: Минимум и максимум" : "Task A3: Min and Max"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте список <code>[5, 1, 9, 3, 7]</code> и выведите минимальное и максимальное значения: <strong>min=1</strong> и <strong>max=9</strong>. Допустимо выводить в одну строку или в две."
        : "Create a list <code>[5, 1, 9, 3, 7]</code> and print min and max: <strong>min=1</strong> and <strong>max=9</strong>. One or two lines are fine.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную list и присвойте ей «создать список из 5 1 9 3 7» (блок из «Списки»).\n2. В «Математика» возьмите блок «сумма списка» и в выпадающем списке дважды создайте копии: выберите «наименьшее в списке» и «наибольшее в списке», вложив в обе переменную list.\n3. Присвойте результаты переменным min и max.\n4. Выведите через «Вывести … цвет …»: min=1 и max=9 (в одну строку или в две)."
        : "Step by step:\n1. Create a variable list with “create list with 5 1 9 3 7” (a Lists block).\n2. In Math take the “math on list” block and make two copies via the dropdown: choose “minimum of list” and “maximum of list”, putting variable list into both.\n3. Assign the results to variables min and max.\n4. Print with “Print … color …”: min=1 and max=9 (one or two lines).",
    infoTopics: ["console_output"],
    validate: validateMinMax,
  },
  char_freq: {
    id: "char_freq",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача A4: Частоты символов" : "Task A4: Character frequencies",
    description: (lang) =>
      lang === "ru"
        ? 'Подсчитайте частоты символов в строке <code>"abcaabbb"</code> и выведите результат, например: <strong>a:3 b:4 c:1</strong> (формат вывода свободный). Удобно использовать блок <strong>«подсчитать количество … в …»</strong> из категории «Текст».'
        : 'Count character frequencies in the string <code>"abcaabbb"</code> and print the result, e.g. <strong>a:3 b:4 c:1</strong> (any clear format). The <strong>“count the number of … in …”</strong> block from Text is handy here.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную text и присвойте ей строку abcaabbb (блок «создать текст из» из «Текст» или просто значение).\n2. Для каждого символа (a, b, c) возьмите блок «подсчитать количество … в …» из «Текст»: в первое поле — букву, во второе — переменную text.\n3. Соберите строку вывода: «создать текст из» — например, «a:», результат подсчёта — и вложите в «Вывести … цвет …».\n4. Вывод может быть в свободном формате, например: a:3 b:4 c:1."
        : "Step by step:\n1. Create a variable text and assign the string abcaabbb to it (use the “create text with” block from Text or a plain value).\n2. For each letter (a, b, c) take the “count the number of … in …” block from Text: the letter in the first field, variable text in the second.\n3. Build the output line: “create text with” — e.g. “a:”, the count result — and put it into “Print … color …”.\n4. Any output format is fine, e.g.: a:3 b:4 c:1.",
    validate: validateCharFreq,
    infoTopics: ["dict"],
  },
};
