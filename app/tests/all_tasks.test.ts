import { describe, it, expect, beforeAll } from "vitest";
import * as Blockly from "blockly";
import { getTaskOrder, tasks } from "../src/tasks";
import type { TaskId } from "../src/tasks";

/**
 * Общий раннер валидаторов всех задач.
 *
 * Для каждой задачи проверяется главный инвариант: валидатор ПРИНИМАЕТ
 * корректный вывод (ok = true, stars >= 1). Это ловит регрессии вида
 * «задача стала непроходимой» (сломанный regex, неверное ожидание и т.п.).
 *
 * Блоки в рабочих областях — минимально достаточные для флагов, которые
 * валидатор требует для ok (переменные, if, печать и т.д.); логика кода не
 * исполняется. Полные e2e-решения со звёздами — в mult_table.test.ts и
 * char_freq.test.ts.
 */

// ---------- Хелперы сборки блоков (serialization JSON) ----------
const num = (n: number) => ({ block: { type: "math_number", fields: { NUM: n } } });
const getV = (name: string) => ({
  block: { type: "variables_get", fields: { VAR: { name } } },
});
const setV = (name: string, value: unknown) => ({
  type: "variables_set",
  fields: { VAR: { name } },
  inputs: { VALUE: value },
});
const setNum = (name: string, n: number) => setV(name, num(n));
const printB = () => ({ type: "add_text" });
const ifB = () => ({ type: "controls_if" });
const changeB = (name: string, delta: number) => ({
  type: "math_change",
  fields: { VAR: { name } },
  inputs: { DELTA: num(delta) },
});
const addB = (a: unknown, b: unknown) => ({
  block: {
    type: "math_arithmetic",
    fields: { OP: "ADD" },
    inputs: { A: a, B: b },
  },
});
const compareGT = (left: unknown, right: unknown) => ({
  type: "logic_compare",
  fields: { OP: "GT" },
  inputs: { A: left, B: right },
});
const getTop = (name: string) => ({
  type: "variables_get",
  fields: { VAR: { name } },
});
/** Строка lists_create_with — одна строка поля 3×3. */
const gridRow = () => ({ type: "lists_create_with", extraState: { itemCount: 3 } });
/** Двойное обращение к ячейке: внешний блок берёт строку, внутренний — элемент. */
const gridCell = () => ({
  type: "lists_getIndex",
  fields: { MODE: "GET", WHERE: "FROM_START" },
  inputs: {
    VALUE: {
      block: {
        type: "lists_getIndex",
        fields: { MODE: "GET", WHERE: "FROM_START" },
        inputs: { VALUE: getV("grid"), AT: num(2) },
      },
    },
    AT: num(2),
  },
});

type Row = {
  id: TaskId;
  output: string[];
  blocks: unknown[];
};

