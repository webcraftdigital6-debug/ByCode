/**
 * Выделение названий блоков и разделов тулбокса в текстах задач.
 *
 * Фраза в кавычках («…”, “…”), совпавшая с названием блока или раздела,
 * окрашивается в цвет его категории — так ученик видит, что именно искать
 * в тулбоксе. Работает и в plain-тексте подсказок (renderHintText), и внутри
 * HTML-разметки условий и справочника (highlightTermsIn). Соответствия задаёт
 * BLOCK_TERMS: «…» внутри шаблона — слот, в который ученик вставил значение
 * («увеличить sum на i» совпадает с «увеличить … на …»).
 */

import * as BlocklyCore from "blockly/core";

/** Стиль категории тулбокса; «custom» — вне темы, фиксированный цвет. */
export type HintTermStyle =
  | "logic_category"
  | "loop_category"
  | "math_category"
  | "text_category"
  | "list_category"
  | "dict_category"
  | "variable_category"
  | "procedure_category"
  | "custom";

/** Цвет категории «Кастомные блоки» — как в toolbox.ts. */
const CUSTOM_COLOUR = "#a55eea";

/** Оттенок категории «Словари»: категория задаёт цвет hue 290, а не стиль темы. */
const DICT_COLOUR = "#995ba5";

/**
 * Цвета категорий по умолчанию, если тема их не отдаёт.
 * совпадают с классической темой Blockly.
 */
const FALLBACK_COLOUR: Record<HintTermStyle, string> = {
  logic_category: "#5c81d0",
  loop_category: "#5ba55c",
  math_category: "#3a68d3",
  text_category: "#5ca74c",
  list_category: "#745ca7",
  dict_category: DICT_COLOUR,
  variable_category: "#ee7d16",
  procedure_category: "#664488",
  custom: CUSTOM_COLOUR,
};

