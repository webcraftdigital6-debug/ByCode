/**
 * Утилиты локализации приложения: локаль Blockly + тексты UI + имена категорий тулбокса
 */
import * as BlocklyCore from "blockly/core";
import * as EnLocale from "blockly/msg/en";
import * as RuLocale from "blockly/msg/ru";
import { toolbox as originalToolbox } from "./toolbox";
import { getCustomBlocksToolboxCategory } from "./customBlocks";
import * as stringsEn from "./strings/en";
import * as stringsRu from "./strings/ru";

export type AppLang = "ru" | "en";
export const APP_LANG_KEY = "app_language";

let currentAppLang: AppLang = "ru";

export function getAppLang(): AppLang {
  return currentAppLang;
}

function updateHeaderText(lang: AppLang): void {
  const subtitle = document.querySelector(".header-subtitle");
  const ruLabel = document.getElementById("lang-ru");
  const enLabel = document.getElementById("lang-en");
  if (subtitle) {
    (subtitle as HTMLElement).textContent =
      lang === "ru"
        ? "Создавайте программы с помощью блоков"
        : "Create programs using blocks";
  }
  if (ruLabel && enLabel) {
    ruLabel.className = lang === "ru" ? "lang-label active" : "lang-label";
    enLabel.className = lang === "en" ? "lang-label active" : "lang-label";
  }
}

export function setAppLang(lang: AppLang): void {
  currentAppLang = lang;
  BlocklyCore.setLocale(lang === "ru" ? (RuLocale as any) : (EnLocale as any));
  if (lang === "ru") {
    (BlocklyCore as any).Msg.ADD_TEXT_COLOR = "Вывести %1 цвет %2";
    (BlocklyCore as any).Msg.ANGLE_DEMO = "Установить угол %1 градусов";
    (BlocklyCore as any).Msg.ANGLE_VALUE = "Угол %1 градусов";
    (BlocklyCore as any).Msg.DEGREES = "градусов";
    (BlocklyCore as any).Msg.BITMAP_DEMO = "Битмап: %1";
    (BlocklyCore as any).Msg.DATE_VALUE = "Дата: %1";
    (BlocklyCore as any).Msg.DATE_VALUE_TOOLTIP = "Поле выбора даты";
    (BlocklyCore as any).Msg.SLIDER_VALUE = "Слайдер: %1";
    (BlocklyCore as any).Msg.SLIDER_VALUE_TOOLTIP = "Поле числового слайдера";
    (BlocklyCore as any).Msg.HSV_VALUE = "HSV цвет: %1";
    (BlocklyCore as any).Msg.HSV_VALUE_TOOLTIP = "Поле выбора цвета HSV";
    (BlocklyCore as any).Msg.PY_INPUT = "Ввод текста";
    (BlocklyCore as any).Msg.PY_INPUT_NUMBER = "Ввод числа";
    (BlocklyCore as any).Msg.DICT_CREATE = "Словарь: создать пустой";
    (BlocklyCore as any).Msg.DICT_CREATE_TOOLTIP =
      "Создаёт пустой словарь (набор пар «ключ → значение»)";
    (BlocklyCore as any).Msg.DICT_SET = "Словарь: установить %1[%2] = %3";
    (BlocklyCore as any).Msg.DICT_SET_TOOLTIP =
      "Записать значение по ключу в словарь";
    (BlocklyCore as any).Msg.DICT_GET = "Словарь: получить %1[%2]";
    (BlocklyCore as any).Msg.DICT_GET_TOOLTIP = "Получить значение по ключу";
    (BlocklyCore as any).Msg.DICT_HAS_KEY = "Словарь: есть ключ? %1 в %2";
    (BlocklyCore as any).Msg.DICT_HAS_KEY_TOOLTIP =
      "Проверить наличие ключа в словаре";
    (BlocklyCore as any).Msg.DICT_NEED_VARIABLE =
      "Нет словаря: подключите переменную, в которой он лежит";
    (BlocklyCore as any).Msg.DICT_STORE_IN_VARIABLE =
      "Положите словарь в переменную: запись в «создать пустой» пропадает";
    // Локализация плагина поиска по тулбоксу
    (BlocklyCore as any).Msg.SEARCH_PLACEHOLDER = "Поиск блоков";
    (BlocklyCore as any).Msg.SEARCH_TYPE_TO_SEARCH =
      "Введите текст для поиска блоков";
    (BlocklyCore as any).Msg.SEARCH_NO_MATCHING = "Блоки не найдены";
  } else {
    (BlocklyCore as any).Msg.ADD_TEXT_COLOR = "Print %1 color %2";
    (BlocklyCore as any).Msg.ANGLE_DEMO = "Set angle to %1 degrees";
    (BlocklyCore as any).Msg.ANGLE_VALUE = "Angle %1 degrees";
    (BlocklyCore as any).Msg.DEGREES = "degrees";
    (BlocklyCore as any).Msg.BITMAP_DEMO = "Bitmap: %1";
    (BlocklyCore as any).Msg.DATE_VALUE = "Date: %1";
    (BlocklyCore as any).Msg.DATE_VALUE_TOOLTIP = "Date picker field";
    (BlocklyCore as any).Msg.SLIDER_VALUE = "Slider: %1";
    (BlocklyCore as any).Msg.SLIDER_VALUE_TOOLTIP = "Numeric slider field";
    (BlocklyCore as any).Msg.HSV_VALUE = "HSV color: %1";
    (BlocklyCore as any).Msg.HSV_VALUE_TOOLTIP = "HSV color picker field";
    (BlocklyCore as any).Msg.PY_INPUT = "Text input";
    (BlocklyCore as any).Msg.PY_INPUT_NUMBER = "Number input";
    (BlocklyCore as any).Msg.DICT_CREATE = "Dictionary: create empty";
    (BlocklyCore as any).Msg.DICT_CREATE_TOOLTIP =
      "Creates an empty dictionary (a set of key → value pairs)";
    (BlocklyCore as any).Msg.DICT_SET = "Dictionary: set %1[%2] = %3";
    (BlocklyCore as any).Msg.DICT_SET_TOOLTIP =
      "Store a value in the dictionary under a key";
    (BlocklyCore as any).Msg.DICT_GET = "Dictionary: get %1[%2]";
    (BlocklyCore as any).Msg.DICT_GET_TOOLTIP = "Read the value stored under a key";
    (BlocklyCore as any).Msg.DICT_HAS_KEY = "Dictionary: has key? %1 in %2";
    (BlocklyCore as any).Msg.DICT_HAS_KEY_TOOLTIP =
      "Check whether the key exists in the dictionary";
    (BlocklyCore as any).Msg.DICT_NEED_VARIABLE =
      "No dictionary: connect the variable that holds it";
    (BlocklyCore as any).Msg.DICT_STORE_IN_VARIABLE =
      "Put the dictionary in a variable first: writing into “create empty” is lost";
    // Локализация плагина поиска по тулбоксу
    (BlocklyCore as any).Msg.SEARCH_PLACEHOLDER = "Search blocks";
    (BlocklyCore as any).Msg.SEARCH_TYPE_TO_SEARCH =
      "Type to search for blocks";
    (BlocklyCore as any).Msg.SEARCH_NO_MATCHING = "No matching blocks found";
  }
  updateHeaderText(lang);
}

export function localizedToolbox(
  lang: AppLang,
): BlocklyCore.utils.toolbox.ToolboxInfo {
  const t = lang === "ru" ? stringsRu.toolbox : stringsEn.toolbox;
  const tb = JSON.parse(
    JSON.stringify(originalToolbox),
  ) as BlocklyCore.utils.toolbox.ToolboxInfo;
  for (const item of tb.contents) {
    if (item.kind === "category") {
      const cat = item as BlocklyCore.utils.toolbox.StaticCategoryInfo;
      if (t[cat.name as keyof typeof t]) {
        cat.name = t[cat.name as keyof typeof t];
      }
    }
    // Локализуем имя категории поиска (кастомный элемент тулбокса)
    if ((item as any).kind === "search") {
      (item as any).name = t.Search;
    }
  }
  const customCat = getCustomBlocksToolboxCategory();
  if (customCat) {
    customCat.name = t.MyBlocks;
    tb.contents.push({ kind: "sep" });
    tb.contents.push(customCat);
  }
  return tb;
}

