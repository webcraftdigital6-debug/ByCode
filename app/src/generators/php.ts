/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order as PhpOrder } from "blockly/php";
import * as Blockly from "blockly/core";
import { dictGuardIssue } from "./dictGuard";

type BlockGenerator = (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) => string | [string, number];

export const forBlock: Record<string, BlockGenerator> = Object.create(null);

function ensurePhpVar(name: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "$var";
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

forBlock["add_text"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const text = generator.valueToCode(block, "TEXT", PhpOrder.NONE) || "''";
  const color = generator.valueToCode(block, "COLOR", PhpOrder.NONE) || "";
  if (
    typeof color === "string" &&
    color.trim().length > 0 &&
    color.trim() !== '""'
  ) {
    return `echo ${text} . " (${color})" . PHP_EOL;\n`;
  }
  return `echo ${text} . PHP_EOL;\n`;
};

forBlock["angle_demo"] = function (block: Blockly.Block) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  return `echo 'Angle: ' . ${angle} . PHP_EOL;\n`;
};

forBlock["angle_value"] = function (block: Blockly.Block) {
  const angleStr = block.getFieldValue("ANGLE");
  const angle = angleStr ? Number(angleStr) : 0;
  return [String(angle), PhpOrder.ATOMIC];
};

forBlock["bitmap_demo"] = function (block: Blockly.Block) {
  const bitmapData = String(block.getFieldValue("FIELDNAME") || "");
  return `echo 'Bitmap data: ' . ${JSON.stringify(bitmapData)} . PHP_EOL;\n`;
};

forBlock["date_value"] = function (block: Blockly.Block) {
  const value = String(block.getFieldValue("DATE") ?? "");
  return [JSON.stringify(value), PhpOrder.ATOMIC];
};

forBlock["slider_value"] = function (block: Blockly.Block) {
  const v = Number(block.getFieldValue("SLIDER") ?? 0);
  return [String(v), PhpOrder.ATOMIC];
};

forBlock["hsv_colour_value"] = function (block: Blockly.Block) {
  const v = String(block.getFieldValue("COLOUR") ?? "");
  return [JSON.stringify(v), PhpOrder.ATOMIC];
};

forBlock["dict_create"] = function () {
  return ["[]", PhpOrder.ATOMIC];
};

forBlock["dict_set"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const issue = dictGuardIssue(block);
  if (issue) return `// ${issue}\n`;
  const dict = generator.valueToCode(block, "DICT", PhpOrder.NONE) || "[]";
  const key = generator.valueToCode(block, "KEY", PhpOrder.NONE) || "''";
  const value = generator.valueToCode(block, "VALUE", PhpOrder.NONE) || "null";
  const code = `${dict}[${key}] = ${value};\n`;
  return code;
};

forBlock["dict_get"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  if (dictGuardIssue(block)) return ["null", PhpOrder.ATOMIC];
  const dict = generator.valueToCode(block, "DICT", PhpOrder.NONE) || "[]";
  const key = generator.valueToCode(block, "KEY", PhpOrder.NONE) || "''";
  const code = `${dict}[${key}]`;
  return [code, PhpOrder.MEMBER];
};

forBlock["dict_has_key"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  if (dictGuardIssue(block)) return ["false", PhpOrder.ATOMIC];
  const key = generator.valueToCode(block, "KEY", PhpOrder.NONE) || "''";
  const dict = generator.valueToCode(block, "DICT", PhpOrder.NONE) || "[]";
  const code = `array_key_exists(${key}, ${dict})`;
  return [code, PhpOrder.FUNCTION_CALL];
};

forBlock["text_print"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const text = generator.valueToCode(block, "TEXT", PhpOrder.NONE) || "''";
  return `echo ${text} . PHP_EOL;\n`;
};

forBlock["text_append"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const varName = ensurePhpVar(
    (generator as any).nameDB_?.getName?.(
      (block as any).getFieldValue("VAR"),
      (Blockly as any).Names?.NameType?.VARIABLE || "VARIABLE",
    ) || (block as any).getFieldValue("VAR"),
  );
  const text = generator.valueToCode(block, "TEXT", PhpOrder.NONE) || "''";
  return `${varName} .= ${text};\n`;
};

forBlock["text_join"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  // Приоритет детей — как у «×»: у «+» и «.» приоритеты близки, и без
  // запроса более сильного связывания «age + 1» внутри склейки потерял бы
  // скобки.
  const itemCount = Number((block as any).itemCount_ ?? 0);
  const parts: string[] = [];
  for (let i = 0; i < itemCount; i++) {
    parts.push(
      generator.valueToCode(block, `ADD${i}`, PhpOrder.MULTIPLICATION) || "''",
    );
  }
  if (parts.length === 0) return ["''", PhpOrder.ATOMIC];
  if (parts.length === 1) return [parts[0], PhpOrder.ATOMIC];
  return [parts.join(" . "), PhpOrder.STRING_CONCAT];
};

forBlock["lists_create_with"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const itemCount = Number((block as any).itemCount_ ?? 0);
  const items: string[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push(generator.valueToCode(block, `ADD${i}`, PhpOrder.NONE) || "null");
  }
  return [`[${items.join(", ")}]`, PhpOrder.ATOMIC];
};

forBlock["math_on_list"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const list = generator.valueToCode(block, "LIST", PhpOrder.NONE) || "[]";
  const modeRaw =
    (block as any).getFieldValue?.("OP") || (block as any).getFieldValue?.("MODE");
  const mode = String(modeRaw || "").toUpperCase();
  if (mode.includes("SUM")) return [`array_sum(${list})`, PhpOrder.FUNCTION_CALL];
  if (mode.includes("MIN")) return [`min(${list})`, PhpOrder.FUNCTION_CALL];
  if (mode.includes("MAX")) return [`max(${list})`, PhpOrder.FUNCTION_CALL];
  if (mode.includes("AVERAGE"))
    return [
      `(count(${list}) ? (array_sum(${list}) / count(${list})) : 0)`,
      PhpOrder.ATOMIC,
    ];
  return ["0", PhpOrder.ATOMIC];
};

forBlock["controls_forEach"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const varName = ensurePhpVar(
    (generator as any).nameDB_?.getName?.(
      (block as any).getFieldValue("VAR"),
      (Blockly as any).Names?.NameType?.VARIABLE || "VARIABLE",
    ) || (block as any).getFieldValue("VAR"),
  );
  const list = generator.valueToCode(block, "LIST", PhpOrder.NONE) || "[]";
  const branch = generator.statementToCode(block, "DO") || "";
  return `foreach (${list} as ${varName}) {\n${branch}}\n`;
};

forBlock["controls_if"] = function (
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
) {
  const elseifCount = Number((block as any).elseifCount_ ?? 0);
  const elseCount = Number((block as any).elseCount_ ?? 0);

  let code = "";
  for (let i = 0; i <= elseifCount; i++) {
    const cond =
      generator.valueToCode(block, `IF${i}`, PhpOrder.NONE) || "false";
    const branch = generator.statementToCode(block, `DO${i}`) || "";
    if (i === 0) code += `if (${cond}) {\n${branch}}`;
    else code += ` elseif (${cond}) {\n${branch}}`;
  }
  if (elseCount) {
    const branch = generator.statementToCode(block, "ELSE") || "";
    code += ` else {\n${branch}}`;
  }
  return code + "\n";
};
