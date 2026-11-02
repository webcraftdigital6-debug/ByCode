/**
 * Общая часть генераторов блока «Словарь: создать с парами» (dict_create_with).
 *
 * Блок хранит пары во входах KEY0…VALUE n, а количество пар задаёт мутатор,
 * поэтому каждому языку нужен один и тот же список — и каждый оформляет его
 * своим литералом: `{к: значение}` в Python и JavaScript, `[к => значение]` в
 * PHP, `{[к] = значение}` в Lua.
 */
import type * as Blockly from "blockly/core";

/** Одна пара литерала: код ключа и код значения. */
export type DictPair = { key: string; value: string };

/**
 * Собирает пары входов KEY0…VALUE n блока dict_create_with.
 *
 * @param block Блок dict_create_with.
 * @param generator Генератор целевого языка.
 * @param order Приоритет, с которым запрашиваются вложенные выражения.
 * @returns Пары в порядке строк блока.
 */
export function collectDictPairs(
  block: Blockly.Block,
  generator: Blockly.CodeGenerator,
  order: number,
): DictPair[] {
  const itemCount = Number((block as any).itemCount_ ?? 0);
  const pairs: DictPair[] = [];
  for (let i = 0; i < itemCount; i++) {
    pairs.push({
      key: generator.valueToCode(block, `KEY${i}`, order) || "''",
      value: generator.valueToCode(block, `VALUE${i}`, order) || "''",
    });
  }
  return pairs;
}
