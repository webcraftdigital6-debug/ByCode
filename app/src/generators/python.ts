/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order as PythonOrder } from "blockly/python";
import * as Blockly from "blockly/core";
import { collectJoinParts } from "./textJoin";
import { dictGuardIssue } from "./dictGuard";

type BlockGenerator = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => string | [string, number];
export const forBlock: Record<string, BlockGenerator> = Object.create(null);
// Экспортируем генераторы кода для наших кастомных блоков (Python),
// но не регистрируем их в Blockly напрямую: регистрация делается в index.ts.

// Штатный генератор Blockly оборачивает прибавление в проверку
// isinstance(..., Number) и добавляет «from numbers import Number», из-за чего
// в коде задачи появляется две лишние строки. В JS/Lua/PHP тот же блок — одна
// операция, здесь тоже. Цена: без «присвоить sum = 0» Python падает с явной
// TypeError вместо молчаливого старта с нуля.
forBlock["math_change"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const varName = generator.getVariableName(block.getFieldValue("VAR"));
  const delta =
    generator.valueToCode(block, "DELTA", PythonOrder.ADDITIVE) || "0";
  return `${varName} += ${delta}\n`;
};

// Штатный генератор даёт ''.join([str(x) for x in [...]]) — генератор
// списка со циклом для новичка непонятен. Склеиваем через +, не-литералы
// оборачиваем в str().
forBlock["text_join"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const parts = collectJoinParts(block, generator, PythonOrder.NONE).map(
    (part) => (part.isLiteral ? part.code : `str(${part.code})`),
  );
  if (parts.length === 0) return ["''", PythonOrder.ATOMIC];
  if (parts.length === 1) return [parts[0], PythonOrder.ATOMIC];
  return [parts.join(" + "), PythonOrder.ADDITIVE];
};

forBlock["add_text"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const text = generator.valueToCode(block, "TEXT", PythonOrder.NONE) || "''";
  const color = generator.valueToCode(block, "COLOR", PythonOrder.NONE) || "";
  if (color && (color as string).trim && (color as string).trim().length > 0) {
    return `print_colored(${text}, ${color})\n`;
  }
  return `print(${text})\n`;
};

// Генератор для блока angle_demo (Python)
forBlock["angle_demo"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  const code = `print('Angle: ' + str(${angle}))\n`;
  return code;
};

// Генератор для блока-выражения angle_value (Python)
forBlock["angle_value"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  // Возвращаем код и порядок операций (атомарное значение)
  return [String(angle), PythonOrder.ATOMIC];
};

// ===== Словарные блоки (Python) =====
forBlock["dict_create"] = function (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) {
  return ["{}", PythonOrder.ATOMIC];
};

forBlock["dict_set"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const issue = dictGuardIssue(block);
  if (issue) return `# ${issue}\n`;
  const dict = generator.valueToCode(block, "DICT", PythonOrder.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", PythonOrder.NONE) || "''";
  const value =
    generator.valueToCode(block, "VALUE", PythonOrder.NONE) || "None";
  const code = `${dict}[${key}] = ${value}\n`;
  return code;
};

forBlock["dict_get"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  if (dictGuardIssue(block)) return ["None", PythonOrder.ATOMIC];
  const dict = generator.valueToCode(block, "DICT", PythonOrder.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", PythonOrder.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, PythonOrder.ATOMIC];
};

forBlock["dict_has_key"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  if (dictGuardIssue(block)) return ["False", PythonOrder.ATOMIC];
  const key = generator.valueToCode(block, "KEY", PythonOrder.NONE) || "''";
  const dict = generator.valueToCode(block, "DICT", PythonOrder.NONE) || "{}";
  const code = `${key} in ${dict}`;
  return [code, PythonOrder.RELATIONAL];
};

// Генератор для блока bitmap_demo (Python)
forBlock["bitmap_demo"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const bitmapData = String(block.getFieldValue("FIELDNAME") || "");
  const code = `print('Bitmap data: ' + ${JSON.stringify(bitmapData)})\n`;
  return code;
};

// Генератор для блока date_value (Python)
forBlock["date_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) {
  const value = String(block.getFieldValue("DATE") ?? "");
  return [JSON.stringify(value), PythonOrder.ATOMIC];
};

// Генератор для блока slider_value (Python)
forBlock["slider_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) {
  const v = Number(block.getFieldValue("SLIDER") ?? 0);
  return [String(v), PythonOrder.ATOMIC];
};

forBlock["hsv_colour_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator,
) {
  const v = String(block.getFieldValue("COLOUR") ?? "#000000");
  return [JSON.stringify(v), PythonOrder.ATOMIC];
};

// Генератор для блока py_input (Python)
forBlock["py_input"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Поле подсказки удалено, возвращаем просто input()
  // Значение может использоваться как строка или число.
  // Для числовых контекстов пользователь может конвертировать значение самостоятельно,
  // либо использовать его напрямую как строку.
  return ["input()", PythonOrder.ATOMIC];
};

// Генератор для блока py_input_number (Python)
forBlock["py_input_number"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Преобразуем ввод в число (float для универсальности)
  return ["float(input())", PythonOrder.ATOMIC];
};
