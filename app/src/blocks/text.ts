/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly/core";
import "@blockly/field-angle";
import "@blockly/field-bitmap";
import "@blockly/field-date";
import "@blockly/field-slider";
import "@blockly/field-colour-hsv-sliders";

// Пример кастомного блока add_text, который выводит значение в окно вывода приложения.
// При необходимости можно заменить/расширить этот блок своими блоками.
const addText = {
  type: "add_text",
  // Используем ключ локализации
  message0: "%{BKY_ADD_TEXT_COLOR}",
  args0: [
    {
      type: "input_value",
      name: "TEXT",
      check: ["String", "Number"],
    },
    {
      type: "input_value",
      name: "COLOR",
      check: ["String"],
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 160,
  tooltip: "",
  helpUrl: "",

  // Инициализация блока - здесь мы можем динамически менять текст
  init: function (this: Blockly.Block) {
    this.setColour(160);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Print a value to the output area");
    this.setHelpUrl("");

    // Оставляем логику без дополнительных надписей, JSON уже задает поля
  },
};

// Блок для демонстрации поля угла
const angleDemo = {
  type: "angle_demo",
  message0: "%{BKY_ANGLE_DEMO}",
  args0: [
    {
      type: "field_angle",
      name: "ANGLE",
      angle: 90,
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 20,
  tooltip: "Demonstrates angle field usage",
  helpUrl: "",

  init: function (this: Blockly.Block) {
    this.setColour(20);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Demonstrates angle field usage");
    this.setHelpUrl("");
    // JSON уже формирует содержимое блока через message0/args0
  },
};

// Блок-выражение: угол как число градусов
const angleValue = {
  type: "angle_value",
  message0: "%{BKY_ANGLE_VALUE}",
  args0: [
    {
      type: "field_angle",
      name: "ANGLE",
      angle: 90,
    },
  ],
  output: "Number",
  colour: 20,
  tooltip: "Angle value in degrees",
  helpUrl: "",

  init: function (this: Blockly.Block) {
    this.setColour(20);
    this.setOutput(true, "Number");
    this.setTooltip("Angle value in degrees");
    this.setHelpUrl("");
    // JSON уже формирует содержимое блока через message0/args0
  },
};

// Блок с плагином field_bitmap
const bitmapDemo = {
  type: "bitmap_demo",
  message0: "%{BKY_BITMAP_DEMO}",
  args0: [
    {
      type: "field_bitmap",
      name: "FIELDNAME",
      width: 8,
      height: 8,
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 260,
  tooltip: "Bitmap editor field",
  helpUrl: "",
  init: function (this: Blockly.Block) {
    this.setColour(260);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Bitmap editor field");
  },
};

// Блок с плагином field_date (значение даты как строка)
const dateValue = {
  type: "date_value",
  message0: "%{BKY_DATE_VALUE}",
  args0: [
    {
      type: "field_date",
      name: "DATE",
      date: "2025-01-01",
    },
  ],
  output: "String",
  colour: 120,
  tooltip: "Date field value",
  helpUrl: "",
  init: function (this: Blockly.Block) {
    this.setColour(120);
    this.setOutput(true, "String");
    this.setTooltip(
      (Blockly as any).Msg.DATE_VALUE_TOOLTIP || "Date field value",
    );
  },
};

// Блок с плагином field_slider (значение числа от слайдера)
const sliderValue = {
  type: "slider_value",
  message0: "%{BKY_SLIDER_VALUE}",
  args0: [
    {
      type: "field_slider",
      name: "SLIDER",
      min: 0,
      max: 100,
      step: 1,
      value: 50,
    },
  ],
  output: "Number",
  colour: 40,
  tooltip: "Slider field value",
  helpUrl: "",
  init: function (this: Blockly.Block) {
    this.setColour(40);
    this.setOutput(true, "Number");
    this.setTooltip(
      (Blockly as any).Msg.SLIDER_VALUE_TOOLTIP || "Slider field value",
    );
  },
};

const hsvColourValue = {
  type: "hsv_colour_value",
  message0: "%{BKY_HSV_VALUE}",
  args0: [
    {
      type: "field_colour_hsv_sliders",
      name: "COLOUR",
      colour: "#ff0000",
    },
  ],
  output: "String",
  colour: 290,
  tooltip: "%{BKY_HSV_VALUE_TOOLTIP}",
  helpUrl: "",
  init: function (this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, "String");
    this.setTooltip(
      (Blockly as any).Msg.HSV_VALUE_TOOLTIP || "HSV colour field",
    );
  },
};

// Блок для ввода из Python input(), без поля подсказки
const pyInput = {
  type: "py_input",
  message0: "%{BKY_PY_INPUT}",
  // Убираем args0, поле подсказки больше не требуется
  output: ["String", "Number"],
  colour: 160,
  tooltip: "%{BKY_PY_INPUT_TOOLTIP}",
  helpUrl: "",
};

// Блок для ввода числа: конвертирует input() в число
const pyInputNumber = {
  type: "py_input_number",
  message0: "%{BKY_PY_INPUT_NUMBER}",
  output: "Number",
  colour: 160,
  tooltip: "%{BKY_PY_INPUT_NUMBER_TOOLTIP}",
  helpUrl: "",
};

// Создаём определения блоков из JSON-конфигураций.
// Регистрация самих блоков в Blockly выполняется в index.ts.
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  addText,
  angleDemo,
  angleValue,
  bitmapDemo,
  dateValue,
  sliderValue,
  hsvColourValue,
  pyInput,
  pyInputNumber,
]);
