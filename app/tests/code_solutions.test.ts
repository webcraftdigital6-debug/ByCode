/**
 * Guard-тест режима «код в редакторе».
 *
 * Ученик вправе не собирать блоки, а написать программу в панели кода (кнопка
 * ▶ в Ace запускает именно текст редактора). Тогда рабочая область пуста, и
 * проверка обязана опираться только на вывод. Инварианты для КАЖДОЙ задачи:
 *
 * 1. пустая рабочая область + корректный вывод  → ok=true;
 * 2. пустая рабочая область + посторонний вывод  → ok=false
 *    (иначе «режим кода» превращается в «напиши любую цифру»);
 * 3. верное решение без блоков получает верхнюю шкалу звёзд, как и
 *    оптимальная сборка блоками (см. applyCodeModeStars).
 *
 * Корректный вывод берётся из эталонного решения solutions/<taskId>.xml:
 * XML → генератор JS → выполнение. Задачи с input()/рандомом используют
 * MANUAL_OUTPUT (тот же источник, что и solutions.test.ts).
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";
import { applyCodeModeStars } from "../src/tasks/utils";
import { INPUT_ANSWERS, makeInput } from "./interactive-input";
import type { TaskId } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

const SOLUTIONS_DIR = path.resolve(__dirname, "../../solutions");

/** Вывод корректной, но не эталонной по форме программы: годится «любая» строка
 *  с цифрой. Если валидатор принимает такое — проверка слишком слабая. */
const JUNK_OUTPUT = ["zzz-мусор-999"];

const MANUAL_OUTPUT: Partial<Record<TaskId, string[]>> = {
  guess_game: [
    "Загадано число от 1 до 100!",
    "Загаданное число больше!",
    "Загаданное число меньше!",
    "Поздравляем! Вы угадали число!",
  ],
  chatterbox: ["Привет, Аня! Через год тебе будет 11."],
  // Цикл «пока не»: программа спросила 9, приняла 4.
  loop_while_input: ["4"],
};

beforeAll(() => {
  // Часть валидаторов читает вывод из DOM (#output), как это делает
  // приложение, — заполняем его перед каждой проверкой.
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

/** Строки, которые печатает корректная программа задачи. */
function expectedOutput(id: TaskId): string[] {
  if (MANUAL_OUTPUT[id]) return MANUAL_OUTPUT[id]!;
  const xml = fs.readFileSync(path.join(SOLUTIONS_DIR, `${id}.xml`), "utf-8");
  const ws = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), ws);
  const code = javascriptGenerator.workspaceToCode(ws);
  const logs: string[] = [];
  // Имя должно остаться `input`: его читает eval-код, а не этот модуль.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const input = makeInput(INPUT_ANSWERS[id], (line) => logs.push(line));
  const orig = console.log;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  try {
    eval(code);
  } finally {
    console.log = orig;
  }
  expect(logs.length, `${id}: эталон ничего не выводит`).toBeGreaterThan(0);
  return logs;
}

/** Пустая рабочая область — «ученик написал код в редакторе, блоков нет». */
function noBlocksWorkspace() {
  return new Blockly.Workspace() as never;
}

const ALL_TASK_IDS = Object.keys(tasks) as TaskId[];
const GOLD = new Map<TaskId, string[]>();

describe("Решение задачи кодом в редакторе (без блоков)", () => {
  beforeAll(() => {
    for (const id of ALL_TASK_IDS) GOLD.set(id, expectedOutput(id));
  });

  for (const id of ALL_TASK_IDS) {
    it(`${id}: корректный вывод без блоков засчитывается`, async () => {
      const lines = GOLD.get(id)!;
      fillOutput(lines);
      const res = await tasks[id].validate(noBlocksWorkspace(), lines, "ru");
      expect(
        res.ok,
        `${id}: решение кодом отклонено (вывод: ${JSON.stringify(lines)})`
      ).toBe(true);
      expect(res.stars, `${id}: решение кодом без звёзд`).toBeGreaterThanOrEqual(1);
    });
  }

  for (const id of ALL_TASK_IDS) {
    it(`${id}: посторонний вывод без блоков не засчитывается`, async () => {
      fillOutput(JUNK_OUTPUT);
      const res = await tasks[id].validate(noBlocksWorkspace(), JUNK_OUTPUT, "ru");
      expect(
        res.ok,
        `${id}: слишком слабая проверка — принят вывод ${JSON.stringify(JUNK_OUTPUT)}`
      ).toBe(false);
    });
  }
});

describe("Шкала звёзд в режиме кода", () => {
  it("верное решение без блоков получает максимум, как оптимальные блоки", () => {
    const ws = new Blockly.Workspace() as unknown as Blockly.WorkspaceSvg;
    expect(applyCodeModeStars({ ok: true, stars: 1 }, ws)).toEqual({ ok: true, stars: 3 });
  });

  it("собранные блоками звёзды не меняются", () => {
    const xml = Blockly.utils.xml.textToDom(
      `<block type="text_print"><field name="TEXT">Hello World!</field></block>`
    );
    const ws = new Blockly.Workspace();
    Blockly.Xml.domToBlock(xml, ws as never);
    const real = ws as unknown as Blockly.WorkspaceSvg;
    expect(applyCodeModeStars({ ok: true, stars: 2 }, real)).toEqual({ ok: true, stars: 2 });
    expect(applyCodeModeStars({ ok: false, stars: 0 }, ws)).toEqual({ ok: false, stars: 0 });
  });
});
