/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from "blockly/javascript";
import * as Blockly from "blockly/core";
import { collectJoinParts } from "./textJoin";
import { dictGuardIssue } from "./dictGuard";

type BlockGenerator = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) => string | [string, number];
export const forBlock: Record<string, BlockGenerator> = Object.create(null);
// Экспортируем генераторы кода для наших кастомных блоков (JavaScript),
// но не регистрируем их в Blockly напрямую: регистрация делается в index.ts.

// Штатный генератор даёт ['Hello, ',name,'!'].join('') — ученик видит join()
// раньше, чем обычную склейку через +. Вложенные выражения запрашиваются с
// приоритетом умножения: у «+» одинаковый приоритет с другим «+», и Blockly не
// добавил бы скобки вокруг «age + 1» внутри склейки.
forBlock["text_join"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const parts = collectJoinParts(block, generator, Order.MULTIPLICATION).map(
    (part) => part.code
  );
  if (parts.length === 0) return ["''", Order.ATOMIC];
  if (parts.length === 1) return [`String(${parts[0]})`, Order.ATOMIC];
  return [parts.join(" + "), Order.ADDITION];
};

forBlock["add_text"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const text = generator.valueToCode(block, "TEXT", Order.NONE) || "''";
  return `console.log(${text});\n`;
};

// Генератор для блока angle_demo
forBlock["angle_demo"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  const code = `console.log('Angle:', String(${angle}));\n`;
  return code;
};

// ===== Словарные блоки (JS) =====
forBlock["dict_create"] = function (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  return ["({})", Order.ATOMIC];
};

forBlock["dict_set"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const issue = dictGuardIssue(block);
  if (issue) return `// ${issue}\n`;
  const dict = generator.valueToCode(block, "DICT", Order.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", Order.NONE) || "''";
  const value = generator.valueToCode(block, "VALUE", Order.NONE) || "null";
  const code = `${dict}[${key}] = ${value};\n`;
  return code;
};

forBlock["dict_get"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  if (dictGuardIssue(block)) return ["undefined", Order.ATOMIC];
  const dict = generator.valueToCode(block, "DICT", Order.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", Order.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, Order.MEMBER];
};

forBlock["dict_has_key"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  if (dictGuardIssue(block)) return ["false", Order.ATOMIC];
  const key = generator.valueToCode(block, "KEY", Order.NONE) || "''";
  const dict = generator.valueToCode(block, "DICT", Order.NONE) || "{}";
  const code = `Object.prototype.hasOwnProperty.call(${dict}, ${key})`;
  return [code, Order.FUNCTION_CALL];
};

// Переопределение генератора для блока изменения переменной (math_change)
// Это гарантирует, что тело циклов с этим блоком генерирует корректный JS код.
forBlock["math_change"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Имя переменной из поля VAR
  const varName = (generator as any).nameDB_.getName(
    (block as any).getFieldValue("VAR"),
    (Blockly as any).Names?.NameType?.VARIABLE || "VARIABLE"
  );
  // Значение изменения (DELTA)
  const delta = generator.valueToCode(block, "DELTA", Order.ADDITION) || "0";
  const code = `${varName} += ${delta};\n`;
  return code;
};

// Генератор для блока-выражения angle_value
forBlock["angle_value"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  // Возвращаем код и порядок операций (атомарное значение)
  return [String(angle), Order.ATOMIC];
};

// Генератор для блока bitmap_demo
forBlock["bitmap_demo"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const bitmapData = String(block.getFieldValue("FIELDNAME") || "");
  const code = `console.log('Bitmap data:', ${JSON.stringify(bitmapData)});\n`;
  return code;
};

// Генератор для блока date_value (JavaScript)
forBlock["date_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const value = String(block.getFieldValue("DATE") ?? "");
  return [JSON.stringify(value), Order.ATOMIC];
};

// Генератор для блока slider_value (JavaScript)
forBlock["slider_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const v = Number(block.getFieldValue("SLIDER") ?? 0);
  return [String(v), Order.ATOMIC];
};

forBlock["hsv_colour_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const v = String(block.getFieldValue("COLOUR") ?? "#000000");
  return [JSON.stringify(v), Order.ATOMIC];
};

// Генератор для блока py_input (JavaScript)
forBlock["py_input"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Возвращаем выражение input(), определённое в рантайме воркера
  return ["input()", Order.ATOMIC];
};

// Генератор для блока py_input_number (JavaScript)
forBlock["py_input_number"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Преобразуем ввод в число
  return ["Number(input())", Order.ATOMIC];
};