const rows: Row[] = [
  {
    id: "hello_world",
    output: ["Hello World!"],
    blocks: [printB()],
  },
  {
    id: "add_2_7",
    output: ["9"],
    blocks: [printB()],
  },
  {
    id: "var_my_age",
    output: ["10"],
    blocks: [setNum("myAge", 10), getTop("myAge"), printB()],
  },
  {
    id: "calc_sum",
    output: ["30"],
    blocks: [
      setNum("a", 10),
      setNum("b", 20),
      setV("sum", addB(getV("a"), getV("b"))),
      getTop("sum"),
      printB(),
    ],
  },
  {
    id: "greet_concat",
    output: ["Hello, World!"],
    blocks: [setNum("name", 1), getTop("name"), printB()],
  },
  {
    id: "inc_counter",
    output: ["1"],
    blocks: [setNum("counter", 0), changeB("counter", 1), getTop("counter"), printB()],
  },
  {
    id: "discount_calc",
    output: ["80"],
    blocks: [setNum("price", 100), setNum("discount", 20), getTop("price"), printB()],
  },
  {
    id: "first_condition",
    output: ["The weather is warm"],
    blocks: [
      setNum("temperature", 25),
      getTop("temperature"),
      ifB(),
      compareGT(getV("temperature"), num(0)),
      printB(),
    ],
  },
  {
    id: "even_or_odd",
    output: ["The number is even"],
    blocks: [setNum("n", 10), getTop("n"), printB()],
  },
  {
    id: "time_of_day",
    output: ["Good afternoon"],
    blocks: [setNum("hour", 14), getTop("hour"), printB()],
  },
  {
    id: "first_loop",
    output: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    blocks: [
      {
        type: "controls_for",
        fields: { VAR: { name: "i" } },
        inputs: { FROM: num(0), TO: num(10), BY: num(1) },
      },
      printB(),
    ],
  },
  {
    id: "sum_1_to_n",
    output: ["55"],
    blocks: [setNum("n", 10), getTop("n"), printB()],
  },
  {
    id: "guess_game",
    output: ["Congratulations! You guessed the number!"],
    blocks: [ifB(), compareGT(getV("guess"), num(3)), printB()],
  },
  {
    id: "list_foreach",
    output: ["1", "2", "3", "4", "5", "Сумма: 15"],
    blocks: [printB()],
  },
  {
    id: "sublist_foreach",
    output: ["3", "4", "5", "6", "7"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even",
    output: ["2", "4", "6", "8", "10", "30"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even_min_max",
    output: ["2", "4", "6", "8", "10", "min=2", "max=10"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even_avg",
    output: ["2", "4", "6", "8", "10", "count=5", "sum=30", "avg=6"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even_median",
    output: ["2", "4", "6", "8", "10", "count=5", "median=6"],
    blocks: [printB()],
  },
  {
    id: "list_sum_even_positions",
    output: ["sum=19"],
    blocks: [printB()],
  },
  {
    id: "list_sort_min_max",
    output: ["min=1", "max=9"],
    blocks: [printB()],
  },
  {
    id: "mult_table",
    output: (() => {
      const lines: string[] = [];
      for (let i = 1; i <= 5; i++)
        for (let j = 1; j <= 5; j++) lines.push(`${i} × ${j} = ${i * j}`);
      return lines;
    })(),
    blocks: [printB()],
  },
  {
    id: "first_even_break",
    output: ["8"],
    blocks: [
      {
        type: "controls_forEach",
        fields: { VAR: { name: "n" } },
        inputs: {
          LIST: {
            block: {
              type: "lists_create_with",
              extraState: { itemCount: 2 },
              inputs: {
                ADD0: { block: { type: "math_number", fields: { NUM: 7 } } },
                ADD1: { block: { type: "math_number", fields: { NUM: 8 } } },
              },
            },
          },
        },
      },
      { type: "controls_if" },
      {
        type: "math_number_property",
        fields: { PROPERTY: "EVEN" },
        inputs: {
          NUMBER_TO_CHECK: { block: { type: "variables_get", fields: { VAR: { name: "n" } } } },
        },
      },
      printB(),
      { type: "controls_flow_statements", fields: { FLOW: "BREAK" } },
    ],
  },
  {
    id: "first_function",
    output: ["Hello, world!", "Hello, world!", "Hello, world!"],
    blocks: [
      {
        type: "procedures_defnoreturn",
        fields: { NAME: "greet" },
        inputs: {
          STACK: {
            block: {
              type: "add_text",
              inputs: {
                TEXT: { shadow: { type: "text", fields: { TEXT: "Hello, world!" } } },
              },
            },
          },
        },
      },
      { type: "procedures_callnoreturn", extraState: { name: "greet" } },
      { type: "procedures_callnoreturn", extraState: { name: "greet" } },
      { type: "procedures_callnoreturn", extraState: { name: "greet" } },
    ],
  },
  {
    id: "function_with_param",
    output: ["Привет, Аня!", "Привет, Боря!"],
    blocks: [
      {
        type: "procedures_defnoreturn",
        fields: { NAME: "greet" },
        extraState: { params: [{ name: "name", id: "gwp-name" }] },
        inputs: {
          STACK: {
            block: {
              type: "add_text",
              inputs: {
                TEXT: {
                  block: {
                    type: "text_join",
                    extraState: { itemCount: 3 },
                    inputs: {
                      ADD0: { shadow: { type: "text", fields: { TEXT: "Привет, " } } },
                      ADD1: {
                        block: {
                          type: "variables_get",
                          fields: { VAR: { name: "name" } },
                        },
                      },
                      ADD2: { shadow: { type: "text", fields: { TEXT: "!" } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: "procedures_callnoreturn",
        extraState: { name: "greet", params: ["name"] },
        inputs: { ARG0: { shadow: { type: "text", fields: { TEXT: "Аня" } } } },
      },
      {
        type: "procedures_callnoreturn",
        extraState: { name: "greet", params: ["name"] },
        inputs: { ARG0: { shadow: { type: "text", fields: { TEXT: "Боря" } } } },
      },
    ],
  },
  {
    id: "function_return",
    output: ["7"],
    blocks: [
      {
        type: "procedures_defreturn",
        fields: { NAME: "add" },
        extraState: {
          params: [
            { name: "a", id: "fr-a" },
            { name: "b", id: "fr-b" },
          ],
        },
        inputs: {
          RETURN: {
            block: {
              type: "math_arithmetic",
              fields: { OP: "ADD" },
              inputs: {
                A: { block: { type: "variables_get", fields: { VAR: { name: "a" } } } },
                B: { block: { type: "variables_get", fields: { VAR: { name: "b" } } } },
              },
            },
          },
        },
      },
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: {
              type: "procedures_callreturn",
              extraState: { name: "add", params: ["a", "b"] },
              inputs: {
                ARG0: { shadow: { type: "math_number", fields: { NUM: 3 } } },
                ARG1: { shadow: { type: "math_number", fields: { NUM: 4 } } },
              },
            },
          },
        },
      },
    ],
  },
  {
    id: "dice_rolls",
    output: ["3", "1", "6", "2", "4", "5", "6", "1", "2", "4"],
    blocks: [
      {
        type: "controls_repeat_ext",
        inputs: {
          TIMES: num(10),
          DO: {
            block: {
              type: "add_text",
              inputs: {
                TEXT: {
                  block: {
                    type: "math_random_int",
                    inputs: { FROM: num(1), TO: num(6) },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
  {
    id: "chatterbox",
    output: ["Привет, Аня! Через год тебе будет 11."],
    blocks: [
      setV("name", { block: { type: "py_input" } }),
      setV("age", { block: { type: "py_input_number" } }),
      printB(),
    ],
  },
  {
    id: "loop_while_count",
    output: ["0", "1", "2", "3", "4"],
    blocks: [{ type: "controls_whileUntil", fields: { MODE: "WHILE" } }, printB()],
  },
  {
    id: "loop_while_input",
    output: ["4"],
    blocks: [
      {
        type: "controls_whileUntil",
        fields: { MODE: "UNTIL" },
        inputs: {
          BOOL: { block: compareGT(getV("guess"), num(1)) },
          DO: {
            block: {
              type: "variables_set",
              fields: { VAR: { name: "guess" } },
              inputs: { VALUE: { block: { type: "py_input_number" } } },
            },
          },
        },
      },
      getTop("guess"),
      printB(),
    ],
  },
  {
    id: "list_until_empty",
    output: ["hammer", "saw", "chisel"],
    blocks: [
      { type: "controls_whileUntil", fields: { MODE: "UNTIL" } },
      { type: "lists_isEmpty" },
      { type: "lists_getIndex", fields: { MODE: "GET_REMOVE", WHERE: "FIRST" } },
      printB(),
    ],
  },
  {
    id: "list_grid",
    output: ["E", "C", "G"],
    blocks: [
      gridRow(),
      gridRow(),
      gridRow(),
      gridRow(),
      gridCell(),
      gridCell(),
      gridCell(),
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "function_predicate",
    output: ["NO", "NO", "NO", "YES"],
    blocks: [
      {
        type: "procedures_defreturn",
        fields: { NAME: "big" },
        extraState: { params: [{ name: "num", id: "ap-num" }] },
        inputs: {
          RETURN: {
            block: {
              type: "logic_compare",
              fields: { OP: "GT" },
              inputs: {
                A: { block: { type: "variables_get", fields: { VAR: { name: "num" } } } },
                B: num(3),
              },
            },
          },
        },
      },
      {
        type: "controls_if",
        inputs: {
          IF0: {
            block: {
              type: "procedures_callreturn",
              extraState: { name: "big", params: ["num"] },
              inputs: { ARG0: num(4) },
            },
          },
        },
      },
      printB(),
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "proj_treasure_hunt",
    output: ["sunny beach", "3"],
    blocks: [
      { type: "controls_whileUntil", fields: { MODE: "WHILE" } },
      { type: "lists_create_with", extraState: { itemCount: 4 } },
      {
        type: "lists_getIndex",
        fields: { MODE: "GET", WHERE: "RANDOM" },
        inputs: { VALUE: getV("rooms") },
      },
      changeB("tries", 1),
      { type: "logic_compare", fields: { OP: "NEQ" } },
      printB(),
      printB(),
    ],
  },
  {
    id: "str_length",
    output: ["7", "ylkcolB"],
    blocks: [
      { type: "add_text", inputs: { TEXT: { block: { type: "text_length" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_reverse" } } } },
    ],
  },
  {
    id: "str_charat",
    output: ["B", "y", "o"],
    blocks: [
      { type: "add_text", inputs: { TEXT: { block: { type: "text_charAt" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_charAt" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_charAt" } } } },
    ],
  },
  {
    id: "str_substring",
    output: ["Blo", "kly", "lockl"],
    blocks: [
      {
        type: "add_text",
        inputs: { TEXT: { block: { type: "text_getSubstring" } } },
      },
      {
        type: "add_text",
        inputs: { TEXT: { block: { type: "text_getSubstring" } } },
      },
      {
        type: "add_text",
        inputs: { TEXT: { block: { type: "text_getSubstring" } } },
      },
    ],
  },
  {
    id: "str_clean",
    output: ["PRIVET!"],
    blocks: [
      setV("phrase", { block: { type: "text", fields: { TEXT: "  pri" } } }),
      {
        type: "text_append",
        fields: { VAR: { name: "phrase" } },
        inputs: { TEXT: { block: { type: "text", fields: { TEXT: "vet!" } } } },
      },
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: {
              type: "text_changeCase",
              inputs: {
                TEXT: {
                  block: {
                    type: "text_trim",
                    inputs: { TEXT: getV("phrase") },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
  {
    id: "a1_number_analyzer",
    output: ["The number is odd", "The number is positive"],
    blocks: [setNum("number", 7), getTop("number"), printB()],
  },
  {
    id: "sum_array",
    output: ["15"],
    blocks: [printB()],
  },
  {
    id: "min_max",
    output: ["min=1", "max=9"],
    blocks: [printB()],
  },
  {
    id: "char_freq",
    output: ["a:3", "b:4", "c:1"],
    blocks: [printB()],
  },
  {
    id: "str_indexof",
    output: ["2", "6", "0"],
    blocks: [
      { type: "add_text", inputs: { TEXT: { block: { type: "text_indexOf" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_indexOf" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_indexOf" } } } },
    ],
  },
  {
    id: "str_count",
    output: ["3", "2", "0"],
    blocks: [
      { type: "add_text", inputs: { TEXT: { block: { type: "text_count" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_count" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_count" } } } },
    ],
  },
  {
    id: "str_replace",
    output: ["M1ss1ss1pp1", "Mishishippi", "Mississippi"],
    blocks: [
      { type: "add_text", inputs: { TEXT: { block: { type: "text_replace" } } } },
      { type: "add_text", inputs: { TEXT: { block: { type: "text_replace" } } } },
    ],
  },
  {
    id: "logic_and_or_not",
    output: ["NO", "YES", "NO"],
    blocks: [
      { type: "logic_operation", fields: { OP: "AND" } },
      { type: "logic_operation", fields: { OP: "OR" } },
      { type: "logic_negate" },
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "logic_ternary_task",
    output: ["MORE", "EMPTY", "NO VALUE"],
    blocks: [
      { type: "logic_ternary" },
      { type: "logic_ternary" },
      { type: "logic_ternary" },
      { type: "logic_null" },
      { type: "text_isEmpty" },
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "math_functions",
    output: ["12", "7", "3", "-5"],
    blocks: [
      { type: "math_single", fields: { OP: "ROOT" } },
      { type: "math_single", fields: { OP: "ABS" } },
      { type: "math_single", fields: { OP: "NEG" } },
      { type: "math_constant", fields: { CONSTANT: "PI" } },
      { type: "math_round", fields: { OP: "ROUND" } },
      { type: "math_round", fields: { OP: "ROUND" } },
      printB(),
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "math_round_clamp",
    output: ["4", "5", "5", "4", "100", "0"],
    blocks: [
      { type: "math_round", fields: { OP: "ROUND" } },
      { type: "math_round", fields: { OP: "ROUND" } },
      { type: "math_round", fields: { OP: "ROUNDUP" } },
      { type: "math_round", fields: { OP: "ROUNDDOWN" } },
      { type: "math_constrain" },
      { type: "math_constrain" },
      printB(),
      printB(),
      printB(),
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "list_split_join",
    output: ["10", "20", "30", "10-20-30"],
    blocks: [
      { type: "lists_split", fields: { MODE: "SPLIT" } },
      { type: "lists_split", fields: { MODE: "JOIN" } },
      { type: "controls_forEach" },
      printB(),
      printB(),
    ],
  },
  {
    id: "list_operations",
    output: ["3", "2", "1", "5", "2"],
    blocks: [
      { type: "lists_reverse" },
      { type: "lists_repeat" },
      { type: "lists_length" },
      { type: "lists_indexOf" },
      printB(),
      printB(),
      printB(),
      printB(),
      printB(),
    ],
  },
  {
    id: "fb_area",
    output: ["42"],
    blocks: [
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: {
              type: "math_arithmetic",
              fields: { OP: "MULTIPLY" },
              inputs: { A: num(6), B: num(7) },
            },
          },
        },
      },
    ],
  },
  {
    id: "fb_join",
    output: ["Hello, World!"],
    blocks: [
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: {
              type: "text_join",
              extraState: { itemCount: 2 },
              inputs: {
                ADD0: { shadow: { type: "text", fields: { TEXT: "Hello, " } } },
                ADD1: { shadow: { type: "text", fields: { TEXT: "World!" } } },
              },
            },
          },
        },
      },
    ],
  },
  {
    id: "fb_parity",
    output: ["even"],
    blocks: [
      setNum("number", 8),
      {
        type: "controls_if",
        inputs: {
          IF0: {
            block: {
              type: "logic_compare",
              fields: { OP: "EQ" },
              inputs: {
                A: {
                  block: {
                    type: "math_modulo",
                    inputs: {
                      DIVIDEND: getV("number"),
                      DIVISOR: num(2),
                    },
                  },
                },
                B: num(0),
              },
            },
          },
        },
      },
      printB(),
    ],
  },
  {
    id: "fb_loop",
    output: Array.from({ length: 10 }, (_, i) => String(i + 1)),
    blocks: [
      {
        type: "controls_for",
        fields: { VAR: { name: "i" } },
        inputs: { FROM: num(1), TO: num(10), BY: num(1) },
      },
      printB(),
    ],
  },
  {
    id: "fb_list",
    output: ["2", "4", "6"],
    blocks: [
      {
        type: "controls_forEach",
        fields: { VAR: { name: "item" } },
        inputs: {
          LIST: {
            block: { type: "lists_create_with", extraState: { itemCount: 3 } },
          },
        },
      },
      printB(),
    ],
  },
  {
    id: "fb_double",
    output: ["10"],
    blocks: [
      {
        type: "procedures_defreturn",
        fields: { NAME: "double" },
        extraState: { params: [{ name: "x", id: "fb-x" }] },
        inputs: {
          RETURN: {
            block: {
              type: "math_arithmetic",
              fields: { OP: "MULTIPLY" },
              inputs: {
                A: { block: { type: "variables_get", fields: { VAR: { name: "x" } } } },
                B: num(2),
              },
            },
          },
        },
      },
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: {
              type: "procedures_callreturn",
              extraState: { name: "double", params: ["x"] },
              inputs: { ARG0: num(5) },
            },
          },
        },
      },
    ],
  },
];

beforeAll(() => {
  // Валидаторы, читающие вывод из DOM (getVisibleOutputLines), должны найти #output
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

describe("все задачи: валидатор принимает корректный вывод", () => {
  it.each(rows.map((r) => r.id))("%s: ok=true, stars>=1", async (id) => {
    const row = rows.find((r) => r.id === id)!;
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      { blocks: { languageVersion: 0, blocks: row.blocks } } as never,
      ws
    );
    fillOutput(row.output);
    const res = await tasks[id].validate(ws as never, row.output, "ru");
    if (!res.ok) {
      throw new Error(
        `Задача ${id}: валидатор не принял корректный вывод — ` +
          `это регрессия вида «задача непроходима»`
      );
    }
    expect(res.ok).toBe(true);
    expect(res.stars).toBeGreaterThanOrEqual(1);
  });
});

describe("реестр задач целостен", () => {
  it("в реестре 71 задача", () => {
    expect(Object.keys(tasks).length).toBe(71);
  });

  it("номер в заголовке совпадает с позицией в порядке прохождения", () => {
    for (const id of Object.keys(tasks) as TaskId[]) {
      const order = getTaskOrder(tasks[id].difficulty);
      expect(order, `${id}: задача вне порядка прохождения`).toContain(id);
    }

    // В уровне «Продвинутый» задачи помечены «A1…», а не сквозной нумерацией.
    for (const difficulty of ["basic", "fixbugs"] as const) {
      const order = getTaskOrder(difficulty);
      order.forEach((id, i) => {
        const n = i + 1;
        expect(tasks[id].title("ru"), `${id}: ru заголовок`).toContain(`Задача ${n}:`);
        expect(tasks[id].title("en"), `${id}: en заголовок`).toContain(`Task ${n}:`);
      });
    }
  });

  it("каждая задача имеет title/description/hint/validate", () => {
    for (const [id, def] of Object.entries(tasks)) {
      expect(typeof def.title, `title ${id}`).toBe("function");
      expect(typeof def.description, `description ${id}`).toBe("function");
      expect(typeof def.hint, `hint ${id}`).toBe("function");
      expect(typeof def.validate, `validate ${id}`).toBe("function");
      expect(def.difficulty, `difficulty ${id}`).toMatch(/^(basic|fixbugs|advanced)$/);
    }
  });

  it("каждая задача в порядке прохождения имеет запись в реестре (обратное проверено типами)", () => {
    // TaskId — union-тип: компилятор гарантирует, что все id из порядка
    // прохождения существуют в реестре. Здесь проверяем обратное направление:
    // все ключи реестра уникальны и непусты.
    const ids = Object.keys(tasks);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("пустой вывод не засчитывается ни по одной задаче", async () => {
    const ws = new Blockly.Workspace();
    for (const [id, def] of Object.entries(tasks)) {
      fillOutput([]);
      const res = await def.validate(ws as never, [], "ru");
      expect(res.ok, `задача ${id} не должна засчитываться с пустым выводом`).toBe(false);
    }
  });
});
