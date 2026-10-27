// Задачи группы «in»: программы, которые спрашивают значение у ученика.
// Блоки «Ввод текста» и «Ввод числа» читают ответ через модальное окно, а окно
// вывода печатает подтверждённый ответ строкой вида «> ответ». Валидаторы
// восстанавливают из этих строк введённые значения и сверяют печать программы
// с настоящими ответами — иначе задачу с вводом нельзя проверить ничем, кроме
// формы строки.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import {
  printsGreetingWith,
  splitEchoInput,
  typedCodeMode,
} from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

type AnyBlock = {
  type: string;
  getFieldValue?: (name: string) => unknown;
  getInput?: (name: string) => unknown;
  elseCount_?: unknown;
};

/** Что ученик собрал: счётчики блоков и редкие математические операции. */
type Shape = {
  textInput: number;
  numInput: number;
  sets: number;
  prints: number;
  join: number;
  compare: number;
  ifCount: number;
  ifElse: number;
  forLoop: number;
  repeat: number;
  add: boolean;
  multiply: boolean;
};

/** Есть ли у блока «если» ветка «иначе». */
function hasElseBranch(block: AnyBlock): boolean {
  return Number(block.elseCount_ ?? 0) > 0 || !!block.getInput?.("ELSE");
}

function scanShape(ws: Blockly.WorkspaceSvg): Shape {
  const s: Shape = {
    textInput: 0,
    numInput: 0,
    sets: 0,
    prints: 0,
    join: 0,
    compare: 0,
    ifCount: 0,
    ifElse: 0,
    forLoop: 0,
    repeat: 0,
    add: false,
    multiply: false,
  };
  for (const b of getNonShadowBlocks(ws) as AnyBlock[]) {
    switch (b.type) {
      case "py_input":
        s.textInput += 1;
        break;
      case "py_input_number":
        s.numInput += 1;
        break;
      case "variables_set":
        s.sets += 1;
        break;
      case "add_text":
      case "text_print":
        s.prints += 1;
        break;
      case "text_join":
      case "text_append":
        s.join += 1;
        break;
      case "logic_compare":
        s.compare += 1;
        break;
      case "controls_if":
        s.ifCount += 1;
        if (hasElseBranch(b)) s.ifElse += 1;
        break;
      case "controls_for":
      case "controls_forEach":
        s.forLoop += 1;
        break;
      case "controls_repeat_ext":
      case "controls_repeat":
        s.repeat += 1;
        break;
      case "math_arithmetic": {
        const op = String(b.getFieldValue?.("OP") ?? "");
        if (op === "ADD") s.add = true;
        if (op === "MULTIPLY") s.multiply = true;
        break;
      }
      default:
        break;
    }
  }
  return s;
}

/** Число из строки: запятая как разделитель допустима («7,5»). */
function toNumber(text: string): number {
  return Number(String(text).trim().replace(",", "."));
}

/** Число в конце строки: «7 × 3 = 21» → 21, «Какое число?» → NaN. */
function trailingNumber(line: string): number {
  const m = /(-?\d+(?:[.,]\d+)?)\s*$/.exec(line.trim());
  return m ? toNumber(m[1]) : NaN;
}

/** Целое без постороннего текста: «12» → 12, «шаг 12» → null. */
function bareInteger(line: string): number | null {
  const m = /^(-?\d+)$/.exec(line.trim());
  return m ? Number(m[1]) : null;
}

const sameNumber = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

/**
 * Ответы ученика из строк «> ответ». Пустой массив означает, что ввода не было:
 * либо задача проверяется по эталонному выводу, либо программа не спросила ничего.
 */
function echoedAnswers(outputLines: string[]): string[] {
  return splitEchoInput(outputLines).answers;
}

/** Первое число, которое ввёл ученик, или null, если его нет или оно не число. */
function firstEchoedNumber(outputLines: string[]): number | null {
  const [answer] = echoedAnswers(outputLines);
  if (answer === undefined || answer.trim() === "") return null;
  const n = toNumber(answer);
  return Number.isFinite(n) ? n : null;
}

/**
 * «Знакомство»: программа печатает приветствие с именем, которое ввёл ученик.
 * Если ответ виден в окне вывода, имя сверяется буквально; без ответа
 * засчитывается только непустое слово вместо приветствия.
 */
