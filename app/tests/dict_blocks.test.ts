/**
 * Тесты блоков словаря (dict_*): категория в тулбоксе, локализация меток,
 * генерация кода на четырёх языках и распознавание терминов в подсказках.
 *
 * Словарные блоки были скрыты из тулбокса; проверка кодогенерации фиксирует,
 * в каком виде блок возвращается — код обязан быть синтаксически корректным,
 * когда словарь лежит в переменной.
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
import { dictGuardIssue } from "../src/generators/dictGuard";
import "../src/blocks/algorithms";
import { localizedToolbox, setAppLang } from "../src/localization";
import { matchHintTerm, hintTermColour } from "../src/ui/hintTerms";

Object.assign(javascriptGenerator.forBlock, jsForBlock);
Object.assign(pythonGenerator.forBlock, pyForBlock);
Object.assign(luaGenerator.forBlock, luaForBlock);
Object.assign(phpGenerator.forBlock, phpForBlock);

const DICT_TYPES = ["dict_create", "dict_set", "dict_get", "dict_has_key"];

/** freq = {}; freq["a"] = 3; print(freq["a"]); если есть ключ "z" — печать. */
const dictProgram = {
  variables: [{ name: "freq", type: "Object" }],
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "variables_set",
        fields: { VAR: { name: "freq", type: "Object" } },
        inputs: { VALUE: { block: { type: "dict_create" } } },
        next: {
          block: {
            type: "dict_set",
            inputs: {
              DICT: {
                block: {
                  type: "variables_get",
                  fields: { VAR: { name: "freq", type: "Object" } },
                },
              },
              KEY: { shadow: { type: "text", fields: { TEXT: "a" } } },
              VALUE: { shadow: { type: "math_number", fields: { NUM: 3 } } },
            },
            next: {
              block: {
                type: "add_text",
                inputs: {
                  TEXT: {
                    block: {
                      type: "dict_get",
                      inputs: {
                        DICT: {
                          block: {
                            type: "variables_get",
                            fields: { VAR: { name: "freq", type: "Object" } },
                          },
                        },
                        KEY: { shadow: { type: "text", fields: { TEXT: "a" } } },
                      },
                    },
                  },
                },
                next: {
                  block: {
                    type: "controls_if",
                    inputs: {
                      IF0: {
                        block: {
                          type: "dict_has_key",
                          inputs: {
                            KEY: { shadow: { type: "text", fields: { TEXT: "z" } } },
                            DICT: {
                              block: {
                                type: "variables_get",
                                fields: { VAR: { name: "freq", type: "Object" } },
                              },
                            },
                          },
                        },
                      },
                      DO0: {
                        block: {
                          type: "add_text",
                          inputs: {
                            TEXT: {
                              shadow: { type: "text", fields: { TEXT: "no z" } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

function loadProgram(): Blockly.Workspace {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(dictProgram, ws);
  return ws;
}

describe("тулбокс: категория «Словари»", () => {
  it("содержит все словарные блоки и цвет категории", () => {
    const tb = localizedToolbox("ru") as Blockly.utils.toolbox.ToolboxInfo;
    const contents = tb.contents as Blockly.utils.toolbox.CategoryInfo[];
    const dicts = contents.find(
      (c) => (c as { name?: string }).name === "Словари"
    ) as Blockly.utils.toolbox.StaticCategoryInfo;
    expect(dicts).toBeTruthy();
    expect(dicts.colour).toBe("290");
    const types = (dicts.contents as Array<{ type?: string }>).map((b) => b.type);
    expect(types).toEqual(DICT_TYPES);
  });

  it("идёт сразу после «Списки»", () => {
    const tb = localizedToolbox("ru") as Blockly.utils.toolbox.ToolboxInfo;
    const names = (tb.contents as Array<{ name?: string }>)
      .filter((c) => c.name)
      .map((c) => c.name);
    expect(names.slice(0, 6)).toEqual([
      "Поиск",
      "Логика",
      "Циклы",
      "Математика",
      "Текст",
      "Списки",
    ]);
    expect(names[6]).toBe("Словари");
  });

  it("название категории переводится", () => {
    const tb = localizedToolbox("en") as Blockly.utils.toolbox.ToolboxInfo;
    const names = (tb.contents as Array<{ name?: string }>)
      .filter((c) => c.name)
      .map((c) => c.name);
    expect(names).toContain("Dicts");
    expect(names).not.toContain("Словари");
  });
});

describe("локализация меток словарных блоков", () => {
  it("RU и EN метки приходят из Blockly.Msg", () => {
    setAppLang("ru");
    expect((Blockly as any).Msg.DICT_SET).toBe("Словарь: установить %1[%2] = %3");
    expect((Blockly as any).Msg.DICT_HAS_KEY).toBe("Словарь: есть ключ? %1 в %2");
    setAppLang("en");
    expect((Blockly as any).Msg.DICT_CREATE).toBe("Dictionary: create empty");
    expect((Blockly as any).Msg.DICT_GET).toBe("Dictionary: get %1[%2]");
    setAppLang("ru");
  });

  it("блок на рабочем поле показывает локализованную надпись", () => {
    const ws = new Blockly.Workspace();
    setAppLang("ru");
    expect(ws.newBlock("dict_set").toString()).toContain("Словарь: установить");
    expect(ws.newBlock("dict_has_key").toString()).toContain("Словарь: есть ключ?");
    setAppLang("en");
    expect(ws.newBlock("dict_set").toString()).toContain("Dictionary: set");
    expect(ws.newBlock("dict_create").toString()).toContain("Dictionary: create empty");
    setAppLang("ru");
    ws.dispose();
  });
});

describe("кодогенерация словарных блоков", () => {
  it("JavaScript: запись и чтение по ключу", () => {
    const code = javascriptGenerator.workspaceToCode(loadProgram());
    expect(code).toContain("freq = ({});");
    expect(code).toContain("freq['a'] = 3;");
    expect(code).toContain("console.log(freq['a']);");
    expect(code).toContain("hasOwnProperty.call(freq, 'z')");
    expect(() => new Function(code)).not.toThrow();
  });

  it("Python: dict и оператор in", () => {
    const code = pythonGenerator.workspaceToCode(loadProgram());
    expect(code).toContain("freq = {}");
    expect(code).toContain("freq['a'] = 3");
    expect(code).toContain("print(freq['a'])");
    expect(code).toContain("if 'z' in freq:");
  });

  it("Lua: таблица и проверка на nil", () => {
    const code = luaGenerator.workspaceToCode(loadProgram());
    expect(code).toContain("freq = {}");
    expect(code).toContain("freq['a'] = 3");
    expect(code).toContain("print(freq['a'])");
    expect(code).toContain("if freq['z'] ~= nil then");
  });

  it("PHP: массив и array_key_exists", () => {
    const code = phpGenerator.workspaceToCode(loadProgram());
    expect(code).toContain("$freq = []");
    expect(code).toContain("$freq['a'] = 3");
    expect(code).toContain("echo $freq['a']");
    expect(code).toContain("array_key_exists('z', $freq)");
  });
});

describe("страж: словарь не подключён или подключён литералом", () => {
  /** dict_set без словаря в слоте DICT (только теневые ключ и значение). */
  function loadBareSet(): Blockly.Workspace {
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: "dict_set",
              inputs: {
                KEY: { shadow: { type: "text", fields: { TEXT: "a" } } },
                VALUE: { shadow: { type: "math_number", fields: { NUM: 3 } } },
              },
            },
          ],
        },
      },
      ws
    );
    return ws;
  }

  /** dict_set, где в DICT воткнут сам «Словарь: создать пустой». */
  function loadLiteralSet(): Blockly.Workspace {
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: "dict_set",
              inputs: {
                DICT: { block: { type: "dict_create" } },
                KEY: { shadow: { type: "text", fields: { TEXT: "a" } } },
                VALUE: { shadow: { type: "math_number", fields: { NUM: 3 } } },
              },
            },
          ],
        },
      },
      ws
    );
    return ws;
  }

  /** dict_get и dict_has_key без словаря. */
  function loadReadersWithoutDict(): Blockly.Workspace {
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: "add_text",
              inputs: {
                TEXT: {
                  block: {
                    type: "dict_get",
                    inputs: { KEY: { shadow: { type: "text", fields: { TEXT: "a" } } } },
                  },
                },
              },
            },
            {
              type: "controls_if",
              inputs: {
                IF0: {
                  block: {
                    type: "dict_has_key",
                    inputs: { KEY: { shadow: { type: "text", fields: { TEXT: "a" } } } },
                  },
                },
              },
            },
          ],
        },
      },
      ws
    );
    return ws;
  }

  it("ни один язык не выдаёт синтаксически битое присваивание", () => {
    setAppLang("ru");
    const js = javascriptGenerator.workspaceToCode(loadBareSet());
    const py = pythonGenerator.workspaceToCode(loadBareSet());
    const lua = luaGenerator.workspaceToCode(loadBareSet());
    const php = phpGenerator.workspaceToCode(loadBareSet());
    expect(js).not.toContain("{}['a']");
    expect(py).not.toContain("{}['a']");
    expect(lua).not.toContain("{}['a']");
    expect(php).not.toContain("[][");
    expect(js).toContain("// Нет словаря");
    expect(py).toContain("# Нет словаря");
    expect(lua).toContain("-- Нет словаря");
    expect(php).toContain("// Нет словаря");
    expect(() => new Function(js)).not.toThrow();
  });

  it("то же, когда словарь подключён литералом «создать пустой»", () => {
    setAppLang("ru");
    const js = javascriptGenerator.workspaceToCode(loadLiteralSet());
    const php = phpGenerator.workspaceToCode(loadLiteralSet());
    expect(js).toContain("// Положите словарь в переменную");
    expect(php).not.toContain("[][");
    expect(() => new Function(js)).not.toThrow();
  });

  it("чтение и проверка ключа без словаря дают пустое значение", () => {
    setAppLang("ru");
    const ws = loadReadersWithoutDict();
    expect(javascriptGenerator.workspaceToCode(ws)).toContain("console.log(undefined)");
    expect(pythonGenerator.workspaceToCode(ws)).toContain("print(None)");
    expect(luaGenerator.workspaceToCode(ws)).toContain("print(nil)");
    expect(phpGenerator.workspaceToCode(ws)).toContain("echo null");
  });

  it("страж возвращает текст проблемы, а при верном словаре — null", () => {
    setAppLang("ru");
    const broken = loadBareSet().getBlocksByType("dict_set", false)[0];
    expect(dictGuardIssue(broken)).toContain("Нет словаря");

    const literal = loadLiteralSet().getBlocksByType("dict_set", false)[0];
    expect(dictGuardIssue(literal)).toContain("Положите словарь в переменную");

    const good = loadProgram().getBlocksByType("dict_set", false)[0];
    expect(dictGuardIssue(good)).toBeNull();
  });

  it("текст проблемы переводится", () => {
    setAppLang("en");
    const block = loadBareSet().getBlocksByType("dict_set", false)[0];
    expect(dictGuardIssue(block)).toContain("No dictionary");
    setAppLang("ru");
  });
});

describe("термины словарей в подсказках", () => {
  it("названия блоков и раздела узнаются", () => {
    expect(matchHintTerm("Словарь: создать пустой")).toBe("dict_category");
    expect(matchHintTerm("Словарь: установить freq['a'] = 3")).toBe("dict_category");
    expect(matchHintTerm("Словарь: получить freq['a']")).toBe("dict_category");
    expect(matchHintTerm("Словарь: есть ключ?")).toBe("dict_category");
    expect(matchHintTerm("Dictionary: has key? 'z' in freq")).toBe("dict_category");
    expect(matchHintTerm("Словари")).toBe("dict_category");
    expect(matchHintTerm("Словарей")).toBe("dict_category");
    expect(matchHintTerm("Dicts")).toBe("dict_category");
  });

  it("цвет совпадает с оттенком категории (hue 290)", () => {
    expect(hintTermColour("dict_category")).toBe("#995ba5");
  });
});
