/**
 * Справочник тем: короткие объяснения новых терминов с примерами кода
 * на четырёх поддерживаемых языках (JavaScript, Python, Lua, PHP).
 *
 * Тема привязывается к задаче через поле `infoTopics` (см. tasks/types.ts)
 * и рендерится под условием задачи в контейнере #glossaryInfoSection —
 * там же, где живут старые захардкоженные info-секции. Новые темы
 * добавляются сюда как данные, а не как разметка в index.html.
 */

import { getAppLang } from "../localization";
import type { TaskId } from "../tasks/types";
import { tasks } from "../tasks/registry";

export type GlossaryTopicId =
  | "functions"
  | "nested_loops"
  | "break_continue"
  | "sorting"
  | "repeat_n_times"
  | "random_numbers"
  | "user_input"
  | "string_concat"
  | "string_length"
  | "string_indexing"
  | "string_slice"
  | "string_case_trim"
  | "string_search"
  | "string_replace"
  | "boolean_logic"
  | "ternary_null"
  | "math_functions"
  | "rounding"
  | "split_join"
  | "list_operations"
  | "list_indexing"
  | "list_add_remove"
  | "list_random_choice"
  | "string_accumulate"
  | "while_until"
  | "list_is_empty"
  | "nested_lists"
  | "predicate_functions"
  | "dict";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

type LangExample = { label: string; code: string };

function examplesBlock(items: LangExample[]): string {
  const lis = items.map((i) => `<li><strong>${esc(i.label)}</strong><pre><code>${esc(i.code)}</code></pre></li>`);
  return `<ul class="code-examples">${lis.join("")}</ul>`;
}

function partsList(pairs: Array<[string, string]>): string {
  return `<ul class="parts-list">${pairs.map(([label, text]) => `<li><strong>${esc(label)}</strong>: ${esc(text)}</li>`).join("")}</ul>`;
}

function mistakesList(items: string[]): string {
  return `<h4 style="margin-top:12px;">${t("Частые ошибки", "Common mistakes")}</h4><ul>${items
    .map((i) => `<li>${esc(i)}</li>`)
    .join("")}</ul>`;
}

function blocklyNote(html: string): string {
  return `<p style="font-size: 0.9em; font-style: italic;">${html}</p>`;
}

/** Пояснение одного слова из примера: term — как оно написано в коде. */
export type KeywordNote = { term: string; ru: string; en: string };

/**
 * Слова из примеров темы: ключевые слова языка (for, while, if, return) и
 * методы (.slice, .length, .reverse). Ребёнок читает пример и сразу понимает,
 * что значит каждое слово. term перечисляет написания через «/» — каждая форма
 * обязана встречаться в примерах темы, за этим следит
 * tests/glossary_keywords.test.ts.
 */
