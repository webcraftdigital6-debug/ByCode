// Задачи группы «fixbugs» («Найди ошибку», задачи 1–6 (свой раздел)): ученику даётся
// готовая программа с одной смысловой ошибкой — её нужно найти и исправить.
// Стартовый XML подгружается в пустое рабочее поле при активации задачи
// (см. loadStarter в validation.ts).
import * as Blockly from "blockly";
import {
  countNonShadowBlocks,
  getNonShadowBlocks,
} from "../workspaceUtils";
import { typedCodeMode } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

type AnyBlock = { type: string; getFieldValue?: (n: string) => unknown };

function hasBlock(
  ws: Blockly.WorkspaceSvg,
  pred: (b: AnyBlock) => boolean,
): boolean {
  try {
    return getNonShadowBlocks(ws).some((b) => pred(b as unknown as AnyBlock));
  } catch {
    return false;
  }
}

function hasType(ws: Blockly.WorkspaceSvg, type: string): boolean {
  return hasBlock(ws, (b) => b.type === type);
}

function hasOp(ws: Blockly.WorkspaceSvg, type: string, op: string): boolean {
  return hasBlock(
    ws,
    (b) => b.type === type && String(b.getFieldValue?.("OP") ?? "") === op,
  );
}

// Звёзды для отладочных задач: 3★ — исправлен только баг (блоков не
// больше, чем в стартовой программе), 2★ — +1–2 блока, 1★ — иначе.
function fixStars(
  ws: Blockly.WorkspaceSvg,
  baseline: number,
  ok: boolean,
): number {
  if (!ok) return 0;
  const count = countNonShadowBlocks(ws);
  if (count <= baseline) return 3;
  if (count <= baseline + 2) return 2;
  return 1;
}

const sameLines = (
  lines: string[],
  expected: string[],
): boolean =>
  lines.length === expected.length &&
  expected.every((l, i) => lines[i] === l);

// ---------- fb_area ----------

async function validateFbArea(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[],
): Promise<ValidationResult> {
  const outputOk = outputLines.includes("42");
  const ok = outputOk && (typedCodeMode(ws) || hasOp(ws, "math_arithmetic", "MULTIPLY"));
  return { ok, stars: fixStars(ws, 6, ok) };
}

const FB_AREA_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="fb-a">a</variable>
    <variable id="fb-b">b</variable>
  </variables>
  <block type="variables_set" x="40" y="40">
    <field name="VAR" id="fb-a">a</field>
    <value name="VALUE">
      <shadow type="math_number"><field name="NUM">6</field></shadow>
    </value>
    <next>
      <block type="variables_set">
        <field name="VAR" id="fb-b">b</field>
        <value name="VALUE">
          <shadow type="math_number"><field name="NUM">7</field></shadow>
        </value>
        <next>
          <block type="add_text">
            <value name="TEXT">
              <block type="math_arithmetic">
                <field name="OP">ADD</field>
                <value name="A">
                  <block type="variables_get"><field name="VAR" id="fb-a">a</field></block>
                </value>
                <value name="B">
                  <block type="variables_get"><field name="VAR" id="fb-b">b</field></block>
                </value>
              </block>
            </value>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;

// ---------- fb_join ----------

async function validateFbJoin(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[],
): Promise<ValidationResult> {
  const outputOk = outputLines.includes("Hello, World!");
  const ok = outputOk && (typedCodeMode(ws) || hasType(ws, "text_join"));
  return { ok, stars: fixStars(ws, 4, ok) };
}

const FB_JOIN_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="add_text" x="40" y="40">
    <value name="TEXT">
      <block type="text_join">
        <mutation items="2"></mutation>
        <value name="ADD0">
          <block type="text"><field name="TEXT">World!</field></block>
        </value>
        <value name="ADD1">
          <block type="text"><field name="TEXT">Hello, </field></block>
        </value>
      </block>
    </value>
  </block>
