/**
 * Тесты валидаторов задач «Кубик» (dice_rolls) и «Болталка» (chatterbox):
 * форма вывода важнее значений (рандом), проверяются и негативные
 * сценарии — неверный диапазон/количество, чужая фраза.
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as Blockly from "blockly";

import { tasks } from "../src/tasks";

const num = (n: number) => ({ block: { type: "math_number", fields: { NUM: n } } });
const setV = (name: string, value: unknown) => ({
  type: "variables_set",
  fields: { VAR: { name } },
  inputs: { VALUE: value },
});
const rollSolution = {
  type: "controls_repeat_ext",
  inputs: {
    TIMES: num(10),
    DO: {
      block: {
        type: "add_text",
        inputs: {
          TEXT: { block: { type: "math_random_int", inputs: { FROM: num(1), TO: num(6) } } },
        },
      },
    },
  },
};

function load(blocks: unknown[]): Blockly.Workspace {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks } } as never, ws);
  return ws;
}

function fillOutput(lines: string[]) {
  (document.getElementById("output") as HTMLDivElement).innerHTML = lines
    .map((l) => `<p>${l}</p>`)
    .join("");
}

beforeAll(() => {
  document.body.innerHTML = `<div id="output"></div>`;
});

describe("dice_rolls (задача 20)", () => {
  const good = ["3", "1", "6", "2", "4", "5", "6", "1", "2", "4"];

  it("принимает 10 чисел 1…6 от корректной программы", async () => {
    fillOutput(good);
    const res = await tasks.dice_rolls.validate(load([rollSolution]) as never, good, "ru");
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("отвергает число вне диапазона", async () => {
    const bad = ["7", ...good.slice(1)];
    fillOutput(bad);
    const res = await tasks.dice_rolls.validate(load([rollSolution]) as never, bad, "ru");
    expect(res.ok).toBe(false);
  });

  it("отвергает другое количество бросков", async () => {
    const nine = good.slice(0, 9);
    fillOutput(nine);
    const res = await tasks.dice_rolls.validate(load([rollSolution]) as never, nine, "ru");
    expect(res.ok).toBe(false);
  });

  it("отвергает печать случайного числа без цикла", async () => {
    fillOutput(good);
    const ws = load([
      {
        type: "add_text",
        inputs: {
          TEXT: { block: { type: "math_random_int", inputs: { FROM: num(1), TO: num(6) } } },
        },
      },
    ]);
    const res = await tasks.dice_rolls.validate(ws as never, good, "ru");
    expect(res.ok).toBe(false);
  });
});

describe("chatterbox (задача 25)", () => {
  const solution = [
    setV("name", { block: { type: "py_input" } }),
    setV("age", { block: { type: "py_input_number" } }),
    {
      type: "add_text",
      inputs: {
        TEXT: {
          block: {
            type: "text_join",
            extraState: { itemCount: 4 },
            inputs: {
              ADD0: { shadow: { type: "text", fields: { TEXT: "Привет, " } } },
              ADD1: { block: { type: "variables_get", fields: { VAR: { name: "name" } } } },
              ADD2: { shadow: { type: "text", fields: { TEXT: "! Через год тебе будет " } } },
              ADD3: {
                block: {
                  type: "math_arithmetic",
                  fields: { OP: "ADD" },
                  inputs: {
                    A: { block: { type: "variables_get", fields: { VAR: { name: "age" } } } },
                    B: num(1),
                  },
                },
              },
            },
          },
        },
      },
    },
  ];

  it("принимает русскую форму фразы", async () => {
    const lines = ["Привет, Аня! Через год тебе будет 11."];
    fillOutput(lines);
    const res = await tasks.chatterbox.validate(load(solution) as never, lines, "ru");
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("принимает английскую форму фразы", async () => {
    const lines = ["Hello, Anya! Next year you will be 12."];
    fillOutput(lines);
    const res = await tasks.chatterbox.validate(load(solution) as never, lines, "ru");
    expect(res.ok).toBe(true);
  });

  it("отвергает приветствие без второй части", async () => {
    const lines = ["Привет, Аня!"];
    fillOutput(lines);
    const res = await tasks.chatterbox.validate(load(solution) as never, lines, "ru");
    expect(res.ok).toBe(false);
  });

  it("отвергает решение без блоков ввода", async () => {
    const lines = ["Привет, Аня! Через год тебе будет 11."];
    fillOutput(lines);
    const ws = load([setV("name", num(1)), setV("age", num(10)), { type: "add_text" }]);
    const res = await tasks.chatterbox.validate(ws as never, lines, "ru");
    expect(res.ok).toBe(false);
  });
});