export function localizeImportUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.importUi : stringsEn.importUi;

  const importBtnText = document.getElementById("importBtnText");
  const modalTitle = document.getElementById("modalTitle");
  const jsonLabel = document.getElementById("jsonLabel");
  const generatorLabel = document.getElementById("generatorLabel");
  const importInfo = document.getElementById("importInfo");
  const presetsLabelEl = document.getElementById("presetsLabel");
  const presetNoticeEl = document.getElementById("presetNotice");
  const presetLetBtn = document.getElementById(
    "presetLet",
  ) as HTMLButtonElement | null;
  const presetConstBtn = document.getElementById(
    "presetConst",
  ) as HTMLButtonElement | null;
  const presetReturnBtn = document.getElementById(
    "presetReturn",
  ) as HTMLButtonElement | null;
  const blockJsonTextarea = document.getElementById(
    "blockJson",
  ) as HTMLTextAreaElement | null;

  if (importBtnText) importBtnText.textContent = t.ImportBlocks;
  if (modalTitle) modalTitle.textContent = t.ImportModalTitle;
  if (jsonLabel) jsonLabel.textContent = t.JsonLabel;
  if (generatorLabel) generatorLabel.textContent = t.GeneratorLabel;
  if (importInfo) importInfo.textContent = t.ImportInfo;
  if (blockJsonTextarea) blockJsonTextarea.placeholder = t.JsonPlaceholder;
  if (presetsLabelEl) presetsLabelEl.textContent = t.PresetsLabel;
  if (presetNoticeEl) presetNoticeEl.textContent = t.PresetNotice;
  if (presetLetBtn) presetLetBtn.textContent = t.PresetLet;
  if (presetConstBtn) presetConstBtn.textContent = t.PresetConst;
  if (presetReturnBtn) presetReturnBtn.textContent = t.PresetReturn;

  const cancelBtn = document.getElementById("cancelImport");
  const confirmBtn = document.getElementById("confirmImport");
  if (cancelBtn) (cancelBtn as HTMLButtonElement).textContent = t.Cancel;
  if (confirmBtn) (confirmBtn as HTMLButtonElement).textContent = t.Import;

  // Сохраняем набор строк, чтобы использовать в других модулях
  (window as any)._currentLocalizedStrings = t as any;
  // Дополняем строками для задач/проверки
  const taskStrings =
    lang === "ru"
      ? {
          TaskPerfect: "Отлично! Решение оптимально.",
          TaskPassed: "Решение верное.",
          NextTask: "Следующая задача",
          PrevTask: "Предыдущая задача",
          TaskSolutions: "Решение задач",
          CheckSolution: "Проверить решение",
          TaskHintLabel: "Подсказка",
          StarsCriteria: "Критерии звёзд:",
          StarsOptimal: "оптимально (минимум блоков)",
          StarsGood: "хорошо",
          StarsCorrect: "решение верное",
          ConsoleOutputHeader: "Вывод в консоль:",
          ConsoleOutputDescription:
            "Для вывода информации в консоль используйте следующие функции в зависимости от выбранного языка:",
          ConsoleOutputNote:
            "Примечание: Результат вывода будет отображаться в окне вывода справа внизу.",
          ConsoleTextDesc: "вывод текста",
          ConsoleNumberDesc: "вывод числа",
          ConsoleTextVarDesc: "вывод текста и значения",
          ConsoleJsTemplateDesc: "шаблонные строки",
          ConsolePyFStringDesc: "f-строки для форматирования",
          ConsoleLuaFormatDesc: "форматирование строк",
          ConsoleJsLogTextCode: 'console.log("текст")',
          ConsoleJsLogNumberCode: "console.log(число)",
          ConsoleJsLogTextVarCode: 'console.log("текст", переменная)',
          ConsoleJsTemplateCode: "console.log(`Значение: ${переменная}`)",
          ConsolePyPrintTextCode: 'print("текст")',
          ConsolePyPrintNumberCode: "print(число)",
          ConsolePyPrintTextVarCode: 'print("текст", переменная)',
          ConsolePyFStringCode: 'print(f"Значение: {переменная}")',
          ConsoleLuaPrintTextCode: 'print("текст")',
          ConsoleLuaPrintNumberCode: "print(число)",
          ConsoleLuaPrintTextVarCode: 'print("текст", переменная)',
          ConsoleLuaFormatCode:
            'print(string.format("Значение: %s", переменная))',
          ConsolePhpEchoTextCode: 'echo "текст" . PHP_EOL;',
          ConsolePhpEchoNumberCode: "echo число . PHP_EOL;",
          ConsolePhpEchoTextVarCode: 'echo "текст " . $переменная . PHP_EOL;',
          DataTypesHeader: "Типы данных:",
          DataTypesDescription:
            "Текст (строка) нужно оборачивать в кавычки, а числа — нет.",
          DataTypesExamplesHeader: "Какие типы данных бывают:",
          DataTypesKindsNote:
            "В разных языках названия могут немного отличаться, но идея одинаковая.",
          DataTypesBasicsHeader: "Основные типы:",
          DataTypesStringLine: "string (строка): текст. Пишется в кавычках.",
          DataTypesNumberLine: "number (число): числа (и целые, и дробные).",
          DataTypesFloatLine:
            "float (дробное число): число с точкой, например 3.14.",
          DataTypesBoolLine: "bool/boolean: логический тип — true или false.",
          DataTypesExampleStringCode: '"Привет"',
          DataTypesExampleStringDesc: "строка (текст)",
          DataTypesExampleNumberCode: "5",
          DataTypesExampleNumberDesc: "число",
          DataTypesExampleFloatCode: "3.14",
          DataTypesExampleFloatDesc: "дробное число",
          DataTypesExampleBooleanCode: "true",
          DataTypesExampleBooleanDesc: "логическое значение (да/нет)",
          DataTypesExampleNullCode: "null",
          DataTypesExampleNullDesc: "«пустое значение»",
          DataTypesExampleUndefinedCode: "undefined",
          DataTypesExampleUndefinedDesc: "значение “не задано”",
          DataTypesExampleArrayCode: "[1, 2, 3]",
          DataTypesExampleArrayDesc: "список (массив)",
          DataTypesExampleObjectCode: '{ name: "Ann" }',
          DataTypesExampleObjectDesc: "объект (набор свойств)",
          DataTypesConsoleExamplesHeader: "Примеры вывода:",
          DataTypesConsoleOkDesc: "правильно",
          DataTypesConsoleErrorDesc: "ошибка (нет кавычек)",
          DataTypesConsoleTextCode: 'console.log("Привет")',
          DataTypesConsoleNumberCode: "console.log(5)",
          DataTypesConsoleErrorCode: "console.log(Привет)",
          VariableInfoHeader: "Что такое переменная?",
          VariableInfoText:
            "Переменная — это “коробка” с именем, в которой можно хранить значение (например, число). Это удобно, когда одно и то же значение нужно использовать много раз или менять в одном месте — тогда не надо искать и править число везде.",
          VariableInfoExamplesHeader: "Примеры:",
          JsVarKindsHeader: "JavaScript: var, let и const",
          JsVarKindsIntro:
            "В JavaScript есть несколько способов объявить переменную. В современных примерах чаще используют let и const.",
          JsVarVarCode: "var x = 1;",
          JsVarVarDesc: "— старый вариант, область видимости функция",
          JsVarLetCode: "let x = 1;",
          JsVarLetDesc: "— можно менять значение, область видимости блок",
          JsVarConstCode: "const x = 1;",
          JsVarConstDesc: "— нельзя переназначить, область видимости блок",
          JsVarKindsNote:
            "Примечание: const запрещает переназначение переменной, но содержимое объекта/массива менять можно.",
          JsScopeHeader: "Что такое “область видимости”",
          JsScopeIntro:
            "Область видимости — это место в коде, где переменная “видна” и её можно использовать. Если переменная объявлена внутри некоторого участка кода, то снаружи этого участка её может не быть видно.",
          JsScopeFunctionLine:
            "Function scope (область видимости функции): переменная видна внутри всей функции.",
          JsScopeBlockLine:
            "Block scope (область видимости блока): переменная видна только внутри фигурных скобок { ... } (например, внутри if / for).",
          JsScopeExamplesHeader: "Мини-пример",
          JsScopeVarTitle: "var (function scope)",
          JsScopeVarExample:
            "function demo() {\n  if (true) {\n    var a = 1;\n  }\n  console.log(a);\n}",
          JsScopeVarExplain:
            "Переменная a объявлена внутри if, но var делает её видимой во всей функции demo.",
          JsScopeLetTitle: "let/const (block scope)",
          JsScopeLetExample:
            "function demo() {\n  if (true) {\n    let b = 2;\n  }\n  console.log(b);\n}",
          JsScopeLetExplain:
            "Переменная b видна только внутри блока if. Снаружи блока b “не существует”.",
          JsScopeTip:
            "Для новичков правило простое: в JavaScript почти всегда используйте const, а если нужно менять значение — let. var лучше избегать в новых примерах.",
          ConcatInfoHeader: "Конкатенация строк",
          ConcatInfoIntro: "Конкатенация — это соединение строк в одну строку.",
          ConcatInfoIdea:
            "Идея простая: берём кусочки текста и “склеиваем” их вместе.",
          ConcatExamplesHeader: "Примеры:",
          ConcatJsPlusDesc: "обычное сложение строк",
          ConcatJsTemplateDesc: "шаблонная строка",
          ConcatPyPlusDesc: "сложение строк",
          ConcatPyFStringDesc: "f-строка (удобно вставлять переменные)",
          ConcatLuaDotsDesc: "оператор .. склеивает строки",
          ConcatLuaFormatDesc: "форматирование строки",
          ConcatPhpDotsDesc: "оператор . склеивает строки",
          ConcatPhpInterpDesc: "интерполяция в двойных кавычках",
          ConcatInfoNote:
            "Примечание: Blockly склеивает только строки, поэтому число он оборачивает сам: в Python это str(...), в Lua — tostring(...). В JavaScript и PHP оператор превращает число в текст без помощи функции.",
          IncDecInfoHeader: "Инкремент и декремент",
          IncDecInfoIntro:
            "Инкремент — это увеличение значения на 1, декремент — уменьшение на 1.",
          IncDecExamplesHeader: "Примеры:",
          IncDecIncDesc: "увеличить на 1",
          IncDecDecDesc: "уменьшить на 1",
          IncDecPhpIncDesc: "увеличить на 1",
          IncDecPhpDecDesc: "уменьшить на 1",
          IncDecInfoNote:
            "В Blockly это обычно делается так: берём текущее значение переменной, прибавляем 1 и снова присваиваем в ту же переменную.",
          ConditionInfoHeader: "Условные конструкции (if/else)",
          ConditionInfoIntro:
            "Условный оператор if/else позволяет программе принимать решения. Сначала вычисляется логическое выражение (условие), затем в зависимости от результата выполняется одна ветка кода (if) или другая (else). Так мы можем реагировать на разные ситуации — например, выводить сообщение только при выполнении нужного условия.",
          ConditionInfoExamplesHeader: "Примеры:",
          ConditionJsIfDesc: "выполнить действие при условии",
          ConditionJsIfElseDesc: "две ветки: если / иначе",
          ConditionPyIfDesc: "условие с отступами",
          ConditionPyIfElseDesc: "ветка else",
          ConditionLuaIfDesc: "if ... then ... end",
          ConditionLuaIfElseDesc: "ветка else",
          ConditionPhpIfDesc: "выполнить действие при условии",
          ConditionPhpIfElseDesc: "две ветки: если / иначе",
          ConditionInfoOpsHeader: "Операторы сравнения",
          ConditionInfoOpsText: ">, <, ==, != (в Lua — ~=).",
          ForLoopInfoHeader: "Цикл for со счётчиком",
          ForLoopIntroPrefix: "Цикл ",
          ForLoopIntroMid:
            " со счётчиком — это повторение действий, где переменная (например, ",
          ForLoopIntroSuffix:
            ") последовательно принимает значения с заданным шагом.",
          ForLoopPartsHeader: "Из чего состоит",
          ForLoopStartLabel: "Старт",
          ForLoopStartDesc: ": с какого значения начинаем (например, 1)",
          ForLoopEndLabel: "Финиш/условие",
          ForLoopEndDesc:
            ": до какого значения идём (например, до 5 включительно)",
          ForLoopStepLabel: "Шаг",
          ForLoopStepDesc: ": как меняем счётчик (обычно +1)",
          ForLoopBodyLabel: "Тело цикла",
          ForLoopBodyDescPrefix:
            ": что делаем на каждом шаге (например, печатаем ",
          ForLoopBodyDescSuffix: ")",
          ForLoopExampleHeader: "Пример (1…5, каждое число с новой строки)",
          ForLoopErrorsHeader: "Частые ошибки",
          ForLoopErr1Title: "1…4 вместо 1…5",
          ForLoopErr1TextBefore: ": забыли “включительно” (JS: ",
          ForLoopErr1TextMiddle: ", Python: ",
          ForLoopErr1TextAfter: ")",
          ForLoopErr2Title: "Неправильный шаг",
          ForLoopErr2Text: ": при шаге 2 получится 1, 3, 5",
          ForLoopErr3Title: "Печать не счётчика",
          ForLoopErr3Text:
            ": внутри цикла нужно выводить именно переменную цикла",
          ForLoopNote:
            "В Blockly это обычно блок “for” (Циклы) с полями FROM/TO/BY и переменной-счётчиком.",
          WhileLoopInfoHeader: "Цикл while",
          WhileLoopIntroPrefix: "Цикл ",
          WhileLoopIntroSuffix:
            " повторяет действия, пока условие истинно. Он полезен, когда заранее неизвестно, сколько раз нужно повторить (например, «пока не угадали число»).",
          WhileLoopPartsHeader: "Как устроен",
          WhileLoopCondLabel: "Условие",
          WhileLoopCondDesc:
            ": проверяется перед каждым шагом (если false — цикл заканчивается)",
          WhileLoopBodyLabel: "Тело цикла",
          WhileLoopBodyDesc:
            ": действия, которые выполняются на каждом повторении",
          WhileLoopChangeLabel: "Изменение",
          WhileLoopChangeDesc:
            ": внутри цикла нужно менять значение, влияющее на условие",
          WhileLoopDiffHeader: "Отличия от for",
          WhileLoopDiffFor:
            "for: заранее известны старт/финиш/шаг (например, 1…5)",
          WhileLoopDiffWhile:
            "while: повторяем «пока …», количество повторов заранее неизвестно",
          WhileLoopExampleHeader: "Простой пример: повторяем, пока не ввели 5",
          WhileLoopErrorsHeader: "Частые ошибки",
          WhileLoopErr1Title: "Бесконечный цикл",
          WhileLoopErr1Text: ": забыли обновить переменную внутри цикла",
          WhileLoopErr2Title: "Lua",
          WhileLoopErr2TextBefore: ": «не равно» пишется как ",
          WhileLoopErr3Title: "Ввод",
          WhileLoopErr3Text:
            ": строку нужно превратить в число (Number/float/tonumber)",
          WhileLoopNote:
            "В Blockly используйте блок while (Циклы) и обновляйте переменную guess внутри цикла.",
          WhileJsCode:
            'let guess = Number(input());\nwhile (guess !== 5) {\n  console.log("Попробуйте ещё");\n  guess = Number(input());\n}\nconsole.log("Готово!");',
          WhilePyCode:
            'guess = float(input())\nwhile guess != 5:\n    print("Попробуйте ещё")\n    guess = float(input())\nprint("Готово!")',
          WhileLuaCode:
            'local guess = tonumber(input())\nwhile guess ~= 5 do\n  print("Попробуйте ещё")\n  guess = tonumber(input())\nend\nprint("Готово!")',
          WhilePhpCode:
            '$guess = (float) input();\nwhile ($guess != 5) {\n  echo "Попробуйте ещё" . PHP_EOL;\n  $guess = (float) input();\n}\necho "Готово!" . PHP_EOL;',
          ListInfoHeader: "Список (массив) и «для каждого элемента…» (forEach)",
          ListInfoIntroBefore:
            "Список (или массив) — это набор значений в одном месте. Например: ",
          ListInfoIntroAfter:
            ". У списка есть порядок: у каждого элемента есть номер (индекс).",
          ListInfoWhyHeader: "Зачем нужны списки",
          ListInfoWhy1:
            "хранить много однотипных значений (числа, слова) вместе",
          ListInfoWhy2: "перебирать элементы по одному и что-то с ними делать",
          ListInfoWhy3: "считать сумму, количество, находить минимум/максимум",
          ListInfoForEachHeader: "Что такое forEach",
          ListInfoForEachBefore:
            "forEach означает «для каждого элемента списка». В нашем интерфейсе этот блок называется ",
          ListInfoForEachBlockName: "«для каждого элемента i в списке»",
          ListInfoForEachAfter:
            " — это одно и то же по смыслу. Он берёт элементы списка по очереди и внутри цикла даёт вам текущий элемент (например, ",
          ListInfoForEachMid: " или ",
          ListInfoForEachEnd: ").",
          ListInfoJsNote:
            "В примере JavaScript показан современный способ перебора: list.forEach(...). Blockly может сгенерировать обычный цикл for — по смыслу это то же самое. Если хотите, вы можете создать себе пользовательский блок (в «Мои блоки») с генерацией forEach.",
          ListInfoExampleHeader: "Пример: вывести элементы и посчитать сумму",
          ListInfoNoteBefore: "В этой задаче: создайте ",
          ListInfoNoteMid: " (или ",
          ListInfoNoteAfter:
            "), затем используйте «для каждого элемента … в списке» и переменную-накопитель ",
          ListInfoNoteEnd: ".",
          SublistInfoHeader: "Подсписок (sublist)",
          SublistInfoIntroBefore: "Подсписок — это ",
          SublistInfoIntroStrong: "часть списка",
          SublistInfoIntroAfter:
            ". Например, из списка [1..10] можно взять подсписок с элементами 3, 4, 5, 6, 7.",
          SublistInfoHowHeader: "Как сделать в Blockly",
          SublistInfoStep1:
            "Создайте список 1…10 и сохраните его в переменную list",
          SublistInfoStep2:
            "Возьмите подсписок блоком «взять подсписок» (Lists → get sub-list) и сохраните в sub",
          SublistInfoStep3:
            "Сделайте «для каждого элемента i в списке» по sub и выводите i",
          SublistInfoNote:
            "Подсписок удобен, когда нужна только часть элементов: тогда не приходится писать условия внутри цикла.",
          SublistLangHeader: "Примеры в языках",
          SublistIndexNote:
            "В JavaScript метод slice(start, end) берёт часть массива и возвращает новый массив (исходный не меняется). Индексация с 0, а end не включается. Например, чтобы взять элементы со 2-го по 4-й, можно сделать slice(1, 4).",
          SublistJsHeader: "JavaScript: .slice(start, end)",
          SublistJsCode:
            "const list = [10, 20, 30, 40, 50, 60];\nconst sub = list.slice(1, 4);\nsub.forEach((i) => console.log(i));",
          SublistJsExplain: "start включается, end не включается.",
          SublistPyHeader: "Python: list[start:end]",
          SublistPyCode:
            "list = [10, 20, 30, 40, 50, 60]\nsub = list[1:4]\nfor i in sub:\n    print(i)",
          SublistPyExplain: "start включается, end не включается.",
          SublistLuaHeader: "Lua: собрать подсписок вручную",
          SublistLuaCode:
            "local list = {10,20,30,40,50,60}\nlocal sub = {}\nfor i = 2, 4 do\n  table.insert(sub, list[i])\nend\nfor _, i in ipairs(sub) do\n  print(i)\nend",
          SublistLuaExplain: "В Lua индексация обычно начинается с 1.",
          SublistPhpHeader: "PHP: array_slice",
          SublistPhpCode:
            "$list = [10,20,30,40,50,60];\n$sub = array_slice($list, 1, 3);\nforeach ($sub as $i) {\n  echo $i . PHP_EOL;\n}",
          SublistPhpExplain:
            "В PHP array_slice: offset с 0 и length — сколько элементов.",
          SublistAltNote:
            "Альтернатива без подсписка: можно перебрать индексы 3…7 и печатать list[i].",
          ListFilterHeader: "Фильтрация списка",
          ListFilterIntro:
            "Фильтрация — это когда мы перебираем элементы списка и оставляем только те, которые подходят под условие. Например: “только чётные числа”.",
          ListFilterHowHeader: "Как сделать",
          ListFilterStep1:
            "Переберите list блоком «для каждого элемента i в списке»",
          ListFilterStep2:
            "Внутри цикла сделайте if с проверкой чётности: i % 2 == 0",
          ListFilterStep3:
            "Если условие истинно — выводите i и добавляйте его в sum",
          ListFilterNote:
            "Важно: фильтрация не требует отдельного “подсписка” — можно просто печатать подходящие элементы внутри if.",
          ListFilterLangHeader: "Примеры в языках",
          ListFilterJsNote:
            "В JavaScript можно писать по-разному: Blockly может сгенерировать цикл for, а в примерах ниже показан вариант с forEach. Результат одинаковый. Если хотите, вы можете создать себе пользовательский блок (в «Мои блоки») с генерацией forEach.",
          ListFilterJsCode:
            "const list = [3, 4, 7, 12, 15];\nlet sum = 0;\nlist.forEach((i) => {\n  if (i % 2 === 0) {\n    console.log(i);\n    sum = sum + i;\n  }\n});\nconsole.log(sum);",
          ListFilterPyCode:
            "list = [3, 4, 7, 12, 15]\nsum = 0\nfor i in list:\n    if i % 2 == 0:\n        print(i)\n        sum = sum + i\nprint(sum)",
          ListFilterLuaCode:
            "local list = {3,4,7,12,15}\nlocal sum = 0\nfor _, i in ipairs(list) do\n  if i % 2 == 0 then\n    print(i)\n    sum = sum + i\n  end\nend\nprint(sum)",
          ListFilterPhpCode:
            "$list = [3, 4, 7, 12, 15];\n$sum = 0;\nforeach ($list as $i) {\n  if ($i % 2 == 0) {\n    echo $i . PHP_EOL;\n    $sum = $sum + $i;\n  }\n}\necho $sum . PHP_EOL;",
          ListFilterMinMaxHeader: "Минимум и максимум среди отфильтрованных",
          ListFilterMinMaxText:
            "Частая задача: сначала отобрать элементы (например, чётные), а потом найти среди них минимум и максимум. Один удобный способ — собрать отдельный список evens, а затем найти min и max для этого списка.",
          ListFilterMinMaxNewHeader: "Новые слова в коде",
          ListFilterMinMaxPushText:
            "evens.push(i) — добавить элемент в конец массива evens (JavaScript).",
          ListFilterMinMaxDotText:
            "Точка в evens.push означает «взять метод у объекта/массива»: у массива evens есть метод push.",
          ListFilterMinMaxApplyText:
            "Иногда генерация Blockly в JS использует Math.min.apply(null, evens) вместо Math.min(...evens). Это два способа «передать элементы массива как аргументы функции».",
          ListFilterMinMaxAppendText:
            "evens.append(i) — добавить элемент в конец списка evens (Python).",
          ListFilterMinMaxJsCode:
            "const list = [5, 2, 9, 4, 1, 8];\nconst evens = [];\nlist.forEach((i) => {\n  if (i % 2 === 0) evens.push(i);\n});\nconst min = Math.min(...evens);\nconst max = Math.max(...evens);\nconsole.log(`min=${min}`);\nconsole.log(`max=${max}`);",
          ListFilterMinMaxPyCode:
            'list = [5, 2, 9, 4, 1, 8]\nevens = []\nfor i in list:\n    if i % 2 == 0:\n        evens.append(i)\nprint("min=" + str(min(evens)))\nprint("max=" + str(max(evens)))',
          CondOpGtDesc: "больше",
          CondOpLtDesc: "меньше",
          CondOpGteDesc: "больше или равно",
          CondOpLteDesc: "меньше или равно",
          CondOpEqDesc: "сравнение: равно",
          CondOpNeqDesc: "сравнение: не равно",
          CondOpNeqLuaDesc: "не равно (в Lua)",
          CondOpEqNote:
            "Важно: == — это сравнение, а = — присваивание (например, x = 5). А != означает “не равно” (в Lua — ~=).",
          ConditionInfoNote:
            "Если нужно “ничего не делать” — просто оставьте ветку else пустой или не добавляйте её.",
          RunFirst: "Сначала запустите код",
          TaskDifficultyBasic: "Основа",
          TaskDifficultyFixbugs: "Найди ошибку",
          TaskDifficultyAdvanced: "Продвинутый",
        }
      : {
          TaskPerfect: "Great! Optimal solution.",
          TaskPassed: "Solution is correct.",
          NextTask: "Next task",
          PrevTask: "Previous task",
          TaskSolutions: "Task Solutions",
          CheckSolution: "Check solution",
          TaskHintLabel: "Hint",
          StarsCriteria: "Stars criteria:",
          StarsOptimal: "optimal (minimum blocks)",
          StarsGood: "good",
          StarsCorrect: "solution correct",
          ConsoleOutputHeader: "Console output:",
          ConsoleOutputDescription:
            "Use the following functions to print to the console depending on the selected language:",
          ConsoleOutputNote:
            "Note: The output will be shown in the output window at the bottom right.",
          ConsoleTextDesc: "print text",
          ConsoleNumberDesc: "print number",
          ConsoleTextVarDesc: "print text and value",
          ConsoleJsTemplateDesc: "template strings",
          ConsolePyFStringDesc: "f-strings for formatting",
          ConsoleLuaFormatDesc: "string formatting",
          ConsoleJsLogTextCode: 'console.log("text")',
          ConsoleJsLogNumberCode: "console.log(number)",
          ConsoleJsLogTextVarCode: 'console.log("text", variable)',
          ConsoleJsTemplateCode: "console.log(`Value: ${variable}`)",
          ConsolePyPrintTextCode: 'print("text")',
          ConsolePyPrintNumberCode: "print(number)",
          ConsolePyPrintTextVarCode: 'print("text", variable)',
          ConsolePyFStringCode: 'print(f"Value: {variable}")',
          ConsoleLuaPrintTextCode: 'print("text")',
          ConsoleLuaPrintNumberCode: "print(number)",
          ConsoleLuaPrintTextVarCode: 'print("text", variable)',
          ConsoleLuaFormatCode: 'print(string.format("Value: %s", variable))',
          ConsolePhpEchoTextCode: 'echo "text" . PHP_EOL;',
          ConsolePhpEchoNumberCode: "echo number . PHP_EOL;",
          ConsolePhpEchoTextVarCode: 'echo "text " . $variable . PHP_EOL;',
          DataTypesHeader: "Data types:",
          DataTypesDescription:
            "Text (a string) requires quotes, but numbers do not.",
          DataTypesExamplesHeader: "Common data types:",
          DataTypesKindsNote:
            "Names can vary a bit between languages, but the idea is the same.",
          DataTypesBasicsHeader: "Core types:",
          DataTypesStringLine: "string: text. Written in quotes.",
          DataTypesNumberLine:
            "number: numeric values (integers and decimals).",
          DataTypesFloatLine: "float: a decimal number like 3.14.",
          DataTypesBoolLine: "bool/boolean: logical type — true or false.",
          DataTypesExampleStringCode: '"Hello"',
          DataTypesExampleStringDesc: "string (text)",
          DataTypesExampleNumberCode: "5",
          DataTypesExampleNumberDesc: "number",
          DataTypesExampleFloatCode: "3.14",
          DataTypesExampleFloatDesc: "decimal number",
          DataTypesExampleBooleanCode: "true",
          DataTypesExampleBooleanDesc: "boolean (yes/no)",
          DataTypesExampleNullCode: "null",
          DataTypesExampleNullDesc: "empty value",
          DataTypesExampleUndefinedCode: "undefined",
          DataTypesExampleUndefinedDesc: "value is not set",
          DataTypesExampleArrayCode: "[1, 2, 3]",
          DataTypesExampleArrayDesc: "array (list)",
          DataTypesExampleObjectCode: '{ name: "Ann" }',
          DataTypesExampleObjectDesc: "object (a set of properties)",
          DataTypesConsoleExamplesHeader: "Output examples:",
          DataTypesConsoleOkDesc: "correct",
          DataTypesConsoleErrorDesc: "error (missing quotes)",
          DataTypesConsoleTextCode: 'console.log("Hello")',
          DataTypesConsoleNumberCode: "console.log(5)",
          DataTypesConsoleErrorCode: "console.log(Hello)",
          VariableInfoHeader: "What is a variable?",
          VariableInfoText:
            "A variable is like a named “box” that stores a value (for example, a number). It’s useful when you want to reuse the same value or change it in one place instead of editing it everywhere.",
          VariableInfoExamplesHeader: "Examples:",
          JsVarKindsHeader: "JavaScript: var, let and const",
          JsVarKindsIntro:
            "JavaScript has several ways to declare variables. In modern code you mostly use let and const.",
          JsVarVarCode: "var x = 1;",
          JsVarVarDesc: "— legacy keyword, function-scoped",
          JsVarLetCode: "let x = 1;",
          JsVarLetDesc: "— re-assignable, block-scoped",
          JsVarConstCode: "const x = 1;",
          JsVarConstDesc: "— not re-assignable, block-scoped",
          JsVarKindsNote:
            "Note: const prevents re-assignment, but objects/arrays can still be mutated.",
          JsScopeHeader: "What is “scope”",
          JsScopeIntro:
            "Scope is the part of the code where a variable is “visible” and can be used. If a variable is declared inside some region, it may not be visible outside of it.",
          JsScopeFunctionLine:
            "Function scope: the variable is visible throughout the whole function.",
          JsScopeBlockLine:
            "Block scope: the variable is visible only inside curly braces { ... } (for example, inside if / for).",
          JsScopeExamplesHeader: "Mini example",
          JsScopeVarTitle: "var (function scope)",
          JsScopeVarExample:
            "function demo() {\n  if (true) {\n    var a = 1;\n  }\n  console.log(a);\n}",
          JsScopeVarExplain:
            "The variable a is declared inside if, but var makes it visible in the whole function demo.",
          JsScopeLetTitle: "let/const (block scope)",
          JsScopeLetExample:
            "function demo() {\n  if (true) {\n    let b = 2;\n  }\n  console.log(b);\n}",
          JsScopeLetExplain:
            "The variable b is visible only inside the if block. Outside the block, b does not exist.",
          JsScopeTip:
            "Simple rule for beginners: in JavaScript use const by default, and use let when you need to re-assign. Avoid var in new code.",
          ConcatInfoHeader: "String concatenation",
          ConcatInfoIntro:
            "Concatenation means joining strings into one string.",
          ConcatInfoIdea:
            "The idea is simple: take parts and join them together.",
          ConcatExamplesHeader: "Examples:",
          ConcatJsPlusDesc: "simple string concatenation",
          ConcatJsTemplateDesc: "template string",
          ConcatPyPlusDesc: "string concatenation",
          ConcatPyFStringDesc: "f-string (easy variable interpolation)",
          ConcatLuaDotsDesc: "the .. operator joins strings",
          ConcatLuaFormatDesc: "string formatting",
          ConcatPhpDotsDesc: "the . operator joins strings",
          ConcatPhpInterpDesc: "interpolation in double quotes",
          ConcatInfoNote:
            "Note: Blockly joins only strings, so it converts numbers for you — str(...) in Python and tostring(...) in Lua. In JavaScript and PHP the operator turns the number into text by itself.",
          IncDecInfoHeader: "Increment and decrement",
          IncDecInfoIntro:
            "Increment means increasing a value by 1, decrement means decreasing it by 1.",
          IncDecExamplesHeader: "Examples:",
          IncDecIncDesc: "increase by 1",
          IncDecDecDesc: "decrease by 1",
          IncDecPhpIncDesc: "increase by 1",
          IncDecPhpDecDesc: "decrease by 1",
          IncDecInfoNote:
            "In Blockly you usually do it like this: take the current value, add 1, and assign it back to the same variable.",
          ConditionInfoHeader: "Conditional statements (if/else)",
          ConditionInfoIntro:
            "The if/else statement lets a program make decisions. First a boolean expression (condition) is evaluated; depending on the result, either the if-branch or the else-branch runs. This lets you react to different situations — for example, only print a message when some requirement is met.",
          ConditionInfoExamplesHeader: "Examples:",
          ConditionJsIfDesc: "run code when the condition is true",
          ConditionJsIfElseDesc: "two branches: if / else",
          ConditionPyIfDesc: "indentation matters",
          ConditionPyIfElseDesc: "else branch",
          ConditionLuaIfDesc: "if ... then ... end",
          ConditionLuaIfElseDesc: "else branch",
          ConditionPhpIfDesc: "run code when the condition is true",
          ConditionPhpIfElseDesc: "two branches: if / else",
          ConditionInfoOpsHeader: "Comparison operators",
          ConditionInfoOpsText: ">, <, ==, != (Lua uses ~=).",
          ForLoopInfoHeader: "Counter-based for loop",
          ForLoopIntroPrefix: "A ",
          ForLoopIntroMid:
            " loop with a counter repeats actions while a variable (for example, ",
          ForLoopIntroSuffix: ") takes values step by step.",
          ForLoopPartsHeader: "What it consists of",
          ForLoopStartLabel: "Start",
          ForLoopStartDesc: ": the initial value (e.g. 1)",
          ForLoopEndLabel: "End/condition",
          ForLoopEndDesc: ": when to stop (e.g. up to 5, inclusive)",
          ForLoopStepLabel: "Step",
          ForLoopStepDesc: ": how the counter changes (usually +1)",
          ForLoopBodyLabel: "Loop body",
          ForLoopBodyDescPrefix: ": what we do each step (e.g. print ",
          ForLoopBodyDescSuffix: ")",
          ForLoopExampleHeader: "Example (1…5, one number per line)",
          ForLoopErrorsHeader: "Common mistakes",
          ForLoopErr1Title: "1…4 instead of 1…5",
          ForLoopErr1TextBefore: ": forgot “inclusive” (JS: ",
          ForLoopErr1TextMiddle: ", Python: ",
          ForLoopErr1TextAfter: ")",
          ForLoopErr2Title: "Wrong step",
          ForLoopErr2Text: ": with step 2 you get 1, 3, 5",
          ForLoopErr3Title: "Printing the wrong thing",
          ForLoopErr3Text:
            ": inside the loop you should print the counter variable",
          ForLoopNote:
            "In Blockly this is typically the “for” (Loops) block with FROM/TO/BY and a counter variable.",
          WhileLoopInfoHeader: "While loop",
          WhileLoopIntroPrefix: "A ",
          WhileLoopIntroSuffix:
            " loop repeats actions while the condition is true. It’s useful when you don’t know in advance how many times you need to repeat (for example, “until you guess the number”).",
          WhileLoopPartsHeader: "How it works",
          WhileLoopCondLabel: "Condition",
          WhileLoopCondDesc:
            ": checked before each step (if false, the loop ends)",
          WhileLoopBodyLabel: "Loop body",
          WhileLoopBodyDesc: ": the actions that run on each iteration",
          WhileLoopChangeLabel: "Change",
          WhileLoopChangeDesc:
            ": inside the loop you must change the value that affects the condition",
          WhileLoopDiffHeader: "Difference from for",
          WhileLoopDiffFor: "for: start/end/step are known (e.g. 1…5)",
          WhileLoopDiffWhile:
            "while: repeat “while …”, the number of iterations is not known in advance",
          WhileLoopExampleHeader: "Simple example: repeat until you enter 5",
          WhileLoopErrorsHeader: "Common mistakes",
          WhileLoopErr1Title: "Infinite loop",
          WhileLoopErr1Text: ": forgot to update the variable inside the loop",
          WhileLoopErr2Title: "Lua",
          WhileLoopErr2TextBefore: ": “not equal” is written as ",
          WhileLoopErr3Title: "Input",
          WhileLoopErr3Text:
            ": convert the input string to a number (Number/float/tonumber)",
          WhileLoopNote:
            "In Blockly use the while (Loops) block and update guess inside the loop.",
          WhileJsCode:
            'let guess = Number(input());\nwhile (guess !== 5) {\n  console.log("Try again");\n  guess = Number(input());\n}\nconsole.log("Guessed!");',
          WhilePyCode:
            'guess = float(input())\nwhile guess != 5:\n    print("Try again")\n    guess = float(input())\nprint("Guessed!")',
          WhileLuaCode:
            'local guess = tonumber(input())\nwhile guess ~= 5 do\n  print("Try again")\n  guess = tonumber(input())\nend\nprint("Guessed!")',
          WhilePhpCode:
            '$guess = (float) input();\nwhile ($guess != 5) {\n  echo "Try again" . PHP_EOL;\n  $guess = (float) input();\n}\necho "Guessed!" . PHP_EOL;',
          ListInfoHeader: "List (array) and “for each item …” (forEach)",
          ListInfoIntroBefore:
            "A list (or array) is a collection of values in one place. For example: ",
          ListInfoIntroAfter:
            ". A list has an order: each item has a position (index).",
          ListInfoWhyHeader: "Why lists are useful",
          ListInfoWhy1: "store many similar values (numbers, words) together",
          ListInfoWhy2: "iterate over items and do something with each one",
          ListInfoWhy3: "compute sum/count, find min/max",
          ListInfoForEachHeader: "What is forEach",
          ListInfoForEachBefore:
            "forEach means “for each item in the list”. In our interface this block is called ",
          ListInfoForEachBlockName: "“for each item i in list”",
          ListInfoForEachAfter:
            " — it’s the same idea. It goes through list items one by one and gives you the current item (for example, ",
          ListInfoForEachMid: " or ",
          ListInfoForEachEnd: ").",
          ListInfoJsNote:
            "In the JavaScript example we show a modern style: list.forEach(...). Blockly may generate a plain for loop instead — the meaning is the same. If you want, you can create a custom block (in “My Blocks”) that generates forEach.",
          ListInfoExampleHeader: "Example: print items and compute sum",
          ListInfoNoteBefore: "In this task: create ",
          ListInfoNoteMid: " (or ",
          ListInfoNoteAfter:
            "), then use “for each item … in list” and an accumulator variable ",
          ListInfoNoteEnd: ".",
          SublistInfoHeader: "Sublist",
          SublistInfoIntroBefore: "A sublist is a ",
          SublistInfoIntroStrong: "part of a list",
          SublistInfoIntroAfter:
            ". For example, from the list [1..10] you can take the sublist 3, 4, 5, 6, 7.",
          SublistInfoHowHeader: "How to do it in Blockly",
          SublistInfoStep1: "Create the list 1…10 and store it in list",
          SublistInfoStep2:
            "Use the Lists “get sub-list” block and store the result in sub",
          SublistInfoStep3:
            "Use “for each item i in list” over sub and print i",
          SublistInfoNote:
            "A sublist is useful when you need only a part of the elements, so you don’t need extra conditions inside the loop.",
          SublistLangHeader: "Language examples",
          SublistIndexNote:
            "In JavaScript, slice(start, end) returns a new array containing a part of the array (the original is not modified). Indexing starts at 0 and end is excluded. For example, to take items 2..4 you can use slice(1, 4).",
          SublistJsHeader: "JavaScript: .slice(start, end)",
          SublistJsCode:
            "const list = [10, 20, 30, 40, 50, 60];\nconst sub = list.slice(1, 4);\nsub.forEach((i) => console.log(i));",
          SublistJsExplain: "start is included, end is excluded.",
          SublistPyHeader: "Python: list[start:end]",
          SublistPyCode:
            "list = [10, 20, 30, 40, 50, 60]\nsub = list[1:4]\nfor i in sub:\n    print(i)",
          SublistPyExplain: "start is included, end is excluded.",
          SublistLuaHeader: "Lua: build a sublist manually",
          SublistLuaCode:
            "local list = {10,20,30,40,50,60}\nlocal sub = {}\nfor i = 2, 4 do\n  table.insert(sub, list[i])\nend\nfor _, i in ipairs(sub) do\n  print(i)\nend",
          SublistLuaExplain: "In Lua indexing usually starts at 1.",
          SublistPhpHeader: "PHP: array_slice",
          SublistPhpCode:
            "$list = [10,20,30,40,50,60];\n$sub = array_slice($list, 1, 3);\nforeach ($sub as $i) {\n  echo $i . PHP_EOL;\n}",
          SublistPhpExplain:
            "In PHP array_slice uses a 0-based offset and a length.",
          SublistAltNote:
            "Alternative without a sublist: loop i from 3 to 7 and print list[i].",
          ListFilterHeader: "List filtering",
          ListFilterIntro:
            "Filtering is when you iterate over a list and keep only the items that match a condition. For example: “only even numbers”.",
          ListFilterHowHeader: "How to do it",
          ListFilterStep1: "Iterate over list using “for each item i in list”",
          ListFilterStep2: "Inside the loop, add an if: i % 2 == 0",
          ListFilterStep3: "If true, print i and add it to sum",
          ListFilterNote:
            "Note: filtering doesn’t require creating a separate sublist — you can just print matching items inside the if.",
          ListFilterLangHeader: "Language examples",
          ListFilterJsNote:
            "In JavaScript you can write it in different ways: Blockly may generate a for loop, while the examples below use forEach. The result is the same. If you want, you can create a custom block (in “My Blocks”) that generates forEach.",
          ListFilterJsCode:
            "const list = [3, 4, 7, 12, 15];\nlet sum = 0;\nlist.forEach((i) => {\n  if (i % 2 === 0) {\n    console.log(i);\n    sum = sum + i;\n  }\n});\nconsole.log(sum);",
          ListFilterPyCode:
            "list = [3, 4, 7, 12, 15]\nsum = 0\nfor i in list:\n    if i % 2 == 0:\n        print(i)\n        sum = sum + i\nprint(sum)",
          ListFilterLuaCode:
            "local list = {3,4,7,12,15}\nlocal sum = 0\nfor _, i in ipairs(list) do\n  if i % 2 == 0 then\n    print(i)\n    sum = sum + i\n  end\nend\nprint(sum)",
          ListFilterPhpCode:
            "$list = [3, 4, 7, 12, 15];\n$sum = 0;\nforeach ($list as $i) {\n  if ($i % 2 == 0) {\n    echo $i . PHP_EOL;\n    $sum = $sum + $i;\n  }\n}\necho $sum . PHP_EOL;",
          ListFilterMinMaxHeader: "Min and max among filtered items",
          ListFilterMinMaxText:
            "A common task: first keep only matching items (for example, evens), then find the minimum and maximum among them. A convenient approach is to build a separate evens list and then compute min and max for that list.",
          ListFilterMinMaxNewHeader: "New words in the code",
          ListFilterMinMaxPushText:
            "evens.push(i) — add an item to the end of the evens array (JavaScript).",
          ListFilterMinMaxDotText:
            "The dot in evens.push means “call a method on an object/array”: the evens array has a push method.",
          ListFilterMinMaxApplyText:
            "Sometimes Blockly’s JS generator uses Math.min.apply(null, evens) instead of Math.min(...evens). Both pass array items as function arguments.",
          ListFilterMinMaxAppendText:
            "evens.append(i) — add an item to the end of the evens list (Python).",
          ListFilterMinMaxJsCode:
            "const list = [5, 2, 9, 4, 1, 8];\nconst evens = [];\nlist.forEach((i) => {\n  if (i % 2 === 0) evens.push(i);\n});\nconst min = Math.min(...evens);\nconst max = Math.max(...evens);\nconsole.log(`min=${min}`);\nconsole.log(`max=${max}`);",
          ListFilterMinMaxPyCode:
            'list = [5, 2, 9, 4, 1, 8]\nevens = []\nfor i in list:\n    if i % 2 == 0:\n        evens.append(i)\nprint("min=" + str(min(evens)))\nprint("max=" + str(max(evens)))',
          CondOpGtDesc: "greater than",
          CondOpLtDesc: "less than",
          CondOpGteDesc: "greater or equal",
          CondOpLteDesc: "less or equal",
          CondOpEqDesc: "comparison: equal",
          CondOpNeqDesc: "comparison: not equal",
          CondOpNeqLuaDesc: "not equal (in Lua: ~=)",
          CondOpEqNote:
            "Important: == means comparison, while = means assignment (e.g., x = 5). And != means “not equal” (in Lua it is ~=).",
          ConditionInfoNote:
            "If you need to “do nothing”, leave the else branch empty or omit it.",
          RunFirst: "Run the code first",
          TaskDifficultyBasic: "Basic",
          TaskDifficultyFixbugs: "Find the Bug",
          TaskDifficultyAdvanced: "Advanced",
        };
  (window as any)._currentLocalizedStrings = {
    ...(window as any)._currentLocalizedStrings,
    ...taskStrings,
  };
}