</xml>`;

// ---------- fb_parity ----------

async function validateFbParity(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[],
): Promise<ValidationResult> {
  const outputOk = outputLines.includes("even") && !outputLines.includes("odd");
  const ok = outputOk && (typedCodeMode(ws) || hasType(ws, "math_modulo"));
  return { ok, stars: fixStars(ws, 8, ok) };
}

const FB_PARITY_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="fb-n">number</variable>
  </variables>
  <block type="variables_set" x="40" y="40">
    <field name="VAR" id="fb-n">number</field>
    <value name="VALUE">
      <shadow type="math_number"><field name="NUM">8</field></shadow>
    </value>
    <next>
      <block type="controls_if">
        <mutation else="1"></mutation>
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">EQ</field>
            <value name="A">
              <block type="math_modulo">
                <value name="DIVIDEND">
                  <block type="variables_get"><field name="VAR" id="fb-n">number</field></block>
                </value>
                <value name="DIVISOR">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
              </block>
            </value>
            <value name="B">
              <shadow type="math_number"><field name="NUM">1</field></shadow>
            </value>
          </block>
        </value>
        <statement name="DO0">
          <block type="add_text">
            <value name="TEXT">
              <shadow type="text"><field name="TEXT">even</field></shadow>
            </value>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="add_text">
            <value name="TEXT">
              <shadow type="text"><field name="TEXT">odd</field></shadow>
            </value>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>`;

// ---------- fb_loop ----------

const FB_LOOP_EXPECTED = Array.from({ length: 10 }, (_, i) => String(i + 1));

async function validateFbLoop(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[],
): Promise<ValidationResult> {
  const outputOk = sameLines(outputLines, FB_LOOP_EXPECTED);
  const ok = outputOk && (typedCodeMode(ws) || hasType(ws, "controls_for"));
  return { ok, stars: fixStars(ws, 3, ok) };
}

const FB_LOOP_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="fb-i">i</variable>
  </variables>
  <block type="controls_for" x="40" y="40">
    <field name="VAR" id="fb-i">i</field>
    <value name="FROM">
      <shadow type="math_number"><field name="NUM">1</field></shadow>
    </value>
    <value name="TO">
      <shadow type="math_number"><field name="NUM">9</field></shadow>
    </value>
    <value name="BY">
      <shadow type="math_number"><field name="NUM">1</field></shadow>
    </value>
    <statement name="DO">
      <block type="add_text">
        <value name="TEXT">
          <block type="variables_get"><field name="VAR" id="fb-i">i</field></block>
        </value>
      </block>
    </statement>
  </block>
</xml>`;

// ---------- fb_list ----------

async function validateFbList(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[],
): Promise<ValidationResult> {
  const outputOk = sameLines(outputLines, ["2", "4", "6"]);
  const structureOk = hasType(ws, "controls_forEach") && hasType(ws, "lists_create_with");
  const ok = outputOk && (typedCodeMode(ws) || structureOk);
  return { ok, stars: fixStars(ws, 10, ok) };
}

const FB_LIST_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="fb-nums">numbers</variable>
    <variable id="fb-item">item</variable>
  </variables>
  <block type="variables_set" x="40" y="40">
    <field name="VAR" id="fb-nums">numbers</field>
    <value name="VALUE">
      <block type="lists_create_with">
        <mutation items="6"></mutation>
        <value name="ADD0"><shadow type="math_number"><field name="NUM">1</field></shadow></value>
        <value name="ADD1"><shadow type="math_number"><field name="NUM">2</field></shadow></value>
        <value name="ADD2"><shadow type="math_number"><field name="NUM">3</field></shadow></value>
        <value name="ADD3"><shadow type="math_number"><field name="NUM">4</field></shadow></value>
        <value name="ADD4"><shadow type="math_number"><field name="NUM">5</field></shadow></value>
        <value name="ADD5"><shadow type="math_number"><field name="NUM">6</field></shadow></value>
      </block>
    </value>
    <next>
      <block type="controls_forEach">
        <field name="VAR" id="fb-item">item</field>
        <value name="LIST">
          <block type="variables_get"><field name="VAR" id="fb-nums">numbers</field></block>
        </value>
        <statement name="DO">
          <block type="controls_if">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A">
                  <block type="math_modulo">
                    <value name="DIVIDEND">
                      <block type="variables_get"><field name="VAR" id="fb-item">item</field></block>
                    </value>
                    <value name="DIVISOR">
                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                    </value>
                  </block>
                </value>
                <value name="B">
                  <shadow type="math_number"><field name="NUM">1</field></shadow>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="add_text">
                <value name="TEXT">
                  <block type="variables_get"><field name="VAR" id="fb-item">item</field></block>
                </value>
              </block>
            </statement>
          </block>
        </statement>
      </block>
    </next>
  </block>
</xml>`;