/** Шаблоны названий блоков, RU и EN в одном списке. */
const BLOCK_TERMS: Record<HintTermStyle, string[]> = {
  logic_category: [
    "если",
    "если …",
    "иначе",
    "иначе если",
    "иначе если …",
    "если … иначе",
    "если/иначе",
    "если / иначе если / иначе",
    "если истина",
    "если ложь",
    "и",
    "или",
    "не",
    "… и …",
    "… или …",
    "не …",
    "верно?",
    "неверно?",
    "истина",
    "ложь",
    "ничто",
    "сравнить",
    "= …",
    "= … > …",
    "выбрать по … | если истина … | если ложь …",
    "выбрать по",
    "if",
    "if …",
    "else",
    "else if",
    "if … else",
    "if/else",
    "if/else if/else",
    "if true",
    "if false",
    "and",
    "or",
    "not",
    "… and …",
    "… or …",
    "not …",
    "true",
    "false",
    "null",
    "compare",
    "= … > …",
    "test … | if true … | if false …",
    "test",
  ],
  loop_category: [
    "повторить … раз",
    "повторять, пока …",
    "повторять, пока не …",
    "повторять для … от … до …",
    "цикл по … от … до … с шагом …",
    "для каждого элемента … в списке …",
    "для каждого элемента",
    "для каждого … в …",
    "прервать цикл",
    "продолжить цикл",
    "выполнить …",
    "пока",
    "пока не",
    "выполнить",
    "repeat … times",
    "repeat while …",
    "repeat until …",
    "count with … from … to … by …",
    "for each item … in list …",
    "for each element … in …",
    "break out of loop",
    "skip to next loop",
    "do …",
    "while",
    "do",
  ],
  math_category: [
    "+ − × ÷",
    "+",
    "−",
    "×",
    "÷",
    "остаток от … ÷ …",
    "остаток от …",
    "квадратный корень …",
    "модуль …",
    "округлить …",
    "округлить",
    "округлить к большему",
    "округлить к меньшему",
    "ограничить … снизу … сверху …",
    "выдать случайное от … до …",
    "выдать случайное",
    "выбрать произвольный",
    "постоянная",
    "число",
    "чётное?",
    "нечётное?",
    "чётное",
    "нечётное",
    "сумма списка",
    "наименьшее в списке",
    "наибольшее в списке",
    "математика над списком",
    "… в степени …",
    "remainder of … ÷ …",
    "square root …",
    "absolute value …",
    "round …",
    "round",
    "round up",
    "round down",
    "constrain … low … high …",
    "random integer from … to …",
    "pick random",
    "constant",
    "number",
    "is even",
    "is odd",
    "even",
    "odd",
    "sum of list",
    "minimum of list",
    "maximum of list",
    "math on list",
  ],
  text_category: [
    "Вывести … цвет …",
    "Вывести",
    "создать текст из",
    "добавить текст",
    "к переменной … добавить текст …",
    "добавить к переменной … текст",
    "длина …",
    "длина текста",
    "… пуст",
    "в тексте получить …",
    "в тексте … найти первое вхождение текста …",
    "найти первое вхождение текста",
    "взять букву №",
    "взять подстроку с буквы № по букву №",
    "изменить регистр",
    "в верхний",
    "в нижний",
    "обрезать пробелы",
    "обрезать пробелы с двух сторон",
    "с обоих концов",
    "с начала",
    "с конца",
    "подсчитать количество … в …",
    "заменить … на … в …",
    "изменить порядок на обратный",
    "развернуть",
    "Ввод текста",
    "Ввод числа",
    "текст",
    "соединить",
    "Print … color …",
    "Print",
    "create text with",
    "text input",
    "numeric input",
    "append text",
    "append text to variable …",
    "add text to variable",
    "length of …",
    "length of text",
    "… is empty",
    "in text get …",
    "in text … find first occurrence of text …",
    "find first occurrence of text",
    "get letter #",
    "get substring from letter # to letter #",
    "change case",
    "to UPPERCASE",
    "to lowercase",
    "trim spaces from … to …",
    "trim spaces",
    "from start",
    "from end",
    "count … in …",
    "count the number of … in …",
    "replace … with … in …",
    "reverse",
    "Text input",
    "Number input",
    "text",
  ],
  list_category: [
    "создать список из",
    "в списке … взять …",
    "в списке … присвоить … = …",
    "в списке … вставить … = …",
    "в списке … взять и удалить …",
    "в списке … найти первое вхождение элемента …",
    "длина списка",
    "взять первый",
    "взять последний",
    "взять и удалить",
    "взять произвольный",
    "взять № …",
    "взять",
    "первый",
    "последний",
    "произвольный",
    "№ …",
    "create list with",
    "in list … get …",
    "in list … set item … = …",
    "in list … insert at … = …",
    "in list … get and remove …",
    "in list … find first occurrence of item …",
    "length of list",
    "get first",
    "get last",
    "get random",
    "get and remove",
    "get item # …",
    "first",
    "last",
    "random",
    "item #",
  ],
  variable_category: [
    "присвоить … = …",
    "присвоить …",
    "присвоить",
    "увеличить … на …",
    "создать переменную",
    "set … to …",
    "set …",
    "set",
    "change … by …",
    "Create variable…",
  ],
  procedure_category: [
    "создать функцию … вернуться",
    "создать функцию с возвратом …",
    "создать функцию …",
    "выполнить что-то",
    "создать вызов",
    "вернуть …",
    "вернуть",
    "параметры",
    "имя параметра",
    "вызвать … с …",
    "make a function … return",
    "make a function …",
    "do something",
    "create call",
    "return …",
    "return",
    "parameters",
    "parameter name",
    "call … with …",
  ],
  dict_category: [
    "Словарь: создать пустой",
    "создать пустой словарь",
    "Словарь: установить …",
    "Словарь: получить …",
    "Словарь: есть ключ? … в …",
    "Словарь: есть ключ?",
    "Dictionary: create empty",
    "create an empty dictionary",
    "Dictionary: set …",
    "Dictionary: get …",
    "Dictionary: has key? … in …",
    "Dictionary: has key?",
  ],
  custom: [
    "Установить угол … градусов",
    "Угол … градусов",
    "Битмап: …",
    "Дата: …",
    "Слайдер: …",
    "HSV цвет: …",
    "Set angle to … degrees",
    "Angle … degrees",
    "Bitmap: …",
    "Date: …",
    "Slider: …",
    "HSV color: …",
  ],
};

