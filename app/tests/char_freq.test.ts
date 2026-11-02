import { describe, it, expect } from "vitest";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

// Решение A4 через «подсчитать количество … в …» (text_count) — без словарей:
// три строки «a:3», «b:4», «c:1» через text_join + text_count + add_text.
const textCountSolutionJson = {
  blocks: {
    languageVersion: 0,
    blocks: (["a", "b", "c"] as const).map((ch) => ({
      type: "add_text",
      inputs: {
        TEXT: {
          block: {
            type: "text_join",
            extraState: { itemCount: 2 },
            inputs: {
              ADD0: { shadow: { type: "text", fields: { TEXT: `${ch}:` } } },
              ADD1: {
                block: {
                  type: "text_count",
                  inputs: {
                    SUB: { shadow: { type: "text", fields: { TEXT: ch } } },
                    TEXT: {
                      shadow: { type: "text", fields: { TEXT: "abcaabbb" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })),
  },
};

describe("task char_freq (Частоты символов)", () => {
  it("решение через text_count проходит и даёт 3 звезды (без словарей)", async () => {
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      textCountSolutionJson as never,
      ws,
    );

    const code = javascriptGenerator.workspaceToCode(ws);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
    try {
      eval(code);
    } finally {
      console.log = orig;
    }

    expect(logs).toContain("a:3");
    expect(logs).toContain("b:4");
    expect(logs).toContain("c:1");

    const res = await tasks["char_freq"].validate(ws as never, logs, "ru");
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("частоты из литерала «создать с парами» засчитываются как словарь", async () => {
    const inputs: Record<string, unknown> = {};
    (
      [
        ["a", 3],
        ["b", 4],
        ["c", 1],
      ] as const
    ).forEach(([ch, n], i) => {
      inputs[`KEY${i}`] = { shadow: { type: "text", fields: { TEXT: ch } } };
      inputs[`VALUE${i}`] = {
        shadow: { type: "math_number", fields: { NUM: n } },
      };
    });
    const line = (ch: string) => ({
      type: "add_text",
      inputs: {
        TEXT: {
          block: {
            type: "text_join",
            extraState: { itemCount: 2 },
            inputs: {
              ADD0: { shadow: { type: "text", fields: { TEXT: `${ch}:` } } },
              ADD1: {
                block: {
                  type: "dict_get",
                  inputs: {
                    DICT: {
                      block: {
                        type: "variables_get",
                        fields: { VAR: { name: "freq", type: "Object" } },
                      },
                    },
                    KEY: { shadow: { type: "text", fields: { TEXT: ch } } },
                  },
                },
              },
            },
          },
        },
      },
    });
    // Цепочка a → b → c собирается с конца, чтобы каждый блок знал следующий.
    let tail: Record<string, unknown> | null = null;
    for (const ch of ["c", "b", "a"]) {
      const block: Record<string, unknown> = line(ch);
      if (tail) block.next = { block: tail };
      tail = block;
    }
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      {
        variables: [{ name: "freq", type: "Object" }],
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: "variables_set",
              fields: { VAR: { name: "freq", type: "Object" } },
              inputs: {
                VALUE: {
                  block: {
                    type: "dict_create_with",
                    extraState: { itemCount: 3 },
                    inputs,
                  },
                },
              },
              next: { block: tail },
            },
          ],
        },
      } as never,
      ws
    );

    const code = javascriptGenerator.workspaceToCode(ws);
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
    try {
      eval(code);
    } finally {
      console.log = orig;
    }
    expect(logs).toEqual(["a:3", "b:4", "c:1"]);

    const res = await tasks["char_freq"].validate(ws as never, logs, "ru");
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });
});