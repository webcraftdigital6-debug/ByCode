/**
 * E2E для серии задач на интерактивный ввод (in_* в разделе «Основа»):
 * 1) эталон из solutions/<id>.xml, исполненный с фиксированными ответами
 *    ученика, обязан проходить валидацию на 3★;
 * 2) решение засчитывается именно по введённым значениям: другой вердикт,
 *    чужая сумма, неполный счёт или чужая таблица — не проходят;
 * 3) пустой вывод не проходит ни одну задачу серии.
 *
 * Ответы и строку-эхо «> ответ» даёт tests/interactive-input.ts — так тест
 * повторяет поведение окна вывода (src/codeExecution.ts).
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";
import { INPUT_ANSWERS, makeInput } from "./interactive-input";
import type { TaskId } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

const SOLUTIONS_DIR = path.resolve(__dirname, "../../solutions");

/** Задачи серии «ввод» раздела «Основа» (fb_input покрыт fixbugs.test.ts). */
const INPUT_TASKS: TaskId[] = [
  "in_greet",
  "in_two_numbers",
  "in_adult_gate",
  "in_count_to_n",
  "in_times_table",
];

beforeAll(() => {
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

function loadSolution(id: TaskId): Blockly.Workspace {
  const xml = fs.readFileSync(path.join(SOLUTIONS_DIR, `${id}.xml`), "utf-8");
  const ws = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), ws);
  return ws;
}

/** Исполняет эталонный XML с ответами ученика и возвращает строки вывода. */
function runSolution(id: TaskId, ws: Blockly.Workspace): string[] {
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
  return logs;
}

async function validate(id: TaskId, ws: Blockly.Workspace, lines: string[]) {
  fillOutput(lines);
  return tasks[id].validate(ws as never, lines, "ru");
}

describe("задачи на ввод: эталон проходит на 3★", () => {
  for (const id of INPUT_TASKS) {
    it(`${id}: эталон с ответами ${JSON.stringify(INPUT_ANSWERS[id])}`, async () => {
      const ws = loadSolution(id);
      const lines = runSolution(id, ws);
      const res = await validate(id, ws, lines);
      expect(
        res.ok,
        `${id}: эталон не принят (вывод: ${JSON.stringify(lines)})`
      ).toBe(true);
      expect(res.stars, `${id}: эталон должен давать 3★`).toBe(3);
    });
  }
});

describe("задачи на ввод: ответ зависит от введённого значения", () => {
  it("in_greet: приветствие без имени не засчитывается", async () => {
    const ws = loadSolution("in_greet");
    const res = await validate("in_greet", ws, [
      "Как тебя зовут?",
      "> Маша",
      "Привет!",
    ]);
    expect(res.ok).toBe(false);
  });

  it("in_two_numbers: напечатано число, не равное сумме ответов", async () => {
    const ws = loadSolution("in_two_numbers");
    const res = await validate("in_two_numbers", ws, ["> 3", "> 4", "8"]);
    expect(res.ok).toBe(false);
  });

  it("in_adult_gate: вердикт не соответствует введённому возрасту", async () => {
    const ws = loadSolution("in_adult_gate");
    const res = await validate("in_adult_gate", ws, [
      "Сколько тебе лет?",
      "> 20",
      "Доступ запрещён",
    ]);
    expect(res.ok).toBe(false);
  });

  it("in_adult_gate: два вердикта (нет ветки «иначе») не засчитываются", async () => {
    const ws = loadSolution("in_adult_gate");
    const res = await validate("in_adult_gate", ws, [
      "> 12",
      "Доступ разрешён",
      "Доступ запрещён",
    ]);
    expect(res.ok).toBe(false);
  });

  it("in_count_to_n: счёт короче введённого числа не засчитывается", async () => {
    const ws = loadSolution("in_count_to_n");
    const res = await validate("in_count_to_n", ws, ["> 4", "1", "2", "3"]);
    expect(res.ok).toBe(false);
  });

  it("in_times_table: таблица другого числа не засчитывается", async () => {
    const ws = loadSolution("in_times_table");
    const res = await validate("in_times_table", ws, [
      "> 7",
      "5 × 1 = 5",
      "5 × 2 = 10",
      "5 × 3 = 15",
      "5 × 4 = 20",
      "5 × 5 = 25",
      "5 × 6 = 30",
      "5 × 7 = 35",
      "5 × 8 = 40",
      "5 × 9 = 45",
      "5 × 10 = 50",
    ]);
    expect(res.ok).toBe(false);
  });

  it("in_times_table: девять строк вместо десяти не засчитываются", async () => {
    const ws = loadSolution("in_times_table");
    const lines = ["> 7"];
    for (let i = 1; i <= 9; i += 1) lines.push(`7 × ${i} = ${7 * i}`);
    const res = await validate("in_times_table", ws, lines);
    expect(res.ok).toBe(false);
  });
});

describe("задачи на ввод: пустой вывод не засчитывается", () => {
  for (const id of INPUT_TASKS) {
    it(`${id}: без строк в окне вывода решение не принято`, async () => {
      const ws = loadSolution(id);
      const res = await validate(id, ws, []);
      expect(res.ok).toBe(false);
      expect(res.stars).toBe(0);
    });
  }
});