const TOPIC_KEYWORDS: Record<GlossaryTopicId, KeywordNote[]> = {
  functions: [
    { term: "function / def", ru: "начало описания функции: сразу после слова идут её имя и параметры в скобках", en: "starts the definition: right after it come the function name and its parameters" },
    { term: "(a, b)", ru: "параметры — имена, которыми функция пользуется внутри", en: "parameters — the names the function uses inside itself" },
    { term: "return", ru: "отдаёт результат туда, где функцию вызвали, и на этом её работа кончается", en: "hands the value back to the caller and ends the function there" },
    { term: "greet(\"Anna\")", ru: "вызов: имя со скобками значит «запустить»; в скобках — аргументы", en: "a call: the name plus parentheses means “run it”; the parentheses hold the arguments" },
    { term: "end", ru: "в Lua так закрывают тело функции", en: "in Lua this closes the function body" },
  ],
  nested_loops: [
    { term: "for", ru: "цикл: повторяет тело для каждого значения счётчика", en: "the loop: repeats its body for every counter value" },
    { term: "let", ru: "объявляет переменную-счётчик, которую можно менять", en: "creates the counter variable that the loop may change" },
    { term: "i++", ru: "шаг: увеличивает счётчик на 1 после каждого повтора", en: "the step: raises the counter by 1 after each repetition" },
    { term: "range(1, 4)", ru: "Python: числа 1, 2, 3 — верхняя граница не входит", en: "Python: the numbers 1, 2, 3 — the upper bound is excluded" },
    { term: "do", ru: "Lua: после do идёт тело цикла, end его закрывает", en: "Lua: the loop body sits between do and end" },
    { term: "f\"", ru: "Python: f-строка подставляет значения переменных прямо в текст", en: "Python: an f-string puts variable values straight into the text" },
  ],
  break_continue: [
    { term: "for", ru: "цикл: перебирает список по одному элементу", en: "the loop: walks the list one item at a time" },
    { term: "of", ru: "JS: for (const n of список) — за один шаг берём один элемент", en: "JS: for (const n of list) — each step takes one item from the list" },
    { term: "as", ru: "PHP: foreach (список as $n) — то же самое, по одному элементу", en: "PHP: foreach (list as $n) — the same, one item at a time" },
    { term: "if", ru: "выполняет тело только когда условие истинно", en: "runs the body only when the condition is true" },
    { term: "then", ru: "Lua: слово между условием и телом", en: "Lua: the word between the condition and its body" },
    { term: "%", ru: "остаток от деления: n % 2 == 0 читается как «n чётное»", en: "the remainder: n % 2 == 0 reads as “n is even”" },
    { term: "===", ru: "JS и PHP: равно и по значению, и по типу; в Python и Lua хватает ==", en: "JS and PHP: equal in value and type; Python and Lua use ==" },
  ],
  sorting: [
    { term: "sort", ru: "упорядочивает сам список, а не его копию", en: "orders the list itself, not a copy of it" },
    { term: "=>", ru: "JS: функция сравнения — стрелкой отвечают, какое значение меньше", en: "JS: the comparator — the arrow answers which value is smaller" },
    { term: "table.sort", ru: "Lua: сортировка живёт в библиотеке table", en: "Lua: sorting lives in the table library" },
    { term: "concat", ru: "Lua: склеивает элементы списка в одну строку для вывода", en: "Lua: joins the list items into one string for printing" },
    { term: "implode", ru: "PHP: та же склейка через выбранный разделитель", en: "PHP: the same join with a separator you choose" },
    { term: "local", ru: "Lua: переменная видна только там, где её объявили", en: "Lua: the variable is visible only where it was declared" },
  ],
  repeat_n_times: [
    { term: "for", ru: "цикл «повторить N раз»: счётчик сам считает повторы", en: "the “repeat N times” loop: the counter keeps track for you" },
    { term: "i < 3", ru: "условие: крутимся, пока счётчик меньше трёх", en: "the condition: keep going while the counter is below three" },
    { term: "i++", ru: "увеличиваем счётчик — иначе цикл никогда не закончится", en: "raises the counter — without it the loop never ends" },
    { term: "range(3)", ru: "Python: даёт 0, 1, 2 — ровно три шага", en: "Python: yields 0, 1, 2 — exactly three steps" },
    { term: "_", ru: "прочерк: имя переменной не нужно, важно только число повторов", en: "an underscore: the variable name is irrelevant, only the count matters" },
    { term: "do", ru: "Lua: тело цикла стоит между do и end", en: "Lua: the loop body sits between do and end" },
  ],
  random_numbers: [
    { term: "Math.random", ru: "дробь от 0 до 1: умножаем на 6 и покрываем весь диапазон", en: "a fraction from 0 to 1: multiply by 6 to cover the whole range" },
    { term: "Math.floor", ru: "округляет вниз до целого: 3.9 превращается в 3", en: "rounds down to a whole number: 3.9 becomes 3" },
    { term: "+ 1", ru: "сдвиг границы: 0…5 становится привычными 1…6", en: "shifts the range: 0…5 becomes the familiar 1…6" },
    { term: "randint", ru: "Python: целое число сразу внутри указанных границ", en: "Python: a whole number right inside the bounds you give" },
    { term: "math.random", ru: "Lua: без аргументов — дробь, с (1, 6) — целое из диапазона", en: "Lua: no arguments gives a fraction, (1, 6) gives a whole number" },
    { term: "rand", ru: "PHP: то же самое одной функцией", en: "PHP: the same thing in one function" },
  ],
  user_input: [
    { term: "prompt", ru: "JS в браузере: окно с вопросом и полем ввода", en: "JS in the browser: a dialog with the question and a text field" },
    { term: "input", ru: "Python: ждёт, пока наберут текст и нажмут Enter", en: "Python: waits until you type text and press Enter" },
    { term: "io.read", ru: "Lua: читает то, что набрали на клавиатуре", en: "Lua: reads what was typed on the keyboard" },
    { term: "fgets", ru: "PHP: читает набранную строку", en: "PHP: reads the line you typed" },
    { term: "trim", ru: "убирает невидимый перенос строки и пробелы по краям", en: "drops the invisible line break and the spaces around the answer" },
    { term: "const", ru: "сохраняет ответ в переменную, чтобы вернуться к нему позже", en: "stores the answer in a variable so the program can use it later" },
  ],
  string_concat: [
    { term: "+", ru: "JS и Python: склеивает части в одну строку", en: "JS and Python: glues the parts into one string" },
    { term: "..", ru: "Lua: склеивают именно две точки, плюс не работает", en: "Lua: two dots glue text, a plus sign does not work" },
    { term: "str / tostring", ru: "превращает число в текст: иначе строка и число не склеятся", en: "turns a number into text: otherwise text and number refuse to glue" },
    { term: "(age + 1)", ru: "скобки: сначала считаем, потом склеиваем", en: "parentheses: do the maths first, glue afterwards" },
    { term: "PHP_EOL", ru: "PHP: перенос строки, без него вывод слипнется в одну линию", en: "PHP: a line break — without it the output runs into one line" },
  ],
  string_length: [
    { term: "length", ru: "JS: сколько символов в строке", en: "JS: how many characters the string holds" },
    { term: "len", ru: "Python: функция длины", en: "Python: the length function" },
    { term: "#", ru: "Lua: решётка перед именем — это длина", en: "Lua: a hash before the name gives the length" },
    { term: "strlen", ru: "PHP: длина строки", en: "PHP: the length of the string" },
    { term: "split", ru: "разбивает строку на отдельные символы", en: "breaks the string into single characters" },
    { term: "reverse", ru: "переворачивает список задом наперёд", en: "flips the list around" },
    { term: "join", ru: "собирает список обратно в строку", en: "assembles the list back into one string" },
  ],
  string_indexing: [
    { term: "charAt", ru: "JS: символ по номеру позиции", en: "JS: the character at a given position" },
    { term: "[0]", ru: "обращение к ячейке: первый символ — нулевой, не первый", en: "cell access: the first character is number 0, not number 1" },
    { term: "[-1]", ru: "считаем с конца: -1 — последний символ", en: "counts backwards: -1 is the last character" },
    { term: "sub", ru: "Lua: string.sub(строка, начало, конец), обе границы входят", en: "Lua: string.sub(s, from, to) — both bounds included" },
    { term: "substr", ru: "PHP: вырезает по началу и длине", en: "PHP: cuts by start and length" },
    { term: "length - 1", ru: "последний символ в JS: символов 7, а индексы 0…6", en: "the last index in JS: 7 characters but indexes 0…6" },
  ],
  string_slice: [
    { term: "slice", ru: "JS: вырезает от начала до конца, правую границу не включает", en: "JS: cuts from start to end, the right bound stays out" },
    { term: "[0:3]", ru: "Python: срез через двоеточие — те же правила", en: "Python: a colon slice — the same rules" },
    { term: "sub", ru: "Lua: обе границы входят в результат, счёт с 1", en: "Lua: both bounds are inside the result, counting starts at 1" },
    { term: "substr", ru: "PHP: второе число — это длина куска, а не его конец", en: "PHP: the second number is the length, not the end position" },
    { term: "-3", ru: "отрицательное число — отсчёт от конца строки", en: "a negative number counts from the end of the string" },
  ],
  string_case_trim: [
    { term: "trim", ru: "JS и PHP: убирает пробелы по краям", en: "JS and PHP: removes the spaces at both ends" },
    { term: "strip", ru: "Python: то же самое", en: "Python: the same thing" },
    { term: "toUpperCase", ru: "JS: делает все буквы заглавными", en: "JS: makes every letter uppercase" },
    { term: "upper", ru: "Python и Lua: функция верхнего регистра", en: "Python and Lua: the uppercase function" },
    { term: "+=", ru: "дописывает текст в конец переменной", en: "appends text to the end of the variable" },
    { term: "match", ru: "Lua: шаблоном ^%s*(.-)%s*$ срезают пробелы по краям", en: "Lua: the pattern ^%s*(.-)%s*$ trims the surrounding spaces" },
  ],
  string_search: [
    { term: "indexOf", ru: "JS: номер первого вхождения, -1 если искали зря", en: "JS: position of the first hit, -1 when there is none" },
    { term: "lastIndexOf", ru: "JS: номер последнего вхождения", en: "JS: position of the last hit" },
    { term: "find / rfind", ru: "Python: поиск сначала и с конца", en: "Python: searching from the start and from the end" },
    { term: "strpos", ru: "PHP: позиция первого вхождения", en: "PHP: the position of the first hit" },
    { term: "count", ru: "сколько раз подстрока встречается", en: "how many times the substring appears" },
    { term: "gmatch", ru: "Lua: перебирает все вхождения по одному", en: "Lua: walks through every match one by one" },
    { term: "for", ru: "Lua: цикл собирает найденные вхождения и считает их", en: "Lua: the loop walks the matches and counts them" },
  ],
  string_replace: [
    { term: "replace", ru: "меняет одно вхождение: JS — только первое, Python — по лимиту", en: "changes one hit: JS only the first, Python as many as you allow" },
    { term: "replaceAll", ru: "JS: меняет все вхождения сразу", en: "JS: changes every hit at once" },
    { term: "gsub", ru: "Lua: всегда меняет все вхождения", en: "Lua: always replaces all hits" },
    { term: "str_replace", ru: "PHP: меняет все вхождения", en: "PHP: replaces all hits" },
  ],
  boolean_logic: [
    { term: "&& / and", ru: "И: нужно, чтобы оба условия были истинны", en: "AND: both conditions have to be true" },
    { term: "|| / or", ru: "ИЛИ: достаточно, чтобы сработало одно", en: "OR: one true condition is enough" },
    { term: "! / not", ru: "НЕ: переворачивает ответ — правда становится ложью", en: "NOT: flips the answer — truth becomes false" },
    { term: "true / True", ru: "истина", en: "the true value" },
    { term: "false / False", ru: "ложь", en: "the false value" },
    { term: "var_dump", ru: "PHP: печатает и значение, и его тип", en: "PHP: prints both the value and its type" },
  ],
  ternary_null: [
    { term: "?", ru: "развилка: условие ? если_да : если_нет", en: "the fork: condition ? yes-value : no-value" },
    { term: "if / else", ru: "то же самое, развёрнутое в две ветки", en: "the same choice spread over two branches" },
    { term: "and / or", ru: "Lua: тернарного оператора нет, роль играет пара and/or", en: "Lua: no ternary operator — the and/or pair plays that role" },
    { term: "null / nil / None", ru: "значения совсем нет: ячейка пустая", en: "there is no value at all: the cell is empty" },
    { term: "is None", ru: "Python: так спрашивают «значения нет?»", en: "Python: how you ask “is there no value?”" },
    { term: "let x", ru: "JS: переменная без значения хранит undefined", en: "JS: a variable with no value holds undefined" },
  ],
  math_functions: [
    { term: "Math / math", ru: "библиотека, где живут математические функции", en: "the library that holds the math functions" },
    { term: "sqrt", ru: "квадратный корень: сторона квадрата площадью 144", en: "square root: the side of a square with area 144" },
    { term: "abs / fabs", ru: "модуль: расстояние до нуля, знак отбрасываем", en: "absolute value: distance from zero, the sign is dropped" },
    { term: "PI / pi / M_PI", ru: "число π — длина круга к его диаметру", en: "π — the circle's length divided by its diameter" },
    { term: "log", ru: "логарифм; к console.log отношения не имеет", en: "the logarithm — nothing to do with console.log" },
  ],
  rounding: [
    { term: "round", ru: "округляет к ближайшему целому", en: "rounds to the nearest whole number" },
    { term: "ceil", ru: "всегда вверх: 4.1 превращает в 5", en: "always up: 4.1 becomes 5" },
    { term: "floor", ru: "всегда вниз: 4.9 превращает в 4", en: "always down: 4.9 becomes 4" },
    { term: "+ .5", ru: "Lua: округление делают парой floor(x + 0.5)", en: "Lua: rounding is written as floor(x + 0.5)" },
    { term: "max / min", ru: "наибольшее и наименьшее из перечисленного", en: "the largest and the smallest of what you list" },
  ],
  split_join: [
    { term: "split", ru: "режет строку по разделителю и отдаёт список", en: "cuts the string at the separator and returns a list" },
    { term: "join", ru: "собирает список обратно в строку через разделитель", en: "glues the list back into a string with a separator" },
    { term: "explode / implode", ru: "PHP: те же два действия другими именами", en: "PHP: the same two actions under other names" },
    { term: "gmatch", ru: "Lua: разбор по шаблону, где [^,]+ — «всё до запятой»", en: "Lua: splitting by pattern, where [^,]+ means “everything up to a comma”" },
    { term: "for", ru: "Lua: цикл собирает найденные части в список", en: "Lua: the loop collects the found parts into a list" },
    { term: "int", ru: "Python: превращает «10» в число, иначе + склеит строки", en: "Python: turns “10” into a number, otherwise + glues text" },
    { term: "\",\"", ru: "разделитель: по чему режем и чем склеиваем", en: "the separator: what we cut at and what we glue with" },
  ],
  list_operations: [
    { term: "reverse", ru: "переворачивает список задом наперёд", en: "flips the list around" },
    { term: "slice", ru: "JS: копия списка, чтобы не испортить оригинал", en: "JS: a copy of the list so the original stays intact" },
    { term: "indexOf / index", ru: "номер позиции, где лежит значение", en: "the position number where a value sits" },
    { term: "fill", ru: "Array(5).fill(\"ха\") — список из пяти одинаковых записей", en: "Array(5).fill(value) — a list of five identical entries" },
    { term: "for", ru: "Lua: так идут по списку с конца, шаг -1", en: "Lua: this walks the list backwards when the step is -1" },
    { term: "reversed", ru: "Python: обратный перебор, обёрнутый в list()", en: "Python: a reversed walk, wrapped in list()" },
    { term: "count", ru: "PHP: сколько элементов в списке", en: "PHP: how many items the list holds" },
  ],
  list_indexing: [
    { term: "[0]", ru: "первая ячейка списка: нумерация начинается с нуля", en: "the first cell of the list: counting starts at zero" },
    { term: "[-1]", ru: "Python: ячейка с конца — последняя", en: "Python: the cell counted from the end — the last one" },
    { term: "inv[1]", ru: "в Lua первая ячейка стоит под номером 1", en: "in Lua the first cell is number 1" },
    { term: "length / len / count", ru: "сколько ячеек занято: в JS это свойство, в Python и PHP — функция", en: "how many cells are filled: a property in JS, a function in Python and PHP" },
    { term: "#", ru: "Lua: длина списка — решётка перед именем", en: "Lua: the list length is a hash before the name" },
  ],
  list_add_remove: [
    { term: "push", ru: "JS: добавить элемент в конец", en: "JS: add an item at the end" },
    { term: "append", ru: "Python: то же самое", en: "Python: the same thing" },
    { term: "insert", ru: "Lua: вставить на указанное место", en: "Lua: insert at the position you name" },
    { term: "remove", ru: "Python удаляет по значению, Lua table.remove — по позиции", en: "Python removes by value, Lua's table.remove by position" },
    { term: "splice", ru: "JS: вырезать элемент по индексу", en: "JS: cut an item out by index" },
    { term: "indexOf / array_search", ru: "чтобы удалить по позиции, позицию сначала находят", en: "removing by position means finding that position first" },
  ],
  list_random_choice: [
    { term: "Math.random", ru: "дробь 0…1 — основа случайного выбора", en: "a 0…1 fraction — the base of a random pick" },
    { term: "Math.floor", ru: "округляет вниз: из дроби получается индекс ячейки", en: "rounds down: the fraction turns into a cell index" },
    { term: "length", ru: "сколько предметов — столько и вариантов", en: "as many items as there are choices" },
    { term: "choice", ru: "Python: случайный элемент одной функцией", en: "Python: one function picks a random item" },
    { term: "randomseed / os.time", ru: "Lua: «зачаток» от часов, чтобы ряд менялся каждый запуск", en: "Lua: seeding from the clock so each run differs" },
    { term: "array_rand", ru: "PHP: возвращает случайный индекс, а не сам элемент", en: "PHP: returns a random index, not the item itself" },
  ],
  string_accumulate: [
    { term: "let", ru: "переменную можно менять — на ней и копят результат", en: "a variable you may change — that is where the result piles up" },
    { term: "+= / .=", ru: "дописать к тому, что уже накоплено", en: "append to whatever is already collected" },
    { term: "..", ru: "Lua: склейка строк двумя точками", en: "Lua: strings glue with two dots" },
    { term: "range", ru: "Python: сколько шагов сделать", en: "Python: how many steps to take" },
    { term: "for", ru: "цикл: один повтор — одна порция дописанного текста", en: "the loop: one repetition appends one more piece of text" },
    { term: "\"\"", ru: "пустая строка — с неё начинают накопление", en: "an empty string — where the accumulating starts" },
  ],
  while_until: [
    { term: "while", ru: "повторять, пока условие истинно: сколько раз — заранее неизвестно", en: "repeat while the condition holds — the count is not known in advance" },
    { term: "<", ru: "условие остановки: крутимся, пока step меньше пяти", en: "the stopping test: keep looping while step is below five" },
    { term: "do", ru: "Lua: тело цикла между do и end", en: "Lua: the body sits between do and end" },
    { term: "+=", ru: "шаг: приближает условие к остановке, без него цикл вечный", en: "the update step: it moves the condition toward stopping" },
    { term: "++", ru: "JS и PHP: то же увеличение на 1, короче", en: "JS and PHP: the same +1, written shorter" },
    { term: "local", ru: "Lua: переменную объявляют до цикла, иначе проверять нечего", en: "Lua: declare the variable before the loop, or the test has nothing to read" },
  ],
  list_is_empty: [
    { term: "while", ru: "цикл с условием: проверяет перед каждым шагом", en: "a condition loop: it tests before every step" },
    { term: "> 0", ru: "в списке ещё есть хоть одна ячейка", en: "the list still has at least one cell" },
    { term: "length / len / count", ru: "считаем ячейки: пустой список — это длина 0", en: "counts cells: an empty list has length 0" },
    { term: "#", ru: "Lua: та же длина, только решёткой", en: "Lua: the same length, written as a hash" },
    { term: "shift", ru: "JS: вынуть первый элемент, список укорачивается", en: "JS: take out the first item, the list gets shorter" },
    { term: "pop / table.remove / array_shift", ru: "вынуть элемент — и условие само приближается к остановке", en: "take an item out — and the condition moves toward stopping" },
  ],
  nested_lists: [
    { term: "[1][1]", ru: "две пары скобок: сначала номер строки, потом номер ячейки в ней", en: "two bracket pairs: first the row, then the cell inside that row" },
    { term: "[[", ru: "список внутри списка: каждая строка — отдельный список", en: "a list inside a list: every row is its own list" },
    { term: "{{", ru: "Lua: вложенные фигурные скобки — строки внутри «двора»", en: "Lua: nested braces are the rows inside the grid" },
    { term: "const / local", ru: "весь «двор» хранится в одной переменной", en: "the whole grid lives in a single variable" },
    { term: "$", ru: "PHP: имя переменной всегда начинается с доллара", en: "PHP: a variable name always starts with a dollar sign" },
  ],
  predicate_functions: [
    { term: "function / def", ru: "описываем функцию-вопрос один раз", en: "define the question function once" },
    { term: "return", ru: "возвращает правду или ложь — то есть ответ", en: "returns the truth or lie that answers the question" },
    { term: "num > 3", ru: "сравнение внутри функции: его результат и есть ответ", en: "the comparison inside: its result is the answer" },
    { term: "big(4)", ru: "вызов-вопрос: «4 больше трёх?»", en: "the call asks: “is 4 bigger than 3?”" },
    { term: "if / then / else", ru: "проверяет ответ функции и выбирает ветку", en: "checks the answer of the function and picks a branch" },
    { term: "?", ru: "JS и PHP: короткий выбор ответа по тому же условию", en: "JS and PHP: the short yes/no pick on the same test" },
  ],
  dict: [
    { term: "{}", ru: "пустой словарь: ячеек ещё нет, будем добавлять", en: "an empty dictionary: no cells yet, we will add them" },
    { term: "[\"a\"]", ru: "обращение по имени, а не по номеру: ключ в кавычках", en: "access by name, not by position: the key is quoted" },
    { term: "in", ru: "есть ли в словаре такой ключ", en: "whether the dictionary has that key" },
    { term: "nil", ru: "Lua: значения под ключом нет", en: "Lua: there is no value under that key" },
    { term: "array_key_exists", ru: "PHP: та же проверка наличия ключа", en: "PHP: the same has-key check" },
    { term: "var_dump", ru: "PHP: печатает и ответ, и его тип", en: "PHP: prints the answer and its type" },
  ],
};

/**
 * Блок «Слова в примере»: что значит каждое ключевое слово языка и каждый метод
 * из примеров темы. Раздел ставится перед «Частыми ошибками».
 */
function keywordsBlock(topic: GlossaryTopicId): string {
  const lis = TOPIC_KEYWORDS[topic]
    .map((k) => `<li><code>${esc(k.term)}</code> — ${esc(t(k.ru, k.en))}</li>`)
    .join("");
  return `<h4 style="margin-top:12px;">${t("Слова в примере", "Words in this example")}</h4><ul>${lis}</ul>`;
}

/** Пояснения слов темы — для теста покрытия справочника. */
export function glossaryKeywordNotes(topic: GlossaryTopicId): KeywordNote[] {
  return TOPIC_KEYWORDS[topic];
}

