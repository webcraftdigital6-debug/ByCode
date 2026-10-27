/**
 * Блоки «Ввод текста» (py_input) и «Ввод числа» (py_input_number) должны
 * генерироваться на всех четырёх языках: PHP-генератор Blockly их не знает
 * и бросает «does not know how to generate code for block type», из-за чего
 * любая задача со вводом в PHP была непроходима.
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

// name = ввод текста; печать(ввод числа)
const program = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "variables_set",
        fields: { VAR: { name: "name" } },
        inputs: { VALUE: { block: { type: "py_input" } } },
      },
      {
        type: "add_text",
        inputs: { TEXT: { block: { type: "py_input_number" } } },
      },
    ],
  },
};

function codeFor(generator: Blockly.CodeGenerator): string {
  const ws = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(program as never, ws);
    return generator.workspaceToCode(ws);
  } finally {
    ws.dispose();
  }
}

describe("ввод: генерация на четырёх языках", () => {
  it("PHP: input() и floatval(input()) вместо ошибки генерации", () => {
    const code = codeFor(phpGenerator);
    expect(code).toMatch(/\$name\s*=\s*input\(\);/);
    expect(code).toMatch(/floatval\(input\(\)\)/);
  });

  it("PHP: вызовов fgets/STDIN в генерации нет — их даёт рантайм-преамбула", () => {
    const code = codeFor(phpGenerator);
    expect(code).not.toMatch(/STDIN/);
    expect(code).not.toMatch(/fgets/);
  });

  it("JS, Python и Lua остаются как были", () => {
    expect(codeFor(javascriptGenerator)).toMatch(/input\(\)/);
    expect(codeFor(pythonGenerator)).toMatch(/input\(\)/);
    expect(codeFor(luaGenerator)).toMatch(/input\(\)/);
    expect(codeFor(javascriptGenerator)).toMatch(/Number\(input\(\)\)/);
    expect(codeFor(pythonGenerator)).toMatch(/float\(input\(\)\)/);
    expect(codeFor(luaGenerator)).toMatch(/tonumber\(input\(\)\)/);
  });
});
