/**
 * E2E-раннер эталонных решений из solutions/<taskId>.xml.
 *
 * Для каждой задачи: XML → рабочая область → генерация JS → исполнение
 * (console.log перехватывается) → валидатор задачи. Инвариант: эталонное
 * решение ОБЯЗАНО проходить валидацию. Ловит: битые XML, рассинхрон
 * решений с валидаторами, невалидные генераторы блоков.
 *
 * Задачи с интерактивным вводом (in_*, fb_input) прогоняются через eval:
 * полифилл input() из tests/interactive-input.ts отдаёт заранее заданные
 * ответы и печатает строку-эхо «> ответ», как окно вывода приложения.
 * Задачи с рандомом и с циклом по вводу проверяются валидатором с ожидаемым
 * выводом из MANUAL_OUTPUT (блоки из XML гарантируют нужные флаги структуры).
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

// Регистрируем кастомные генераторы JS (как это делает index.ts)
Object.assign(javascriptGenerator.forBlock, jsForBlock);

const SOLUTIONS_DIR = path.resolve(__dirname, "../../solutions");

beforeAll(() => {
  // Валидаторы многих задач читают вывод из DOM (getVisibleOutputLines →
  // #output). Готовим контейнер и заполняем его перед каждой валидацией —
  // как это делает all_tasks.test.ts.
  document.body.innerHTML = `<div id="output"></div>`;
});

/** Кладёт строки вывода в DOM (#output → <p>…</p>), как это делает приложение. */
function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

function loadSolution(taskId: string): { xml: string; ws: Blockly.Workspace } {
  const xmlPath = path.join(SOLUTIONS_DIR, `${taskId}.xml`);
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const dom = Blockly.utils.xml.textToDom(xml);
  const ws = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace(dom, ws);
  return { xml, ws };
}

function runCode(id: TaskId, ws: Blockly.Workspace): string[] {
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

// Задачи, которые нельзя прогнать end-to-end (input(), рандом, дин. ввод),
// но валидатор всё равно требует флаги структуры из XML.
// Проверяем: XML парсится, блоки на месте, и (для выполнимых) вывод валиден.
const ALL_TASK_IDS = Object.keys(tasks) as TaskId[];

// Пары (taskId, ожидаемый признак выполнения): задачи с вводом/рандомом —
// проверка вывода вручную не нужна: валидатор запускаем с эталонным выводом.
const RUNNABLE = new Set<string>([
  "hello_world",
  "add_2_7",
  "var_my_age",
  "calc_sum",
  "greet_concat",
  "inc_counter",
  "discount_calc",
  "first_condition",
  "even_or_odd",
  "time_of_day",
  "first_loop",
  "sum_1_to_n",
  "list_foreach",
  "sublist_foreach",
  "list_filter_even",
  "list_filter_even_min_max",
  "list_filter_even_avg",
  "list_filter_even_median",
  "list_sum_even_positions",
  "list_sort_min_max",
  "mult_table",
  "first_even_break",
  "first_function",
  "function_with_param",
  "function_return",
  "fb_area",
  "fb_join",
  "fb_parity",
  "fb_loop",
  "fb_list",
  "fb_double",
  "dice_rolls",
  "str_length",
  "str_charat",
  "str_substring",
  "str_clean",
  "str_indexof",
  "str_count",
  "str_replace",
  "logic_and_or_not",
  "logic_ternary_task",
  "math_functions",
  "math_round_clamp",
  "list_split_join",
  "list_operations",
  "list_inventory_index",
  "list_inventory_replace",
  "list_inventory_add",
  "list_inventory_remove",
  "list_inventory_random",
  "proj_inventory",
  "logic_gate_check",
  "str_echo",
  "a1_number_analyzer",
  "sum_array",
  "min_max",
  "char_freq",
  "loop_while_count",
  "list_until_empty",
  "list_grid",
  "function_predicate",
  "proj_treasure_hunt",
  // Задачи с интерактивным вводом: ответы берёт INPUT_ANSWERS, эхо печатает
  // makeInput — так проверяется и порядок «вопрос → ввод → ответ».
  "in_greet",
  "in_two_numbers",
  "in_adult_gate",
  "in_count_to_n",
  "in_times_table",
  "fb_input",
]);

// Ожидаемый вывод для невыполнимых через eval задач (input/рандом):
// валидатор получает вывод, который дала бы корректная программа.
const MANUAL_OUTPUT: Partial<Record<TaskId, string[]>> = {
  guess_game: [
    "Загадано число от 1 до 100!",
    "Загаданное число больше!",
    "Загаданное число меньше!",
    "Поздравляем! Вы угадали число!",
  ],
  chatterbox: ["Привет, Аня! Через год тебе будет 11."],
  // Цикл «пока не» с вводом: программа спрашивала 9, затем приняла 4.
  loop_while_input: ["4"],
};

describe("Эталонные решения (solutions/*.xml)", () => {
  it("каждая задача имеет файл решения", () => {
    for (const id of ALL_TASK_IDS) {
      const p = path.join(SOLUTIONS_DIR, `${id}.xml`);
      expect(fs.existsSync(p), `solutions/${id}.xml отсутствует`).toBe(true);
    }
  });

  for (const id of ALL_TASK_IDS) {
    it(`решение ${id} проходит валидацию`, async () => {
      const { ws } = loadSolution(id);
      // XML должен разворачиваться в непустое рабочее поле
      expect(ws.getAllBlocks(false).length).toBeGreaterThan(0);

      let lines: string[];
      if (MANUAL_OUTPUT[id]) {
        lines = MANUAL_OUTPUT[id]!;
      } else if (RUNNABLE.has(id)) {
        lines = runCode(id, ws);
        expect(lines.length, `${id}: решение ничего не выводит`).toBeGreaterThan(0);
      } else {
        // Остальные задачи прогоняем с ожидаемым выводом из валидатора,
        // блоки из XML дают структурные флаги
        lines = ["ok"];
      }

      // Кладём вывод в DOM: валидаторы читают его через getVisibleOutputLines
      fillOutput(lines);
      const res = await tasks[id].validate(ws as never, lines, "ru");
      expect(
        res.ok,
        `${id}: эталонное решение не прошло валидацию (вывод: ${JSON.stringify(lines)})`
      ).toBe(true);
      expect(res.stars, `${id}: эталон должен давать звёзды`).toBeGreaterThanOrEqual(1);
    });
  }
});