const TOPIC_CONTENT: Record<GlossaryTopicId, () => string> = {
  functions: () =>
    `<h4>${t("Функции: определение, параметр, возврат", "Functions: definition, parameter, return")}</h4>` +
    `<p>${t(
      "Функция — это именованный кусок программы: действия описываются один раз и запускаются по имени столько раз, сколько нужно.",
      "A function is a named piece of a program: you describe the actions once and run them by name as many times as needed."
    )}</p>` +
    partsList([
      [t("определение", "definition"), t("описание функции — блок «создать функцию …»", "writing the function body — the “create a function …” block")],
      [t("вызов", "call"), t("запуск функции по имени — блок вызова", "running the function by name — the call block")],
      [t("параметр", "parameter"), t("внутренняя переменная функции, получает значение при вызове", "a variable inside the function, gets its value at call time")],
      [t("аргумент", "argument"), t("конкретное значение, которое передают при вызове", "the actual value passed at the call site")],
      [t("возврат", "return"), t("значение, которое функция отдаёт обратно в выражение", "the value the function hands back into the expression")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: функция с параметром", "Example: function with a parameter")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'function greet(name) {\n  console.log("Hello, " + name + "!");\n}\ngreet("Anna"); // Hello, Anna!' },
      { label: "Python", code: 'def greet(name):\n    print("Hello, " + name + "!")\ngreet("Anna")  # Hello, Anna!' },
      { label: "Lua", code: 'function greet(name)\n  print("Hello, " .. name .. "!")\nend\ngreet("Anna") -- Hello, Anna!' },
      { label: "PHP", code: '<?php\nfunction greet($name) {\n  echo "Hello, " . $name . "!" . PHP_EOL;\n}\ngreet("Anna"); // Hello, Anna!' },
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: функция с возвратом", "Example: function with a return value")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "function add(a, b) {\n  return a + b;\n}\nconsole.log(add(3, 4)); // 7" },
      { label: "Python", code: "def add(a, b):\n    return a + b\nprint(add(3, 4))  # 7" },
      { label: "Lua", code: "function add(a, b)\n  return a + b\nend\nprint(add(3, 4)) -- 7" },
      { label: "PHP", code: "<?php\nfunction add($a, $b) {\n  return $a + $b;\n}\necho add(3, 4) . PHP_EOL; // 7" },
    ]) +
    keywordsBlock("functions") +
    mistakesList([
      t("Определили функцию, но ни разу не вызвали — ничего не выполняется.", "The function is defined but never called — nothing runs."),
      t("Перепутали параметр (в определении) и аргумент (в вызове).", "Confusing the parameter (in the definition) with the argument (in the call)."),
      t("Печатают результат вместо возврата, когда значение нужно использовать дальше.", "Printing the result instead of returning it when the value is needed later."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Функции» — блок-фигура «создать функцию …», параметры добавляются через шестерёнку; блок вызова появляется в той же категории.",
      "In Blockly: the Functions category — the “create a function …” puzzle block, parameters are added via the gear; the call block appears in the same category."
    )),

  nested_loops: () =>
    `<h4>${t("Вложенные циклы", "Nested loops")}</h4>` +
    `<p>${t(
      "Вложенный цикл — это цикл внутри другого цикла. Внешний цикл отвечает за строки, внутренний — за столбцы: на каждую итерацию внешнего цикла внутренний проходится целиком.",
      "A nested loop is a loop inside another loop. The outer loop handles the rows, the inner one the columns: for each outer iteration the inner loop runs to completion."
    )}</p>` +
    partsList([
      [t("внешний цикл", "outer loop"), t("выполняется меньше раз, каждый его шаг запускает внутренний цикл заново", "runs fewer times; each of its steps starts the inner loop from scratch")],
      [t("внутренний цикл", "inner loop"), t("выполняется на каждой итерации внешнего", "runs fully on every iteration of the outer one")],
      [t("всего итераций", "total iterations"), t("произведение количеств: 5 × 5 = 25 повторов внутреннего", "the product of the counts: 5 × 5 = 25 inner repetitions")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: таблица умножения 1…3", "Example: multiplication table 1…3")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (let i = 1; i <= 3; i++) {\n  for (let j = 1; j <= 3; j++) {\n    console.log(i + \" × \" + j + \" = \" + i * j);\n  }\n}" },
      { label: "Python", code: "for i in range(1, 4):\n    for j in range(1, 4):\n        print(f\"{i} × {j} = {i * j}\")" },
      { label: "Lua", code: "for i = 1, 3 do\n  for j = 1, 3 do\n    print(i .. \" × \" .. j .. \" = \" .. i * j)\n  end\nend" },
      { label: "PHP", code: "<?php\nfor ($i = 1; $i <= 3; $i++) {\n  for ($j = 1; $j <= 3; $j++) {\n    echo \"$i × $j = \" . ($i * $j) . PHP_EOL;\n  }\n}" },
    ]) +
    keywordsBlock("nested_loops") +
    mistakesList([
      t("Один и тот же счётчик в обоих циклах — цикл «съедает» сам себя.", "The same counter variable in both loops — the loop eats itself."),
      t("Перепутали местами: перемножение i × j даёт разные строки, если внешний и внутренний поменяны.", "Swapping the loops: the i × j products change if outer and inner are switched."),
    ]) +
    blocklyNote(t(
      "В Blockly: вложите блок «цикл по j …» внутрь слота «выполнить» блока «цикл по i …» (категория «Циклы»).",
      "In Blockly: put the “count with j …” block into the “do” slot of the “count with i …” block (Loops category)."
    )),

  break_continue: () =>
    `<h4>${t("Break и continue: управление циклом", "Break and continue: controlling the loop")}</h4>` +
    partsList([
      [t("break", "break"), t("немедленно останавливает цикл — программа продолжается с блока после цикла", "stops the loop at once — execution continues after the loop")],
      [t("continue", "continue"), t("пропускает остаток текущей итерации и переходит к следующей", "skips the rest of the current iteration and moves to the next one")],
    ]) +
    `<p>${t(
      "break — классический паттерн «поиск с ранним выходом»: нашли искомое — дальше искать незачем.",
      "break is the classic “search with early exit” pattern: once the item is found, there is no reason to keep looking."
    )}</p>` +
    `<h4 style="margin-top:12px;">${t("Пример: break — первое чётное число", "Example: break — the first even number")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (const n of [7, 3, 8, 5, 2]) {\n  if (n % 2 === 0) {\n    console.log(n);\n    break; // напечатает только 8\n  }\n}" },
      { label: "Python", code: "for n in [7, 3, 8, 5, 2]:\n    if n % 2 == 0:\n        print(n)\n        break  # prints only 8" },
      { label: "Lua", code: "for _, n in ipairs({7, 3, 8, 5, 2}) do\n  if n % 2 == 0 then\n    print(n)\n    break -- prints only 8\n  end\nend" },
      { label: "PHP", code: "<?php\nforeach ([7, 3, 8, 5, 2] as $n) {\n  if ($n % 2 === 0) {\n    echo $n . PHP_EOL;\n    break; // only 8 is printed\n  }\n}" },
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: continue — пропустить нечётные", "Example: continue — skip the odds")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (const n of [1, 2, 3, 4]) {\n  if (n % 2 !== 0) continue;\n  console.log(n); // 2, 4\n}" },
      { label: "Python", code: "for n in [1, 2, 3, 4]:\n    if n % 2 != 0:\n        continue\n    print(n)  # 2, 4" },
      { label: "Lua", code: "-- В Lua нет continue: тело оборачивают\n-- в противоположное условие\nfor _, n in ipairs({1, 2, 3, 4}) do\n  if n % 2 == 0 then print(n) end\nend" },
      { label: "PHP", code: "<?php\nforeach ([1, 2, 3, 4] as $n) {\n  if ($n % 2 !== 0) continue;\n  echo $n . PHP_EOL; // 2, 4\n}" },
    ]) +
    keywordsBlock("break_continue") +
    mistakesList([
      t("Код в цикле после break не выполняется — ставьте его сразу после нужного действия.", "Code in the loop after break never runs — place it right after the useful action."),
      t("break останавливает только ближайший (внутренний) цикл, внешний продолжится.", "break stops only the innermost loop; the outer loop keeps going."),
    ]) +
    blocklyNote(t(
      "В Blockly: блок «прервать цикл» из категории «Циклы» — в выпадающем списке выберите «прервать» (break) или «пропустить» (continue).",
      "In Blockly: the “break out of loop” block from the Loops category — the dropdown switches it between “break” and “continue”."
    )),

  sorting: () =>
    `<h4>${t("Сортировка списка", "Sorting a list")}</h4>` +
    `<p>${t(
      "Сортировать — значит упорядочить элементы списка по правилу: по возрастанию (от меньшего к большему) или по убыванию. После сортировки по возрастанию первый элемент — минимум, последний — максимум.",
      "To sort means to arrange list items by a rule: ascending (smallest to largest) or descending. After an ascending sort the first item is the minimum and the last is the maximum."
    )}</p>` +
    partsList([
      [t("по возрастанию", "ascending"), t("1, 3, 5, 7, 9", "1, 3, 5, 7, 9")],
      [t("по убыванию", "descending"), t("9, 7, 5, 3, 1", "9, 7, 5, 3, 1")],
      [t("алфавитный порядок", "alphabetical"), t("слова сравниваются по буквам: \"арбуз\" раньше \"банан\"", "words compare letter by letter: \"apple\" comes before \"banana\"")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: сортировка [9, 3, 7, 1, 5]", "Example: sorting [9, 3, 7, 1, 5]")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "const list = [9, 3, 7, 1, 5];\nlist.sort((a, b) => a - b);\nconsole.log(list); // [1, 3, 5, 7, 9]" },
      { label: "Python", code: "lst = [9, 3, 7, 1, 5]\nlst.sort()\nprint(lst)  # [1, 3, 5, 7, 9]" },
      { label: "Lua", code: "local list = {9, 3, 7, 1, 5}\ntable.sort(list)\nprint(table.concat(list, \", \"))\n-- 1, 3, 5, 7, 9" },
      { label: "PHP", code: "<?php\n$list = [9, 3, 7, 1, 5];\nsort($list);\necho implode(\", \", $list); // 1, 3, 5, 7, 9" },
    ]) +
    keywordsBlock("sorting") +
    mistakesList([
      t("Числа как текст сортируются странно: [\"10\", \"9\"] → 10 раньше 9. Сортируйте именно числа.", "Numbers stored as text sort oddly: [\"10\", \"9\"] puts 10 before 9. Sort actual numbers."),
      t("Путают direction в блоке сортировки: по убыванию минимум окажется в конце.", "Mixing up the sort direction: with descending order the minimum ends up last."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Списки» — блок «сортировать» с выпадающим списком (числовая по возрастанию / по убыванию / алфавитно).",
      "In Blockly: the Lists category — the “sort” block with a dropdown (numeric ascending / descending / alphabetical)."
    )),

  repeat_n_times: () =>
    `<h4>${t("Повторить N раз", "Repeat N times")}</h4>` +
    `<p>${t(
      "Самый простой цикл, когда заранее известно число повторов: «повторить 10 раз» — счётчик не нужен, тело цикла выполняется заданное количество раз.",
      "The simplest loop when the number of repetitions is known upfront: “repeat 10 times” — no counter needed, the body runs exactly that many times."
    )}</p>` +
    partsList([
      [t("повторить … раз", "repeat … times"), t("сколько раз выполнить тело цикла", "how many times to run the loop body")],
      [t("отличие от «цикл по i»", "vs “count with i”"), t("здесь нет переменной-счётчика: действие повторяется, но номер шага недоступен", "there is no counter variable: the action repeats, but the step number isn't available")],
      [t("отличие от «пока»", "vs “while”"), t("число повторов известно до запуска, а не зависит от условия", "the repeat count is known before running, not driven by a condition")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: сказать «Привет» 3 раза", "Example: say “Hello” 3 times")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "for (let i = 0; i < 3; i++) {\n  console.log(\"Привет\");\n}" },
      { label: "Python", code: "for _ in range(3):\n    print(\"Привет\")" },
      { label: "Lua", code: "for _ = 1, 3 do\n  print(\"Привет\")\nend" },
      { label: "PHP", code: "<?php\nfor ($i = 0; $i < 3; $i++) {\n  echo \"Привет\" . PHP_EOL;\n}" },
    ]) +
    keywordsBlock("repeat_n_times") +
    mistakesList([
      t("Ставят «повторить» там, где нужен счётчик (например, числа 1…10) — берите «цикл по i».", "Using “repeat” where a counter is needed (e.g. printing 1…10) — take “count with i” instead."),
      t("Не то, что нужно, при неизвестном числе повторов («пока не угадан») — там подходит «повторять, пока».", "Wrong tool when the count is unknown (“until guessed right”) — use “repeat while” there."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Циклы» — блок «повторить … раз» с полем количества повторений.",
      "In Blockly: the Loops category — the “repeat … times” block with a count field."
    )),

  random_numbers: () =>
    `<h4>${t("Случайные числа", "Random numbers")}</h4>` +
    `<p>${t(
      "Генератор случайных чисел каждый запуск выдаёт новое значение «из ничего» — программа не может его предсказать. Чаще всего нужен целый случайный число в диапазоне: от и до, включая обе границы.",
      "A random number generator produces a fresh unpredictable value on each run. The most common need is a random whole number in a range: from and to, both bounds included."
    )}</p>` +
    partsList([
      [t("целое в диапазоне", "random integer in range"), t("случайное целое от A до B включительно (кубик: от 1 до 6)", "a random whole number from A to B inclusive (a die: 1 to 6)")],
      [t("дробное", "random fraction"), t("число от 0 до 1 — основа для ручных диапазонов", "a number from 0 to 1 — the building block for manual ranges")],
      [t("непредсказуемость", "unpredictability"), t("проверить вывод генератора точно нельзя — только диапазон и форму", "you can't assert the exact output — only the range and the shape")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: бросок кубика (1…6)", "Example: a die roll (1…6)")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "const roll = Math.floor(Math.random() * 6) + 1;\nconsole.log(roll);" },
      { label: "Python", code: "import random\nroll = random.randint(1, 6)\nprint(roll)" },
      { label: "Lua", code: "roll = math.random(1, 6)\nprint(roll)" },
      { label: "PHP", code: "<?php\n$roll = rand(1, 6);\necho $roll . PHP_EOL;" },
    ]) +
    keywordsBlock("random_numbers") +
    mistakesList([
      t("Думают, что границы не включаются: «от 1 до 6» может дать и 1, и 6.", "Believing the bounds are exclusive: “1 to 6” can yield both 1 and 6."),
      t("Сравнивают результат с конкретным числом при проверке — он же случайный. Проверяйте диапазон.", "Checking the result against a fixed number — it is random. Verify the range instead."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Математика» — блок «выдать случайное от … до …» (целое) и «случайное дробное».",
      "In Blockly: the Math category — the “random integer from … to …” block and “random fraction”."
    )),

  user_input: () =>
    `<h4>${t("Ввод пользователя", "User input")}</h4>` +
    `<p>${t(
      "Программа может не только печатать, но и спрашивать: во время запуска появляется поле ввода, пользователь что-то пишет, а функция ввода возвращает это как значение.",
      "A program can not only print but also ask: while it runs an input box appears, the user types something, and the input call returns it as a value."
    )}</p>` +
    partsList([
      [t("значение из поля", "value from the box"), t("результат ввода можно присвоить переменной или вложить в другой блок", "the input result can be stored in a variable or plugged into another block")],
      [t("текст vs число", "text vs number"), t("ввод — это всегда строка; для арифметики её надо привести к числу", "input is always a string; convert it to a number for arithmetic")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: спросить имя и поздороваться", "Example: ask a name and greet")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: "const name = prompt(\"Как тебя зовут?\");\nconsole.log(\"Привет, \" + name + \"!\");" },
      { label: "Python", code: "name = input(\"Как тебя зовут? \")\nprint(\"Привет, \" + name + \"!\")" },
      { label: "Lua", code: "io.write(\"Как тебя зовут? \")\nlocal name = io.read()\nprint(\"Привет, \" .. name .. \"!\")" },
      { label: "PHP", code: "<?php\necho \"Как тебя зовут? \" . PHP_EOL;\n$name = trim(fgets(STDIN));\necho \"Привет, \" . $name . \"!\" . PHP_EOL;" },
    ]) +
    keywordsBlock("user_input") +
    mistakesList([
      t("Числовой ввод используют без перевода в число: «возраст + 1» к строке даёт склеивание, а не сумму — берите блок числа вместо текста.", "Using numeric input without conversion: “age + 1” on a string concatenates instead of adding — use the number input block."),
      t("Забывают, что ввод происходит во время запуска: нужно нажать «▶», дождаться поле ввода и ответить.", "Forgetting that input happens at run time: press “▶”, wait for the input box and answer."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блоки «Ввод текста» и «Ввод числа»; они возвращают значение, которое присваивают переменной.",
      "In Blockly: the Text category — the “text input” and “numeric input” blocks; they return a value you assign to a variable."
    )),

  string_concat: () =>
    `<h4>${t("Конкатенация: сборка строки из кусочков", "Concatenation: building a string from parts")}</h4>` +
    `<p>${t(
      "Конкатенация — это склейка текста из кусочков: строк, переменных и чисел. Блок «создать текст из» делает ровно это, а в коде выглядит как один оператор.",
      "Concatenation glues text out of pieces: strings, variables and numbers. The “create text with” block does exactly that, and in code it is a single operator."
    )}</p>` +
    partsList([
      [t("оператор склейки", "join operator"), t("«+» в JavaScript и Python, «..» в Lua, «.» в PHP", "“+” in JavaScript and Python, “..” in Lua, “.” in PHP")],
      [t("приведение к строке", "conversion to text"), t("число со строкой в Python и Lua не склеивается — Blockly сам пишет str(…) или tostring(…)", "in Python and Lua a number will not glue onto text, so Blockly writes str(…) or tostring(…) for you")],
      [t("пробел", "space"), t("пробел — часть кусочка: «Hello, » с пробелом и «Hello,» без него дают разный результат", "the space belongs to the piece: “Hello, ” and “Hello,” give different results")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: приветствие с именем", "Example: greeting with a name")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const name = "Anna";\nconsole.log("Hello, " + name + "!"); // Hello, Anna!' },
      { label: "Python", code: 'name = "Anna"\nprint("Hello, " + name + "!")  # Hello, Anna!' },
      { label: "Lua", code: 'local name = "Anna"\nprint("Hello, " .. name .. "!") -- Hello, Anna!' },
      { label: "PHP", code: '<?php\n$name = "Anna";\necho "Hello, " . $name . "!" . PHP_EOL; // Hello, Anna!' },
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: строка и число", "Example: text with a number")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const age = 10;\nconsole.log("Next year " + (age + 1) + "."); // Next year 11.' },
      { label: "Python", code: 'age = 10\nprint("Next year " + str(age + 1) + ".")  # Next year 11.' },
      { label: "Lua", code: 'local age = 10\nprint("Next year " .. tostring(age + 1) .. ".") -- Next year 11.' },
      { label: "PHP", code: '<?php\n$age = 10;\necho "Next year " . ($age + 1) . "." . PHP_EOL; // Next year 11.' },
    ]) +
    keywordsBlock("string_concat") +
    mistakesList([
      t("Склеить строку и число в Python без str() — программа падает с ошибкой типов.", "Joining a string and a number in Python without str() raises a type error."),
      t("Забыть пробел между кусочками — слова слипаются в «HelloAnna».", "Forgetting the space between the pieces — the words stick together as “HelloAnna”."),
      t("Перепутать операторы языков: в Lua строки склеивают точки .., а не «+».", "Mixing up the operators: in Lua strings are joined by .., not by “+”."),
    ]) +
    blocklyNote(t(
      "В Blockly: блок «создать текст из» (категория «Текст») склеивает свои поля по порядку; кнопки «+» и «−» слева и справа добавляют или убирают части.",
      "In Blockly: the “create text with” block (Text category) glues its fields in order; the “+” and “−” buttons on its sides add or remove parts."
    )),

  string_length: () =>
    `<h4>${t("Длина строки и разворот", "String length and reverse")}</h4>` +
    `<p>${t(
      "Длина строки — это сколько символов в ней хранится. Символом считается всё: буквы, цифры, знаки препинания и пробелы. Разворот строки — то же самое чтение символов, но с конца.",
      "A string's length is how many characters it holds. Every character counts: letters, digits, punctuation and spaces. Reversing a string means reading those characters from the end."
    )}</p>` +
    partsList([
      [t("длина", "length"), t("число символов в строке, у \"\" она равна 0", "the number of characters, an empty string has 0")],
      [t("пробел — символ", "a space is a character"), t("\"привет \" длиннее, чем \"привет\"", "\"hello \" is longer than \"hello\"")],
      [t("разворот", "reverse"), t("строка наоборот: \"abc\" → \"cba\"", "the string backwards: \"abc\" → \"cba\"")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: длина и разворот слова «Blockly»", "Example: length and reverse of “Blockly”")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Blockly";\nconsole.log(s.length); // 7\nconsole.log(s.split("").reverse().join("")); // ylkcolB' },
      { label: "Python", code: 's = "Blockly"\nprint(len(s))      # 7\nprint(s[::-1])     # ylkcolB' },
      { label: "Lua", code: 'local s = "Blockly"\nprint(#s)                  -- 7\nprint(string.reverse(s))   -- ylkcolB' },
      { label: "PHP", code: '<?php\n$s = "Blockly";\necho strlen($s) . PHP_EOL; // 7\necho strrev($s) . PHP_EOL; // ylkcolB' },
    ]) +
    keywordsBlock("string_length") +
    mistakesList([
      t("Длина — не последний индекс: у строки из 7 символов последний индекс 6, потому что счёт символов начинается с нуля.", "Length is not the last index: a 7-character string ends at index 6 because counting starts at zero."),
      t("В JavaScript разворота строки нет — сначала split(''), затем reverse(), потом join('').", "JavaScript has no string reverse — split('') first, then reverse(), then join('')."),
      t("Путают длину текста и длину списка: блоки «длина текста» и «длина списка» разные.", "Confusing text length with list length — they are different blocks."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блоки «длина текста» и «развернуть».",
      "In Blockly: the Text category — the “length of text” and “reverse” blocks."
    )),

  string_indexing: () =>
    `<h4>${t("Символ по номеру: как считают индексы", "Character by position: how indexes work")}</h4>` +
    `<p>${t(
      "Чтобы взять один символ строки, указывают его позицию — индекс. В большинстве языков первый символ имеет индекс 0, а не 1, и это главный источник ошибок. В Blockly можно выбрать удобный способ: первый, последний, «с начала» и «с конца».",
      "To take a single character you give its position — the index. In most languages the first character has index 0, not 1, which is the main source of bugs. Blockly lets you pick a mode: first, last, from the start, from the end."
    )}</p>` +
    partsList([
      [t("индекс", "index"), t("номер символа в строке", "the number of a character inside the string")],
      [t("с нуля", "zero-based"), t("JavaScript, Python, PHP: первый символ — 0", "JavaScript, Python, PHP: the first character is 0")],
      [t("с единицы", "one-based"), t("Lua и блоки Blockly «с начала»: первый символ — 1", "Lua and the Blockly “from start” mode: the first character is 1")],
      [t("с конца", "from the end"), t("отрицательный индекс: -1 — последний символ", "a negative index: -1 is the last character")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: первый и последний символ", "Example: first and last character")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Blockly";\nconsole.log(s.charAt(0)); // B\nconsole.log(s.charAt(s.length - 1)); // y' },
      { label: "Python", code: 's = "Blockly"\nprint(s[0])   # B\nprint(s[-1])  # y' },
      { label: "Lua", code: 'local s = "Blockly"\nprint(string.sub(s, 1, 1))  -- B\nprint(string.sub(s, -1))    -- y' },
      { label: "PHP", code: '<?php\n$s = "Blockly";\necho $s[0] . PHP_EOL;            // B\necho substr($s, -1) . PHP_EOL;   // y' },
    ]) +
    keywordsBlock("string_indexing") +
    mistakesList([
      t("Спрашивают «первый символ» под индексом 1 и получают второй. В JS/Python/PHP первый — это 0.", "Asking for index 1 to get the first character and getting the second one. In JS/Python/PHP the first is 0."),
      t("Индекс равный длине уже вне строки: у \"Blockly\" индексы 0…6, а 7 — пусто.", "An index equal to the length is out of range: \"Blockly\" has indexes 0…6, index 7 is empty."),
      t("Режим «с начала» в Blockly считает с 1 — не путайте его с индексом языка.", "Blockly's “from start” mode counts from 1 — don't mix it up with the language index."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блок «в тексте получить …», в выпадающем списке: первый, последний, с начала, с конца.",
      "In Blockly: the Text category — the “in text get …” block; the dropdown offers first, last, from start, from end."
    )),

  string_slice: () =>
    `<h4>${t("Подстрока и срез (slice)", "Substring and slicing")}</h4>` +
    `<p>${t(
      "Подстрока — это кусочек строки, вырезанный между двумя позициями. В JavaScript и Python такой приём называют slice («срез»): указывают начало и конец, причём символ на позиции «конец» в результат не входит. В Lua и PHP задают начало и длину или начало и конец.",
      "A substring is a piece cut out between two positions. In JavaScript and Python this is called slicing: you give a start and an end, and the character at the end position is not included. Lua and PHP take a start and a length instead."
    )}</p>` +
    partsList([
      [t("начало", "start"), t("позиция первого символа кусочка", "the position of the piece's first character")],
      [t("конец", "end"), t("в JS/Python — позиция ПОСЛЕ последнего символа кусочка", "in JS/Python — the position AFTER the last character of the piece")],
      [t("с конца", "from the end"), t("отрицательная позиция отсчитывает хвост строки", "a negative position counts from the tail of the string")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: три куска слова «Blockly»", "Example: three pieces of “Blockly”")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Blockly";\nconsole.log(s.slice(0, 3)); // Blo\nconsole.log(s.slice(-3));   // kly\nconsole.log(s.slice(1, 6)); // lockl' },
      { label: "Python", code: 's = "Blockly"\nprint(s[0:3])  # Blo\nprint(s[-3:])  # kly\nprint(s[1:6])  # lockl' },
      { label: "Lua", code: 'local s = "Blockly"\nprint(string.sub(s, 1, 3))   -- Blo\nprint(string.sub(s, -3))     -- kly\nprint(string.sub(s, 2, 6))   -- lockl' },
      { label: "PHP", code: '<?php\n$s = "Blockly";\necho substr($s, 0, 3) . PHP_EOL;  // Blo\necho substr($s, -3) . PHP_EOL;    // kly\necho substr($s, 1, 5) . PHP_EOL;  // lockl' },
    ]) +
    keywordsBlock("string_slice") +
    mistakesList([
      t("В JS/Python правая граница не включается: s.slice(0, 3) даёт 3 символа, а не 4.", "In JS/Python the right bound is exclusive: s.slice(0, 3) yields 3 characters, not 4."),
      t("В Lua и PHP вторая цифра — часто длина, а не конечная позиция: substr(s, 0, 3) и sub(s, 1, 3) значат разное.", "In Lua and PHP the second number is often a length, not an end position: substr(s, 0, 3) and sub(s, 1, 3) differ."),
      t("Если начало дальше конца, получается пустая строка, а не ошибка — проверьте границы.", "When the start is past the end you get an empty string, not an error — check the bounds."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — блок «в тексте получить подстроку с … по …»; границы переключаются между «с начала», «с конца», «первый» и «последний».",
      "In Blockly: the Text category — the “in text get substring from … to …” block; each bound switches between from start, from end, first and last."
    )),

  string_case_trim: () =>
    `<h4>${t("Регистр, пробелы и дописывание строки", "Case, trimming and appending")}</h4>` +
    `<p>${t(
      "Реальные данные приходят «грязными»: с лишними пробелами по краям и в разном регистре. Перед сравнением строку чистят: убирают пробелы (trim) и приводят к одному регистру. Дописывание (append) — способ собирать длинную строку по частям.",
      "Real-world data arrives dirty: extra spaces around the text and mixed case. Before comparing, clean it up: trim the spaces and normalize the case. Appending is how you build a long string piece by piece."
    )}</p>` +
    partsList([
      [t("trim", "trim"), t("удаляет пробелы только по краям строки", "removes whitespace only at the ends of the string")],
      [t("верхний/нижний регистр", "upper/lower case"), t("PRI и pri — разные строки для компьютера", "PRI and pri are different strings for a computer")],
      [t("append", "append"), t("дописать текст к переменной, не перезаписывая её", "add text to a variable without overwriting it")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: очистить и поднять регистр", "Example: clean up and uppercase")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'let s = "  pri";\ns += "vet!";\nconsole.log(s.trim().toUpperCase()); // PRIVET!' },
      { label: "Python", code: 's = "  pri"\ns += "vet!"\nprint(s.strip().upper())  # PRIVET!' },
      { label: "Lua", code: 'local s = "  pri"\ns = s .. "vet!"\nlocal t = s:match("^%s*(.-)%s*$")\nprint(t:upper())  -- PRIVET!' },
      { label: "PHP", code: '<?php\n$s = "  pri";\n$s .= "vet!";\necho strtoupper(trim($s)) . PHP_EOL; // PRIVET!' },
    ]) +
    keywordsBlock("string_case_trim") +
    mistakesList([
      t("trim не трогает пробелы внутри строки: \" pri vet \" останется с двойным пробелом посередине.", "trim leaves inner spaces alone: \" pri vet \" still has a double space in the middle."),
      t("Сравнивают строки разного регистра и получают «не равно». Сначала — к одному регистру, потом сравнивать.", "Comparing strings of different case returns “not equal”. Normalize the case first, then compare."),
      t("Функции регистра не меняют строку на месте в JS и Python — результат нужно присвоить.", "Case functions do not mutate the string in JS and Python — assign the result."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — «изменить регистр», «убрать пробелы» и «добавить к переменной текст».",
      "In Blockly: the Text category — “change case”, “trim whitespace” and “add text to variable”."
    )),

  string_search: () =>
    `<h4>${t("Поиск в строке: позиция и количество", "Searching a string: position and count")}</h4>` +
    `<p>${t(
      "Искать в строке — значит отвечать на два вопроса: «где подстрока?» и «сколько её раз?». В Blockly позиция считается с 1, а если подстроки нет — блок возвращает 0. В самих языках отсчёт идёт с 0, а «не найдено» выглядит по-разному: -1, None или false.",
      "Searching a string answers two questions: “where is the substring?” and “how many times?”. Blockly counts positions from 1 and returns 0 when nothing is found. The languages themselves count from 0 and spell “not found” differently: -1, None or false."
    )}</p>` +
    partsList([
      [t("первое вхождение", "first occurrence"), t("самая левая позиция подстроки", "the leftmost position of the substring")],
      [t("последнее вхождение", "last occurrence"), t("самая правая позиция — искать нужно с конца", "the rightmost position — the search runs from the end")],
      [t("не найдено", "not found"), t("в Blockly это 0, в JS/Python -1, в PHP false", "0 in Blockly, -1 in JS/Python, false in PHP")],
      [t("количество", "count"), t("сколько НЕПЕРЕКРЫВАЮЩИХСЯ вхождений подстроки", "how many NON-OVERLAPPING occurrences the substring has")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: ищем «a» в «banana»", "Example: looking for “a” in “banana”")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "banana";\nconsole.log(s.indexOf("a"));         // 1 — отсчёт с 0\nconsole.log(s.lastIndexOf("a"));       // 5\nconsole.log(s.indexOf("z"));           // -1 — не найдено\nconsole.log(s.split("a").length - 1);  // 3 — сколько раз' },
      { label: "Python", code: 's = "banana"\nprint(s.find("a"))    # 1\nprint(s.rfind("a"))   # 5\nprint(s.find("z"))    # -1\nprint(s.count("a"))   # 3' },
      { label: "Lua", code: 'local s = "banana"\nprint((string.find(s, "a", 1, true)))  -- 1\nlocal n = 0\nfor _ in s:gmatch("a") do n = n + 1 end\nprint(n)  -- 3' },
      { label: "PHP", code: '<?php\n$s = "banana";\necho strpos($s, "a") . PHP_EOL;        // 1\necho strrpos($s, "a") . PHP_EOL;       // 5\nvar_dump(strpos($s, "z"));             // bool(false)\necho substr_count($s, "a") . PHP_EOL;  // 3' },
    ]) +
    keywordsBlock("string_search") +
    mistakesList([
      t("«Позиция 0» в языке программирования — это первая буква, а не «не найдено». Проверяйте результат сравнением с -1 или false.", "Position 0 in a programming language is the first letter, not “not found”. Test the result against -1 or false."),
      t("Подсчёт не перекрывается: «na» в «banana» дают 2, а не 3 — найденный кусок «вычёркивается» целиком.", "Counting does not overlap: “na” in “banana” gives 2, not 3 — each hit is consumed whole."),
      t("Регистр важен: «A» не найдётся в «banana». Сначала приведите строку к одному регистру.", "Case matters: “A” is not found in “banana”. Normalize the case first."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — «в тексте … найти первое вхождение текста» (режимы «первое» и «последнее») и «подсчитать количество … в …». Обе позиции уже пересчитаны с 1.",
      "In Blockly: the Text category — “in text … find first occurrence of text …” (modes first and last) and “count … in …”. Both positions are already 1-based."
    )),

  string_replace: () =>
    `<h4>${t("Замена подстроки", "Replacing a substring")}</h4>` +
    `<p>${t(
      "Замена создаёт новую строку, в которой одни куски заменены другими. Блок Blockly «заменить … на … в тексте» меняет сразу ВСЕ вхождения; в JavaScript обычный replace() заменяет только первое, и для остальных нужен специальный режим.",
      "Replacement produces a new string where some pieces are swapped for others. The Blockly “replace … with … in text” block changes ALL occurrences at once; in JavaScript a plain replace() changes only the first one and you need a special mode for the rest."
    )}</p>` +
    partsList([
      [t("что менять", "search"), t("подстрока-образец (FROM)", "the substring to look for (FROM)")],
      [t("на что менять", "replacement"), t("новый текст на месте каждого совпадения", "the new text placed at every match")],
      [t("в чём искать", "haystack"), t("исходная строка, которую обрабатывают", "the original string being processed")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: «Mississippi» с заменами", "Example: “Mississippi” with replacements")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const s = "Mississippi";\nconsole.log(s.replace("i", "1"));     // M1ssissippi — только первое\nconsole.log(s.replaceAll("i", "1"));  // M1ss1ss1pp1 — все\nconsole.log(s.replace(/ss/g, "sh"));  // Mishishippi' },
      { label: "Python", code: 's = "Mississippi"\nprint(s.replace("i", "1"))      # M1ss1ss1pp1 — сразу все\nprint(s.replace("i", "1", 1))   # M1ssissippi — только первое' },
      { label: "Lua", code: 'local s = "Mississippi"\nprint((s:gsub("i", "1")))      -- M1ss1ss1pp1\n-- gsub всегда меняет все вхождения, если не указан лимит' },
      { label: "PHP", code: '<?php\n$s = "Mississippi";\necho str_replace("i", "1", $s) . PHP_EOL;  // M1ss1ss1pp1' },
    ]) +
    keywordsBlock("string_replace") +
    mistakesList([
      t("Замена не меняет строку на месте: без присваивания результата исходная строка остаётся прежней.", "Replacement does not mutate the string: unless you assign the result, the original stays unchanged."),
      t("Замена на пустой текст — это удаление: replace(s, \"\") вырезает подстроку.", "Replacing with an empty text is deletion: replace(s, \"\") cuts the substring out."),
      t("Нельзя получить обратную замену «на автомате»: чтобы вернуть ss, нужна вторая замена с обратным направлением.", "There is no automatic undo: to get ss back you need a second replacement in the opposite direction."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Текст» — «заменить … на … в …». Блок — выражение, поэтому замены вкладывают друг в друга цепочкой.",
      "In Blockly: the Text category — “replace … with … in …”. It is a value block, so replacements chain into each other."
    )),

  boolean_logic: () =>
    `<h4>${t("Логические операции: И, ИЛИ, НЕ", "Boolean operators: AND, OR, NOT")}</h4>` +
    `<p>${t(
      "Логические операции собирают из простых проверок одну сложную. «И» истина, только когда истинны обе части; «ИЛИ» истина, если истинна хотя бы одна; «НЕ» переворачивает значение. Результат любой проверки — это логическое значение (true/false), и его можно напечатать, сохранить в переменную или передать в условие.",
      "Boolean operators build one complex check out of simple ones. AND is true only when both parts are true; OR is true when at least one part is; NOT flips the value. Every check yields a boolean (true/false) that you can print, store in a variable or feed into a condition."
    )}</p>` +
    partsList([
      [t("И (AND)", "AND"), t("оба условия должны выполниться", "both conditions must hold")],
      [t("ИЛИ (OR)", "OR"), t("достаточно одного выполнившегося условия", "one satisfied condition is enough")],
      [t("НЕ (NOT)", "NOT"), t("инверсия: истина становится ложью", "inversion: truth becomes falsehood")],
      [t("схема вычисления", "short-circuit"), t("вторую часть не проверяют, если вердикт ясен из первой", "the second part is skipped when the first already decides")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: сборка из двух проверок", "Example: combining two checks")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const a = true, b = false;\nconsole.log(a && b);  // false\nconsole.log(a || b);  // true\nconsole.log(!a);      // false\nconsole.log(14 > 10 && 14 < 12);  // false' },
      { label: "Python", code: 'a, b = True, False\nprint(a and b)        # False\nprint(a or b)         # True\nprint(not a)          # False\nprint(14 > 10 and 14 < 12)  # False' },
      { label: "Lua", code: 'local a, b = true, false\nprint(a and b)   -- false\nprint(a or b)    -- true\nprint(not a)     -- false' },
      { label: "PHP", code: '<?php\n$a = true; $b = false;\nvar_dump($a && $b);  // bool(false)\nvar_dump($a || $b);  // bool(true)\nvar_dump(!$a);       // bool(false)' },
    ]) +
    keywordsBlock("boolean_logic") +
    mistakesList([
      t("«И» с противоречивыми границами не выполним никогда: x > 20 и x < 12 ложны для любого числа.", "AND with contradictory bounds can never hold: x > 20 and x < 12 is false for every number."),
      t("Печать true в разных языках выглядит по-разному (True/true/1) — для окна вывода надёжнее печатать слово «да»/«нет».", "Printing true differs per language (True/true/1) — for the output panel it is safer to print a “yes”/“no” word."),
      t("«ИЛИ» — не «либо-либо»: когда истины обе части, результат всё равно истина.", "OR is not “either-or”: when both parts are true the result is still true."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Логика» — блоки «… и …», «… или …», «не …»; они принимаются внутрь «если» и в любые сравнения.",
      "In Blockly: the Logic category — “… and …”, “… or …”, “not …”; they fit inside “if” and into any comparison."
    )),

  ternary_null: () =>
    `<h4>${t("Тернарный выбор и пустое значение", "Ternary choice and the empty value")}</h4>` +
    `<p>${t(
      "Тернарный выбор — это «если … то … иначе», записанное одним значением: такой блок можно вставить прямо в «Вывести … цвет …» или в переменную, и громоздкое «если» не нужно. Отдельная сущность — пустое значение (null): оно означает «значения вовсе нет», и это не то же самое, что 0, false или пустая строка.",
      "A ternary choice is “if … then … else” written as a single value: the block drops straight into “Print … color …” or a variable, with no bulky “if”. A separate thing is the null value: it means “there is no value at all”, which is not the same as 0, false or an empty string."
    )}</p>` +
    partsList([
      [t("условие", "condition"), t("проверка, которая выбирает одну из двух веток", "the check that picks one of two branches")],
      [t("значение «то»", "then value"), t("что получить, когда условие истинно", "what you get when the condition holds")],
      [t("значение «иначе»", "else value"), t("что получить во всех остальных случаях", "what you get otherwise")],
      [t("null", "null"), t("пустое значение переменной или результата", "the empty value of a variable or a result")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: выбор значением", "Example: choosing a value")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const n = 7;\nconsole.log(n > 5 ? "больше" : "меньше");  // больше\nlet x;\nconsole.log(x == null);  // true — значения нет' },
      { label: "Python", code: 'n = 7\nprint("больше" if n > 5 else "меньше")  # больше\nx = None\nprint(x is None)  # True' },
      { label: "Lua", code: 'local n = 7\n-- в Lua тернарного оператора нет, роль играет пара and/or\nprint(n > 5 and "больше" or "меньше")\nlocal x = nil\nprint(x == nil)  -- true' },
      { label: "PHP", code: '<?php\n$n = 7;\necho ($n > 5 ? "больше" : "меньше") . PHP_EOL;  // больше\n$x = null;\nvar_dump($x === null);  // bool(true)' },
    ]) +
    keywordsBlock("ternary_null") +
    mistakesList([
      t("null, 0, false и \"\" — четыре разных вещи. «Пустой текст» проверяют блоком «… пуст», а не сравнением с «ничто».", "null, 0, false and \"\" are four different things. An empty text is checked with the “… is empty” block, not by comparing with “null”."),
      t("Переменная, которой никогда не присваивали значение, и есть null — частый источник «пустых» результатов.", "A variable that was never assigned a value is exactly null — a common source of “empty” results."),
      t("Тернарный блок — выражение, а не команда: он сам отдаёт значение, поэтому «если» с двумя ветками печати не обязателен.", "The ternary block is an expression, not a command: it hands back a value, so an “if” with two print branches is not needed."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Логика» — «выбрать по … | если истина … | если ложь …» (значение) и «ничто»; категория «Текст» — «… пуст».",
      "In Blockly: the Logic category — “test … | if true … | if false …” (a value) and “null”; the Text category — “… is empty”."
    )),

  math_functions: () =>
    `<h4>${t("Математические функции и константы", "Math functions and constants")}</h4>` +
    `<p>${t(
      "Кроме сложения и умножения есть готовые функции: корень, модуль, противоположное число, логарифм — и готовые константы: π, число Эйлера, золотое сечение. Их не нужно вычислять вручную: блок просто вставляется на место числа.",
      "Beyond addition and multiplication there are ready-made functions — square root, absolute value, negation, logarithm — and ready-made constants: π, Euler's number, the golden ratio. You do not compute them by hand: the block takes the place of a number."
    )}</p>` +
    partsList([
      [t("корень (sqrt)", "square root"), t("число, которое само умноженное даёт исходное", "the number that multiplied by itself gives the input")],
      [t("модуль (abs)", "absolute value"), t("расстояние до нуля, всегда неотрицательное", "distance from zero, never negative")],
      [t("противоположное (neg)", "negation"), t("смена знака: −7 становится 7", "flipping the sign: −7 becomes 7")],
      [t("константа", "constant"), t("готовое именованное число, например π ≈ 3,14159", "a named ready-made number such as π ≈ 3.14159")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: корень, модуль и π", "Example: root, absolute value and π")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'console.log(Math.sqrt(144));  // 12\nconsole.log(Math.abs(-7));    // 7\nconsole.log(Math.PI);         // 3.141592653589793\nconsole.log(Math.log(9));     // натуральный логарифм' },
      { label: "Python", code: 'import math\nprint(math.sqrt(144))  # 12.0 — дробное, даже если корень целый\nprint(math.fabs(-7))   # 7.0\nprint(math.pi)         # 3.141592653589793\nprint(math.log(9))' },
      { label: "Lua", code: 'print(math.sqrt(144))  -- 12\nprint(math.abs(-7))    -- 7\nprint(math.pi)         -- 3.1415926535898\nprint(math.log(9))' },
      { label: "PHP", code: '<?php\necho sqrt(144) . PHP_EOL;  // 12\necho abs(-7) . PHP_EOL;    // 7\necho M_PI . PHP_EOL;       // 3.1415926535898' },
    ]) +
    keywordsBlock("math_functions") +
    mistakesList([
      t("Функции часто возвращают дробное число там, где ждёшь целое: math.sqrt(144) в Python — это 12.0. Округляйте, если нужен целый ответ.", "These functions often return a float where you expect a whole number: math.sqrt(144) is 12.0 in Python. Round it when you need a whole answer."),
      t("Корень из отрицательного числа и логарифм от 0 или меньше дадут ошибку или NaN — сначала проверьте знак условием.", "A root of a negative number and a logarithm of 0 or less produce an error or NaN — check the sign with a condition first."),
      t("π печатается с разной точностью: JavaScript и Python дают 3.141592653589793, Lua и PHP — 3.1415926535898.", "π prints with different precision: JavaScript and Python give 3.141592653589793, Lua and PHP give 3.1415926535898."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Математика» — блок с нужной операцией («квадратный корень …», «модуль …», «- …», «ln …») и блок константы «π» с выбором π / e / φ / sqrt(2) / sqrt(½) / ∞.",
      "In Blockly: the Math category — the block for the operation (“square root …”, absolute value, negation, ln …) and the “π” constant block with a π / e / φ / sqrt(2) / sqrt(½) / ∞ dropdown."
    )),

  rounding: () =>
    `<h4>${t("Округление и ограничение значения", "Rounding and clamping")}</h4>` +
    `<p>${t(
      "Округление превращает дробь в целое: обычное — к ближайшему, вверх — к следующему целому, вниз — к предыдущему. Ограничение (constrain) не округляет, а запирает значение в диапазон: что меньше нижней границы, становится нижней, что больше верхней — верхней.",
      "Rounding turns a fraction into a whole number: ordinary rounding goes to the nearest, up to the next integer, down to the previous one. Clamping does not round: it locks a value into a range — anything below the low bound becomes the low bound, anything above the high bound becomes the high bound."
    )}</p>` +
    partsList([
      [t("округлить", "round"), t("к ближайшему целому", "to the nearest whole number")],
      [t("вверх", "ceiling"), t("к наименьшему целому, которое не меньше числа", "to the smallest integer that is not less")],
      [t("вниз", "floor"), t("к наибольшему целому, которое не больше числа", "to the largest integer that is not greater")],
      [t("ограничить", "clamp"), t("запереть значение между нижней и верхней границей", "lock a value between a low and a high bound")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: 4,4 / 4,6 и диапазон 0..100", "Example: 4.4 / 4.6 and the range 0..100")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'console.log(Math.round(4.4));   // 4\nconsole.log(Math.round(4.6));   // 5\nconsole.log(Math.ceil(4.1));    // 5\nconsole.log(Math.floor(4.9));   // 4\nconsole.log(Math.min(Math.max(150, 0), 100));  // 100' },
      { label: "Python", code: 'import math\nprint(round(4.4))     # 4\nprint(round(4.6))     # 5\nprint(round(4.5))     # 4 — до чётного, а не вверх!\nprint(math.ceil(4.1)) # 5\nprint(math.floor(4.9))# 4' },
      { label: "Lua", code: 'print(math.floor(4.4 + .5))  -- 4 (в Blockly округление так и пишется)\nprint(math.floor(4.6 + .5))  -- 5\nprint(math.ceil(4.1))        -- 5\nprint(math.floor(4.9))       -- 4' },
      { label: "PHP", code: '<?php\necho round(4.4) . PHP_EOL;  // 4\necho round(4.6) . PHP_EOL;  // 5\necho ceil(4.1) . PHP_EOL;   // 5\necho floor(4.9) . PHP_EOL;  // 4' },
    ]) +
    keywordsBlock("rounding") +
    mistakesList([
      t("Ровно половина округляется неоднозначно: JavaScript и PHP дают round(4.5) = 5, а Python — 4, потому что округляет к чётному. Проверяйте .5 на своём языке.", "Exact halves round inconsistently: JavaScript and PHP give round(4.5) = 5 while Python gives 4, because it rounds to even. Test .5 on your own language."),
      t("Округление «вверх» для отрицательного числа идёт к нулю: потолок −4.9 это −4, а не −5.", "Rounding “up” moves a negative number toward zero: the ceiling of −4.9 is −4, not −5."),
      t("Ограничение молча портит данные, если границы перепутаны: при low > 100 любое значение станет равным низу.", "Clamping silently ruins data when the bounds are swapped: with low > 100 every value collapses to the low bound."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Математика» — «округлить …» с режимами «округлить», «округлить к большему», «округлить к меньшему» и «ограничить … снизу … сверху …».",
      "In Blockly: the Math category — “round …” with round / round up / round down modes and “constrain … low … high …”."
    )),

  split_join: () =>
    `<h4>${t("Разделить строку на список и склеить список в строку", "Splitting a string into a list and joining it back")}</h4>` +
    `<p>${t(
      "Один и тот же блок работает в двух направлениях. Разделение (split) режет текст по разделителю и возвращает список кусков; склейка (join) берёт список и собирает из него текст, вставляя разделитель между частями. Так хранят несколько значений в одной строке: CSV-файл, параметры, «фамилия имя».",
      "The same block works in both directions. Splitting cuts a text by a delimiter and returns a list of pieces; joining takes a list and builds a text, inserting the delimiter between parts. This is how several values live in one string: a CSV line, parameters, “lastname firstname”."
    )}</p>` +
    partsList([
      [t("разделитель", "delimiter"), t("подстрока, по которой режут; сама она в результат не попадает", "the substring to cut at; it is not kept in the result")],
      [t("куски", "pieces"), t("после разделения это всегда ТЕКСТ, а не числа", "after splitting these are TEXT, never numbers")],
      [t("пустой разделитель", "empty delimiter"), t("режет строку по символам", "cuts the string character by character")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: «10,20,30» туда и обратно", "Example: “10,20,30” there and back")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const parts = "10,20,30".split(",");  // ["10","20","30"]\nconsole.log(parts[0]);                 // 10\nconsole.log(parts[0] + 1);             // "101" — строки, не числа!\nconsole.log(parts.join("-"));          // 10-20-30' },
      { label: "Python", code: 'parts = "10,20,30".split(",")\nprint(parts[0])           # 10\nprint(int(parts[0]) + 1)  # 11 — сначала перевод в число\nprint("-".join(parts))    # 10-20-30' },
      { label: "Lua", code: 'local parts = {}\nfor w in ("10,20,30"):gmatch("([^,]+)") do\n  parts[#parts + 1] = w\nend\nprint(table.concat(parts, "-"))  -- 10-20-30' },
      { label: "PHP", code: '<?php\n$parts = explode(",", "10,20,30");\necho $parts[0] . PHP_EOL;          // 10\necho number_format($parts[0] + 1) . PHP_EOL;  // 11\necho implode("-", $parts);         // 10-20-30' },
    ]) +
    keywordsBlock("split_join") +
    mistakesList([
      t("После split элементы — строки: «10» + 1 в JavaScript даст «101». Для арифметики преобразуйте в число.", "After split the items are strings: \"10\" + 1 gives \"101\" in JavaScript. Convert to a number before doing arithmetic."),
      t("В Python join читается наоборот: разделитель стоит слева, \"-\".join(parts). В Blockly это просто другой режим того же блока.", "In Python join reads backwards: the delimiter comes first, \"-\".join(parts). In Blockly it is just another mode of the same block."),
      t("Разделитель может быть длиннее одного символа, и тогда его вырезают целиком: split(\"a => b\", \" => \") даёт два куска.", "A delimiter can be longer than one character and is then cut out whole: split(\"a => b\", \" => \") gives two pieces."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Списки» — «сделать список из текста … с разделителем …» и «собрать текст из списка … с разделителем …»; режим переключается в выпадающем списке блока.",
      "In Blockly: the Lists category — “make list from text … with delimiter …” and “make text from list … with delimiter …”; the mode is a dropdown on the same block."
    )),

  list_operations: () =>
    `<h4>${t("Операции со списками: переворот, повтор, позиция", "List operations: reverse, repeat, position")}</h4>` +
    `<p>${t(
      "Список можно развернуть задом наперёд, собрать из одного элемента нужное число раз и найти, на какой позиции стоит элемент. Все три блока — выражения: они возвращают новый список или число, а исходный список не портят.",
      "A list can be reversed, built from one element repeated a number of times, or searched for the position of an element. All three blocks are values: they return a new list or a number and leave the original list intact."
    )}</p>` +
    partsList([
      [t("развернуть", "reverse"), t("новый список с тем же содержимым в обратном порядке", "a new list with the same items in opposite order")],
      [t("повторить", "repeat"), t("список из одного элемента, повторённого n раз", "a list of one item repeated n times")],
      [t("позиция элемента", "item position"), t("в Blockly считается с 1, 0 — элемента нет", "Blockly counts from 1, 0 means the item is absent")],
      [t("длина", "length"), t("сколько элементов в списке, у пустого — 0", "how many items the list has, 0 when empty")],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: [1, 2, 3] со всех сторон", "Example: looking at [1, 2, 3] from all sides")}</h4>` +
    examplesBlock([
      { label: "JavaScript", code: 'const xs = [1, 2, 3];\nconsole.log(xs.slice().reverse());  // [3,2,1]\nconsole.log(xs.indexOf(2));         // 1 — отсчёт с 0\nconsole.log(Array(5).fill("ха"));   // пять повторений' },
      { label: "Python", code: 'xs = [1, 2, 3]\nprint(list(reversed(xs)))  # [3, 2, 1]\nprint(xs.index(2))         # 1 — отсчёт с 0\nprint(["ха"] * 5)          # 5 повторений' },
      { label: "Lua", code: 'local xs = {1, 2, 3}\nlocal rev = {}\nfor i = #xs, 1, -1 do rev[#rev + 1] = xs[i] end\nprint(rev[1])  -- 3\nprint(#xs)     -- 3 — длина' },
      { label: "PHP", code: '<?php\n$xs = [1, 2, 3];\nprint_r(array_reverse($xs));        // 3, 2, 1\nvar_dump(array_search(2, $xs));     // int(1) — с 0\necho count($xs) . PHP_EOL;          // 3' },
    ]) +
    keywordsBlock("list_operations") +
    mistakesList([
      t("Блок позиции отдаёт 0, когда элемента в списке нет, — а 0 похож на настоящее число. Проверяйте «не найдено» отдельно.", "The position block returns 0 when the item is not in the list — and 0 looks like a real number. Check “not found” explicitly."),
      t("Разворот в JavaScript на месте (xs.reverse()) портит исходный список; через slice() — безопасный копия-вариант.", "Reversing in place in JavaScript (xs.reverse()) ruins the original list; slice().reverse() works on a copy."),
      t("Элементы нужно сравнивать целиком: 2 и \"2\" — разные значения для поиска позиции.", "Items must match exactly: 2 and \"2\" are different values for a position search."),
    ]) +
    blocklyNote(t(
      "В Blockly: категория «Списки» — «изменить порядок на обратный …», «создать список из элемента …, повторяющегося … раз», «в списке … найти первое вхождение элемента …» и «длина …».",
      "In Blockly: the Lists category — “reverse …”, “create list with item … repeated … times”, “in list … find first occurrence of item …” and “length of …”."
    )),

  list_indexing: () =>
    `<h4>${t("Список и индексы: ячейки с номерами", "Lists and indexes: numbered cells")}</h4>` +
    `<p>${t(
      "Список хранит много значений в одной переменной. Каждое значение сидит в своей ячейке с номером — индексом, и по индексу можно это значение прочитать. Сортировка, поиск и вывод строятся именно на обращении к ячейкам.",
      "A list keeps many values in one variable. Every value sits in its own numbered cell — an index — and by that index you can read the value. Sorting, searching and printing all build on addressing cells."
    )}</p>` +
    partsList([
      [
        t("элемент", "item"),
        t(
          "одно значение внутри списка: предмет, число, строка",
          "one value inside the list: an item, a number, a string"
        ),
      ],
      [
        t("индекс", "index"),
        t(
          "номер ячейки; в Blockly отсчёт с 1, в языках — почти всегда с 0",
          "the cell number; Blockly counts from 1, languages almost always from 0"
        ),
      ],
      [
        t("длина", "length"),
        t(
          "сколько ячеек занято; у пустого списка это 0",
          "how many cells are filled; an empty list has 0"
        ),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: инвентарь по ячейкам", "Example: reading the inventory cell by cell")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'const inv = ["sword", "shield", "potion"];\nconsole.log(inv.length); // 3\nconsole.log(inv[0]);   // sword — первый элемент\nconsole.log(inv[2]);   // potion — последний',
      },
      {
        label: "Python",
        code: 'inv = ["sword", "shield", "potion"]\nprint(len(inv))  # 3\nprint(inv[0])    # sword — первый элемент\nprint(inv[-1])   # potion — последний, индекс с конца',
      },
      {
        label: "Lua",
        code: 'local inv = {"sword", "shield", "potion"}\nprint(#inv)     -- 3 — длина\nprint(inv[1])   -- sword — Lua считает с 1\nprint(inv[3])   -- potion',
      },
      {
        label: "PHP",
        code: '<?php\n$inv = ["sword", "shield", "potion"];\necho count($inv) . PHP_EOL; // 3\necho $inv[0] . PHP_EOL;     // sword\necho $inv[2] . PHP_EOL;     // potion',
      },
    ]) +
    keywordsBlock("list_indexing") +
    mistakesList([
      t(
        "Индекс вне диапазона: в списке 3 элемента, а просят четвёртый. Python выдаст IndexError, JavaScript — undefined.",
        "Index out of range: the list has 3 items but a 4th is requested. Python raises IndexError, JavaScript gives undefined."
      ),
      t(
        "Считать индексы с нуля там, где Blockly считает с 1, и наоборот: первый элемент — это № 1 в блоке и [0] в коде.",
        "Mixing the two conventions: the first item is #1 in the block but [0] in code."
      ),
      t(
        'Печатать список целиком вместо элемента: len("items") в Python считает буквы строки, а не предметы списка.',
        'Printing the whole list instead of an item: len("items") in Python counts the letters of the quoted name, not the items.'
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Списки» — «длина …» и «в списке … взять первый / последний / № …»; режим выбирается в выпадающем списке блока.",
        "In Blockly: the Lists category — “length of …” and “in list … get first / last / item # …”; the mode is a dropdown on the block."
      )
    ),

  list_add_remove: () =>
    `<h4>${t("Добавление, замена и удаление элементов", "Adding, replacing and removing items")}</h4>` +
    `<p>${t(
      "Список можно менять по ходу программы: заменить значение в ячейке, добавить новый элемент, удалить старый. В отличие от строк, списки изменяемые — эти действия меняют сам список, а не создают копию.",
      "A list can change while the program runs: replace a cell, add a new item, remove one. Unlike strings, lists are mutable — these actions edit the list itself instead of building a copy."
    )}</p>` +
    partsList([
      [
        t("заменить", "set"),
        t(
          "новое значение в существующую ячейку, длина не меняется",
          "a new value into an existing cell, the length stays the same"
        ),
      ],
      [
        t("добавить в конец", "append"),
        t(
          "новый элемент после последнего, длина растёт на 1",
          "a new item after the last one, the length grows by 1"
        ),
      ],
      [
        t("удалить", "remove"),
        t(
          "ячейка исчезает, а все элементы за ней сдвигаются на позицию влево",
          "the cell disappears and every later item shifts one position left"
        ),
      ],
      [
        t("найти вхождение", "index of"),
        t(
          "номер позиции элемента, 0 — если такого элемента нет",
          "the position number of an item, 0 when the item is absent"
        ),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: купить и продать предмет", "Example: buying and selling an item")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'const inv = ["sword", "shield"];\ninv[0] = "steel sword";     // замена\ninv.push("potion");         // добавить в конец\nconst p = inv.indexOf("shield");\ninv.splice(p, 1);           // удалить по позиции',
      },
      {
        label: "Python",
        code: 'inv = ["sword", "shield"]\ninv[0] = "steel sword"   # замена\ninv.append("potion")     # добавить в конец\ninv.remove("shield")     # удалить по значению\nprint(len(inv))          # 2',
      },
      {
        label: "Lua",
        code: 'local inv = {"sword", "shield"}\ninv[1] = "steel sword"       -- замена\ntable.insert(inv, "potion")    -- добавить в конец\ntable.remove(inv, 2)           -- удалить по позиции\nprint(#inv)                    -- 2',
      },
      {
        label: "PHP",
        code: '<?php\n$inv = ["sword", "shield"];\n$inv[0] = "steel sword";            // замена\narray_push($inv, "potion");          // добавить в конец\n$p = array_search("shield", $inv);   // найти позицию\nunset($inv[$p]);                      // удалить\necho count($inv) . PHP_EOL;          // 2',
      },
    ]) +
    keywordsBlock("list_add_remove") +
    mistakesList([
      t(
        "Удалять то, чего нет: Python выдаст ValueError, Blockly просто уберёт несуществующую ячейку. Сначала проверьте поиск.",
        "Removing something absent: Python raises ValueError. Search first and check that the item is really there."
      ),
      t(
        "После удаления позиции сдвигаются: то, что было № 3, станет № 2. Удаляйте элементы, идя с конца списка.",
        "After a removal the positions shift: what was #3 becomes #2. Remove items walking backwards through the list."
      ),
      t(
        "remove() в Python убирает только первое совпадение, а не все одинаковые элементы.",
        "Python's remove() drops only the first match, not every equal item."
      ),
      t(
        "Перепутали «заменить» и «вставить»: замена не меняет длину, вставка увеличит список.",
        "Confusing “set” with “insert”: replacing keeps the length, inserting makes the list longer."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Списки» — «в списке … присвоить № … = …» (замена), режим «вставить в …» того же блока (добавить) и «в списке … взять и удалить …» / «удалить …» (удаление).",
        "In Blockly: the Lists category — “in list … set item # … = …” (replace), the “insert at …” mode of the same block (add), and “in list … get remove …” / “remove …” (delete)."
      )
    ),

  list_random_choice: () =>
    `<h4>${t("Случайный выбор элемента из списка", "Picking a random item from a list")}</h4>` +
    `<p>${t(
      "Случайное число само по себе бесполезно, если нужно выбрать случайный предмет, карта или противника. Тогда берут элемент списка по случайной позиции — это «random choice».",
      "A random number is not enough when you need a random item, map or opponent. Then you take a list element at a random position — the “random choice”."
    )}</p>` +
    partsList([
      [
        t("позиция", "position"),
        t(
          "случайное целое от 1 до длины списка — не больше и не меньше",
          "a random whole number from 1 to the length — never above, never below"
        ),
      ],
      [
        t("равновероятно", "uniform"),
        t(
          "у каждого элемента одинаковый шанс, повторение не запрещено",
          "every item has the same chance, repeats are allowed"
        ),
      ],
      [
        t("пустой список", "empty list"),
        t(
          "выбирать нечего: программа падает или отдаёт пустоту",
          "there is nothing to pick: the program crashes or returns nothing"
        ),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: лут из монстра", "Example: loot from a monster")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'const loot = ["pelt", "sword", "fang", "root"];\nconst i = Math.floor(Math.random() * loot.length);\nconsole.log(loot[i]); // один случайный предмет',
      },
      {
        label: "Python",
        code: 'import random\n\nloot = ["pelt", "sword", "fang", "root"]\nprint(random.choice(loot))  # один случайный предмет',
      },
      {
        label: "Lua",
        code: 'local loot = {"pelt", "sword", "fang", "root"}\nmath.randomseed(os.time())\nprint(loot[math.random(#loot)]) -- один случайный предмет',
      },
      {
        label: "PHP",
        code: '<?php\n$loot = ["pelt", "sword", "fang", "root"];\n$i = array_rand($loot);\necho $loot[$i] . PHP_EOL; // один случайный предмет',
      },
    ]) +
    keywordsBlock("list_random_choice") +
    mistakesList([
      t(
        "Случайное число от 0 до длины: позиции с индексом длины не существует, будет выход за диапазон.",
        "A random number from 0 to the length: the cell at index length does not exist, so it goes out of range."
      ),
      t(
        "Путать «случайное число» и «случайный элемент»: первое даёт номер, второе — значение.",
        "Confusing a random number with a random item: the first gives a position, the second a value."
      ),
      t(
        "Думать, что результат предсказуем: проверку нельзя строить на точных строках, только на правиле (каждый вывод — элемент списка).",
        "Expecting a predictable result: the check cannot rely on exact lines, only on the rule (every printed line is an item of the list)."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: в блоке «в списке … взять …» выберите режим «произвольный»; в категории «Математика» есть «выдать случайное от … до …» для чисел.",
        "In Blockly: set the “in list … get …” block to the “random” mode; the Math category has “pick random … to …” for numbers."
      )
    ),

  string_accumulate: () =>
    `<h4>${t("Накопление строки: дописать и повторить", "Building a string up: append and repeat")}</h4>` +
    `<p>${t(
      "Строку нельзя изменить по символу, но можно собрать новую, дописывая кусочек за кусочком. Обычно заводят переменную с пустым текстом и в цикле приклеивают к неё нужные части.",
      "A string cannot be edited in place, but you can build a new one by gluing piece after piece. The usual pattern: a variable holding empty text, and a loop that keeps appending the parts you need."
    )}</p>` +
    partsList([
      [
        t("накопитель", "accumulator"),
        t(
          "переменная, которая растёт с каждым шагом цикла",
          "a variable that grows on every step of the loop"
        ),
      ],
      [
        t("дописать", "append"),
        t(
          "приклеить текст справа к уже накопленному",
          "glue text to the right of what is already stored"
        ),
      ],
      [
        t("склейка", "concatenation"),
        t(
          "операция, создающая новую строку из двух",
          "the operation that builds a new string out of two"
        ),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: эхо трижды", "Example: an echo three times")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'let echo = "";\nfor (let i = 0; i < 3; i++) {\n  echo += "ROAR" + "!";\n}\nconsole.log(echo); // ROAR!ROAR!ROAR!',
      },
      {
        label: "Python",
        code: 'echo = ""\nfor _ in range(3):\n    echo += "ROAR" + "!"\nprint(echo)  # ROAR!ROAR!ROAR!',
      },
      {
        label: "Lua",
        code: 'local echo = ""\nfor i = 1, 3 do\n  echo = echo .. "ROAR" .. "!"\nend\nprint(echo) -- ROAR!ROAR!ROAR!',
      },
      {
        label: "PHP",
        code: '<?php\n$echo = "";\nfor ($i = 0; $i < 3; $i++) {\n  $echo .= "ROAR" . "!";\n}\necho $echo . PHP_EOL; // ROAR!ROAR!ROAR!',
      },
    ]) +
    keywordsBlock("string_accumulate") +
    mistakesList([
      t(
        "Забыли обнулить накопитель: к прошлому значению дописывается новое, и эхо «растёт» между запусками.",
        "Forgetting to reset the accumulator: new text sticks to the old value and the echo keeps growing between runs."
      ),
      t(
        "Путать «добавить к переменной текст» (меняет переменную) с блоком «Вывести … цвет …» (он только показывает значение).",
        "Confusing “append text to variable” (changes the variable) with “Print … color …” (it only shows a value)."
      ),
      t(
        'В JavaScript «+» с числом склеивает строку: "ROAR" + 3 даёт "ROAR3", а не четыре рыка.',
        'In JavaScript “+” with a number concatenates: "ROAR" + 3 gives "ROAR3", not four roars.'
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Текст» — «к переменной … добавить текст …», это команда, а не значение; вложите её в «повторить … раз».",
        "In Blockly: the Text category — “append … to variable …”; it is a command, not a value, so drop it into “repeat … times”."
      )
    ),

  while_until: () =>
    `<h4>${t("Цикл «пока» и цикл «пока не»", "The “while” and “until” loops")}</h4>` +
    `<p>${t(
      "Цикл «пока» выполняет тело, пока условие истинно; «пока не» — пока условие ложно, то есть до момента, когда условие станет истинным. Оба останавливаются сами: число повторов заранее неизвестно.",
      "A “while” loop runs its body while the condition holds; an “until” loop runs while the condition is still false, that is up to the moment it becomes true. Both stop on their own: the number of repeats is not known in advance."
    )}</p>` +
    partsList([
      [
        t("условие цикла", "loop condition"),
        t("проверяется ПЕРЕД каждой итерацией, а не после", "checked BEFORE every iteration, not after it"),
      ],
      [
        t("шаг изменения", "update step"),
        t(
          "блок, который приближает условие к остановке («увеличить i на 1»)",
          "the block that moves the condition toward stopping (“change i by 1”)"
        ),
      ],
      [
        t("первичный ввод", "priming read"),
        t(
          "первый вопрос до цикла: условие проверяется сразу, поэтому переменная уже должна быть заполнена",
          "asking once before the loop: the condition is checked right away, so the variable must already hold a value"
        ),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: посчитать до пяти", "Example: counting up to five")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: "let step = 0;\nwhile (step < 5) {\n  console.log(step);\n  step += 1;\n}",
      },
      { label: "Python", code: "step = 0\nwhile step < 5:\n    print(step)\n    step += 1" },
      { label: "Lua", code: "local step = 0\nwhile step < 5 do\n  print(step)\n  step = step + 1\nend" },
      {
        label: "PHP",
        code: "<?php\n$step = 0;\nwhile ($step < 5) {\n  echo $step . PHP_EOL;\n  $step++;\n}",
      },
    ]) +
    keywordsBlock("while_until") +
    mistakesList([
      t(
        "Забыли блок «увеличить на 1»: условие никогда не станет ложным, цикл зациклится навсегда.",
        "Forgetting the “change by 1” block: the condition never becomes false and the loop spins forever."
      ),
      t(
        "Перепутали режимы «пока» и «пока не» — программа не запускается вовсе или работает наоборот.",
        "Mixing up “while” and “until”: the program either never starts or does the opposite."
      ),
      t(
        "Спрашивают число только до цикла и не спрашивают внутри — повторного ввода нет, и «пока не» крутится вечно.",
        "Asking for input before the loop but not inside it — there is no second chance, so “repeat until” never ends."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Циклы» — блок «повторять, пока …» с выпадающим списком режимов «повторять, пока» и «повторять, пока не».",
        "In Blockly: the Loops category — the “repeat while …” block whose dropdown switches between “while” and “until”."
      )
    ),

  list_is_empty: () =>
    `<h4>${t("Пустой список как условие", "An empty list as the condition")}</h4>` +
    `<p>${t(
      "Список можно спросить, пуст ли он. Это удобное условие для цикла, который разбирает содержимое до конца: предметов может быть сколько угодно, и программа сама решает, когда остановиться.",
      "You can ask a list whether it is empty. That is a handy condition for a loop that consumes the content to the end: there may be any number of items, and the program decides when to stop."
    )}</p>` +
    partsList([
      [
        t("пуст", "is empty"),
        t("истина, когда в списке ноль элементов", "true when the list holds zero items"),
      ],
      [
        t("длина", "length"),
        t("то же самое в числах: «длина = 0» означает «пуст»", "the same thing as a number: “length = 0” means empty"),
      ],
      [
        t("взять и удалить", "pop"),
        t(
          "отдаёт элемент наружу и убирает его из списка — список укорачивается",
          "hands an item out and removes it from the list, so the list gets shorter"
        ),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: разобрать список до конца", "Example: emptying a list")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'const tools = ["hammer", "saw"];\nwhile (tools.length > 0) {\n  console.log(tools.shift());\n}',
      },
      {
        label: "Python",
        code: 'tools = ["hammer", "saw"]\nwhile len(tools) > 0:\n    print(tools.pop(0))',
      },
      {
        label: "Lua",
        code: 'local tools = {"hammer", "saw"}\nwhile #tools > 0 do\n  print(table.remove(tools, 1))\nend',
      },
      {
        label: "PHP",
        code: '<?php\n$tools = ["hammer", "saw"];\nwhile (count($tools) > 0) {\n  echo array_shift($tools) . PHP_EOL;\n}',
      },
    ]) +
    keywordsBlock("list_is_empty") +
    mistakesList([
      t(
        "Читают элемент, но не удаляют его: список не меняется, и условие «пуст» не наступает никогда.",
        "Reading an item without removing it: the list never changes, so the “is empty” condition never arrives."
      ),
      t(
        "Сравнивают список с пустым текстом вместо того, чтобы спросить «пуст».",
        "Comparing the list to empty text instead of asking “is it empty”."
      ),
      t(
        "Печатают «длина» внутри цикла и ждут, что это остановит его — печать ничего не меняет.",
        "Printing the “length” inside the loop and expecting that to stop it — printing changes nothing."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Списки» — блок «… пуст» в условие цикла «повторять, пока не»; укорачивает список режим «взять и удалить» блока «в списке … взять …».",
        "In Blockly: the Lists category — the “… is empty” block goes into the “repeat until” condition; the “get and remove” mode of the “in list … get …” block shortens the list."
      )
    ),

  nested_lists: () =>
    `<h4>${t("Список списков: строки и столбцы", "A list of lists: rows and columns")}</h4>` +
    `<p>${t(
      "Если элементом списка является другой список, получается таблица: внешний список хранит строки, внутренний — ячейки внутри строки. Такой записью задают игровые поля, таблицы и расписания.",
      "When an item of a list is itself a list, you get a table: the outer list holds the rows, the inner one the cells inside a row. Boards, spreadsheets and timetables are written this way."
    )}</p>` +
    partsList([
      [
        t("измерение", "dimension"),
        t("сколько номеров нужно, чтобы достать ячейку: у таблицы их два", "how many numbers you need to reach a cell: a table takes two"),
      ],
      [
        t("строка", "row"),
        t("первый номер — элемент внешнего списка", "the first number, an item of the outer list"),
      ],
      [
        t("столбец", "column"),
        t("второй номер — элемент найденной строки", "the second number, an item of the row you just found"),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: ячейка E поля 3×3", "Example: the cell E of a 3×3 board")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'const grid = [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]];\nconsole.log(grid[1][1]); // E',
      },
      {
        label: "Python",
        code: 'grid = [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]]\nprint(grid[1][1])  # E',
      },
      {
        label: "Lua",
        code: 'local grid = {{"A", "B", "C"}, {"D", "E", "F"}, {"G", "H", "I"}}\nprint(grid[2][2]) -- E',
      },
      {
        label: "PHP",
        code: '<?php\n$grid = [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]];\necho $grid[1][1] . PHP_EOL; // E',
      },
    ]) +
    keywordsBlock("nested_lists") +
    mistakesList([
      t(
        "Ищут ячейку одним номером: «grid[4]» даёт целую строку, а не четвёртый символ.",
        "Reaching for a cell with one number: “grid[4]” returns a whole row, not the fourth letter."
      ),
      t(
        "Забыли, что в Blockly номера ячеек начинаются с 1, а в языках — с 0: строка № 2 это [1].",
        "Forgetting that Blockly counts cells from 1 while languages count from 0: row #2 is [1]."
      ),
      t(
        "Перепутали порядок номеров — сначала столбец, потом строка; для поля 3×3 это другие ячейки.",
        "Swapping the numbers — column first, then row — which picks different cells on a 3×3 board."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: вложите блок «создать список из» в ячейку другого такого же блока; для чтения поставьте «в списке … взять № …» внутрь такого же блока.",
        "In Blockly: put a “create list with” block into a cell of another “create list with” block; to read a cell, drop an “in list … get item # …” block inside another one."
      )
    ),

  predicate_functions: () =>
    `<h4>${t("Функция-проверка (предикат)", "A checking function (predicate)")}</h4>` +
    `<p>${t(
      "Функция-проверка возвращает истину или ложь и поэтому становится прямо в условие «если». Её имя обычно читается как вопрос: «большое?», «пустое?», «готово?».",
      "A checking function returns true or false, so it fits right into an “if” condition. Its name usually reads like a question: “is big?”, “is empty?”, “is ready?”"
    )}</p>` +
    partsList([
      [
        t("предикат", "predicate"),
        t("функция, отвечающая «да» или «нет»", "a function that answers yes or no"),
      ],
      [
        t("возврат сравнения", "returning a comparison"),
        t(
          "сравнение само по себе является значением, его не нужно пересчитывать",
          "a comparison is already a value, so there is nothing to recompute"
        ),
      ],
      [
        t("вызов в условии", "call inside a condition"),
        t("«если big(4)» читается как «если число большое»", "“if big(4)” reads as “if the number is big”"),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: большая ли цена?", "Example: is the price big?")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code: 'function big(num) {\n  return num > 3;\n}\nconsole.log(big(4) ? "YES" : "NO"); // YES',
      },
      {
        label: "Python",
        code: 'def big(num):\n    return num > 3\nprint("YES" if big(4) else "NO")  # YES',
      },
      {
        label: "Lua",
        code: 'function big(num)\n  return num > 3\nend\nif big(4) then print("YES") else print("NO") end',
      },
      {
        label: "PHP",
        code: '<?php\nfunction big($num) {\n  return $num > 3;\n}\necho big(4) ? "YES" : "NO";',
      },
    ]) +
    keywordsBlock("predicate_functions") +
    mistakesList([
      t(
        "Функция печатает ДА/НЕТ вместо возврата: значение нельзя вложить в «если».",
        "The function prints YES/NO instead of returning it: a printed line cannot go into an “if”."
      ),
      t(
        "Возвращают текст «YES», а потом сравнивают его с истиной — проверка ломается.",
        "Returning the text “YES” and then comparing it with truth — the check falls apart."
      ),
      t(
        "Вызов функции ставят в ветку «если» вместо её условия.",
        "Placing the function call in the “if” branch instead of in its condition."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Функции» — функция с возвратом, в слот «вернуть» вставьте «сравнить» из «Логика»; блок вызова появится в категории и подойдёт для поля условия.",
        "In Blockly: the Functions category — a function with a return value; put the “compare” block from Logic into its “return” slot. The call block appears in the same category and fits the condition slot."
      )
    ),
  dict: () =>
    `<h4>${t("Словарь: пары «ключ → значение»", "Dictionary: key → value pairs")}</h4>` +
    `<p>${t(
      "Список хранит значения по порядку: первая ячейка, вторая, третья. Словарь хранит значения по именам — ключам. Вместо «взять № 2» вы говорите «взять a», и не следите за порядком: сколько бы букв ни встретилось, частоту буквы «a» всегда ищут по ключу «a».",
      "A list stores values by position: first cell, second, third. A dictionary stores values by name — by key. Instead of “get item #2” you say “get a”, and you stop tracking order: whatever letters appear, the count of the letter “a” is always found under the key “a”."
    )}</p>` +
    partsList([
      [
        t("ключ", "key"),
        t(
          "имя ячейки — текст или число; «a» и 1 это разные ключи",
          "the name of the cell — text or a number; “a” and 1 are different keys"
        ),
      ],
      [
        t("значение", "value"),
        t("то, что храним под ключом: число, текст, список", "what the key holds: a number, text, a list"),
      ],
      [
        t("установить", "set"),
        t(
          "записывает значение по ключу: новая ячейка создаётся, старая заменяется",
          "stores a value under the key: a missing cell is created, an existing one is overwritten"
        ),
      ],
      [
        t("получить", "get"),
        t("читает значение по ключу", "reads the value stored under the key"),
      ],
      [
        t("есть ключ?", "has key?"),
        t("истина, если такая ячейка уже есть", "true when the cell already exists"),
      ],
    ]) +
    `<h4 style="margin-top:12px;">${t("Пример: частоты букв", "Example: letter counts")}</h4>` +
    examplesBlock([
      {
        label: "JavaScript",
        code:
          'const freq = {};\nfreq["a"] = 3;\nfreq["b"] = 4;\n' +
          'console.log(freq["a"]);    // 3\nconsole.log("z" in freq);  // false',
      },
      {
        label: "Python",
        code:
          'freq = {}\nfreq["a"] = 3\nfreq["b"] = 4\n' +
          'print(freq["a"])     # 3\nprint("z" in freq)   # False',
      },
      {
        label: "Lua",
        code:
          'local freq = {}\nfreq["a"] = 3\nfreq["b"] = 4\n' +
          'print(freq["a"])        -- 3\nprint(freq["z"] == nil) -- true',
      },
      {
        label: "PHP",
        code:
          '<?php\n$freq = [];\n$freq["a"] = 3;\n$freq["b"] = 4;\n' +
          'echo $freq["a"] . PHP_EOL;           // 3\n' +
          'var_dump(array_key_exists("z", $freq)); // false',
      },
    ]) +
    keywordsBlock("dict") +
    mistakesList([
      t(
        "«Словарь: установить» подключают прямо к «Словарь: создать пустой» — запись уходит в одноразовый словарь, который тут же исчезает. Словарь сначала кладут в переменную.",
        "Plugging “Dictionary: set” straight into “Dictionary: create empty” — the write goes into a one-shot dictionary that disappears at once. Put the dictionary into a variable first."
      ),
      t(
        "Читают ключ, которого нет: JavaScript даёт пустоту, Python падает с ошибкой. Сначала проверяйте «Словарь: есть ключ?».",
        "Reading a key that is not there: JavaScript hands back nothing, Python raises an error. Check “Dictionary: has key?” first."
      ),
      t(
        "Ждут, что словарь помнит порядок добавления, как список. Он отвечает по имени, а не по позиции.",
        "Expecting a dictionary to remember insertion order like a list. It answers by name, not by position."
      ),
    ]) +
    blocklyNote(
      t(
        "В Blockly: категория «Словари» — «Словарь: создать пустой» вкладывается в «присвоить», а «Словарь: установить …», «Словарь: получить …» и «Словарь: есть ключ?» берут словарь из переменной.",
        "In Blockly: the Dicts category — “Dictionary: create empty” goes into “set … to …”, while “Dictionary: set …”, “Dictionary: get …” and “Dictionary: has key?” take the dictionary from a variable."
      )
    ),
};

/**
 * Все темы справочника в порядке объявления. Тип `Record<GlossaryTopicId, …>`
 * гарантирует полноту, поэтому список выводим из данных, а не дублируем вручную.
 */
export const GLOSSARY_TOPICS = Object.keys(TOPIC_CONTENT) as GlossaryTopicId[];

/**
 * Возвращает HTML-содержимое темы справочника (для тестов и переиспользования).
 */
export function glossaryTopicHtml(topic: GlossaryTopicId): string {
  return TOPIC_CONTENT[topic]();
}

/**
 * Рендерит в контейнер справочные секции тем, привязанных к задаче.
 * Темы берутся из `tasks[taskId].infoTopics`; пустой список скрывает контейнер.
 */
export function mountGlossaryForTask(container: HTMLElement, taskId: TaskId): void {
  const topics = tasks[taskId].infoTopics ?? [];
  container.innerHTML = "";
  container.style.display = topics.length === 0 ? "none" : "";
  for (const topic of topics) {
    const div = document.createElement("div");
    div.className = "console-output-info";
    div.dataset.glossaryTopic = topic;
    div.innerHTML = glossaryTopicHtml(topic);
    container.appendChild(div);
  }
}
