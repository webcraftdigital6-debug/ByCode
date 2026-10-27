/**
 * Блок «создать текст из» (text_join) должен давать обычную склейку строк, а
 * не «взрослые» приёмы штатных генераторов Blockly: `['a',b].join('')` в
 * JavaScript, `''.join([str(x) for x in [...]])` в Python и
 * `table.concat({...})` в Lua.
 */
import { describe, it, expect } from "vitest";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { forBlock as pyForBlock } from "../src/generators/python";
import { forBlock as luaForBlock } from "../src/generators/lua";
import { forBlock as phpForBlock } from "../src/generators/php";

Object.assign(javascriptGenerator.forBlock, jsForBlock);
Object.assign(pythonGenerator.forBlock, pyForBlock);
Object.assign(luaGenerator.forBlock, luaForBlock);
Object.assign(phpGenerator.forBlock, phpForBlock);

const textLit = (t: string) => ({ shadow: { type: "text", fields: { TEXT: t } } });
const numLit = (n: number) => ({ shadow: { type: "math_number", fields: { NUM: n } } });
const getVar = (name: string) => ({
  block: { type: "variables_get", fields: { VAR: { name } } },
});
const sumAgePlusOne = () => ({
  block: {
    type: "math_arithmetic",
    fields: { OP: "ADD" },
    inputs: { A: getVar("age"), B: numLit(1) },
  },
});

/** Программа задачи 5 («Hello, » + name + «!») и задачи 25 с «age + 1». */
function program(items: unknown[], itemCount: number) {
  const inputs: Record<string, unknown> = {};
  items.forEach((item, index) => (inputs[`ADD${index}`] = item));
  return {
    blocks: {
      languageVersion: 0,
      variables: [
        { name: "name" },
        { name: "age" },
        { name: "sum" },
      ],
      blocks: [
        {
          type: "variables_set",
          fields: { VAR: { name: "name" } },
          inputs: { VALUE: textLit("Ilya") },
        },
        {
          type: "variables_set",
          fields: { VAR: { name: "age" } },
          inputs: { VALUE: numLit(10) },
        },
        {
          type: "variables_set",
          fields: { VAR: { name: "sum" } },
          inputs: {
            VALUE: {
              block: { type: "text_join", extraState: { itemCount }, inputs },
            },
          },
        },
      ],
    },
  };
}

function codeFor(generator: Blockly.CodeGenerator, json: unknown): string {
  const ws = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(json as never, ws);
    return generator.workspaceToCode(ws);
  } finally {
    ws.dispose();
  }
}

const greeting = () =>
  program([textLit("Hello, "), getVar("name"), textLit("!")], 3);
const withSum = () =>
  program(
    [textLit("Next year "), sumAgePlusOne(), textLit(".")],
    3,
  );

describe("text_join: простая склейка на четырёх языках", () => {
  it("JavaScript: + вместо join()", () => {
    const code = codeFor(javascriptGenerator, greeting());
    expect(code).toContain("name2 = 'Ilya'");
    expect(code).toMatch(/sum = 'Hello, ' \+ name2 \+ '!';/);
    expect(code).not.toMatch(/\.join\(/);
  });

  it("Python: + со str() вместо генератора списка со циклом", () => {
    const code = codeFor(pythonGenerator, greeting());
    // sum — встроенная функция Python, поэтому в коде она sum2.
    expect(code).toMatch(/sum2 = 'Hello, ' \+ str\(name\) \+ '!'/);
    expect(code).not.toMatch(/join/);
    expect(code).not.toMatch(/for x in/);
  });

  it("Lua: .. вместо table.concat", () => {
    const code = codeFor(luaGenerator, greeting());
    expect(code).toMatch(/sum = 'Hello, ' \.\. tostring\(name\) \.\. '!'/);
    expect(code).not.toMatch(/table\.concat/);
  });

  it("PHP: точки, как и были", () => {
    const code = codeFor(phpGenerator, greeting());
    expect(code).toMatch(/\$sum = 'Hello, ' \. \$name \. '!';/);
  });

  it("Сложение внутри склейки не теряет скобки", () => {
    expect(codeFor(javascriptGenerator, withSum())).toMatch(
      /'Next year ' \+ \(age \+ 1\) \+ '\.'/,
    );
    expect(codeFor(pythonGenerator, withSum())).toMatch(
      /'Next year ' \+ str\(age \+ 1\) \+ '\.'/,
    );
    expect(codeFor(luaGenerator, withSum())).toMatch(
      /'Next year ' \.\. tostring\(age \+ 1\) \.\. '\.'/,
    );
    expect(codeFor(phpGenerator, withSum())).toMatch(
      /\$sum = 'Next year ' \. \(\$age \+ 1\) \. '\.';/,
    );
  });

  it("Одна часть приводит к строке, пустой блок даёт пустую строку", () => {
    const single = program([getVar("age")], 1);
    expect(codeFor(javascriptGenerator, single)).toMatch(/sum = String\(age\);/);
    expect(codeFor(pythonGenerator, single)).toMatch(/sum2 = str\(age\)/);
    expect(codeFor(luaGenerator, single)).toMatch(/sum = tostring\(age\)/);
    const empty = program([], 0);
    expect(codeFor(javascriptGenerator, empty)).toMatch(/sum = '';/);
    expect(codeFor(pythonGenerator, empty)).toMatch(/sum2 = ''/);
    expect(codeFor(luaGenerator, empty)).toMatch(/sum = ''/);
  });

  it("JS-склейка считается правильно (11, а не 101)", () => {
    const code = codeFor(javascriptGenerator, withSum());
    const values: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => void values.push(args.map(String).join(" "));
    try {
      new Function(`${code}; console.log(sum);`)();
    } finally {
      console.log = originalLog;
    }
    expect(values).toEqual(["Next year 11."]);
  });
});