// Локализация tooltip/aria-label по всему приложению
export function localizeTooltips(lang: AppLang): void {
  const setAttrs = (
    el: Element | null,
    attrs: Record<string, string | undefined>,
  ) => {
    if (!el) return;
    Object.entries(attrs).forEach(([k, v]) => {
      if (typeof v === "string") el.setAttribute(k, v);
    });
  };

  const t = lang === "ru" ? stringsRu.tooltips : stringsEn.tooltips;

  // Подсказки в шапке
  setAttrs(document.querySelector(".language-switch"), { title: t.appLang });
  setAttrs(document.querySelector(".theme-switch"), { title: t.appTheme });
  setAttrs(document.querySelector(".gen-lang-dropdown"), { title: t.genLang });

  // Кнопки панели Ace
  const byId = (id: string) => document.getElementById(id);
  const setBtn = (id: string, text: string) => {
    const el = byId(id);
    setAttrs(el, { title: text, "aria-label": text });
  };

  setBtn("aceSearchBtn", t.search);
  setBtn("aceReplaceBtn", t.replace);
  setBtn("aceGotoBtn", t.goto);
  setBtn("aceFormatBtn", t.format);
  setBtn("aceBracesBtn", t.braces);
  setBtn("copyCodeBtn", t.copy);
  setBtn("downloadCodeBtn", t.download);
  setBtn("aceShortcutsBtn", t.shortcuts);
  setBtn("aceSettingsToggle", t.settings);
  setBtn("aceRunBtn", t.run);
  setBtn("debugStepBtn", t.debugStep);
  setBtn("debugSlowBtn", t.debugSlow);
  setBtn("debugRunBtn", t.debugContinue);
  setBtn("debugStopBtn", t.debugStop);
  // Кнопки сохранения/загрузки XML в шапке
  setBtn("saveXmlBtn", lang === "ru" ? "Сохранить (XML)" : "Save (XML)");
  setBtn("loadXmlBtn", lang === "ru" ? "Загрузить (XML)" : "Load (XML)");

  setAttrs(byId("aceSettingsPanel"), { "aria-label": t.settingsPanel });
  setAttrs(byId("aceKeybinding"), { "aria-label": t.keybinding });
  setAttrs(byId("aceThemeSelect"), { "aria-label": t.aceTheme });
  setAttrs(byId("editor"), { "aria-label": t.editorRegion });
  setAttrs(byId("closeModal"), { "aria-label": t.close });

  // Панель аннотаций
  setAttrs(byId("annotToolbar"), { "aria-label": t.annotTools });
  setAttrs(byId("annotateToggleBtn"), { title: t.annotate });
  setAttrs(byId("annotBrush"), { title: t.brush });
  setAttrs(byId("annotLine"), { title: t.line });
  setAttrs(byId("annotArrow"), { title: t.arrow });
  setAttrs(byId("annotRect"), { title: t.rect });
  setAttrs(byId("annotColor"), { title: t.color });
  setAttrs(byId("annotSize"), { title: t.size });
  setAttrs(byId("annotUndo"), { title: t.undo });
  setAttrs(byId("annotRedo"), { title: t.redo });
  setAttrs(byId("annotClear"), { title: t.clear });
}

