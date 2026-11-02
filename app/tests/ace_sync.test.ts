/**
 * Панель кода обязана отражать текущую сборку: удалил блок — его код исчез.
 * При этом программу, набранную руками (режим кода без блоков), затирать
 * нельзя. Эти два требования конфликтуют, когда генерация пуста, поэтому
 * проверка опирается на то, что генератор выдавал до текущего события.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import {
  setupAceEditor,
  updateAceEditorFromWorkspace,
  getAceEditor,
} from "../src/aceEditor";

// Регистрация кастомных генераторов — как в index.ts: без неё Blockly не
// знает, как превратить «Вывести …» в console.log.
Object.assign(javascriptGenerator.forBlock, jsForBlock);

/** Блок «Вывести …» с тенью-текстом: порождает строку кода. */
function printBlock(text: string): object {
  return {
    type: "add_text",
    inputs: { TEXT: { shadow: { type: "text", fields: { TEXT: text } } } },
  };
}

/** Стопка блоков «Вывести» по одному на строку. */
function program(...texts: string[]): object {
  let next: object | undefined;
  for (const text of [...texts].reverse()) {
    next = { ...printBlock(text), ...(next ? { next: { block: next } } : {}) };
  }
  return { blocks: { languageVersion: 0, blocks: next ? [next] : [] } };
}

function editorValue(): string {
  return getAceEditor()?.getValue() ?? "";
}

function load(definition: object, workspace: Blockly.Workspace): void {
  Blockly.serialization.workspaces.load(definition as never, workspace);
}

describe("синхронизация панели кода с рабочим полем", () => {
  let ws: Blockly.Workspace;

  beforeEach(() => {
    if (!getAceEditor()) {
      const host = document.createElement("div");
      host.id = "editor";
      document.body.appendChild(host);
      setupAceEditor(() => "javascript");
    }
    ws = new Blockly.Workspace();
    getAceEditor()?.setValue("", -1);
    updateAceEditorFromWorkspace(ws, "javascript");
  });

  afterEach(() => {
    ws.dispose();
  });

  it("пишет код собранных блоков", () => {
    load(program("раз", "два"), ws);
    updateAceEditorFromWorkspace(ws, "javascript");
    expect(editorValue()).toContain("console.log('раз');");
    expect(editorValue()).toContain("console.log('два');");
  });

  it("убирает код блока, когда на поле остаются другие блоки", () => {
    load(program("раз", "два"), ws);
    updateAceEditorFromWorkspace(ws, "javascript");
    expect(editorValue()).toContain("console.log('два');");

    ws.getTopBlocks(false)[0].getNextBlock()!.dispose();
    updateAceEditorFromWorkspace(ws, "javascript");
    expect(editorValue()).toContain("console.log('раз');");
    expect(editorValue()).not.toContain("console.log('два');");
  });

  it("очищает панель кода, когда удалён последний блок", () => {
    load(program("раз"), ws);
    updateAceEditorFromWorkspace(ws, "javascript");
    expect(editorValue()).toContain("console.log('раз');");

    ws.clear();
    updateAceEditorFromWorkspace(ws, "javascript");
    expect(editorValue().trim()).toBe("");
  });

  it("не затирает программу, набранную без блоков", () => {
    getAceEditor()?.setValue("console.log('набрано руками');", -1);
    updateAceEditorFromWorkspace(ws, "javascript");
    expect(editorValue()).toContain("console.log('набрано руками');");
  });
});