/** Названия разделов тулбокса, включая падежные формы русских названий. */
const CATEGORY_TERMS: Record<HintTermStyle, string[]> = {
  logic_category: ["Логика", "Логике", "Logic"],
  loop_category: ["Циклы", "Циклах", "Loops"],
  math_category: ["Математика", "Математики", "Математике", "Math"],
  text_category: ["Текст", "Текста", "Тексте", "Text"],
  list_category: ["Списки", "Списках", "Lists"],
  dict_category: ["Словари", "Словарей", "Словарях", "Словаре", "Dicts"],
  variable_category: [
    "Переменные",
    "Переменной",
    "Переменных",
    "Variables",
  ],
  procedure_category: ["Функции", "Функциях", "Functions"],
  custom: ["Кастомные блоки", "Custom blocks", "Мои блоки", "My blocks"],
};

/** Нормализация: регистр, пробелы, многоточие, завершающая точка. */
export function normalizeTerm(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\.{3}/g, "…")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/, "")
    .toLowerCase();
}

interface CompiledTerm {
  re: RegExp;
  style: HintTermStyle;
  literal: number;
}

let compiledCache: CompiledTerm[] | null = null;

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Компилирует шаблоны в регулярки. Шаблон без «…» требует точного
 * совпадения; шаблон с «…» допускает подставленные значения — но только
 * если начинается с текста, иначе «… и …» подсвечивало бы любую фразу
 * с союзом «и».
 */
function compiledTerms(): CompiledTerm[] {
  if (compiledCache) return compiledCache;
  const out: CompiledTerm[] = [];
  const styles = Object.keys(BLOCK_TERMS) as HintTermStyle[];
  for (const style of styles) {
    for (const raw of [...BLOCK_TERMS[style], ...CATEGORY_TERMS[style]]) {
      const norm = normalizeTerm(raw);
      if (!norm) continue;
      // «длина …» узнаётся и как шаблон со слотом, и как блок без слота («длина»)
      const variants = norm.endsWith("…")
        ? [norm, norm.replace(/…+$/, "").trim()]
        : [norm];
      for (const variant of variants) {
        if (!variant) continue;
        const parts = variant.split("…");
        const wildcard = parts.length > 1 && parts[0].trim() !== "";
        const body = wildcard
          ? parts.map((p) => escapeRe(p)).join(".*")
          : escapeRe(variant);
        out.push({
          re: new RegExp(`^${body}$`),
          style,
          literal: variant.replace(/…/g, "").length,
        });
      }
    }
  }
  // Более длинные (конкретные) шаблоны выигрывают у коротких с «…»
  out.sort((a, b) => b.literal - a.literal);
  compiledCache = out;
  return out;
}

/**
 * Фразы, которые подходят под шаблон блока, но блоками не являются: союз в
 * обычном предложении, название кнопки, значение строки. Без этого списка
 * wildcard-шаблоны («не …», «длина …») красили бы обычные слова.
 */
export const NON_BLOCK_PHRASES = new Set([
  "проверить решение",
  "check solution",
  "▶",
  "blockly",
  "a",
  "ss",
  "sh",
  "banana",
  "mississippi",
  "hello,",
  "the number is even",
  "the number is odd",
  "запустить код",
  "run code",
  "не найдено",
  "not found",
  "не равно",
  "not equal",
  "!", // кусок строки, который клеят блоком «создать текст из»
  "na", // подстрока, которую ищут блоком «подсчитать количество … в …»
  "да", // пояснение логического значения
  "10", // пример строки-числа в справочнике
  "пуст", // состояние списка/текста, а не блок: «длина = 0» означает «пуст»
]);

/** Возвращает стиль категории для фразы из кавычек или null. */
export function matchHintTerm(quoted: string): HintTermStyle | null {
  const norm = normalizeTerm(quoted);
  if (!norm || norm.length > 90 || NON_BLOCK_PHRASES.has(norm)) return null;
  for (const term of compiledTerms()) {
    if (term.re.test(norm)) return term.style;
  }
  return null;
}

