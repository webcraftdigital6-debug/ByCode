/**
 * Фикстуры интерактивного ввода для тестов, прогоняющих эталонные решения через
 * `eval` сгенерированного JavaScript.
 *
 * В приложении блок «Ввод текста»/«Ввод числа» открывает модальное окно, а
 * подтверждённый ответ печатается в окно вывода строкой «> ответ» (см.
 * src/codeExecution.ts). В тестах модального окна нет, поэтому answers
 * подаются полифиллом input(), который печатает то же эхо — валидаторы задач
 * восстанавливают из него ответ ученика и сверяют вывод с ним.
 */
import type { TaskId } from "../src/tasks";

/** Ответы ученика по задачам с input(): в порядке вопросов программы. */
export const INPUT_ANSWERS: Partial<Record<TaskId, string[]>> = {
  in_greet: ["Маша"],
  in_two_numbers: ["3", "4"],
  in_adult_gate: ["20"],
  in_count_to_n: ["4"],
  in_times_table: ["7"],
  fb_input: ["Маша"],
};

/**
 * Полифилл `input()` для `eval`: отдаёт ответы по порядку (последний —
 * многократно) и пишет в лог строку-эхо «> ответ».
 */
export function makeInput(
  answers: readonly string[] | undefined,
  log: (line: string) => void
): () => string {
  const queue = answers ?? [];
  let taken = 0;
  return () => {
    if (queue.length === 0) return "";
    const value = queue[Math.min(taken, queue.length - 1)] ?? "";
    taken += 1;
    log(`> ${value}`);
    return value;
  };
}
