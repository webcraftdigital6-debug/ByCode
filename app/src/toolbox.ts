/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Удалён импорт локализации, так как локали теперь применяются в index.ts

/*
Этот тулбокс содержит почти все встроенные блоки Blockly,
а также кастомные блоки, которые добавляет приложение (например, add_text).
Скорее всего вам не нужны все блоки сразу — можно собрать тулбокс с нуля
или оставить только те категории/блоки, которые реально используются.
*/

import * as Blockly from "blockly/core";

/**
 * Возвращает конфигурацию тулбокса (имена категорий локализуются отдельно)
 */
export function getLocalizedToolbox(): Blockly.utils.toolbox.ToolboxInfo {
  return {
    kind: "categoryToolbox",
    contents: [
      { kind: "search", name: "Search", contents: [] },
      { kind: "sep" },
      {
        kind: "category",
        name: "Logic",
        categorystyle: "logic_category",
        contents: [
          {
            kind: "block",
            type: "controls_if",
          },
          {
            kind: "block",
            type: "logic_compare",
          },
          {
            kind: "block",
            type: "logic_operation",
          },
          {
            kind: "block",
            type: "logic_negate",
          },
          {
            kind: "block",
            type: "logic_boolean",
          },
          {
            kind: "block",
            type: "logic_null",
          },
          {
            kind: "block",
            type: "logic_ternary",
          },
        ],
      },
      {
        kind: "category",
        name: "Loops",
        categorystyle: "loop_category",
        contents: [
          {
            kind: "block",
            type: "controls_repeat_ext",
            inputs: {
              TIMES: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 10,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "controls_repeat",
          },
          {
            kind: "block",
            type: "controls_whileUntil",
          },
          {
            kind: "block",
            type: "controls_for",
            inputs: {
              FROM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              TO: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 10,
                  },
                },
              },
              BY: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "controls_forEach",
          },
          {
            kind: "block",
            type: "controls_flow_statements",
          },
        ],
      },
      {
        kind: "category",
        name: "Math",
        categorystyle: "math_category",
        contents: [
          {
            kind: "block",
            type: "math_number",
            fields: {
              NUM: 123,
            },
          },
          {
            kind: "block",
            type: "math_arithmetic",
          },
          {
            kind: "block",
            type: "math_single",
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_trig",
          },
          {
            kind: "block",
            type: "math_constant",
          },
          {
            kind: "block",
            type: "math_number_property",
          },
          {
            kind: "block",
            type: "math_change",
            inputs: {
              DELTA: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_round",
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_on_list",
          },
          {
            kind: "block",
            type: "math_modulo",
          },
          {
            kind: "block",
            type: "math_constrain",
            inputs: {
              LOW: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              HIGH: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 100,
                  },
                },
              },
              VALUE: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 50,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_random_int",
            inputs: {
              FROM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
              TO: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 100,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "math_random_float",
          },
          // Добавляем наш новый блок-выражение угла
          {
            kind: "block",
            type: "angle_value",
          },
        ],
      },
      {
        kind: "category",
        name: "Text",
        categorystyle: "text_category",
        contents: [
          {
            kind: "block",
            type: "text",
          },
          {
            kind: "block",
            type: "text_join",
          },
          {
            kind: "block",
            type: "text_append",
          },
          {
            kind: "block",
            type: "text_length",
          },
          {
            kind: "block",
            type: "text_isEmpty",
          },
          {
            kind: "block",
            type: "text_indexOf",
          },
          {
            kind: "block",
            type: "text_charAt",
          },
          {
            kind: "block",
            type: "text_getSubstring",
          },
          {
            kind: "block",
            type: "text_changeCase",
          },
          {
            kind: "block",
            type: "text_trim",
          },
          {
            kind: "block",
            type: "text_count",
          },
          {
            kind: "block",
            type: "text_replace",
            inputs: {
              FROM: {
                shadow: {
                  type: "text",
                },
              },
              TO: {
                shadow: {
                  type: "text",
                },
              },
              TEXT: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "text_reverse",
            inputs: {
              TEXT: {
                shadow: {
                  type: "text",
                },
              },
            },
          },
          {
            kind: "block",
            type: "add_text",
            inputs: {
              TEXT: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "abc",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "py_input",
          },
          {
            kind: "block",
            type: "py_input_number",
          },
        ],
      },
      // Новая категория: Кастомные перенесена в самый низ
      { kind: "sep" },
      {
        kind: "category",
        name: "Lists",
        categorystyle: "list_category",
        contents: [
          {
            kind: "block",
            type: "lists_create_with",
          },
          {
            kind: "block",
            type: "lists_repeat",
            inputs: {
              NUM: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 5,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "lists_length",
          },
          {
            kind: "block",
            type: "lists_isEmpty",
          },
          {
            kind: "block",
            type: "lists_indexOf",
          },
          {
            kind: "block",
            type: "lists_getIndex",
          },
          {
            kind: "block",
            type: "lists_setIndex",
          },
          {
            kind: "block",
            type: "lists_getSublist",
          },
          {
            kind: "block",
            type: "lists_split",
            inputs: {
              DELIM: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: ",",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "lists_sort",
          },
          {
            kind: "block",
            type: "lists_reverse",
          },
        ],
      },
      {
        kind: "sep",
      },
      {
        kind: "category",
        name: "Dicts",
        colour: "290",
        contents: [
          {
            kind: "block",
            type: "dict_create",
          },
          {
            kind: "block",
            type: "dict_set",
            inputs: {
              KEY: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "a",
                  },
                },
              },
              VALUE: {
                shadow: {
                  type: "math_number",
                  fields: {
                    NUM: 1,
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "dict_get",
            inputs: {
              KEY: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "a",
                  },
                },
              },
            },
          },
          {
            kind: "block",
            type: "dict_has_key",
            inputs: {
              KEY: {
                shadow: {
                  type: "text",
                  fields: {
                    TEXT: "a",
                  },
                },
              },
            },
          },
        ],
      },
      {
        kind: "sep",
      },
      {
        kind: "category",
        name: "Variables",
        categorystyle: "variable_category",
        custom: "VARIABLE",
      },
      {
        kind: "category",
        name: "Functions",
        categorystyle: "procedure_category",
        custom: "PROCEDURE",
      },
      // Категория "Custom" перенесена в самый низ
      {
        kind: "category",
        name: "Custom",
        colour: "#a55eea",
        contents: [
          { kind: "block", type: "angle_demo" },
          { kind: "block", type: "angle_value" },
          { kind: "block", type: "bitmap_demo" },
          { kind: "block", type: "date_value" },
          { kind: "block", type: "slider_value" },
          { kind: "block", type: "hsv_colour_value" },
        ],
      },
    ],
  };
}

// Совместимость со старым импортом toolbox
export const toolbox = getLocalizedToolbox();
