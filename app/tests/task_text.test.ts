/**
 * Инвариант условий задач: ученику называют хотя бы один блок так, как он
 * выглядит в тулбоксе — в кавычках. Только кавычка, опознанная словарём
 * `hintTerms`, получает подсветку цветом категории, поэтому условие без
 * кавычек («создайте переменную и выведите её») не подсказывает, где искать
 * блок.
 */
import { describe, it, expect } from "vitest";
import { tasks } from "../src/tasks";
import type { TaskId } from "../src/tasks";
import { matchHintTerm, normalizeTerm } from "../src/ui/hintTerms";

/** Фразы в кавычках, которые словарь опознаёт как блок или раздел. */
function namedTerms(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, " ");
  return [...text.matchAll(/[«“]([^»”\n]{1,90})[»”]/g)]
    .map((m) => normalizeTerm(m[1]))
    .filter((q) => matchHintTerm(q));
}

describe("условие задачи называет блоки", () => {
  for (const id of Object.keys(tasks) as TaskId[]) {
    it(`${id}: в RU и EN условии есть название блока в кавычках`, () => {
      expect(namedTerms(tasks[id].description("ru")), `${id} (ru)`).not.toEqual([]);
      expect(namedTerms(tasks[id].description("en")), `${id} (en)`).not.toEqual([]);
    });
  }
});
