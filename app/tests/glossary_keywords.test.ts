/**
 * Тесты блока «Слова в примере» в справочнике тем (ui/glossary.ts).
 *
 * Инварианты: у каждой темы есть раздел с пояснениями слов; каждое поясняемое
 * слово (и каждая его форма через «/») реально встречается в примерах кода этой
 * темы; каждый служебный keyword из примеров пояснён; тексты RU и EN заполнены
 * и различаются; термины внутри темы не повторяются.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const state = vi.hoisted(() => ({ lang: "ru" as "ru" | "en" }));
vi.mock("../src/localization", () => ({
  getAppLang: () => state.lang,
}));

import {
  GLOSSARY_TOPICS,
  glossaryKeywordNotes,
  glossaryTopicHtml,
  type GlossaryTopicId,
} from "../src/ui/glossary";

const ALL_TOPICS: GlossaryTopicId[] = GLOSSARY_TOPICS;
/** Слова, которые обязаны быть объяснены, если встречаются в примерах темы. */
const CONTROL_KEYWORDS = ["for", "while", "if", "else", "break", "continue", "return", "function", "def"];

/** Возвращает текст всех примеров кода темы: туда и только туда входят слова. */
function exampleCode(topic: GlossaryTopicId): string {
  const host = document.createElement("div");
  host.innerHTML = glossaryTopicHtml(topic);
  return Array.from(host.querySelectorAll("ul.code-examples pre code"))
    .map((node) => node.textContent ?? "")
    .join("\n");
}

function hasWord(code: string, word: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9_])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9_]|$)`).test(
    code
  );
}

/**
 * Слова, которые тема уже объясняет: пояснения из «Слов в примере» плюс метки
 * определений в начале темы — они считаются объяснёнными и не дублируются.
 */
function explainedTerms(topic: GlossaryTopicId): string[] {
  const host = document.createElement("div");
  host.innerHTML = glossaryTopicHtml(topic);
  const partLabels = Array.from(host.querySelectorAll("ul.parts-list > li > strong")).map(
    (node) => node.textContent ?? ""
  );
  return [
    ...glossaryKeywordNotes(topic).flatMap((n) => n.term.split("/").map((f) => f.trim())),
    ...partLabels.map((l) => l.trim()),
  ];
}

beforeEach(() => {
  state.lang = "ru";
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("слова в примере", () => {
  for (const topic of ALL_TOPICS) {
    it(`${topic}: раздел «Слова в примере» присутствует (RU и EN)`, () => {
      state.lang = "ru";
      expect(glossaryTopicHtml(topic)).toContain("Слова в примере");
      state.lang = "en";
      expect(glossaryTopicHtml(topic)).toContain("Words in this example");
    });

    it(`${topic}: не меньше четырёх поясняемых слов`, () => {
      expect(glossaryKeywordNotes(topic).length).toBeGreaterThanOrEqual(4);
    });

    it(`${topic}: каждое поясняемое слово встречается в примерах темы`, () => {
      const code = exampleCode(topic);
      for (const note of glossaryKeywordNotes(topic)) {
        for (const form of note.term.split("/").map((f) => f.trim())) {
          expect(form, `${topic}: форма «${form}» есть в пояснении, но нет в примерах`).not.toBe("");
          expect(code.includes(form), `${topic}: «${form}» не найдено в примерах кода`).toBe(true);
        }
      }
    });

    it(`${topic}: каждый служебный keyword из примеров пояснён`, () => {
      const code = exampleCode(topic);
      const explained = explainedTerms(topic);
      for (const word of CONTROL_KEYWORDS) {
        if (!hasWord(code, word)) continue;
        const covered = explained.some((term) => hasWord(` ${term} `, word));
        expect(covered, `${topic}: пример использует «${word}», но слово не пояснено`).toBe(true);
      }
    });

    it(`${topic}: тексты RU и EN заполнены и различаются`, () => {
      for (const note of glossaryKeywordNotes(topic)) {
        expect(note.ru.length).toBeGreaterThan(0);
        expect(note.en.length).toBeGreaterThan(0);
        expect(note.ru).not.toBe(note.en);
        expect(/[а-яё]/i.test(note.ru)).toBe(true);
        expect(/[а-яё]/i.test(note.en)).toBe(false);
      }
    });
  }

  it("термины не повторяются внутри темы", () => {
    for (const topic of ALL_TOPICS) {
      const terms = glossaryKeywordNotes(topic).map((n) => n.term);
      expect(new Set(terms).size, `${topic}: дубль термина`).toBe(terms.length);
    }
  });
});
