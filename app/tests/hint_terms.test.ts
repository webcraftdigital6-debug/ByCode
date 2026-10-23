/**
 * Тесты выделения названий блоков/разделов (ui/hintTerms.ts): подсказки,
 * условия задач и темы справочника.
 *
 * Последние тесты — guard дрейфа: частые фразы в кавычках из подсказок,
 * условий и справочника либо опознаны как термин, либо лежат в NOT_A_TERM.
 * Новый блок, упомянутый в тексте без регистрации в словаре, уронит тест.
 */
import { describe, expect, it } from "vitest";
import { tasks } from "../src/tasks";
import { GLOSSARY_TOPICS, glossaryTopicHtml } from "../src/ui/glossary";
import {
  highlightTermsIn,
  matchHintTerm,
  NON_BLOCK_PHRASES,
  normalizeTerm,
  renderHintText,
  type HintTermStyle,
} from "../src/ui/hintTerms";

describe("matchHintTerm", () => {
  it("узнаёт точное название блока", () => {
    expect(matchHintTerm("Вывести … цвет …")).toBe("text_category");
    expect(matchHintTerm("Print … color …")).toBe("text_category");
    expect(matchHintTerm("создать список из")).toBe("list_category");
  });

  it("нормализует ASCII-многоточие и лишний пробел", () => {
    expect(matchHintTerm("Вывести ... цвет ...")).toBe("text_category");
    expect(matchHintTerm("  Вывести   …   цвет   …  ")).toBe("text_category");
  });

  it("узнаёт блок с подставленными значениями", () => {
    expect(matchHintTerm("увеличить sum на i")).toBe("variable_category");
    expect(matchHintTerm("цикл по i от 1 до 4 с шагом 1")).toBe("loop_category");
    expect(matchHintTerm("в списке inventory взять № 1")).toBe("list_category");
    expect(matchHintTerm("change sum by i")).toBe("variable_category");
    expect(matchHintTerm("count with i from 1 to 4 by 1")).toBe("loop_category");
  });

  it("узнаёт названия разделов, включая падежные формы", () => {
    expect(matchHintTerm("Текст")).toBe("text_category");
    expect(matchHintTerm("Математики")).toBe("math_category");
    expect(matchHintTerm("Функциях")).toBe("procedure_category");
    expect(matchHintTerm("Custom blocks")).toBe("custom");
  });

  it("не считает термином ожидаемый вывод и имена переменных", () => {
    expect(matchHintTerm("Hello, World!")).toBeNull();
    expect(matchHintTerm("banana")).toBeNull();
    expect(matchHintTerm("▶")).toBeNull();
    expect(matchHintTerm("Проверить решение")).toBeNull();
    expect(matchHintTerm("The number is even")).toBeNull();
  });

  it("не красит слова, которые подходят под шаблон блока, но блоками не являются", () => {
    // «не …» — шаблон блока НЕ, а во фразах ниже это обычный союз.
    expect(matchHintTerm("не найдено")).toBeNull();
    expect(matchHintTerm("not found")).toBeNull();
    expect(matchHintTerm("не равно")).toBeNull();
    expect(matchHintTerm("не")).toBe("logic_category");
  });

  it("не раскрывает wildcard в шаблоне, начинающемся со слота", () => {
    expect(matchHintTerm("текст и ещё текст")).toBeNull();
    expect(matchHintTerm("… и …")).toBe("logic_category");
  });

  it("нормализация приводит фразы к одному виду", () => {
    expect(normalizeTerm("Вывести ... цвет ...")).toBe("вывести … цвет …");
    expect(normalizeTerm("  Повторять,   пока …  ")).toBe("повторять, пока …");
  });
});

