/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order as LuaOrder } from "blockly/lua";
import * as Blockly from "blockly/core";
import { collectJoinParts } from "./textJoin";
import { dictGuardIssue } from "./dictGuard";

type BlockGenerator = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) => string | [string, number];
export const forBlock: Record<string, BlockGenerator> = Object.create(null);
// Экспортируем генераторы кода для наших кастомных блоков (Lua),
// но не регистрируем их в Blockly напрямую: регистрация делается в index.ts.

// Штатный генератор даёт table.concat({...}) — знакомство с concat раньше,
// чем со склейкой через .., и таблица-обёртка вместо выражения.
forBlock["text_join"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const parts = collectJoinParts(block, generator, LuaOrder.NONE).map((part) =>
    part.isLiteral ? part.code : `tostring(${part.code})`
  );
  if (parts.length === 0) return ["''", LuaOrder.ATOMIC];
  if (parts.length === 1) return [parts[0], LuaOrder.ATOMIC];
  return [parts.join(" .. "), LuaOrder.CONCATENATION];
};

forBlock["add_text"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const text = generator.valueToCode(block, "TEXT", LuaOrder.NONE) || "''";
  const color = generator.valueToCode(block, "COLOR", LuaOrder.NONE) || "";
  if (color && (color as string).trim && (color as string).trim().length > 0) {
    return `print_colored(${text}, ${color})\n`;
  }
  return `print(${text})\n`;
};

// Генератор для блока angle_demo (Lua)
forBlock["angle_demo"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  const code = `print('Angle: ' .. tostring(${angle}))\n`;
  return code;
};

// Генератор для блока-выражения angle_value (Lua)
forBlock["angle_value"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  // Возвращаем код и порядок операций (атомарное значение)
  return [String(angle), LuaOrder.ATOMIC];
};

// Генератор для блока bitmap_demo (Lua)
forBlock["bitmap_demo"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const bitmapData = String(block.getFieldValue("FIELDNAME") || "");
  const code = `print('Bitmap data: ' .. ${JSON.stringify(bitmapData)})\n`;
  return code;
};

// Генератор для блока date_value (Lua)
forBlock["date_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const value = String(block.getFieldValue("DATE") ?? "");
  return [JSON.stringify(value), LuaOrder.ATOMIC];
};

// Генератор для блока slider_value (Lua)
forBlock["slider_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const v = Number(block.getFieldValue("SLIDER") ?? 0);
  return [String(v), LuaOrder.ATOMIC];
};

forBlock["hsv_colour_value"] = function (
  block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  const v = String(block.getFieldValue("COLOUR") ?? "#000000");
  return [JSON.stringify(v), LuaOrder.ATOMIC];
};

// Генератор для блока py_input (Lua)
forBlock["py_input"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Возвращаем выражение input(), определённое в рантайме Lua
  return ["input()", LuaOrder.ATOMIC];
};

// Генератор для блока py_input_number (Lua)
forBlock["py_input_number"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  // Преобразуем ввод в число
  return ["tonumber(input())", LuaOrder.ATOMIC];
};
// ===== Словарные блоки (Lua - таблицы) =====
forBlock["dict_create"] = function (
  _block: Blockly.Block,
  _generator: Blockly.CodeGenerator
) {
  return ["{}", LuaOrder.ATOMIC];
};

forBlock["dict_set"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  const issue = dictGuardIssue(block);
  if (issue) return `-- ${issue}\n`;
  const dict = generator.valueToCode(block, "DICT", LuaOrder.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", LuaOrder.NONE) || "''";
  const value = generator.valueToCode(block, "VALUE", LuaOrder.NONE) || "nil";
  const code = `${dict}[${key}] = ${value}\n`;
  return code;
};

forBlock["dict_get"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  if (dictGuardIssue(block)) return ["nil", LuaOrder.ATOMIC];
  const dict = generator.valueToCode(block, "DICT", LuaOrder.NONE) || "{}";
  const key = generator.valueToCode(block, "KEY", LuaOrder.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, LuaOrder.ATOMIC];
};

forBlock["dict_has_key"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator
) {
  if (dictGuardIssue(block)) return ["false", LuaOrder.ATOMIC];
  const key = generator.valueToCode(block, "KEY", LuaOrder.NONE) || "''";
  const dict = generator.valueToCode(block, "DICT", LuaOrder.NONE) || "{}";
  const code = `${dict}[${key}] ~= nil`;
  return [code, LuaOrder.RELATIONAL];
};
