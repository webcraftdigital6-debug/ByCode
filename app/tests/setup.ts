/**
 * Глобальная настройка тестов.
 *
 * Выполняется один раз перед тестами:
 * 1. Полифиллит DOMParser/XMLSerializer из @xmldom/xmldom — Blockly.Xml.textToDom
 *    ищет их на globalThis (в браузере они встроенные).
 * 2. Применяет русскую локаль Blockly и кастомные сообщения через setAppLang —
 *    блочные определения с %{BKY_…} (add_text, словарные блоки) без них не
 *    инициализируются: Blockly падает на «Message does not reference all arg(s)».
 * 3. Регистрирует стандартные блоки Blockly и кастомные блоки проекта.
 */
import * as Blockly from "blockly";
import "blockly/blocks";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

import { blocks as textBlocks } from "../src/blocks/text";
import { blocks as algorithmBlocks } from "../src/blocks/algorithms";
import { setAppLang } from "../src/localization";

// 1. Полифилл XML API в Node (Blockly ожидает их в globalThis)
(globalThis as any).DOMParser = DOMParser;
(globalThis as any).XMLSerializer = XMLSerializer;

// 2. Локаль Blockly + кастомные Msg-ключи проекта (ASCII-метки блоков)
setAppLang("ru");

// 3. Регистрация блоков проекта
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(algorithmBlocks);
