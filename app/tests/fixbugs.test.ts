/**
 * E2E для задач «Найди ошибку» (fb_*):
 * 1) сломанный starterXml обязан НЕ проходить валидацию (иначе задача
 *    решается «сама» — баг не виден или валидатор слишком добрый);
 * 2) исправленное решение (solutions/fb_*.xml) проходит на 3★ (иначе
 *    штраф за минимальное исправление — задача демотивирует).
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

const FIX_TASKS: TaskId[] = [
  "fb_area",
  "fb_join",
  "fb_parity",
  "fb_loop",
  "fb_list",
  "fb_double",
  "fb_input",
];

const SOLUTIONS_DIR = path.resolve(__dirname, "../../solutions");

beforeAll(() => {
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

function loadXml(xml: string): Blockly.Workspace {
  const dom = Blockly.utils.xml.textToDom(xml);
  const ws = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace(dom, ws);
  return ws;
}

function runCode(id: TaskId, ws: Blockly.Workspace): string[] {
  const code = javascriptGenerator.workspaceToCode(ws);
  const logs: string[] = [];
  // Имя должно остаться `input`: его читает eval-код, а не этот модуль.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const input = makeInput(INPUT_ANSWERS[id], (line) => logs.push(line));
  const orig = console.log;
  console.log = (...args: unknown[]) =>
    logs.push(args.map(String).join(" "));
  try {
    eval(code);
  } finally {
    console.log = orig;
  }
  return logs;
}

describe("«Найди ошибку»: сломанный starter не засчитывается", () => {
  for (const id of FIX_TASKS) {
    it(`${id}: starterXml имеет kind="fix" и НЕ проходит валидацию`, async () => {
      const def = tasks[id];
      expect(def.kind, `${id}: ожидается kind="fix"`).toBe("fix");
      expect(def.starterXml, `${id}: пустой starterXml`).toBeTruthy();

      const ws = loadXml(def.starterXml!);
      const lines = runCode(id, ws);
      expect(lines.length, `${id}: starter ничего не выводит`).toBeGreaterThan(
        0,
      );
      fillOutput(lines);
      const res = await def.validate(ws as never, lines, "ru");
      expect(
        res.ok,
        `${id}: сломанная программа прошла валидацию — баг неэффективен`,
      ).toBe(false);
      expect(res.stars).toBe(0);
    });
  }
});

describe("«Найди ошибку»: исправленное решение проходит на 3★", () => {
  for (const id of FIX_TASKS) {
    it(`${id}: solutions/${id}.xml → ok=true, stars=3`, async () => {
      const xml = fs.readFileSync(
        path.join(SOLUTIONS_DIR, `${id}.xml`),
        "utf-8",
      );
      const ws = loadXml(xml);
      const lines = runCode(id, ws);
      fillOutput(lines);
      const res = await tasks[id].validate(ws as never, lines, "ru");
      expect(
        res.ok,
        `${id}: исправление не проходит валидацию (вывод: ${JSON.stringify(lines)})`,
      ).toBe(true);
      expect(res.stars, `${id}: минимальное исправление должно давать 3★`).toBe(
        3,
      );
    });
  }
});