// Локализация подписей и опций внутри панели настроек Ace
export function localizeAceSettingsPanel(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.aceSettings : stringsEn.aceSettings;

  const setText = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("aceThemeLabel", t.theme);
  setText("aceFontSizeLabel", t.fontSize);
  setText("aceTabSizeLabel", t.tabSize);
  setText("aceWrapLabel", t.wrap);
  setText("aceInvisiblesLabel", t.invisibles);
  setText("aceActiveLineLabel", t.activeLine);
  setText("acePrintMarginLabel", t.printMargin);
  setText("aceGutterLabel", t.gutter);
  setText("aceSoftTabsLabel", t.softTabs);
  setText("aceFoldWidgetsLabel", t.foldWidgets);
  setText("aceKeybindingLabel", t.keybinding);

  // Обновляем подпись режима клавиш "по умолчанию"
  const kb = document.getElementById(
    "aceKeybinding",
  ) as HTMLSelectElement | null;
  if (kb) {
    const opt = Array.from(kb.options).find((o) => o.value === "default");
    if (opt) opt.textContent = t.keybindingDefault;
  }

  // Обновляем имена тем (Light/Monokai)
  const themeSel = document.getElementById(
    "aceThemeSelect",
  ) as HTMLSelectElement | null;
  if (themeSel) {
    const light = Array.from(themeSel.options).find(
      (o) => o.value === "ace/theme/chrome",
    );
    if (light) light.textContent = t.themeLight;
    const monokai = Array.from(themeSel.options).find(
      (o) => o.value === "ace/theme/monokai",
    );
    if (monokai) monokai.textContent = t.themeMonokai;
  }
}