// ---------- fb_double ----------

async function validateFbDouble(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[],
): Promise<ValidationResult> {
  const outputOk = outputLines.includes("10");
  const structureOk =
    hasType(ws, "procedures_defreturn") &&
    hasType(ws, "procedures_callreturn") &&
    hasOp(ws, "math_arithmetic", "MULTIPLY");
  const ok = outputOk && (typedCodeMode(ws) || structureOk);
  return { ok, stars: fixStars(ws, 5, ok) };
}

const FB_DOUBLE_XML = `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="fb-x">x</variable>
  </variables>
  <block type="procedures_defreturn" x="40" y="40">
    <mutation>
      <arg name="x" varid="fb-x"></arg>
    </mutation>
    <field name="NAME">double</field>
    <value name="RETURN">
      <block type="math_arithmetic">
        <field name="OP">ADD</field>
        <value name="A">
          <block type="variables_get"><field name="VAR" id="fb-x">x</field></block>
        </value>
        <value name="B">
          <shadow type="math_number"><field name="NUM">1</field></shadow>
        </value>
      </block>
    </value>
  </block>
  <block type="add_text" x="40" y="220">
    <value name="TEXT">
      <block type="procedures_callreturn">
        <mutation name="double">
          <arg name="x"></arg>
        </mutation>
        <value name="ARG0">
          <shadow type="math_number"><field name="NUM">5</field></shadow>
        </value>
      </block>
    </value>
  </block>
</xml>`;

export const fixbugsTasks: Pick<
  TaskRegistry,
  | "fb_area"
  | "fb_join"
  | "fb_parity"
  | "fb_loop"
  | "fb_list"
  | "fb_double"
