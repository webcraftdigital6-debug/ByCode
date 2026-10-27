// Задачи группы «text»: строки и работа с ними (категория «Текст»).
// Длина и разворот, символ по номеру, подстрока, регистр и пробелы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { typedCodeMode } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

const WORD = "Blockly";
const WORD_LEN = WORD.length; // 7
const WORD_REV = "ylkcolB";

const SEARCH_WORD = "banana";
const PHONE_WORD = "Mississippi";
const PHONE_DIGITS = "M1ss1ss1pp1";
const PHONE_SH = "Mishishippi";

function blockTypes(ws: Blockly.WorkspaceSvg): string[] {
  try {
    return getNonShadowBlocks(ws).map((b) => (b as any).type);
  } catch {
    return [];
  }
}

function countOf(types: string[], type: string): number {
  return types.filter((t) => t === type).length;
}

async function validateStrLength(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const outputOk = lines.includes(String(WORD_LEN)) && lines.includes(WORD_REV);
  // Программу, набранную в редакторе кода, проверяем по выводу: блоков на поле нет.
  const ok = outputOk && (typedCodeMode(ws) || countOf(types, "text_length") >= 1);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (countOf(types, "text_reverse") >= 1 && count <= 5)
      stars = 3; // 2 × (печать + блок строки)
    else if (count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrCharAt(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const charAt = countOf(types, "text_charAt");
  const outputOk = lines.includes("B") && lines.includes("y") && lines.includes("o");
  const ok = outputOk && (typedCodeMode(ws) || charAt >= 1);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (charAt >= 3 && count <= 7)
      stars = 3; // по одному блоку на символ
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrEcho(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines.map((l) => l.trim()).filter(Boolean);
  const types = blockTypes(ws);
  const appends = countOf(types, "text_append");
  const outputOk = lines.includes("R") && lines.includes("ROAR!ROAR!ROAR!");
  const structureOk =
    appends >= 1 &&
    countOf(types, "controls_repeat_ext") >= 1 &&
    countOf(types, "text_charAt") >= 1;
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 17)
      stars = 3; // два стартера + цикл с дописыванием + две печати
    else if (count <= 22) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrSubstring(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const slices = countOf(types, "text_getSubstring");
  const outputOk = lines.includes("Blo") && lines.includes("kly") && lines.includes("lockl");
  const ok = outputOk && (typedCodeMode(ws) || slices >= 1);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (slices >= 3 && count <= 7) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrClean(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const outputOk = lines.includes("PRIVET!");
  const structureOk = countOf(types, "text_trim") >= 1 && countOf(types, "text_changeCase") >= 1;
  const ok = outputOk && (typedCodeMode(ws) || structureOk);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (countOf(types, "text_append") >= 1 && count <= 7)
      stars = 3; // переменная + append + печать с trim и регистром
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrIndexOf(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const found = countOf(types, "text_indexOf");
  const outputOk = lines.includes("2") && lines.includes("6") && lines.includes("0");
  const ok = outputOk && (typedCodeMode(ws) || found >= 1);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (found >= 3 && count <= 7)
      stars = 3; // по одному поиску на строку
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrCount(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const counted = countOf(types, "text_count");
  const outputOk = lines.includes("3") && lines.includes("2") && lines.includes("0");
  const ok = outputOk && (typedCodeMode(ws) || counted >= 1);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (counted >= 3 && count <= 7) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateStrReplace(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;
  const types = blockTypes(ws);
  const replaced = countOf(types, "text_replace");
  const outputOk =
    lines.includes(PHONE_DIGITS) && lines.includes(PHONE_SH) && lines.includes(PHONE_WORD);
  const ok = outputOk && (typedCodeMode(ws) || replaced >= 2);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (replaced >= 3 && count <= 10)
      stars = 3; // третья замена — вложенная, обратно в ss
    else if (count <= 14) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const textTasks: Pick<
  TaskRegistry,
  | "str_length"
  | "str_charat"
  | "str_echo"
  | "str_substring"
  | "str_clean"
  | "str_indexof"
  | "str_count"
  | "str_replace"
> = {
  str_length: {
    id: "str_length",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 48: Сколько букв?" : "Task 48: How Many Letters?"),
    description: (lang) =>
      lang === "ru"
        ? `Строка — это последовательность символов, и компьютер умеет с ней работать как со списком. Возьмите слово <strong>«${WORD}»</strong> и напечатайте в окне вывода две строки:<br><br>1) <strong>сколько в нём символов</strong> — блок «длина текста» из категории «Текст»;<br>2) <strong>это же слово задом наперёд</strong> — блок «развернуть» из той же категории.<br><br>Символом считается всё: буквы, цифры и пробелы. <br><br>★★★ — оба действия сделаны блоками, лишних блоков нет.`
        : `A string is a sequence of characters, and a program can work with it like with a list. Take the word <strong>“${WORD}”</strong> and print two lines:<br><br>1) <strong>how many characters it has</strong> — the “length of text” block from the Text category;<br>2) <strong>the same word backwards</strong> — the “reverse” block from the same category.<br><br>Every character counts: letters, digits and spaces.<br><br>★★★ — both done with blocks, no extra blocks.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Текст» возьмите блок «длина текста» и вложите в него текст «${WORD}» (серое поле-подсказка).\n2. Положите этот блок в «Вывести … цвет …».\n3. Запустите код («▶»): должно появиться число ${WORD_LEN}. Если цифра другая — вы взяли не то слово.\n4. Возьмите «развернуть», вложите в него тот же текст «${WORD}» и тоже поместите в «Вывести … цвет …».\n5. Нажмите «Проверить решение».`
        : `Step by step:\n1. In the Text category take “length of text” and put the text “${WORD}” into it (the grey shadow field).\n2. Drop that block into “Print … color …”.\n3. Run the code (“▶”): you should see ${WORD_LEN}. A different number means a different word.\n4. Take “reverse”, put the same “${WORD}” text into it and wrap it in “Print … color …” too.\n5. Press “Check solution”.`,
    infoTopics: ["string_length"],
    validate: validateStrLength,
  },
  str_charat: {
    id: "str_charat",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 49: Буквы по номеру" : "Task 49: Letters by Position",
    description: (lang) =>
      lang === "ru"
        ? `Возьмите слово <strong>«${WORD}»</strong> и напечатайте тремя отдельными строками:<br><br>1) <strong>первую</strong> букву;<br>2) <strong>последнюю</strong> букву;<br>3) букву под номером <strong>3</strong> (считаем от начала слова).<br><br>Используйте блок <strong>«в тексте получить …»</strong> из категории «Текст» — в его выпадающем списке есть режимы «первый», «последний», «с начала» и «с конца».<br><br><strong>Осторожно с нумерацией:</strong> режим «с начала» отсчитывает буквы с 1, а языки программирования — с 0. Об этом — раздел «Символ по номеру» под заданием.<br><br>★★★ — все три буквы получены блоком «в тексте получить …».`
        : `Take the word <strong>“${WORD}”</strong> and print three separate lines:<br><br>1) the <strong>first</strong> letter;<br>2) the <strong>last</strong> letter;<br>3) the letter at position <strong>3</strong> counting from the start.<br><br>Use the <strong>“in text get …”</strong> block from the Text category — its dropdown has first, last, from start and from end modes.<br><br><strong>Mind the numbering:</strong> the “from start” mode counts letters from 1, while programming languages count from 0. See the “Character by position” note below.<br><br>★★★ — all three letters come from the “in text get …” block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Текст» возьмите «в тексте получить …», в поле текста — «${WORD}».\n2. В выпадающем списке выберите «первый» — это заглавная B. Вложите блок в «Вывести … цвет …».\n3. Скопируйте блок дважды. Во втором выберите «последний» (получится y), в третьем — «с начала» и поставьте число 3 (получится o).\n4. Запустите: в выводе три строки B, y, o.\n5. Нажмите «Проверить решение».`
        : `Step by step:\n1. In the Text category take “in text get …” and put “${WORD}” into its text field.\n2. Choose “first” in the dropdown — that is the capital B. Drop the block into “Print … color …”.\n3. Copy the block twice. In the second one choose “last” (you get y); in the third choose “from start” with the number 3 (you get o).\n4. Run: the output shows B, y and o on three lines.\n5. Press “Check solution”.`,
    infoTopics: ["string_indexing"],
    validate: validateStrCharAt,
  },
  str_echo: {
    id: "str_echo",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 50: Эхо в подземелье" : "Task 50: Echo in the Dungeon",
    description: (lang) =>
      lang === "ru"
        ? `Эхо в пещере повторяет боевой клич несколько раз — соберите его из кусочков.<br><br>1) Создайте переменную <strong>cry</strong> со значением <code>ROAR</code> и переменную <strong>echo</strong> с <strong>пустым текстом</strong> (блок «текст», в котором ничего не написано).<br>2) Возьмите <strong>«повторить … раз»</strong> (Циклы) с числом <strong>3</strong> и положите внутрь <strong>«к переменной echo добавить текст …»</strong> (Текст). В поле текста вложите «создать текст из» двух частей: переменная cry и <code>!</code>.<br>3) Напечатайте <strong>первую букву</strong> крика (режим «первый» блока «в тексте получить …») → <strong>R</strong>.<br>4) Напечатайте echo → <strong>ROAR!ROAR!ROAR!</strong>.<br><br><strong>Почему старт пустой:</strong> строку нельзя изменить по букве, но можно собрать новую, дописывая кусочек за кусочком. Накопитель всегда начинают с пустого значения, иначе к эху приклеится прошлый остаток.<br><br>★★★ — эхо собрано дописыванием внутри цикла, а не тремя отдельными блоками «Вывести … цвет …».`
        : `An echo in a cave repeats the battle cry several times — build it piece by piece.<br><br>1) Create the variable <strong>cry</strong> holding <code>ROAR</code> and the variable <strong>echo</strong> holding <strong>empty text</strong> (a “text” block with nothing typed in it).<br>2) Take <strong>“repeat … times”</strong> (Loops) with <strong>3</strong> and put <strong>“append text to variable echo …”</strong> (Text) inside it. Into its text slot drop a “create text with” block of two parts: the cry variable and <code>!</code>.<br>3) Print the <strong>first letter</strong> of the cry (the “first” mode of the “in text get …” block) → <strong>R</strong>.<br>4) Print echo → <strong>ROAR!ROAR!ROAR!</strong>.<br><br><strong>Why start empty:</strong> a string cannot be edited letter by letter, but you can build a new one by gluing piece after piece. An accumulator always starts from an empty value, otherwise the echo picks up old leftovers.<br><br>★★★ — the echo is built by appending inside a loop, not with three separate “Print … color …” blocks.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную cry и присвойте ей текст ROAR.\n2. Создайте переменную echo и присвойте ей пустой текст: блок «текст» из категории «Текст», в котором ничего не написано.\n3. Из «Циклы» возьмите «повторить … раз» и впишите 3.\n4. Внутрь цикла положите «к переменной echo добавить текст …» и выберите в его поле переменную echo.\n5. В поле текста вложите «создать текст из» (Текст) с двумя частями: переменная cry и текст !. За один шаг к echo приклеивается ROAR!.\n6. После цикла напечатайте «в тексте получить …» с текстом cry и режимом «первый» → R.\n7. Следом напечатайте переменную echo → ROAR!ROAR!ROAR!.\n8. Сверьте вывод и нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable cry and set it to the text ROAR.\n2. Create the variable echo and set it to empty text: a “text” block from the Text category with nothing typed inside.\n3. From Loops take “repeat … times” and type 3.\n4. Inside the loop place “append text to variable …” and pick the echo variable in its field.\n5. Into the text slot drop a “create text with” block (Text) with two parts: the cry variable and the text !. One step glues ROAR! onto echo.\n6. After the loop print “in text get …” with the text cry in “first” mode → R.\n7. Then print the echo variable → ROAR!ROAR!ROAR!.\n8. Check the output and press “Check solution”.`,
    infoTopics: ["string_accumulate"],
    validate: validateStrEcho,
  },
  str_substring: {
    id: "str_substring",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 51: Кусочки строки" : "Task 51: Pieces of a String"),
    description: (lang) =>
      lang === "ru"
        ? `От слова <strong>«${WORD}»</strong> осталось три кусочка — напечатайте их по строке каждый:<br><br>1) <strong>первые 3 буквы</strong> — Blo;<br>2) <strong>последние 3 буквы</strong> — kly;<br>3) <strong>слово без первой и последней буквы</strong> — lockl.<br><br>Для этого есть блок <strong>«в тексте получить подстроку с … по …»</strong> (категория «Текст»): у него задают начало и конец кусочка, каждый — своим способом (первый, с начала, с конца, последний).<br><br>Такой приём называют <strong>срез (slice)</strong>, и в разных языках он считает границы по-разному — смотрите раздел «Подстрока и срез» под заданием.<br><br>★★★ — все три кусочка вырезаны блоком подстроки.`
        : `Three pieces are left of the word <strong>“${WORD}”</strong> — print each on its own line:<br><br>1) the <strong>first 3 letters</strong> — Blo;<br>2) the <strong>last 3 letters</strong> — kly;<br>3) the <strong>word without its first and last letter</strong> — lockl.<br><br>Use the <strong>“in text get substring from … to …”</strong> block (Text category): you set a start and an end, each with its own mode (first, from start, from end, last).<br><br>This trick is called <strong>slicing</strong>, and languages treat the bounds differently — see the “Substring and slicing” note below.<br><br>★★★ — all three pieces come from the substring block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Возьмите «в тексте получить подстроку …», в поле текста — «${WORD}».\n2. Первый кусочек: начало — «первый», конец — «с начала» с числом 3. Получится Blo.\n3. Второй: начало — «с конца» с числом 3, конец — «последний». Получится kly.\n4. Третий: начало — «с начала» 2, конец — «с конца» 2. Получится lockl.\n5. Каждый блок подстроки вложите в свой «Вывести … цвет …», запустите и сравните три строки вывода.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. Take “in text get substring …” and put “${WORD}” into its text field.\n2. First piece: start “first”, end “from start” with the number 3 → Blo.\n3. Second: start “from end” with 3, end “last” → kly.\n4. Third: start “from start” 2, end “from end” 2 → lockl.\n5. Put each substring block into its own “Print … color …”, run and compare the three lines.\n6. Press “Check solution”.`,
    infoTopics: ["string_slice"],
    validate: validateStrSubstring,
  },
  str_clean: {
    id: "str_clean",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 52: Приводим текст в порядок" : "Task 52: Cleaning Up Text",
    description: (lang) =>
      lang === "ru"
        ? `Данные часто приходят «грязными»: лишние пробелы по краям, разный регистр. Соберите фразу и очистите её.<br><br>1. Создайте переменную <strong>phrase</strong> и присвойте ей текст из <strong>двух пробелов</strong> и букв <strong>«pri»</strong> (то есть «&nbsp;&nbsp;pri»).<br>2. Блоком <strong>«добавить к переменной текст»</strong> допишите к ней <strong>«vet!»</strong>.<br>3. Напечатайте значение phrase, предварительно <strong>убрав пробелы по краям</strong> («убрать пробелы») и <strong>подняв регистр</strong> («изменить регистр» → В ВЕРХНИЙ РЕГИСТР).<br><br>В окне вывода должна получиться ровно одна строка: <strong>PRIVET!</strong><br><br>★★★ — использованы и дописывание, и очистка, и смена регистра.`
        : `Real data often arrives dirty: extra spaces at the edges, mixed case. Build the phrase and clean it up.<br><br>1. Create a variable <strong>phrase</strong> and set it to a text made of <strong>two spaces</strong> and the letters <strong>“pri”</strong> (i.e. “&nbsp;&nbsp;pri”).<br>2. Using the <strong>“add text to variable”</strong> block, append <strong>“vet!”</strong> to it.<br>3. Print phrase after <strong>trimming the spaces</strong> (“trim spaces from”) and <strong>raising the case</strong> (“change case” → UPPERCASE).<br><br>The output must contain exactly one line: <strong>PRIVET!</strong><br><br>★★★ — appending, trimming and changing case are all used.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Создайте переменную phrase (категория «Переменные») и блок «присвоить …»; в поле значения — текст «  pri»: начните его с двух пробелов.\n2. Из категории «Текст» возьмите «добавить к переменной … текст» и допишите «vet!» — теперь в phrase лежит «  privet!».\n3. Возьмите «убрать пробелы» (режим «с обоих концов») и вложите в него переменную phrase: пробелы по краям исчезнут, внутри строка не меняется.\n4. Сверху положите «изменить регистр» с режимом «в верхний» — получится PRIVET!.\n5. Вложите всё в «Вывести … цвет …», запустите и проверьте: одна строка PRIVET!.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. Create the variable phrase (Variables category) and a “set … to” block; its value is the text “  pri” — start it with two spaces.\n2. From the Text category take “add text to variable” and append “vet!” — phrase now holds “  privet!”.\n3. Take “trim spaces from … to …” (mode: both) and put the variable into it: the edge spaces disappear, the inside stays untouched.\n4. Wrap that in “change case” set to UPPERCASE — you get PRIVET!.\n5. Put it all into “Print … color …”, run and check: a single line PRIVET!.\n6. Press “Check solution”.`,
    infoTopics: ["string_case_trim"],
    validate: validateStrClean,
  },
  str_indexof: {
    id: "str_indexof",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 53: Где буква?" : "Task 53: Where Is the Letter?"),
    description: (lang) =>
      lang === "ru"
        ? `Слово <strong>«${SEARCH_WORD}»</strong> — найдите в нём букву и напечатайте три строки:<br><br>1) номер <strong>первой</strong> буквы «a» — получится <strong>2</strong>;<br>2) номер <strong>последней</strong> буквы «a» — получится <strong>6</strong>;<br>3) номер буквы <strong>«z»</strong>, которой в слове нет — получится <strong>0</strong>.<br><br>Используйте блок <strong>«в тексте … найти первое вхождение текста»</strong> (категория «Текст»): в его выпадающем списке режимы «первое» и «последнее».<br><br><strong>Два важных факта о позициях:</strong> Blockly считает с единицы (первая буква — это 1), а языки программирования — с нуля; и «не найдено» Blockly показывает нулём. Подробности — в разделе «Поиск в строке» под заданием.<br><br>★★★ — все три позиции найдены блоком поиска.`
        : `Take the word <strong>“${SEARCH_WORD}”</strong> and print three lines:<br><br>1) the position of the <strong>first</strong> letter “a” — that is <strong>2</strong>;<br>2) the position of the <strong>last</strong> letter “a” — that is <strong>6</strong>;<br>3) the position of the letter <strong>“z”</strong>, which the word does not have — that is <strong>0</strong>.<br><br>Use the <strong>“in text … find first occurrence of text …”</strong> block (Text category): its dropdown switches between “first” and “last”.<br><br><strong>Two facts about positions:</strong> Blockly counts from one (the first letter is 1) while programming languages count from zero; and “not found” is reported as 0. See the “Searching a string” note below.<br><br>★★★ — all three positions come from the search block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Текст» возьмите блок «в тексте … найти первое вхождение текста»: в первое поле впишите «${SEARCH_WORD}».\n2. Во второе поле (после слов «найти первое вхождение текста») — букву «a». Блок стал числом: вложите его в «Вывести … цвет …».\n3. Запустите: в выводе должно быть 2. Это номер первой «a» (b-a-n-a-n-a, считаем с 1).\n4. Скопируйте блок дважды: во втором переключите выпадающий список на «последнее» (получится 6), в третьем оставьте «первое», но ищите букву «z» (получится 0 — буквы нет).\n5. Проверьте три строки вывода: 2, 6, 0.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. In the Text category take “in text … find first occurrence of text …” and put “${SEARCH_WORD}” into its first field.\n2. Put the letter “a” into the second field. The block is now a number: drop it into “Print … color …”.\n3. Run: the output should show 2, the position of the first “a” (b-a-n-a-n-a, counted from 1).\n4. Copy the block twice: in the second one switch the dropdown to “last” (you get 6); in the third keep “first” but search for “z” (you get 0 — the letter is absent).\n5. Check the three lines: 2, 6, 0.\n6. Press “Check solution”.`,
    infoTopics: ["string_search"],
    validate: validateStrIndexOf,
  },
  str_count: {
    id: "str_count",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 54: Сколько раз?" : "Task 54: How Many Times?"),
    description: (lang) =>
      lang === "ru"
        ? `Тот же вопрос, но про количество. В слове <strong>«${SEARCH_WORD}»</strong> напечатайте три строки:<br><br>1) сколько раз встречается буква <strong>«a»</strong> — ответ <strong>3</strong>;<br>2) сколько раз встречается пара букв <strong>«na»</strong> — ответ <strong>2</strong>;<br>3) сколько раз встречается буква <strong>«x»</strong> — ответ <strong>0</strong>.<br><br>Для этого есть блок <strong>«подсчитать количество … в …»</strong> (категория «Текст»).<br><br><strong>Почему «na» даёт 2, а не 3?</strong> Совпадения не перекрываются: найдя пару, компьютер сдвигается за неё целиком и с начала тот же кусок не считает. Об этом — раздел «Поиск в строке» под заданием.<br><br>★★★ — все три подсчёта сделаны блоком количества.`
        : `Same word, but about quantity. In <strong>“${SEARCH_WORD}”</strong> print three lines:<br><br>1) how many times the letter <strong>“a”</strong> occurs — the answer is <strong>3</strong>;<br>2) how many times the pair <strong>“na”</strong> occurs — the answer is <strong>2</strong>;<br>3) how many times the letter <strong>“x”</strong> occurs — the answer is <strong>0</strong>.<br><br>Use the <strong>“count … in …”</strong> block (Text category).<br><br><strong>Why does “na” give 2 rather than 3?</strong> Matches do not overlap: after finding a pair the computer jumps past it and does not count the same piece twice. See the “Searching a string” note below.<br><br>★★★ — all three counts come from the count block.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. В категории «Текст» возьмите «подсчитать количество … в …».\n2. В первое поле — букву «a», во второе — слово «${SEARCH_WORD}». Вложите результат в «Вывести … цвет …».\n3. Запустите: должно получиться 3 (буква a стоит на позициях 2, 4 и 6).\n4. Скопируйте блок дважды: во втором ищите «na» (получится 2), в третьем — «x» (получится 0).\n5. Сравните вывод с эталоном: 3, 2, 0.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. In the Text category take “count … in …”.\n2. Put the letter “a” into the first field and “${SEARCH_WORD}” into the second, then wrap the result in “Print … color …”.\n3. Run: you should get 3 (the letter a sits at positions 2, 4 and 6).\n4. Copy the block twice: in the second one search for “na” (you get 2), in the third for “x” (you get 0).\n5. Compare the output with the target: 3, 2, 0.\n6. Press “Check solution”.`,
    infoTopics: ["string_search"],
    validate: validateStrCount,
  },
  str_replace: {
    id: "str_replace",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 55: Замена текста" : "Task 55: Replacing Text"),
    description: (lang) =>
      lang === "ru"
        ? `Замена создаёт новую строку, в которой один кусок заменён другим. Возьмите слово <strong>«${PHONE_WORD}»</strong> и напечатайте три строки:<br><br>1) все буквы <strong>«i»</strong> заменить на цифру <strong>«1»</strong> → <strong>${PHONE_DIGITS}</strong>;<br>2) в исходном слове все <strong>«ss»</strong> заменить на <strong>«sh»</strong> → <strong>${PHONE_SH}</strong>;<br>3) в результате пункта 2 заменить <strong>«sh»</strong> обратно на <strong>«ss»</strong> → снова <strong>${PHONE_WORD}</strong>.<br><br>Используйте блок <strong>«заменить … на … в …»</strong> (категория «Текст»). Это блок-выражение, поэтому третью строку собирают вложением: один блок замены кладут внутрь другого, как матрёшку.<br><br><strong>Обратите внимание:</strong> блок меняет сразу ВСЕ вхождения, а строка при этом не меняется — появляется новая.<br><br>★★★ — все три строки получены блоками замены, а третья замена действительно вложена в вторую.`
        : `Replacement builds a new string where one piece is swapped for another. Take <strong>“${PHONE_WORD}”</strong> and print three lines:<br><br>1) replace every <strong>“i”</strong> with the digit <strong>“1”</strong> → <strong>${PHONE_DIGITS}</strong>;<br>2) in the original word replace every <strong>“ss”</strong> with <strong>“sh”</strong> → <strong>${PHONE_SH}</strong>;<br>3) in the result of step 2 replace <strong>“sh”</strong> back to <strong>“ss”</strong> → <strong>${PHONE_WORD}</strong> again.<br><br>Use the <strong>“replace … with … in …”</strong> block (Text category). It is a value block, so the third line is built by nesting: one replace block goes inside another, like a matryoshka.<br><br><strong>Note:</strong> the block changes ALL occurrences at once, and the original string stays untouched — a new one appears.<br><br>★★★ — all three lines come from replace blocks and the third one is genuinely nested.`,
    hint: (lang) =>
      lang === "ru"
        ? `Пошаговое решение:\n1. Возьмите «заменить … на … в …»: в первое поле — «i», во второе — «1», в третье — «${PHONE_WORD}».\n2. Вложите блок в «Вывести … цвет …» и запустите: получится ${PHONE_DIGITS}.\n3. Второй блок: «ss» → «sh», в третье поле снова «${PHONE_WORD}» — получится ${PHONE_SH}.\n4. Третий блок: «sh» → «ss», а в его третье поле вложите ВТОРОЙ блок замены (тот, что даёт ${PHONE_SH}). Тогда третья строка вернёт ${PHONE_WORD}.\n5. Проверьте вывод: три строки ${PHONE_DIGITS}, ${PHONE_SH}, ${PHONE_WORD}.\n6. Нажмите «Проверить решение».`
        : `Step by step:\n1. Take “replace … with … in …”: put “i” in the first field, “1” in the second and “${PHONE_WORD}” in the third.\n2. Wrap that block in “Print … color …” and run: you get ${PHONE_DIGITS}.\n3. Second block: “ss” → “sh”, with “${PHONE_WORD}” in the third field again — you get ${PHONE_SH}.\n4. Third block: “sh” → “ss”, and into its third field put the SECOND replace block (the one producing ${PHONE_SH}). The third line then returns ${PHONE_WORD}.\n5. Check the output: three lines ${PHONE_DIGITS}, ${PHONE_SH}, ${PHONE_WORD}.\n6. Press “Check solution”.`,
    infoTopics: ["string_replace"],
    validate: validateStrReplace,
  },
};