// Строки для UI Ace во время работы (statusbar, уведомления)
export type AceUIStrings = {
  copySuccess: string;
  save: string;
  saved: string;
  statusLine: (mode: string, row: number, col: number, total: number) => string;
  renameNoteReserved: (
    original: string,
    generated: string,
    language: string,
  ) => string;
  renameNoteCollision: (
    original: string,
    generated: string,
    language: string,
  ) => string;
};

export function getAceUIStrings(lang: AppLang): AceUIStrings {
  if (lang === "en") {
    return {
      copySuccess: "Copied",
      save: "Save",
      saved: "Saved",
      statusLine: (mode: string, row: number, col: number, total: number) =>
        `${mode}  |  Line ${row}, Column ${col}  |  Total: ${total}`,
      renameNoteReserved: (original, generated, language) =>
        `"${original}" is a reserved word in ${language}, so Blockly renamed your variable to ${generated}`,
      renameNoteCollision: (original, generated, language) =>
        `"${original}" clashes with a function or another variable in ${language}, so Blockly renamed your variable to ${generated}`,
    };
  }
  return {
    copySuccess: "Скопировано",
    save: "Сохранить",
    saved: "Сохранено",
    statusLine: (mode: string, row: number, col: number, total: number) =>
      `${mode}  |  Строка ${row}, Столбец ${col}  |  Всего: ${total}`,
    renameNoteReserved: (original, generated, language) =>
      `Имя «${original}» занято языком ${language}, поэтому Blockly переименовал переменную в ${generated}`,
    renameNoteCollision: (original, generated, language) =>
      `Имя «${original}» совпадает с функцией или другой переменной в ${language}, поэтому Blockly переименовал его в ${generated}`,
  };
}

