// Задачи группы «math»: готовые математические функции, константы,
// округление и ограничение значения (категория «Математика»).
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { typedCodeMode } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

function mathBlockTypes(ws: Blockly.WorkspaceSvg): string[] {
  try {
    return getNonShadowBlocks(ws).map((b) => (b as any).type);
  } catch {
    return [];
  }
}

function mathCountOf(types: string[], type: string): number {
  return types.filter((t) => t === type).length;
}

async function validateMathFunctions(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = mathBlockTypes(ws);
  const single = mathCountOf(types, "math_single");
  const rounded = mathCountOf(types, "math_round");
  const outputOk =
    outputLines.includes("12") &&
    outputLines.includes("7") &&
    outputLines.includes("3") &&
    outputLines.includes("-5");
  const structureOk =
    single >= 3 && mathCountOf(types, "math_constant") >= 1 && rounded >= 2;
  // Программу, набранную в редакторе кода, оцениваем по выводу: блоков нет.
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    // 11 блоков, если числа вписаны в теневые слоты, и 14, если числа —
    // отдельные блоки «число» (оба варианта считаются оптимальными)
    if (single >= 3 && rounded >= 2 && count <= 14) stars = 3;
    else if (count <= 20) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateMathRoundClamp(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const types = mathBlockTypes(ws);
  const rounded = mathCountOf(types, "math_round");
  const clamped = mathCountOf(types, "math_constrain");
  const outputOk =
    outputLines.includes("4") &&
    outputLines.includes("5") &&
    outputLines.includes("100") &&
    outputLines.includes("0");
  const structureOk = rounded >= 4 && clamped >= 2;
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    // 12 блоков с теневыми числами и 16, если четыре числа для «округлить»
    // вынесены в отдельные блоки; 22 — все числа настоящими блоками
    if (rounded >= 4 && clamped >= 2 && count <= 16) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const mathTasks: Pick<TaskRegistry, "math_functions" | "math_round_clamp"> = {
  math_functions: {
    id: "math_functions",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 11: Корень, модуль и число π" : "Task 11: Root, Absolute Value and π",
    description: (lang) =>
      lang === "ru"
        ? `Кроме сложения и умножения компьютер знает готовые функции и числа. Напечатайте четыре строки:<br><br>1) <strong>квадратный корень</strong> из 144, округлённый до целого → <strong>12</strong>;<br>2) <strong>модуль</strong> числа −7, округлённый до целого → <strong>7</strong>;<br>3) математическая <strong>константа π</strong>, округлённая до целого → <strong>3</strong>;<br>4) <strong>противоположное</strong> число к 5 → <strong>−5</strong>.<br><br>Все блоки — в категории «Математика»:<br>• пункты 1, 2 и 4 собираются одним и тем же блоком: в его выпадающем списке «квадратный корень» переключается на «модуль» или на знак «-» (это и есть противоположное число);<br>• пункт 3 — отдельный блок константы: в его списке π, e, φ, sqrt(2) и ∞.<br><br><strong>Зачем округление?</strong> Корень и модуль программа считает в дробных числах: в Python корень из 144 — это 12.0, а не 12. Блок «округлить» превращает ответ в целое, и вывод становится одинаковым на всех четырёх языках.<br><br>★★★ — четыре строки собраны функциями и константой, дробные ответы округлены.`
        : `Beyond addition and multiplication the computer knows ready-made functions and numbers. Print four lines:<br><br>1) the <strong>square root</strong> of 144, rounded to a whole number → <strong>12</strong>;<br>2) the <strong>absolute value</strong> of −7, rounded → <strong>7</strong>;<br>3) the mathematical <strong>constant π</strong>, rounded → <strong>3</strong>;<br>4) the <strong>negation</strong> of 5 → <strong>−5</strong>.<br><br>All the blocks are in the “Math” category:<br>• items 1, 2 and 4 are built with one and the same block: in its dropdown “square root” switches to “absolute value” or to the minus sign “-” (that is the negation);<br>• item 3 is a separate constant block: its list holds π, e, φ, sqrt(2) and ∞.<br><br><strong>Why round?</strong> Roots and absolute values are computed as fractions: in Python the root of 144 is 12.0, not 12. The “round …” block turns the answer into a whole number, and the output becomes identical in all four languages.<br><br>★★★ — four lines built from functions and the constant, fractional answers rounded.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Из «Математика» возьмите «квадратный корень …» и вложите в него число 144. Результат положите в блок «округлить …» (режим «округлить»), а его — в «Вывести … цвет …».\n2. Запустите: должно быть 12. Если видите 12 — хорошо; на другом языке без округления был бы 12.0.\n3. Возьмите такой же блок «квадратный корень …» и переключите его выпадающий список на «модуль», а внутрь вложите число −7 (в поле числа напишите -7). Тоже пропустите через «округлить …» и вложите в «Вывести … цвет …».\n4. Блок константы (на нём написано π) вложите в «округлить …», а результат — в «Вывести … цвет …»: получится 3. В выпадающем списке константы есть e, φ, sqrt(2), sqrt(½) и ∞.\n5. Возьмите третий такой же блок и в его списке переключите «квадратный корень» на знак «-» — это противоположное число. Вложите в него 5 и напечатайте результат. Округление не нужно: противоположное к 5 это −5.\n6. Проверьте вывод: 12, 7, 3, −5 — и нажмите «Проверить решение».`
        : `Step by step:\n1. From Math take “square root …” and put the number 144 inside. Feed the result into a “round …” block (mode: round), and that into “Print … color …”.\n2. Run: you should see 12. Without rounding another language would print 12.0.\n3. Take another copy of the “square root …” block, switch its dropdown to “absolute value” and put −7 inside (type -7 into the number field). Pass it through “round …” too and into “Print … color …”.\n4. Put the constant block (it reads π) into “round …”, then into “Print … color …” — you get 3. Its dropdown also offers e, φ, sqrt(2), sqrt(½) and ∞.\n5. Take a third copy of the same block and switch its dropdown from “square root” to the minus sign “-” — that is the negation. Put 5 inside and print the result. No rounding needed: the negation of 5 is −5.\n6. Check the output: 12, 7, 3, −5 — then press “Check solution”.`,
    infoTopics: ["math_functions"],
    validate: validateMathFunctions,
  },
  math_round_clamp: {
    id: "math_round_clamp",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 10: Округление и границы" : "Task 10: Rounding and Bounds",
    description: (lang) =>
      lang === "ru"
        ? `Округление выбирает ближайшее целое, а ограничение запирает значение в диапазон. Напечатайте шесть строк:<br><br>1) «округлить» 4.4 → <strong>4</strong>;<br>2) «округлить» 4.6 → <strong>5</strong>;<br>3) «округлить к большему» 4.1 → <strong>5</strong>;<br>4) «округлить к меньшему» 4.9 → <strong>4</strong>;<br>5) «ограничить 150 снизу 0 сверху 100» → <strong>100</strong>;<br>6) «ограничить −5 снизу 0 сверху 100» → <strong>0</strong>.<br><br>Блоки — в категории «Математика»: «округлить …» переключает режим в выпадающем списке, «ограничить … снизу … сверху …» принимает сразу три числа.<br><br><strong>Хитрый случай:</strong> ровно посередине (4.5) языки округляют по-разному: JavaScript и PHP дают 5, а Python — 4, потому что округляет к чётному. В задании таких чисел нет, но запомните это — подробный разбор в разделе «Округление и ограничение» под заданием.<br><br>★★★ — шесть строк получены блоками округления и ограничения.`
        : `Rounding picks the nearest whole number; clamping locks a value into a range. Print six lines:<br><br>1) “round” 4.4 → <strong>4</strong>;<br>2) “round” 4.6 → <strong>5</strong>;<br>3) “round up” 4.1 → <strong>5</strong>;<br>4) “round down” 4.9 → <strong>4</strong>;<br>5) “constrain 150 low 0 high 100” → <strong>100</strong>;<br>6) “constrain −5 low 0 high 100” → <strong>0</strong>.<br><br>Both blocks are in the Math category: “round …” switches its mode in a dropdown, and “constrain … low … high …” takes three numbers.<br><br><strong>Tricky case:</strong> exactly in the middle (4.5) languages disagree: JavaScript and PHP give 5, while Python gives 4 because it rounds to even. Such numbers are not in this task, but remember the rule — see the “Rounding and clamping” note below.<br><br>★★★ — six lines produced by rounding and clamping blocks.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Возьмите «округлить …» и вложите число 4.4, режим оставьте «округлить». Результат — в «Вывести … цвет …». Запустите: 4.\n2. Скопируйте блок и поменяйте число на 4.6 → 5. Обратите внимание: 4.5 здесь нет намеренно.\n3. Добавьте ещё два блока «округлить …» и переключите в них выпадающий список: «округлить к большему» для 4.1 даёт 5, «округлить к меньшему» для 4.9 даёт 4.\n4. Возьмите «ограничить … снизу … сверху …»: первое поле — 150, второе — 0, третье — 100. Число больше верхней границы, поэтому ответ 100.\n5. Повторите тот же блок, но в первое поле поставьте -5. Оно ниже нижней границы, поэтому ответ 0.\n6. Проверьте вывод: 4, 5, 5, 4, 100, 0 — и нажмите «Проверить решение».`
        : `Step by step:\n1. Take a “round …” block and put the number 4.4 inside, keeping the “round” mode. Feed it into “Print … color …”. Run: 4.\n2. Copy the block and change the number to 4.6 → 5. Note that 4.5 is deliberately absent.\n3. Add two more “round …” blocks and switch their dropdowns: “round up” on 4.1 gives 5, “round down” on 4.9 gives 4.\n4. Take “constrain … low … high …”: first field 150, second 0, third 100. The number is above the high bound, so the answer is 100.\n5. Use the same block again with -5 in the first field. It is below the low bound, so the answer is 0.\n6. Check the output: 4, 5, 5, 4, 100, 0 — then press “Check solution”.`,
    infoTopics: ["rounding"],
    validate: validateMathRoundClamp,
  },
};