/**
 * Цвет стиля термина из классической темы Blockly. Тема берётся фиксированно,
 * а не текущая: оттенки категорий в светлой и тёмной теме совпадают по
 * тону, а подсветка подсказки не должна перерисовываться при переключении.
 */
export function hintTermColour(style: HintTermStyle): string {
  if (style === "custom") return CUSTOM_COLOUR;
  try {
    const theme = BlocklyCore.Themes.Classic as unknown as {
      categoryStyles?: Record<string, { colour?: string | number }>;
    };
    const colour = theme?.categoryStyles?.[style]?.colour;
    if (typeof colour === "string" && colour.startsWith("#")) return colour;
    const hue = typeof colour === "number" ? colour : Number(colour);
    if (Number.isFinite(hue)) {
      return BlocklyCore.utils.colour.hueToHex(hue);
    }
  } catch {
    /* тема недоступна — берём цвет по умолчанию */
  }
  return FALLBACK_COLOUR[style];
}

const QUOTED_RE = /[«“]([^»”\n]{1,90})[»”]/g;

/** Кэш цвета стиля: тема отдаёт одно и то же, пересчитывать hueToHex незачем. */
const colourCache = new Map<HintTermStyle, string>();

function termColour(style: HintTermStyle): string {
  let colour = colourCache.get(style);
  if (!colour) {
    colour = hintTermColour(style);
    colourCache.set(style, colour);
  }
  return colour;
}

function makeTermSpan(quoted: string, style: HintTermStyle): HTMLElement {
  const span = document.createElement("span");
  span.className = "hint-term";
  span.style.setProperty("--hint-term", termColour(style));
  span.textContent = quoted;
  return span;
}

/**
 * Оборачивает термины из plain-текста во фрагмент DOM. Возвращает null, если
 * совпадений нет — вызывающий тогда оставляет текст как был.
 */
function highlightQuoted(text: string): DocumentFragment | null {
  let frag: DocumentFragment | null = null;
  let cursor = 0;
  for (const m of text.matchAll(QUOTED_RE)) {
    const start = m.index ?? 0;
    const style = matchHintTerm(m[1]);
    if (!style) continue;
    if (!frag) frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode(text.slice(cursor, start)));
    frag.appendChild(makeTermSpan(m[0], style));
    cursor = start + m[0].length;
  }
  if (!frag) return null;
  frag.appendChild(document.createTextNode(text.slice(cursor)));
  return frag;
}

/**
 * Разбирает текст подсказки во фрагмент DOM: фразы в кавычках, совпавшие с
 * названием блока или раздела, заворачиваются в `<span class="hint-term">`
 * с цветом его категории. Остальной текст остаётся обычным.
 */
export function renderHintText(text: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.appendChild(highlightQuoted(text) ?? document.createTextNode(text));
  return frag;
}

/** Внутри этих тегов подсветку не ставим: код и ввод остаются как есть. */
const SKIP_TAGS = new Set(["PRE", "CODE", "KBD", "SAMP", "SCRIPT", "STYLE"]);

/**
 * Раскрашивает термины внутри уже размеченного HTML — условия задач и темы
 * справочника приходят строками с тегами, поэтому их нельзя разбирать
 * регуляркой по всей строке. Обходим текстовые узлы: теги, атрибуты и
 * вложенность остаются нетронутыми.
 */
export function highlightTermsIn(root: ParentNode): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !/[«“]/.test(node.nodeValue)) {
        return NodeFilter.FILTER_REJECT;
      }
      for (let el = node.parentElement; el && el !== root; el = el.parentElement) {
        if (SKIP_TAGS.has(el.tagName) || el.classList.contains("hint-term")) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  // Узлы собираем заранее: замена меняет дерево во время обхода.
  const targets: Text[] = [];
  while (walker.nextNode()) targets.push(walker.currentNode as Text);
  for (const node of targets) {
    const frag = highlightQuoted(node.nodeValue as string);
    if (frag) node.replaceWith(frag);
  }
}
