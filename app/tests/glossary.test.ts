/**
 * Тесты справочника тем (ui/glossary.ts).
 *
 * Инварианты: каждая тема рендерит примеры на четырёх языках, каждая тема
 * привязана хотя бы к одной задаче через infoTopics, каждая задача открывает
 * хотя бы одну тему, setActiveTask рендерит справочник под условием задачи,
 * а в index.html не остаётся старых захардкоженных info-секций.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const state = vi.hoisted(() => ({ lang: "ru" as "ru" | "en" }));
vi.mock("../src/localization", () => ({
  getAppLang: () => state.lang,
}));

import {
  GLOSSARY_TOPICS,
  glossaryTopicHtml,
  mountGlossaryForTask,
  type GlossaryTopicId,
} from "../src/ui/glossary";
import { setActiveTask, tasks } from "../src/tasks";

const ALL_TOPICS: GlossaryTopicId[] = GLOSSARY_TOPICS;
const LANGS = ["JavaScript", "Python", "Lua", "PHP"];

const SIDEBAR_HTML = `<div id="glossaryInfoSection" style="display:none;"></div>`;

/** Секции, которые перенесены в справочник и не должны вернуться в разметку. */
const LEGACY_SECTIONS = [
  "consoleOutputInfoSection",
  "forLoopInfoSection",
  "whileLoopInfoSection",
  "listInfoSection",
  "sublistInfoSection",
  "listFilterInfoSection",
  "dataTypesInfoSection",
  "variableInfoSection",
  "concatInfoSection",
  "incDecInfoSection",
  "conditionInfoSection",
  "logicalOpsInfoSection",
];

beforeEach(() => {
  state.lang = "ru";
  document.body.innerHTML = SIDEBAR_HTML;
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("содержимое тем", () => {
  for (const topic of ALL_TOPICS) {
    it(`${topic}: заголовок, определения и примеры на 4 языках (RU)`, () => {
      const html = glossaryTopicHtml(topic);
      expect(html).toContain("<h4>");
      expect(html).toContain('ul class="code-examples"');
      for (const lang of LANGS) expect(html).toContain(`<strong>${lang}</strong>`);
    });
  }

  it("RU и EN версии различаются, но обе содержат все языки", () => {
    state.lang = "ru";
    const ru = glossaryTopicHtml("functions");
    state.lang = "en";
    const en = glossaryTopicHtml("functions");
    expect(ru).not.toBe(en);
    expect(ru).toContain("Функция");
    expect(en).toContain("named piece");
    for (const lang of LANGS) {
      expect(ru).toContain(`<strong>${lang}</strong>`);
      expect(en).toContain(`<strong>${lang}</strong>`);
    }
  });

  it("HTML-спецсимволы в коде экранированы", () => {
    const html = glossaryTopicHtml("nested_loops");
    expect(html).toContain("&lt;=");
    expect(html).not.toContain("i <= 3");
  });
});

describe("привязка тем к задачам", () => {
  const expected: Array<[string, GlossaryTopicId]> = [
    ["first_function", "functions"],
    ["function_with_param", "functions"],
    ["function_return", "functions"],
    ["mult_table", "nested_loops"],
    ["first_even_break", "break_continue"],
    ["list_sort_min_max", "sorting"],
    ["dice_rolls", "repeat_n_times"],
    ["dice_rolls", "random_numbers"],
    ["chatterbox", "user_input"],
    ["list_inventory_index", "list_indexing"],
    ["list_inventory_remove", "list_add_remove"],
    ["list_inventory_random", "list_random_choice"],
    ["str_echo", "string_accumulate"],
    ["logic_gate_check", "boolean_logic"],
    ["loop_while_count", "while_until"],
    ["list_until_empty", "list_is_empty"],
    ["list_grid", "nested_lists"],
    ["function_predicate", "predicate_functions"],
    ["char_freq", "dict"],
    ["hello_world", "console_output"],
    ["add_2_7", "data_types"],
    ["greet_concat", "string_concat"],
    ["var_my_age", "variable"],
    ["calc_sum", "variable"],
    ["inc_counter", "inc_dec"],
    ["first_condition", "if_else"],
    ["even_or_odd", "if_else"],
    ["time_of_day", "boolean_logic"],
    ["first_loop", "for_loop"],
    ["sum_1_to_n", "for_loop"],
    ["guess_game", "while_until"],
    ["list_foreach", "list_foreach"],
    ["sublist_foreach", "list_sublist"],
    ["list_filter_even", "list_filter"],
    ["list_sum_even_positions", "list_filter"],
  ];
  for (const [taskId, topic] of expected) {
    it(`${taskId} → ${topic}`, () => {
      expect(tasks[taskId as keyof typeof tasks].infoTopics).toContain(topic);
    });
  }

  it("ни одна тема не осталась не привязанной к задаче", () => {
    const used = new Set(Object.values(tasks).flatMap((def) => def.infoTopics ?? []));
    for (const topic of GLOSSARY_TOPICS) {
      expect(used.has(topic), `тема ${topic} не открыта ни одной задачей`).toBe(true);
    }
  });

  it("каждая задача открывает хотя бы одну тему", () => {
    for (const [taskId, def] of Object.entries(tasks)) {
      expect(
        (def.infoTopics?.length ?? 0) > 0,
        `задача ${taskId} осталась без справочника — старые info-секции больше не показываются`
      ).toBe(true);
      for (const topic of def.infoTopics ?? []) {
        expect(GLOSSARY_TOPICS, `задача ${taskId}: тема ${topic} не существует`).toContain(topic);
      }
    }
  });
});

describe("старые захардкоженные секции", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "../src/index.html"),
    "utf-8"
  );

  it("index.html больше не содержит per-задачных секций", () => {
    for (const id of LEGACY_SECTIONS) {
      expect(html, `в разметке осталась секция #${id}`).not.toContain(`id="${id}"`);
    }
    expect(html).toContain('id="glossaryInfoSection"');
  });
});

