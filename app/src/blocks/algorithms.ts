/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Простые блоки для словаря (хеш-таблицы) — помогут в задачах подсчёта частот.
// Метки берутся из Blockly.Msg (ключи заполняет setAppLang), поэтому блоки
// переведены и в RU, и в EN.

const dictCreate = {
  type: 'dict_create',
  message0: '%{BKY_DICT_CREATE}',
  output: ['Object'],
  colour: 290,
  tooltip: '%{BKY_DICT_CREATE_TOOLTIP}',
  helpUrl: '',
};

/**
 * «Словарь: создать с парами» — аналог штатного «создать список»: строки
 * «ключ : значение» добавляет и убирает мутатор, а генератор выдаёт литерал
 * одной строкой, как его записывают в документации к языку.
 */
const dictCreateWith = {
  init: function (this: any) {
    this.setColour(290);
    this.setOutput(true, 'Object');
    this.setInputsInline(true);
    this.itemCount_ = 1;
    this.updateShape_();
    this.setMutator(
      new Blockly.icons.MutatorIcon(['dict_create_with_item'], this),
    );
    this.setTooltip(
      (Blockly as any).Msg.DICT_CREATE_WITH_TOOLTIP ||
        'Create a dictionary with the listed pairs',
    );
    this.setHelpUrl('');
  },
  mutationToDom: function (this: any) {
    const mutation = Blockly.utils.xml.createElement('mutation');
    mutation.setAttribute('items', String(this.itemCount_));
    return mutation;
  },
  domToMutation: function (this: any, xmlElement: Element) {
    const items = xmlElement.getAttribute('items');
    this.itemCount_ = items ? parseInt(items, 10) : 0;
    this.updateShape_();
  },
  saveExtraState: function (this: any) {
    return { itemCount: this.itemCount_ };
  },
  loadExtraState: function (this: any, state: { itemCount: number }) {
    this.itemCount_ = Number(state.itemCount) || 0;
    this.updateShape_();
  },
  decompose: function (this: any, workspace: Blockly.Workspace) {
    const container: any = workspace.newBlock('dict_create_with_container');
    container.initSvg();
    let connection = container.getInput('STACK').connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const item: any = workspace.newBlock('dict_create_with_item');
      item.initSvg();
      connection.connect(item.previousConnection);
      connection = item.nextConnection;
    }
    return container;
  },
  compose: function (this: any, containerBlock: any) {
    // Рядов столько, сколько полосок в стеке; подключённые блоки переносятся
    // по позиции, поэтому середину можно выкинуть, не потеряв остальные пары.
    const rows: Array<{ key: any; value: any }> = [];
    let item = containerBlock.getInputTargetBlock('STACK');
    while (item && !item.isInsertionMarker()) {
      rows.push({ key: item.keyConnection_, value: item.valueConnection_ });
      item = item.getNextBlock();
    }
    const kept = new Set<Blockly.Connection>();
    for (const row of rows) {
      if (row.key) kept.add(row.key);
      if (row.value) kept.add(row.value);
    }
    for (let i = 0; i < this.itemCount_; i++) {
      for (const name of ['KEY', 'VALUE']) {
        const target = this.getInput(name + i)?.connection?.targetConnection;
        if (target && !kept.has(target)) target.disconnect();
      }
    }
    this.itemCount_ = rows.length;
    this.updateShape_();
    rows.forEach((row, i) => {
      row.key?.reconnect(this, 'KEY' + i);
      row.value?.reconnect(this, 'VALUE' + i);
    });
  },
  saveConnections: function (this: any, containerBlock: any) {
    let item = containerBlock.getInputTargetBlock('STACK');
    let i = 0;
    while (item) {
      if (!item.isInsertionMarker()) {
        item.keyConnection_ = this.getInput('KEY' + i)?.connection
          ?.targetConnection;
        item.valueConnection_ = this.getInput('VALUE' + i)?.connection
          ?.targetConnection;
        i++;
      }
      item = item.getNextBlock();
    }
  },
  updateShape_: function (this: any) {
    const label = () =>
      (Blockly as any).Msg.DICT_CREATE_WITH || 'Dictionary: create with';
    if (this.itemCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY').appendField(label());
    }
    for (let i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('KEY' + i)) {
        const keyInput = this
          .appendValueInput('KEY' + i)
          .setCheck(['String', 'Number']);
        if (i === 0) keyInput.appendField(label());
      }
      if (!this.getInput('VALUE' + i)) {
        this.appendValueInput('VALUE' + i)
          .setCheck(['Number', 'String'])
          .appendField(':');
      }
    }
    for (let i = this.itemCount_; this.getInput('KEY' + i); i++) {
      this.removeInput('KEY' + i);
      this.removeInput('VALUE' + i);
    }
  },
};

const dictSet = {
  type: 'dict_set',
  message0: '%{BKY_DICT_SET}',
  args0: [
    { type: 'input_value', name: 'DICT', check: ['Object'] },
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
    { type: 'input_value', name: 'VALUE', check: ['Number', 'String'] },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 290,
  tooltip: '%{BKY_DICT_SET_TOOLTIP}',
  helpUrl: '',
};

const dictGet = {
  type: 'dict_get',
  message0: '%{BKY_DICT_GET}',
  args0: [
    { type: 'input_value', name: 'DICT', check: ['Object'] },
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
  ],
  output: ['Number', 'String'],
  colour: 290,
  tooltip: '%{BKY_DICT_GET_TOOLTIP}',
  helpUrl: '',
};

const dictHasKey = {
  type: 'dict_has_key',
  message0: '%{BKY_DICT_HAS_KEY}',
  args0: [
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
    { type: 'input_value', name: 'DICT', check: ['Object'] },
  ],
  output: 'Boolean',
  colour: 290,
  tooltip: '%{BKY_DICT_HAS_KEY_TOOLTIP}',
  helpUrl: '',
};

// Экспорт определений без побочных эффектов.
//
// Динамический блок нельзя описать JSON-массивом: createBlockDefinitionsFromJsonArray
// оставляет от определения только фабрику входов по message0/args0 и теряет
// методы мутации (saveExtraState, updateShape_), поэтому dict_create_with
// и его мутаторные блоки отдаются обычными определениями с init.
const dictCreateWithContainer = {
  init: function (this: any) {
    this.setColour(290);
    this.appendDummyInput().appendField(
      (Blockly as any).Msg.DICT_CREATE_WITH_CONTAINER_TITLE_ADD || 'pairs',
    );
    this.appendStatementInput('STACK');
    this.setTooltip(
      (Blockly as any).Msg.DICT_CREATE_WITH_CONTAINER_TOOLTIP ||
        'Add, remove, or reorder sections to reconfigure this block.',
    );
    this.contextMenu = false;
  },
};

const dictCreateWithItem = {
  init: function (this: any) {
    this.setColour(290);
    this.appendDummyInput().appendField(
      (Blockly as any).Msg.DICT_CREATE_WITH_ITEM_TITLE || 'pair',
    );
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(
      (Blockly as any).Msg.DICT_CREATE_WITH_ITEM_TOOLTIP || 'Add a pair.',
    );
    this.contextMenu = false;
  },
};

export const blocks: Record<string, any> = {
  ...Blockly.common.createBlockDefinitionsFromJsonArray([
    dictCreate,
    dictSet,
    dictGet,
    dictHasKey,
  ]),
  dict_create_with: dictCreateWith,
  dict_create_with_container: dictCreateWithContainer,
  dict_create_with_item: dictCreateWithItem,
};
