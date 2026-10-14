// Задачи группы «output»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateHelloWorld(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const expected = "Hello World!";
  const ok = lines.includes(expected);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 2)
      stars = 3; // печать + текст
    else if (count <= 4) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateAdd2Plus7(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const expected = "9"; // должно вывести 9
  const ok = lines.includes(expected);

  // Эвристика по звёздам: желательно использовать math_arithmetic с ADD и числами 2 и 7
  let hasAddition = false;
  let has2 = false;
  let has7 = false;
  try {
    const blocks = getNonShadowBlocks(ws);
    for (const b of blocks) {
      if ((b as any).type === "math_arithmetic") {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "ADD") hasAddition = true;
      }
      if ((b as any).type === "math_number") {
        const num =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("NUM")
            : undefined;
        if (String(num) === "2") has2 = true;
        if (String(num) === "7") has7 = true;
      }
    }
  } catch {
    // игнорируем
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasAddition && has2 && has7 && count <= 4)
      stars = 3; // печать + math_arithmetic + 2 числа
    else if (count <= 6) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateGreetConcat(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let hasSetName = false;
  let hasGetName = false;
  let usedTextJoin = false;
  let usedTextAppend = false;
  let hasPrint = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set") hasSetName = true;
    if (t === "variables_get") hasGetName = true;
    if (t === "text_join") usedTextJoin = true;
    if (t === "text_append") usedTextAppend = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok =
    nonShadowBlocks.length === 0
      ? lines.some((l) => /^Hello,\s*.+!$/.test(l.trim()))
      : hasSetName &&
        hasGetName &&
        (usedTextJoin || usedTextAppend || hasPrint) &&
        lines.some((l) => /^Hello,\s*.+!$/.test(l.trim()));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && usedTextJoin && count <= 9) stars = 3;
    else if (count <= 12) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const outputTasks: Pick<TaskRegistry, "hello_world" | "add_2_7" | "greet_concat"> = {
  hello_world: {
    id: "hello_world",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 1: Hello World" : "Task 1: Hello World"),
    description: (lang) =>
      lang === "ru"
        ? "Соберите блоки так, чтобы в окне вывода появилась строка: <strong>Hello World!</strong><br><br><strong>Как проверить решение:</strong> добавьте нужные блоки на рабочее поле, затем справа в редакторе нажмите кнопку «▶» («Запустить код»), а после этого нажмите «Проверить решение»."
        : "Assemble blocks so that the output shows: <strong>Hello World!</strong><br><br><strong>How to check:</strong> add the needed blocks to the workspace, then press “▶” (“Run code”) in the editor, and finally press “Check solution”.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Текст» возьмите блок «Вывести … цвет …» и перетащите его на рабочее поле.\n2. Впишите в поле блока фразу Hello World! (цвет можно оставить пустым).\n3. Нажмите кнопку «▶» («Запустить код») в редакторе — в окне вывода появится Hello World!.\n4. Нажмите «Проверить решение» — задача будет засчитана."
        : "Step by step:\n1. In the Text category, take the “Print … color …” block and drag it onto the workspace.\n2. Type the phrase Hello World! directly into the block's text field (you can leave the color empty).\n3. Press the “▶” (“Run code”) button in the editor — the output will show Hello World!.\n4. Press “Check solution” — the task will be accepted.",
    infoTopics: ["console_output"],
    validate: validateHelloWorld,
  },
  add_2_7: {
    id: "add_2_7",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 2: 2 + 7" : "Task 2: 2 + 7"),
    description: (lang) =>
      lang === "ru"
        ? "Сложите <strong>2</strong> и <strong>7</strong> и выведите результат в окно вывода: должно получиться <strong>9</strong>. Дополнительно: после того как получилось <strong>9</strong>, попробуйте поменять операцию на <strong>−</strong>, <strong>×</strong> или <strong>÷</strong> и посмотрите, как меняется результат (но проверка засчитывает только <strong>2 + 7</strong>)."
        : "Add <strong>2</strong> and <strong>7</strong> and print the result to the output: it should be <strong>9</strong>. Bonus: after you get <strong>9</strong>, try changing the operation to <strong>−</strong>, <strong>×</strong>, or <strong>÷</strong> and see how the result changes (but validation checks only <strong>2 + 7</strong>).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Математика» возьмите блок «+ − × ÷» и впишите числа 2 и 7.\n2. В категории «Текст» возьмите «Вывести … цвет …» и вложите в него результат сложения.\n3. Нажмите «▶» («Запустить код») — в окне вывода появится 9.\n4. Нажмите «Проверить решение»."
        : "Step by step:\n1. Take the “+ − × ÷” block from Math and enter 2 and 7.\n2. Take “Print … color …” from Text and put the sum inside it.\n3. Press “▶” (“Run code”) — the output shows 9.\n4. Press “Check solution”.",
    infoTopics: ["data_types"],
    validate: validateAdd2Plus7,
  },
  greet_concat: {
    id: "greet_concat",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 5: Машина для приветствий" : "Task 5: Greeting machine",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте текстовую переменную <strong>name</strong> и сохраните в неё ваше имя (например, <strong>"Anna"</strong>). Соберите приветствие блоком «создать текст из» из трёх кусочков: «Hello, », переменная name и «!» — такая склейка строк называется конкатенацией.<br><br>Знак склейки зависит от языка панели кода: <code>+</code> в JavaScript и Python, <code>..</code> в Lua, <code>.</code> в PHP.'
        : 'Create a text variable <strong>name</strong> and store your name in it (for example, <strong>"Anna"</strong>). Build the greeting with the <strong>“create text with”</strong> block out of three pieces: “Hello, ”, the name variable and “!” — joining strings like this is called concatenation.<br><br>The join operator depends on the code panel language: <code>+</code> in JavaScript and Python, <code>..</code> in Lua, <code>.</code> in PHP.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную name блоком «присвоить name = …» из категории «Переменные». В свободное значение справа вставьте текстовый блок «текст» из категории «Текст» и напишите в нём ваше имя, например Anna — значение переменной задаёт именно текстовый блок.\n2. В категории «Текст» возьмите блок «создать текст из» и добавьте три поля: «Hello, » (важен пробел после запятой), переменную name и «!».\n3. Вложите «создать текст из» в блок «Вывести … цвет …» и запустите код.\n4. В выводе должно получиться «Hello, Anna!» — нажмите «Проверить решение»."
        : "Step by step:\n1. Create the variable name with the “set name to …” block from the Variables category. Into its value slot drop a “text” block from the Text category and type your name there, e.g. Anna — the variable's value must be a text block.\n2. In the Text category take “create text with” and add three items: “Hello, ” (mind the space after the comma), the variable name, and “!”.\n3. Put “create text with” inside the “Print … color …” block and run the code.\n4. The output should be “Hello, Anna!” — press “Check solution”.",
    infoTopics: ["string_concat"],
    validate: validateGreetConcat,
  },
};
