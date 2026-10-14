/**
 * Страж словарных блоков («Словарь: установить/получить/есть ключ?»).
 *
 * Без словаря в слоте DICT генераторы подставляли литерал пустого словаря и
 * выдавали синтаксически битый код: `{}['a'] = 3` в JavaScript, `[]['a'] = 3` в
 * PHP. Подключение «Словарь: создать пустой» прямо в DICT давало тот же
 * результат в PHP и молча теряло запись в остальных языках. Страж помечает блок
 * предупреждением, а генераторы в этом случае выдают пояснение вместо кода.
 */
import * as Blockly from "blockly/core";

/** Идентификатор предупреждения, чтобы не затирать чужие сообщения блока. */
export const DICT_GUARD_WARNING_ID = "dictGuard";

function message(key: string, fallback: string): string {
  const text = (Blockly as any).Msg?.[key];
  return typeof text === "string" && text ? text : fallback;
}

/**
 * Проверяет, откуда блок берёт словарь: обновляет предупреждение на блоке и
 * возвращает текст проблемы, если словаря нет или это литерал «создать пустой».
 * При корректном словаре возвращает null.
 */
export function dictGuardIssue(block: Blockly.Block): string | null {
  const connection = block.getInput("DICT")?.connection ?? null;
  const source = connection?.targetConnection?.getSourceBlock() ?? null;
  let issue: string | null = null;
  if (!source) {
    issue = message(
      "DICT_NEED_VARIABLE",
      "No dictionary: connect the variable that holds it",
    );
  } else if (source.type === "dict_create") {
    issue = message(
      "DICT_STORE_IN_VARIABLE",
      "Put the dictionary in a variable first: writing into “create empty” is lost",
    );
  }
  block.setWarningText(issue, DICT_GUARD_WARNING_ID);
  return issue;
}
