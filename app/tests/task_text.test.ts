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

/** Все фразы в кавычках, включая неопознанные словарём. */
function quotedPhrases(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, " ");
  return [...text.matchAll(/[«“]([^»”\n]{1,90})[»”]/g)].map((m) => m[1]);
}

/** Абзац «Откуда брать блоки» / "Where to get the blocks" целиком. */
function blocksParagraph(html: string, heading: RegExp): string | null {
  for (const seg of html.split(/<br\s*\/?>\s*<br\s*\/?>/i)) {
    if (heading.test(seg)) return seg;
  }
  return null;
}

describe("условие задачи называет блоки", () => {
  for (const id of Object.keys(tasks) as TaskId[]) {
    it(`${id}: в RU и EN условии есть название блока в кавычках`, () => {
      expect(namedTerms(tasks[id].description("ru")), `${id} (ru)`).not.toEqual([]);
      expect(namedTerms(tasks[id].description("en")), `${id} (en)`).not.toEqual([]);
    });
  }
});

/**
 * В абзаце-подсказке про тулбокс каждая кавычка — название блока или раздела:
 * только оно получает цвет категории, а значит и выделение, по которому ученик
 * находит блок на полке.
 */
describe("абзац про тулбокс цитирует только названия из тулбокса", () => {
  for (const id of Object.keys(tasks) as TaskId[]) {
    it(`${id}: RU и EN`, () => {
      for (const [lang, heading] of [
        ["ru", /Откуда брать блоки/i],
        ["en", /Where to get the blocks/i],
      ] as const) {
        const paragraph = blocksParagraph(tasks[id].description(lang), heading);
        if (!paragraph) continue;
        for (const phrase of quotedPhrases(paragraph)) {
          expect(matchHintTerm(phrase), `${id} (${lang}): «${phrase}»`).not.toBeNull();
        }
      }
    });
  }
});