> = {
  fb_area: {
    id: "fb_area",
    difficulty: "fixbugs",
    kind: "fix",
    starterXml: FB_AREA_XML,
    title: (lang) =>
      lang === "ru"
        ? "Задача 2: Найди ошибку — площадь прямоугольника"
        : "Task 2: Find the Bug — Rectangle Area",
    description: (lang) =>
      lang === "ru"
        ? "Программа должна находить площадь прямоугольника со сторонами <strong>6</strong> и <strong>7</strong> и выводить <strong>42</strong>. Но в ней спрятана одна ошибка — сейчас она печатает неправильное число.<br><br><strong>Что делать:</strong> нажмите «▶» («Запустить код») и посмотрите вывод; найдите глазами «подозрительный» блок, исправьте его и запустите снова. Когда в выводе появится 42 — нажимайте «Проверить решение».<br><br>★★★ — исправлен только баг (блоков не стало больше)."
        : "The program should compute the area of a rectangle with sides <strong>6</strong> and <strong>7</strong> and print <strong>42</strong> — but one bug is hidden inside, so it prints the wrong number.<br><br><strong>What to do:</strong> press “▶” (“Run code”) and look at the output; find the suspicious block, fix it, run again. When the output shows 42 — press “Check solution”.<br><br>★★★ — only the bug was fixed (no blocks added).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Запустите код: в выводе 13 вместо 42.\n13 — это 6 + 7, а площадь считается умножением.\n2. Найдите блок вычисления (с синим полем «+»).\n3. Откройте выпадающий список в этом блоке и выберите «×».\n4. Запустите снова — в выводе 42. Проверяйте решение."
        : "Step by step:\n1. Run the code: the output shows 13 instead of 42. 13 is 6 + 7, but area is computed by multiplication.\n2. Find the computation block (the one with the “+” field).\n3. Open its dropdown and pick “×”.\n4. Run again — the output shows 42. Check your solution.",
    infoTopics: ["console_output"],
    validate: validateFbArea,
  },
  fb_join: {
    id: "fb_join",
    difficulty: "fixbugs",
    kind: "fix",
    starterXml: FB_JOIN_XML,
    title: (lang) =>
      lang === "ru"
        ? "Задача 1: Найди ошибку — приветствие"
        : "Task 1: Find the Bug — Greeting",
    description: (lang) =>
      lang === "ru"
        ? "Программа должна вывести <strong>Hello, World!</strong>, но части склеены в неправильном порядке.<br><br><strong>Что делать:</strong> запустите код («▶»), сравните вывод с ожидаемым, поменяйте части местами и запустите снова.<br><br>★★★ — исправлен только баг (блоков не стало больше)."
        : "The program should print <strong>Hello, World!</strong>, but the parts are joined in the wrong order.<br><br><strong>What to do:</strong> run the code (“▶”), compare the output with the expected one, swap the parts and run again.<br><br>★★★ — only the bug was fixed (no blocks added).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Запустите код: выводится «World!Hello, » — части перепутаны.\n2. Найдите блок «создать текст из» (зелёный, категория «Текст»).\n3. Поменяйте местами его две части: «Hello, » должно быть слева, «World!» — справа. Блоки можно вытащить и вставить в обратном порядке.\n4. Запустите снова — в выводе «Hello, World!». Проверяйте."
        : "Step by step:\n1. Run the code: it prints “World!Hello, ” — the parts are swapped.\n2. Find the “create text with” (join) block.\n3. Swap its two parts: “Hello, ” first, “World!” second. Pull the blocks out and re-insert them in reverse order.\n4. Run again — the output shows “Hello, World!”. Check your solution.",
    infoTopics: ["string_concat"],
    validate: validateFbJoin,
  },
  fb_parity: {
    id: "fb_parity",
    difficulty: "fixbugs",
    kind: "fix",
    starterXml: FB_PARITY_XML,
    title: (lang) =>
      lang === "ru"
        ? "Задача 3: Найди ошибку — чётное или нет"
        : "Task 3: Find the Bug — Even or Odd",
    description: (lang) =>
      lang === "ru"
        ? "Программа проверяет число <strong>8</strong> и должна напечатать <strong>even</strong> (чётное), а печатает <strong>odd</strong>. Найдите и исправьте одну ошибку в условии.<br><br><strong>Подсказка не нужна?</strong> Запустите код («▶»), прочитайте условие блок за блоком и сравните с тем, как определяется чётность.<br><br>★★★ — исправлен только баг (блоков не стало больше)."
        : "The program checks the number <strong>8</strong> and should print <strong>even</strong>, but it prints <strong>odd</strong>. Find and fix the single bug in the condition.<br><br><strong>Ready without hints?</strong> Run the code (“▶”), read the condition block by block and compare it with how evenness is defined.<br><br>★★★ — only the bug was fixed (no blocks added).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Запустите код: для 8 печатается «odd» — это неверно.\n2. Чётное число — то, которое при делении на 2 даёт остаток 0.\n3. Найдите блок сравнения «… = 1» справа от остатка от деления.\n4. Замените 1 на 0 в поле сравнения.\n5. Запустите снова — в выводе «even». Проверяйте."
        : "Step by step:\n1. Run the code: for 8 it prints “odd” — wrong.\n2. An even number leaves remainder 0 when divided by 2.\n3. Find the comparison block “… = 1” next to the modulo block.\n4. Change 1 to 0 in the comparison field.\n5. Run again — the output shows “even”. Check your solution.",
    infoTopics: ["console_output"],
    validate: validateFbParity,
  },
  fb_loop: {
    id: "fb_loop",
    difficulty: "fixbugs",
    kind: "fix",
    starterXml: FB_LOOP_XML,
    title: (lang) =>
      lang === "ru"
        ? "Задача 4: Найди ошибку — считалочка от 1 до 10"
        : "Task 4: Find the Bug — Counting 1 to 10",
    description: (lang) =>
      lang === "ru"
        ? "Программа должна напечатать все числа <strong>от 1 до 10</strong> (по одному в строке), но последнее число теряется. Исправьте цикл.<br><br><strong>Что делать:</strong> запустите код («▶»), посчитайте строки вывода и найдите, где цикл обрывается.<br><br>★★★ — исправлен только баг (блоков не стало больше)."
        : "The program should print every number <strong>from 1 to 10</strong> (one per line), but the last number is missing. Fix the loop.<br><br><strong>What to do:</strong> run the code (“▶”), count the output lines and find where the loop stops too early.<br><br>★★★ — only the bug was fixed (no blocks added).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Запустите код: вывод обрывается на 9 — десятки не хватает.\n2. Посмотрите блок цикла: «повторять для i от 1 до …».\n3. В поле «до» стоит 9, а нужно 10 (цикл включает верхнюю границу).\n4. Исправьте 9 на 10 и запустите снова — в выводе числа 1..10. Проверяйте."
        : "Step by step:\n1. Run the code: the output stops at 9 — 10 is missing.\n2. Look at the loop block: “count with i from 1 to …”.\n3. The “to” field says 9, but it must be 10 (the loop includes its upper bound).\n4. Change 9 to 10 and run again — the output shows 1..10. Check your solution.",
    infoTopics: ["console_output"],
    validate: validateFbLoop,
  },
  fb_list: {
    id: "fb_list",
    difficulty: "fixbugs",
    kind: "fix",
    starterXml: FB_LIST_XML,
    title: (lang) =>
      lang === "ru"
        ? "Задача 5: Найди ошибку — только чётные"
        : "Task 5: Find the Bug — Only Even Numbers",
    description: (lang) =>
      lang === "ru"
        ? "Программа перебирает список <strong>1 2 3 4 5 6</strong> и должна напечатать только чётные числа (<strong>2, 4, 6</strong>), а печатает нечётные. Одна ошибка спрятана в условии фильтра.<br><br><strong>Что делать:</strong> запустите код («▶»), посмотрите вывод и сравните условие отбора с определением чётности.<br><br>★★★ — исправлен только баг (блоков не стало больше)."
        : "The program iterates over the list <strong>1 2 3 4 5 6</strong> and should print only the even numbers (<strong>2, 4, 6</strong>), but it prints the odd ones. One bug hides in the filter condition.<br><br><strong>What to do:</strong> run the code (“▶”), look at the output and compare the filter condition with the definition of evenness.<br><br>★★★ — only the bug was fixed (no blocks added).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Запустите код: печатает 1, 3, 5 — а нужны 2, 4, 6.\n2. Условие отбора: «остаток от деления item на 2 = 1» — это нечётные числа.\n3. Чётное число даёт остаток 0.\n4. Замените 1 на 0 в блоке сравнения.\n5. Запустите снова — в выводе 2, 4, 6. Проверяйте."
        : "Step by step:\n1. Run the code: it prints 1, 3, 5 — but 2, 4, 6 are needed.\n2. The filter reads “item mod 2 = 1” — that selects odd numbers.\n3. Even numbers have remainder 0.\n4. Change 1 to 0 in the comparison block.\n5. Run again — the output shows 2, 4, 6. Check your solution.",
    infoTopics: ["console_output"],
    validate: validateFbList,
  },
  fb_double: {
    id: "fb_double",
    difficulty: "fixbugs",
    kind: "fix",
    starterXml: FB_DOUBLE_XML,
    title: (lang) =>
      lang === "ru"
        ? "Задача 6: Найди ошибку — функция double"
        : "Task 6: Find the Bug — the double Function",
    description: (lang) =>
      lang === "ru"
        ? "Функция <strong>double(x)</strong> должна удваивать аргумент, и вызов <strong>double(5)</strong> обязан печатать <strong>10</strong>. Сейчас функция считает «x + 1» — исправьте её тело.<br><br><strong>Что делать:</strong> запустите код («▶»), откройте блок определения функции и почините возвращаемое выражение.<br><br>★★★ — исправлен только баг (блоков не стало больше)."
        : "The function <strong>double(x)</strong> should double its argument, so <strong>double(5)</strong> must print <strong>10</strong>. Right now it computes “x + 1” — fix the function body.<br><br><strong>What to do:</strong> run the code (“▶”), open the function definition block and fix the returned expression.<br><br>★★★ — only the bug was fixed (no blocks added).",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Запустите код: double(5) возвращает 6 — это 5 + 1.\n2. «Удвоить» — значит умножить на 2.\n3. В блоке «возврат …» найдите блок «+» и замените операцию на «×».\n4. Число 1 в втором поле замените на 2.\n5. Запустите снова — в выводе 10. Проверяйте."
        : "Step by step:\n1. Run the code: double(5) returns 6 — that is 5 + 1.\n2. “Double” means multiply by 2.\n3. Inside the “return” block find the “+” block and switch the operation to “×”.\n4. Replace the 1 in the second field with 2.\n5. Run again — the output shows 10. Check your solution.",
    infoTopics: ["console_output"],
    validate: validateFbDouble,
  },
};