describe("renderHintText", () => {
  it("заворачивает термины в span с цветом категории", () => {
    const frag = renderHintText(
      "В категории «Текст» возьмите блок «Вывести … цвет …» и нажмите «Проверить решение».",
    );
    const host = document.createElement("div");
    host.appendChild(frag);
    const terms = [...host.querySelectorAll("span.hint-term")];
    expect(terms).toHaveLength(2);
    expect(terms[0].textContent).toBe("«Текст»");
    expect(terms[1].textContent).toBe("«Вывести … цвет …»");
    expect(terms[0].style.getPropertyValue("--hint-term")).toMatch(/^#/);
    expect(host.textContent).toContain("«Проверить решение»");
  });

  it("сохраняет текст без изменений, если терминов нет", () => {
    const frag = renderHintText("Просто текст без «названий блоков».");
    const host = document.createElement("div");
    host.appendChild(frag);
    expect(host.querySelector("span")).toBeNull();
    expect(host.textContent).toBe("Просто текст без «названий блоков».");
  });
});

describe("highlightTermsIn (HTML условий и справочника)", () => {
  /** Красит html и возвращает хост для проверок. */
  const paint = (html: string) => {
    const host = document.createElement("p");
    host.innerHTML = html;
    highlightTermsIn(host);
    return host;
  };

  it("красит термины внутри существующих тегов, не ломая разметку", () => {
    const host = paint(
      "Возьмите <strong>«увеличить counter на 1»</strong> из категории «Переменные».",
    );
    const terms = [...host.querySelectorAll("span.hint-term")];
    expect(terms.map((e) => e.textContent)).toEqual([
      "«увеличить counter на 1»",
      "«Переменные»",
    ]);
    expect(terms[0].parentElement?.tagName).toBe("STRONG");
    expect(terms[0].style.getPropertyValue("--hint-term")).toMatch(/^#/);
    expect(host.textContent).toBe(
      "Возьмите «увеличить counter на 1» из категории «Переменные».",
    );
  });

  it("не трогает фразы, которые не являются блоками", () => {
    const host = paint("Нажмите «Проверить решение», чтобы увидеть «Hello, World!».");
    expect(host.querySelector("span.hint-term")).toBeNull();
    expect(host.innerHTML).toBe(
      "Нажмите «Проверить решение», чтобы увидеть «Hello, World!».",
    );
  });

  it("не лезет в <code> и <pre> и не красит дважды", () => {
    const host = paint(
      "<code>«Вывести … цвет …»</code><pre>«Математика»</pre>«Математика»",
    );
    const terms = [...host.querySelectorAll("span.hint-term")];
    expect(terms).toHaveLength(1);
    expect(terms[0].textContent).toBe("«Математика»");
    expect(host.querySelector("code")?.textContent).toBe("«Вывести … цвет …»");
    highlightTermsIn(host);
    expect(host.querySelectorAll("span.hint-term")).toHaveLength(1);
  });

  it("красит и английские кавычки-лапки, а не только «…»", () => {
    const host = paint(
      'Take the “square root” block from the “Math” category and press “Check solution”.',
    );
    expect([...host.querySelectorAll("span.hint-term")].map((e) => e.textContent)).toEqual([
      '“square root”',
      '“Math”',
    ]);
  });

  it("сохраняет теги и атрибуты вокруг раскрашенных фраз", () => {
    const host = paint(
      '<a href="#x">блок «если»</a><br><span class="task-desc">«Циклы»</span>',
    );
    expect(host.querySelector("a")?.getAttribute("href")).toBe("#x");
    expect(host.querySelector("br")).not.toBeNull();
    expect(host.querySelectorAll("span.hint-term")).toHaveLength(2);
  });
});

/** Фразы в кавычках, которые блоками не являются (единый список с рантаймом). */
const NOT_A_TERM = NON_BLOCK_PHRASES;

/** Считает фразы в кавычках по списку plain-текстов. */
function countQuoted(texts: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const text of texts) {
    for (const m of text.matchAll(/[«“]([^»”\n]{1,90})[»”]/g)) {
      const key = normalizeTerm(m[1]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Фразы в кавычках из HTML: теги вырезаем, примеры кода пропускаем — там
 * кавычки означают строку программы, а не название блока.
 */
function quotedInHtml(html: string): string {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
    .replace(/<code[\s\S]*?<\/code>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

/** Фразы чаще `min` раз, которые не термины и не лежат в исключениях. */
function drift(counts: Map<string, number>, min = 3): string[] {
  const out: string[] = [];
  for (const [phrase, n] of counts) {
    if (n < min || NOT_A_TERM.has(phrase)) continue;
    if (!matchHintTerm(phrase)) out.push(`${n}× ${phrase}`);
  }
  return out.sort();
}

describe("guard дрейфа по всем подсказкам", () => {
  it("каждая частая фраза в кавычках — термин или в списке исключений", () => {
    const counts = countQuoted(
      Object.values(tasks).flatMap((task) => [task.hint("ru"), task.hint("en")]),
    );
    expect(drift(counts)).toEqual([]);
  });

  it("каждая частая фраза в кавычках условия — термин или в списке исключений", () => {
    const counts = countQuoted(
      Object.values(tasks).flatMap((task) => [
        quotedInHtml(task.description("ru")),
        quotedInHtml(task.description("en")),
      ]),
    );
    expect(drift(counts)).toEqual([]);
  });

  it("каждая частая фраза в кавычках справочника — термин или в списке исключений", () => {
    // Тема вызывается на текущем языке теста, поэтому проверяется один язык.
    const counts = countQuoted(GLOSSARY_TOPICS.map((t) => quotedInHtml(glossaryTopicHtml(t))));
    expect(drift(counts)).toEqual([]);
  });

  it("каждый зарегистрированный стиль отдаёт цвет", () => {
    const styles: HintTermStyle[] = [
      "logic_category",
      "loop_category",
      "math_category",
      "text_category",
      "list_category",
      "dict_category",
      "variable_category",
      "procedure_category",
      "custom",
    ];
    for (const style of styles) {
      const sample =
        style === "custom" ? "Битмап: …" : samplePhraseOf(style);
      expect(matchHintTerm(sample)).toBe(style);
    }
  });
});

/** Опорная фраза для стиля — используется только в тесте цветов. */
function samplePhraseOf(style: HintTermStyle): string {
  const samples: Record<HintTermStyle, string> = {
    logic_category: "если … иначе",
    loop_category: "повторить … раз",
    math_category: "округлить …",
    text_category: "длина …",
    list_category: "создать список из",
    dict_category: "Словарь: получить …",
    variable_category: "присвоить …",
    procedure_category: "вернуть …",
    custom: "Слайдер: …",
  };
  return samples[style];
}