// Локализация окна справки: кнопки/подписи и заголовок модалки
export function localizeHelpUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.helpUi : stringsEn.helpUi;

  const helpBtn = document.getElementById("blockHelpBtn");
  const helpBtnText = document.getElementById("blockHelpBtnText");
  const modalTitleEl = document.querySelector("#helpModal .modal-header h2");
  const closeBtn = document.getElementById("closeHelpModal");

  if (helpBtn) {
    helpBtn.setAttribute("title", t.title);
    helpBtn.setAttribute("aria-label", t.buttonLabel);
  }
  if (helpBtnText) {
    (helpBtnText as HTMLElement).textContent = t.buttonText;
  }
  if (modalTitleEl) {
    (modalTitleEl as HTMLElement).textContent = t.modalTitle;
  }
  if (closeBtn) {
    closeBtn.setAttribute("aria-label", t.closeLabel);
  }
}

export function localizeSupportUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.supportUi : stringsEn.supportUi;

  const btn = document.getElementById("supportBtn");
  const btnText = document.getElementById("supportBtnText");
  const titleEl = document.getElementById("supportModalTitle");
  const intro1El = document.getElementById("supportIntro1");
  const intro2El = document.getElementById("supportIntro2");
  const cardLabelEl = document.getElementById("supportCardLabel");
  const copyBtn = document.getElementById("copyCardBtn");
  const copiedEl = document.getElementById("copyCardStatus");
  const closeBtn = document.getElementById("closeSupportBtn");
  const closeIcon = document.getElementById("closeSupportModal");

  if (btn) {
    btn.setAttribute("title", t.buttonLabel);
    btn.setAttribute("aria-label", t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `💙 ${t.buttonText}`;
  if (titleEl) (titleEl as HTMLElement).textContent = t.modalTitle;
  if (intro1El) (intro1El as HTMLElement).textContent = t.intro1;
  if (intro2El) (intro2El as HTMLElement).textContent = t.intro2;
  if (cardLabelEl) (cardLabelEl as HTMLElement).textContent = t.cardLabel;
  if (copyBtn) (copyBtn as HTMLElement).textContent = t.copy;
  if (copiedEl) (copiedEl as HTMLElement).textContent = t.copied;
  if (closeBtn) (closeBtn as HTMLElement).textContent = t.close;
  if (closeIcon) closeIcon.setAttribute("aria-label", t.close);
}

export function localizeClassesUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.classesUi : stringsEn.classesUi;

  const btn = document.getElementById("classesBtn");
  const btnText = document.getElementById("classesBtnText");
  const titleEl = document.getElementById("classesModalTitle");
  const closeIcon = document.getElementById("closeClassesModal");

  if (btn) {
    btn.setAttribute("title", t.buttonLabel);
    btn.setAttribute("aria-label", t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `🎓 ${t.buttonText}`;
  if (titleEl) (titleEl as HTMLElement).textContent = t.modalTitle;
  if (closeIcon) closeIcon.setAttribute("aria-label", t.closeLabel);
}

export function localizeStudentTasksUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.studentTasksUi : stringsEn.studentTasksUi;

  const btn = document.getElementById("studentTasksBtn");
  const btnText = document.getElementById("studentTasksBtnText");

  if (btn) {
    btn.setAttribute("title", t.buttonLabel);
    btn.setAttribute("aria-label", t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `📋 ${t.buttonText}`;
}

export function localizeNotificationsUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.notificationsUi : stringsEn.notificationsUi;

  const btn = document.getElementById("notificationsBtn");
  const btnText = document.getElementById("notificationsBtnText");
  const titleEl = document.getElementById("notificationsModalTitle");
  const closeIcon = document.getElementById("closeNotificationsModal");

  if (btn) {
    btn.setAttribute("title", t.buttonLabel);
    btn.setAttribute("aria-label", t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `🔔 ${t.buttonText}`;
  if (titleEl) (titleEl as HTMLElement).textContent = t.modalTitle;
  if (closeIcon) closeIcon.setAttribute("aria-label", t.closeLabel);
}

export function localizeFeedbackUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.feedbackUi : stringsEn.feedbackUi;

  const btn = document.getElementById("feedbackBtn");
  const btnText = document.getElementById("feedbackBtnText");
  const titleEl = document.getElementById("feedbackModalTitle");
  const closeIcon = document.getElementById("closeFeedbackModal");

  if (btn) {
    btn.setAttribute("title", t.buttonLabel);
    btn.setAttribute("aria-label", t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `✉️ ${t.buttonText}`;
  if (titleEl) (titleEl as HTMLElement).textContent = t.modalTitle;
  if (closeIcon) closeIcon.setAttribute("aria-label", t.closeLabel);
}

export function localizeStatsUI(lang: AppLang): void {
  const t = lang === "ru" ? stringsRu.statsUi : stringsEn.statsUi;

  const btn = document.getElementById("statsBtn");
  const btnText = document.getElementById("statsBtnText");
  const titleEl = document.getElementById("statsModalTitle");
  const closeIcon = document.getElementById("closeStatsModal");

  if (btn) {
    btn.setAttribute("title", t.buttonLabel);
    btn.setAttribute("aria-label", t.buttonLabel);
  }
  if (btnText) (btnText as HTMLElement).textContent = `📊 ${t.buttonText}`;
  if (titleEl) (titleEl as HTMLElement).textContent = t.modalTitle;
  if (closeIcon) closeIcon.setAttribute("aria-label", t.closeLabel);
}