async function validateInGreet(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const { printed, answers } = splitEchoInput(outputLines);
  const greetOk = printsGreetingWith(printed, answers[0] ?? "");

  const s = scanShape(ws);
  const structureOk = s.textInput >= 1 && s.sets >= 1 && s.prints >= 1;
  const ok = greetOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (s.join >= 1 && count <= 9) stars = 3;
    else if (count <= 14) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

/**
 * «Сумма двух чисел»: ответ зависит от введённых чисел, поэтому он проверяем —
 * сумма восстанавливается из строк «> число» и сверяется с напечатанным.
 */
async function validateInTwoNumbers(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const { printed, answers } = splitEchoInput(outputLines);
  const nums = answers
    .filter((a) => a.trim() !== "")
    .map(toNumber)
    .filter(Number.isFinite);

  let sumOk: boolean;
  if (nums.length >= 2) {
    const expected = nums[0] + nums[1];
    sumOk = printed.some((l) => sameNumber(trailingNumber(l), expected));
  } else {
    // Ввода не было (или ответ не число) — принимается только голое число.
    sumOk = printed.some((l) => /^-?\d+(?:[.,]\d+)?$/.test(l.trim()));
  }

  const s = scanShape(ws);
  const structureOk = s.numInput >= 2 && s.add && s.prints >= 1;
  const ok = sumOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (s.numInput >= 2 && s.add && s.sets >= 2 && count <= 10) stars = 3;
    else if (count <= 14) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

const DENY_RE = /запрещ|отказ|не разреш|denied|forbid|not allowed/i;
const ALLOW_RE = /разреш|granted|allowed|доступ открыт/i;

/** Классификация строки вывода: "allow", "deny" или null, если это не вердикт. */
function verdictOf(line: string): "allow" | "deny" | null {
  if (DENY_RE.test(line)) return "deny";
  if (ALLOW_RE.test(line)) return "allow";
  return null;
}

/**
 * «Пропуск по возрасту»: верный ответ зависит от введённого числа,
 * поэтому окно с ответом читается из вывода. Программа обязана напечатать
 * ровно один вердикт — два вердикта означают, что «иначе» не использовано.
 */
async function validateInAdultGate(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const printed = splitEchoInput(outputLines).printed;
  const verdicts = printed
    .map(verdictOf)
    .filter((v): v is "allow" | "deny" => v !== null);

  const age = firstEchoedNumber(outputLines);
  const expected: "allow" | "deny" | null =
    age === null ? null : age >= 18 ? "allow" : "deny";

  const outputOk =
    verdicts.length === 1 && (expected === null || verdicts[0] === expected);

  const s = scanShape(ws);
  const structureOk =
    s.numInput >= 1 && s.ifCount >= 1 && s.compare >= 1 && s.prints >= 1;
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (s.ifElse >= 1 && s.compare >= 1 && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

/** Верхняя граница счёта: больше — вывод упирается в лимит окна вывода. */
const MAX_COUNT_TO = 60;

/**
 * «Считай до N»: цикл, у которого граница берётся из ввода. Проверка
 * восстанавливает N из ответа ученика и требует ровно чисел 1…N подряд.
 */
async function validateInCountToN(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const printed = splitEchoInput(outputLines).printed;
  const n = firstEchoedNumber(outputLines);
  const sequence = printed.map(bareInteger).filter((v): v is number => v !== null);

  const validN = n !== null && Number.isInteger(n) && n >= 1 && n <= MAX_COUNT_TO;
  const outputOk =
    validN &&
    sequence.length === n &&
    sequence.every((value, i) => value === i + 1);

  const s = scanShape(ws);
  const structureOk =
    (s.forLoop >= 1 || s.repeat >= 1) && s.numInput >= 1 && s.prints >= 1;
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (s.forLoop >= 1 && count <= 8) stars = 3;
    else if (count <= 12) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

const TABLE_ROWS = 10;

/**
 * «Таблица умножения на заказ»: десять строк, каждая кончается произведением
 * введённого числа на номер строки. Лишние строки (вопрос, заголовок) не мешают:
 * ищется подряд идущее окно из десяти произведений.
 */
async function validateInTimesTable(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const printed = splitEchoInput(outputLines).printed;
  const n = firstEchoedNumber(outputLines);
  const tails = printed.map(trailingNumber).filter(Number.isFinite);

  let outputOk = false;
  if (n !== null && Number.isInteger(n) && Math.abs(n) <= 1000) {
    for (let start = 0; start + TABLE_ROWS <= tails.length; start += 1) {
      const matches = Array.from({ length: TABLE_ROWS }, (_, i) =>
        sameNumber(tails[start + i], n * (i + 1))
      ).every(Boolean);
      if (matches) {
        outputOk = true;
        break;
      }
    }
  }

  const s = scanShape(ws);
  const structureOk =
    (s.forLoop >= 1 || s.repeat >= 1) && s.numInput >= 1 && s.prints >= 1;
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (s.join >= 1 && s.multiply && count <= 12) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const userInputTasks: Pick<
  TaskRegistry,
  "in_greet" | "in_two_numbers" | "in_adult_gate" | "in_count_to_n" | "in_times_table"
> = {
  in_greet: {
    id: "in_greet",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 20: Знакомство" : "Task 20: Meet and Greet",
    description: (lang) =>
      lang === "ru"
        ? `До сих пор программа печатала то, что написано в блоках. Теперь научите её <strong>спрашивать</strong>. Блок <strong>«Ввод текста»</strong> (раздел «Текст») останавливает программу и ждёт, пока ученик наберёт ответ и нажмёт «OK».<br><br>1) Напечатайте вопрос: «Вывести … цвет …» с текстом <strong>Как тебя зовут?</strong><br>2) Создайте переменную <strong>name</strong> и присвойте ей блок «Ввод текста» — это и есть ответ ученика.<br>3) Напечатайте приветствие одной строкой: <strong>Привет, &lt;имя&gt;!</strong><br><br><strong>Как запустить:</strong> нажмите «▶» — в окне вывода появится поле ввода. Наберите любое имя и подтвердите: программа подставит его в приветствие.<br><br><strong>Почему вопрос печатается отдельным блоком:</strong> у блока ввода нет поля с вопросом, поэтому программу спрашивает сама — сначала печать, потом ввод.<br><br>★★★ — приветствие собрано блоком «создать текст из» и печатается одной строкой.`
        : `So far the program printed what the blocks said. Now teach it to <strong>ask</strong>. The <strong>“text input”</strong> block (Text category) pauses the program and waits until the student types an answer and presses “OK”.<br><br>1) Print the question: “Print … color …” with the text <strong>What is your name?</strong><br>2) Create the variable <strong>name</strong> and set it to the “text input” block — that is the answer.<br>3) Print one greeting line: <strong>Hello, &lt;name&gt;!</strong><br><br><strong>How to run:</strong> press “▶” — an input box appears in the output. Type any name and confirm: the program puts it into the greeting.<br><br><strong>Why the question is a separate block:</strong> the input block has no question field, so the program asks by printing first and reading second.<br><br>★★★ — the greeting is built with “create text with” and printed as one line.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Из «Текст» возьмите «Вывести … цвет …» и впишите в него вопрос: Как тебя зовут?.\n2. Создайте переменную name и возьмите «присвоить name = …» из «Переменные»; в слот значения положите блок «Ввод текста» из «Текст».\n3. Соберите приветствие блоком «создать текст из» из «Текст»: добавьте три ячейки — «Привет, », переменную name и «!».\n4. Положите «создать текст из» в слот второго блока «Вывести … цвет …».\n5. Нажмите «▶», введите любое имя в появившееся поле и подтвердите — строка приветствия должна содержать именно его.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1) From Text take “Print … color …” and type the question: What is your name?.\n2) Create the variable name and take “set name to …” from Variables; put the “text input” block from Text into its value slot.\n3) Build the greeting with “create text with” from Text: three items — “Hello, ”, the variable name and “!”.\n4) Put “create text with” into the slot of the second “Print … color …” block.\n5) Press “▶”, type any name into the box and confirm — the greeting line must contain exactly that name.\n6) Press “Check solution”.`,
    infoTopics: ["user_input", "string_concat"],
    validate: validateInGreet,
  },
  in_two_numbers: {
    id: "in_two_numbers",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 21: Сумма двух чисел" : "Task 21: Sum of Two Numbers",
    description: (lang) =>
      lang === "ru"
        ? `Блок <strong>«Ввод числа»</strong> читает ответ и сразу превращает его в число, поэтому с ответом можно считать. Спросите два числа и выведите их <strong>сумму</strong> одной строкой — только число, без пояснений.<br><br>1) Создайте переменные <strong>a</strong> и <strong>b</strong>, каждую присвойте блоку «Ввод числа».<br>2) Соберите <strong>a + b</strong> блоком «+ − × ÷» из «Математика» и напечатайте результат.<br><br><strong>Как запустить:</strong> нажмите «▶» — программа спросит первое число, затем второе. Проверка видит оба ваших ответа и убеждается, что напечатана именно их сумма, а не любое число.<br><br><strong>Ловушка:</strong> «Ввод текста» тоже умеет возвращать число, но тогда «создать текст из» склеивает ответы как строки: из 3 и 4 получится 34, а не 7. Для арифметики берите «Ввод числа».<br><br>★★★ — два числа прочитаны блоками «Ввод числа», сумма собрана блоком «+ − × ÷».`
        : `The <strong>“number input”</strong> block reads the answer and turns it into a number straight away, so you can compute with it. Ask for two numbers and print their <strong>sum</strong> as a single line — just the number, nothing else.<br><br>1) Create the variables <strong>a</strong> and <strong>b</strong>, setting each to a “number input” block.<br>2) Build <strong>a + b</strong> with the “+ − × ÷” block from Math and print the result.<br><br><strong>How to run:</strong> press “▶” — the program asks for the first number, then the second. The check sees both answers and verifies that the printed value really is their sum, not just any number.<br><br><strong>Trap:</strong> “text input” also returns what you typed, but then “create text with” glues the answers as strings: 3 and 4 become 34, not 7. Use “number input” for arithmetic.<br><br>★★★ — both numbers read with “number input”, the sum built with the “+ − × ÷” block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную a, возьмите «присвоить a = …» и вложите в него «Ввод числа» из «Текст».\n2. Проделайте то же для переменной b со вторым блоком «Ввод числа».\n3. Из «Математика» возьмите «+ − × ÷», переключите выпадающий список на «+» и вложите в него переменные a и b из «Переменные».\n4. Результат положите в «Вывести … цвет …» — на экране должно быть только число.\n5. Нажмите «▶», введите два числа и просуммируйте их в уме: вывод обязан совпасть.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1) Create the variable a, take “set a to …” and put the “number input” block from Text into it.\n2) Do the same for the variable b with a second “number input” block.\n3) From Math take “+ − × ÷”, switch its dropdown to “+” and put the variables a and b from Variables into its slots.\n4) Feed the result into “Print … color …” — the screen must show the number only.\n5) Press “▶”, type two numbers and add them in your head: the output has to match.\n6) Press “Check solution”.`,
    infoTopics: ["user_input", "data_types"],
    validate: validateInTwoNumbers,
  },
  in_adult_gate: {
    id: "in_adult_gate",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 22: Пропуск по возрасту" : "Task 22: Age Gate",
    description: (lang) =>
      lang === "ru"
        ? `Самое частое применение ввода — спросить значение и <strong>разветвить</strong> программу. Спросите возраст блоком «Ввод числа» и напечатайте ровно один вердикт:<br>• если возраст <strong>18 и больше</strong> — <strong>Доступ разрешён</strong>;<br>• иначе — <strong>Доступ запрещён</strong>.<br><br>1) Создайте переменную <strong>age</strong> и присвойте её «Ввод числа».<br>2) Возьмите <strong>«если/иначе»</strong> из «Логика» и добавьте ветку «иначе».<br>3) Условие — «сравнить» с знаком <code>≥</code>: слева переменная age, справа число 18.<br>4) В ветку «тогда» положите печать Доступ разрешён, в ветку «иначе» — Доступ запрещён.<br><br><strong>Проверка знает ваш ответ:</strong> введённое число видно в окне вывода, поэтому засчитывается только вердикт, который подходит именно вашему возрасту. Введите 20 и убедитесь, что программа отвечает иначе, чем на 12.<br><br>★★★ — одно условие «если/иначе» с веткой «иначе» и сравнением с 18.`
        : `The most common use of input is to ask for a value and then <strong>branch</strong>. Ask the age with the “number input” block and print exactly one verdict:<br>• if the age is <strong>18 or more</strong> — <strong>Access granted</strong>;<br>• otherwise — <strong>Access denied</strong>.<br><br>1) Create the variable <strong>age</strong> and set it to “number input”.<br>2) Take <strong>“if/else”</strong> from Logic and add the “else” branch.<br>3) The condition is a “compare” block with <code>≥</code>: variable age on the left, number 18 on the right.<br>4) Put the “Access granted” print into the “do” branch and “Access denied” into “else”.<br><br><strong>The check sees your answer:</strong> the number you typed is visible in the output, so only the verdict that fits your age is accepted. Try 20 and confirm the program answers differently than for 12.<br><br>★★★ — one if/else with the else branch and a comparison with 18.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную age и присвойте её блоку «Ввод числа» из «Текст» — по желанию заранее напечатайте вопрос блоком «Вывести … цвет …».\n2. Из «Логика» возьмите «если/иначе»; в Blockly это блок «если» — нажмите на плюс справа от него, чтобы появилась ветка «иначе».\n3. Условие: «сравнить» из «Логика», в его выпадающем списке выберите знак ≥ (или >), слева — переменная age из «Переменные», справа — число 18.\n4. В слот «выполнить» положите «Вывести … цвет …» со строкой Доступ разрешён.\n5. В слот «иначе» — второй «Вывести … цвет …» со строкой Доступ запрещён.\n6. Нажмите «▶» дважды: сначала введите 20 (ответ «разрешён»), затем 12 (ответ «запрещён»), и нажмите «Проверить решение».`
        : `Step by step:\n1) Create the variable age and set it to the “number input” block from Text; print a question first with “Print … color …” if you like.\n2) Take the if block from Logic and press the plus on its right side so the “else” branch appears.\n3) Condition: a “compare” block from Logic — pick the ≥ sign (or >) in its dropdown, variable age from Variables on the left, number 18 on the right.\n4) Put “Print … color …” with Access granted into the “do” slot.\n5) Put a second “Print … color …” with Access denied into the “else” slot.\n6) Press “▶” twice: type 20 (the answer is granted), then 12 (the answer is denied), and press “Check solution”.`,
    infoTopics: ["user_input", "if_else"],
    validate: validateInAdultGate,
  },
  in_count_to_n: {
    id: "in_count_to_n",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 23: Считай до N" : "Task 23: Count to N",
    description: (lang) =>
      lang === "ru"
        ? `Раньше граница цикла была вписана в блок. Сделайте её <strong>настраиваемой</strong>: пусть ученик сам вводит, до скольких считать.<br><br>1) Спросите число блоком «Ввод числа» и сохраните его в переменную <strong>n</strong>.<br>2) Возьмите <strong>«цикл по … от … до … с шагом …»</strong> из «Циклы»: от 1 до <strong>n</strong> с шагом 1 — в слот «до» вложите переменную n, а не число.<br>3) Внутри цикла печатайте счётчик <strong>i</strong>: по одному числу на строку, от 1 до n.<br><br>Введите, например, 4 — вывод: <strong>1, 2, 3, 4</strong> четырьмя строками. Введите 2 — строк будет две. Проверка сравнивает печатные строки с тем числом, которое ввели вы.<br><br><strong>Число повторов из данных</strong> — главный шаг от «программы-заготовки» к программе, которая работает с любым вводом.<br><br>★★★ — граница цикла взята из переменной n, а не вписана числом.`
        : `Until now the loop bound was typed into the block. Make it <strong>configurable</strong>: let the student decide how far to count.<br><br>1) Ask for a number with the “number input” block and store it in the variable <strong>n</strong>.<br>2) Take <strong>“count with … from … to … by …”</strong> from Loops: from 1 to <strong>n</strong>, step 1 — put the variable n into the “to” slot instead of a number.<br>3) Inside the loop print the counter <strong>i</strong>: one number per line, from 1 to n.<br><br>Type 4 and the output is <strong>1, 2, 3, 4</strong> on four lines. Type 2 and there are two lines. The check compares the printed lines with the number you entered.<br><br><strong>A repeat count that comes from data</strong> is the main step from a canned program to one that works with any input.<br><br>★★★ — the loop bound is the variable n, not a typed-in number.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную n и присвойте её блоку «Ввод числа» из «Текст».\n2. Из «Циклы» возьмите «цикл по … от … до … с шагом …»: оставьте 1 в поле «от» и 1 в поле «шаг».\n3. В поле «до» вложите блок переменной n из «Переменные» — только он делает границу настраиваемой.\n4. В слот «выполнить» положите «Вывести … цвет …», а в него — переменную i из «Переменные» (это счётчик цикла).\n5. Нажмите «▶» и введите 4: в окне вывода четыре строки 1, 2, 3, 4.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1) Create the variable n and set it to the “number input” block from Text.\n2) Take “count with … from … to … by …” from Loops: keep 1 in the “from” field and 1 in the “step” field.\n3) Put the variable n block from Variables into the “to” field — only that makes the bound configurable.\n4) Put “Print … color …” into the “do” slot and the counter variable i from Variables into it.\n5) Press “▶” and type 4: the output shows four lines, 1, 2, 3, 4.\n6) Press “Check solution”.`,
    infoTopics: ["user_input", "for_loop"],
    validate: validateInCountToN,
  },
  in_times_table: {
    id: "in_times_table",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 24: Таблица на заказ" : "Task 24: Table to Order",
    description: (lang) =>
      lang === "ru"
        ? `В задаче 19 таблица умножения печаталась для всех чисел сразу — двумя вложенными циклами. Здесь цикл <strong>один</strong>, а <strong>число выбирает ученик</strong>.<br><br>1) Спросите число блоком «Ввод числа» и сохраните его в переменную <strong>n</strong>.<br>2) Возьмите «цикл по … от … до … с шагом …»: от 1 до 10 с шагом 1.<br>3) Внутри цикла печатайте <strong>произведение n × i</strong> — строкой может быть и <code>7 × 3 = 21</code>, и просто <code>21</code>, но число в конце обязано быть результатом умножения.<br><br>Вывод — 10 строк: для числа 7 это 7, 14, 21, …, 70. Проверка берёт введённое число из окна вывода и пересчитывает все десять строк, поэтому подставить чужую таблицу не выйдет.<br><br><strong>Поэкспериментируйте:</strong> запустите программу ещё раз с другим числом — блоки те же, ответ другой.<br><br>★★★ — каждая строка собрана блоком «создать текст из», произведение — блоком «+ − × ÷» с операцией «×».`
        : `Task 19 printed the whole multiplication table at once, with two nested loops. Here there is <strong>one</strong> loop and <strong>the student picks the number</strong>.<br><br>1) Ask for a number with the “number input” block and store it in the variable <strong>n</strong>.<br>2) Take “count with … from … to … by …”: from 1 to 10, step 1.<br>3) Inside the loop print <strong>n × i</strong> — a line may read <code>7 × 3 = 21</code> or just <code>21</code>, but the number at the end must be the product.<br><br>The output is 10 lines: for 7 they are 7, 14, 21, …, 70. The check takes your number from the output and recomputes all ten lines, so copying someone else's table will not work.<br><br><strong>Experiment:</strong> run the program again with another number — same blocks, different answers.<br><br>★★★ — each line is built with “create text with”, the product with the “+ − × ÷” block set to “×”.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную n и присвойте её блоку «Ввод числа» из «Текст».\n2. Из «Циклы» возьмите «цикл по … от … до … с шагом …» и поставьте 1, 10 и 1 — здесь граница известна заранее.\n3. Соберите произведение: «+ − × ÷» из «Математика» с операцией «×», в слоты — переменные n и i.\n4. Оформите строку блоком «создать текст из» из «Текст»: например, переменную n, текст ×, переменную i, текст = и результат умножения.\n5. Готовую строку вложите в «Вывести … цвет …» внутри цикла.\n6. Нажмите «▶», введите 7: в выводе 7, 14, 21, 28, 35, 42, 49, 56, 63, 70. Нажмите «Проверить решение».`
        : `Step by step:\n1) Create the variable n and set it to the “number input” block from Text.\n2) Take “count with … from … to … by …” from Loops and set 1, 10 and 1 — this bound is known in advance.\n3) Build the product: the “+ − × ÷” block from Math set to “×”, with the variables n and i in its slots.\n4) Turn it into a line with “create text with” from Text: for example n, the text ×, i, the text = and the product.\n5) Put that line into “Print … color …” inside the loop.\n6) Press “▶”, type 7: the output shows 7, 14, 21, 28, 35, 42, 49, 56, 63, 70. Press “Check solution”.`,
    infoTopics: ["user_input", "for_loop"],
    validate: validateInTimesTable,
  },
};