describe("mountGlossaryForTask", () => {
  it("рендерит по div на тему и показывает контейнер", () => {
    const el = document.getElementById("glossaryInfoSection")!;
    mountGlossaryForTask(el, "first_function");
    expect(el.style.display).toBe("");
    expect(el.querySelectorAll("[data-glossary-topic]")).toHaveLength(1);
    expect(el.innerHTML).toContain("JavaScript");
  });

  it("переключение задачи рендерит только её темы, без остатков прошлой", () => {
    const el = document.getElementById("glossaryInfoSection")!;
    mountGlossaryForTask(el, "first_function");
    mountGlossaryForTask(el, "hello_world");
    const rendered = Array.from(el.querySelectorAll("[data-glossary-topic]")).map(
      (node) => (node as HTMLElement).dataset.glossaryTopic
    );
    expect(rendered).toEqual(["console_output"]);
    expect(el.style.display).toBe("");
    expect(el.textContent).toContain("Вывод в консоль");
  });
});

describe("setActiveTask и справочник", () => {
  it("задача с темой: справочник виден под условием", () => {
    setActiveTask("mult_table");
    const glossary = document.getElementById("glossaryInfoSection")!;
    expect(glossary.style.display).toBe("");
    expect(glossary.innerHTML).toContain("Вложенный цикл");
  });

  it("темы не «переезжают» при переходе на другую задачу", () => {
    setActiveTask("first_even_break");
    expect(document.getElementById("glossaryInfoSection")!.innerHTML).toContain("break");
    setActiveTask("first_loop");
    const glossary = document.getElementById("glossaryInfoSection")!;
    expect(glossary.innerHTML).not.toContain("break");
    expect(glossary.innerHTML).toContain("Цикл for со счётчиком");
    expect(glossary.innerHTML).toContain("Слова в примере");
  });
});
