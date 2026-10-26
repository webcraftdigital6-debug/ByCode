/* Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly/core";
// Добавляем импорт стандартных блоков Blockly, чтобы категории тулбокса были заполнены
import "blockly/blocks";
import { blocks } from "./blocks/text";
import { blocks as algorithmBlocks } from "./blocks/algorithms";
import { forBlock } from "./generators/javascript";
import { forBlock as forBlockPython } from "./generators/python";
import { forBlock as forBlockLua } from "./generators/lua";
import { forBlock as forBlockPhp } from "./generators/php";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import {
  setupAppBootstrap,
  persistWorkspaceDebounced,
  setStorageIndicatorUpdater,
} from "./appBootstrap";
import { setupAuthBootstrap } from "./authBootstrap";
import { initAuthUI } from "./authUI";
import { addAuthChangeListener, getCurrentUser } from "./authClient";
import "./index.css";
import {
  initTaskValidation,
  setActiveTask,
  getActiveTask,
  getEntryTask,
  getFirstUnsolvedTask,
  setActiveDifficulty,
  getActiveDifficulty,
  tasks,
  syncTaskProgress,
} from "./tasks";
import type { TaskDifficulty } from "./tasks";
import { countNonShadowBlocks } from "./workspaceUtils";
import { saveTextFile } from "./fileSave";
import {
  registerCustomBlocks,
  importBlockFromJson,
  removeCustomBlock,
  getCustomBlocks,
  addCustomBlock,
} from "./customBlocks";
import {
  setAppLang,
  localizedToolbox,
  localizeImportUI,
  getAppLang,
  localizeTooltips,
  localizeAceSettingsPanel,
  localizeHelpUI,
  localizeSupportUI,
  localizeClassesUI,
  localizeStudentTasksUI,
  localizeNotificationsUI,
  localizeFeedbackUI,
  localizeStatsUI,
} from "./localization";
import {
  setupAceEditor,
  updateAceEditorFromWorkspace,
  getAceEditor,
  refreshAceUILanguage,
} from "./aceEditor";
import { clearOutput } from "./codeExecution";
// Поиск по тулбоксу (локализованный плагин)
import "./toolbox_search_localized";
import * as BlockDynamicConnection from "@blockly/block-dynamic-connection";
import { KeyboardNavigation } from "@blockly/keyboard-navigation";
import { Multiselect } from "@mit-app-inventor/blockly-plugin-workspace-multiselect";

import {
  initThemeUI,
  setAppTheme,
  getCurrentTheme,
  getBlocklyTheme,
  getGridColor,
  onThemeChange,
  type AppTheme,
} from "./ui/theme";
import {
  initImportModal,
} from "./ui/modals";
import { localizeTaskSidebarStaticUI } from "./ui/taskSidebarLocalization";
import {
  initHelpModalLocal,
  initSupportModalLocal,
} from "./ui/helpModalContent";
import {
  registerCustomBlockContextMenu,
  registerStandardBlockContextMenus,
} from "./ui/contextMenu";
import { initClassesUI } from "./ui/classes";
import { initStudentTasksUI } from "./ui/studentTasks";
import { initNotificationsUI } from "./ui/notifications";
import { initFeedbackUI } from "./ui/feedback";
import { initStatsUI } from "./ui/stats";
import {
  initMobileUI as initMobileUIModule,
  initMobileToolboxUI,
  toggleTaskSidebar as toggleTaskSidebarModule,
  setMobileMenuOpen,
  setMobileToolboxOpen,
  closeAllMobilePanels,
} from "./ui/mobile";
import {
  updateToolboxBlockCounterLabel,
  watchToolboxCounterLayout,
} from "./ui/toolboxCounter";
import { initDebugger } from "./ui/debugger";
import { setupEditorToolbarLayout } from "./ui/toolbarLayout";
import {
  initOnboardingReplay,
  localizeOnboardingUI,
  maybeStartOnboarding,
} from "./ui/onboarding";

// Добавлено: регистрация плагина угла
import { registerFieldAngle } from "@blockly/field-angle";

// Регистрируем поле угла до того, как начнём создавать блоки
registerFieldAngle();

try {
  KeyboardNavigation.registerKeyboardNavigationStyles();
  KeyboardNavigation.registerNavigationDeferringToolbox();
} catch {}

// Регистрируем блоки/генераторы после применения локали, чтобы подтянуть правильные строки

// Настройки локализации приложения
const defaultLang = getAppLang();

// Инициализируем язык до создания рабочей области
setAppLang(defaultLang);
// Локализуем статические подписи окна настроек Ace при старте
localizeAceSettingsPanel(defaultLang);

// Функции модалок вынесены в ui/modals.ts
// Контекстные меню вынесены в ui/contextMenu.ts

const ENABLE_KBD_NAV = true;

// Теперь, когда локаль установлена, регистрируем блоки и генераторы
Blockly.common.defineBlocks(blocks);
Blockly.common.defineBlocks(algorithmBlocks);
Object.assign(javascriptGenerator.forBlock, forBlock);
Object.assign(pythonGenerator.forBlock, forBlockPython);
Object.assign(luaGenerator.forBlock, forBlockLua);
Object.assign(phpGenerator.forBlock, forBlockPhp);
// Регистрием пользовательские блоки и контекстное меню удаления
for (const custom of getCustomBlocks()) {
  const type = String(custom?.definition?.type || "");
  const lang = (custom?.generatorLanguage || "javascript") as
    | "javascript"
    | "python"
    | "lua"
    | "php";
  ensureLetCompanionGetter(type, lang);
}
registerCustomBlocks();
registerCustomBlockContextMenu({
  onRefresh: () => refreshWorkspaceWithCustomToolbox(),
});

// Инициализация UI и внедрение Blockly
const outputDiv = document.getElementById("output");
const blocklyDiv = document.getElementById("blocklyDiv");
const importBtn = document.getElementById(
  "importBlockBtn",
) as HTMLButtonElement | null;
const importModal = document.getElementById(
  "importModal",
) as HTMLDivElement | null;
const closeModalBtn = document.getElementById(
  "closeModal",
) as HTMLSpanElement | null;
const cancelImportBtn = document.getElementById(
  "cancelImport",
) as HTMLButtonElement | null;
const confirmImportBtn = document.getElementById(
  "confirmImport",
) as HTMLButtonElement | null;
const blockJsonTextarea = document.getElementById(
  "blockJson",
) as HTMLTextAreaElement | null;
const blockGeneratorTextarea = document.getElementById(
  "blockGenerator",
) as HTMLTextAreaElement | null;

// Элементы UI задач: кнопка в шапке и левая панель
const taskSolutionBtn = document.getElementById(
  "taskSolutionBtn",
) as HTMLButtonElement | null;
const taskSidebar = document.getElementById(
  "taskSidebar",
) as HTMLDivElement | null;
const taskSidebarCloseBtn = document.getElementById(
  "taskSidebarCloseBtn",
) as HTMLButtonElement | null;
const mobileMenuBtn = document.getElementById(
  "mobileMenuBtn",
) as HTMLButtonElement | null;
const mobileMenuBackdrop = document.getElementById(
  "mobileMenuBackdrop",
) as HTMLDivElement | null;
const mobileMenuPanel = document.getElementById(
  "mobileMenuPanel",
) as HTMLDivElement | null;
const mobileMenuCloseBtn = document.getElementById(
  "mobileMenuCloseBtn",
) as HTMLButtonElement | null;
const mobileToolboxBackdrop = document.getElementById(
  "mobileToolboxBackdrop",
) as HTMLDivElement | null;
const TASK_DIFFICULTY_PREF_KEY = "task_difficulty_v1";

const presetLetBtn = document.getElementById(
  "presetLet",
) as HTMLButtonElement | null;
const presetConstBtn = document.getElementById(
  "presetConst",
) as HTMLButtonElement | null;
const presetReturnBtn = document.getElementById(
  "presetReturn",
) as HTMLButtonElement | null;
// Добавляем ссылки на элементы модального окна для перетаскивания
const modalContent = importModal?.querySelector(
  ".modal-content",
) as HTMLDivElement | null;
const modalHeader = importModal?.querySelector(
  ".modal-header",
) as HTMLDivElement | null;
// Новые элементы модалки
const genLangTabs = document.getElementById(
  "generatorLangTabs",
) as HTMLDivElement | null;
const genLangJsBtn = document.getElementById(
  "genLangJs",
) as HTMLButtonElement | null;
const genLangPyBtn = document.getElementById(
  "genLangPy",
) as HTMLButtonElement | null;
const genLangLuaBtn = document.getElementById(
  "genLangLua",
) as HTMLButtonElement | null;
const genLangPhpBtn = document.getElementById(
  "genLangPhp",
) as HTMLButtonElement | null;
// Кнопки выбора языка генератора в шапке
const genLangHeaderContainer = document.getElementById(
  "genLangHeaderSelect",
) as HTMLDivElement | null;
const genLangHeaderSelectedOption = document.getElementById(
  "selectedOption",
) as HTMLDivElement | null;
const genLangHeaderDropdownOptions = document.getElementById(
  "dropdownOptions",
) as HTMLDivElement | null;
const presetNotice = document.getElementById(
  "presetNotice",
) as HTMLDivElement | null;
const generatorErrorEl = document.getElementById(
  "generatorError",
) as HTMLDivElement | null;
const generatorOkEl = document.getElementById(
  "generatorOk",
) as HTMLDivElement | null;

// Элементы боковой панели задач
const checkTaskBtn = document.getElementById(
  "checkTaskBtn",
) as HTMLButtonElement | null;
const taskFeedbackEl = document.getElementById(
  "taskFeedback",
) as HTMLDivElement | null;
const taskStarsEl = document.getElementById(
  "taskStars",
) as HTMLDivElement | null;
const nextTaskBtn = document.getElementById(
  "nextTaskBtn",
) as HTMLButtonElement | null;
const prevTaskBtn = document.getElementById(
  "prevTaskBtn",
) as HTMLButtonElement | null;
const taskDifficultyBasicBtn = document.getElementById(
  "taskDifficultyBasic",
) as HTMLButtonElement | null;
const taskDifficultyFixbugsBtn = document.getElementById(
  "taskDifficultyFixbugs",
) as HTMLButtonElement | null;
const taskDifficultyAdvancedBtn = document.getElementById(
  "taskDifficultyAdvanced",
) as HTMLButtonElement | null;

// Обработчики кнопок панели задач
if (taskSolutionBtn) {
  taskSolutionBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTaskSidebarModule();
  });
}
if (taskSidebarCloseBtn) {
  taskSidebarCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTaskSidebarModule(false);
  });
}

// Элементы переключения темы теперь в ui/theme.ts

let selectedGeneratorLanguage: "javascript" | "python" | "lua" | "php" =
  "javascript";

// Состояние темы вынесено в ui/theme.ts

// Объявление рабочей области Blockly
let ws!: Blockly.WorkspaceSvg;
let __langSwitchTimer: number | null = null;

// Дебаунсим синхронизацию ACE редактора с workspace в rAF (объявление выше всех вызовов)
let __aceSyncScheduled = false;
function scheduleAceSync() {
  if (__aceSyncScheduled) return;
  __aceSyncScheduled = true;
  requestAnimationFrame(() => {
    __aceSyncScheduled = false;
    try {
      updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
    } catch {}
  });
}

let __uiResizeScheduled = false;
function scheduleUIResize() {
  // Открытие панели задач сдвигает вёрстку синхронно (padding у #blocklyDiv), а
  // бейдж «Создано с помощью Blockly» позиционируется по прямоугольнику тулбокса,
  // поэтому пересчитываем его сразу, не дожидаясь кадра перестройки Blockly.
  if (ws) updateToolboxBlockCounterLabel(ws);
  if (__uiResizeScheduled) return;
  __uiResizeScheduled = true;
  requestAnimationFrame(() => {
    __uiResizeScheduled = false;
    try {
      (Blockly as any).svgResize?.(ws);
    } catch {}
    try {
      const ed = typeof getAceEditor === "function" ? getAceEditor() : null;
      ed?.resize?.(true);
    } catch {}
  });
}

function ensureVariablesSetHasDefaultZero(block: Blockly.Block) {
  if (!block || (block as any).type !== "variables_set") return;
  try {
    const input =
      typeof (block as any).getInput === "function"
        ? (block as any).getInput("VALUE")
        : null;
    const conn = input?.connection || null;
    if (!conn) return;
    if (typeof conn.targetBlock === "function" && conn.targetBlock()) return;

    const ws = (block as any).workspace as Blockly.WorkspaceSvg | undefined;
    if (!ws) return;

    const shadow = ws.newBlock("math_number") as any;
    if (!shadow) return;
    if (typeof shadow.setShadow === "function") shadow.setShadow(true);
    if (typeof shadow.setFieldValue === "function")
      shadow.setFieldValue("0", "NUM");
    if (typeof shadow.initSvg === "function") shadow.initSvg();
    if (typeof shadow.render === "function") shadow.render();
    if (shadow.outputConnection && typeof conn.connect === "function") {
      conn.connect(shadow.outputConnection);
    }
  } catch {}
}

function registerVariablesSetDefaultValue(workspace: Blockly.WorkspaceSvg) {
  try {
    workspace.addChangeListener((e: any) => {
      let disabledEvents = false;
      try {
        if (!e || e.type !== (Blockly as any).Events?.BLOCK_CREATE) return;
        if (e.recordUndo === false) return;
        const ids: string[] = Array.isArray(e.ids) ? e.ids : [];
        if (ids.length === 0) return;
        (Blockly as any).Events?.disable?.();
        disabledEvents = true;
        for (const id of ids) {
          const b = workspace.getBlockById(id);
          if (b && (b as any).type === "variables_set")
            ensureVariablesSetHasDefaultZero(b);
        }
      } finally {
        if (disabledEvents) (Blockly as any).Events?.enable?.();
      }
    });
  } catch {}
}


// ===== конец блока счётчика блоков =====

// Мобильная логика вынесена в ui/mobile.ts

function setActiveGenLangButton(lang: "javascript" | "python" | "lua" | "php") {
  [genLangJsBtn, genLangPyBtn, genLangLuaBtn, genLangPhpBtn].forEach(
    (btn) => btn && btn.classList.remove("active"),
  );
  if (lang === "javascript") {
    if (genLangJsBtn) genLangJsBtn.classList.add("active");
  }
  if (lang === "python") {
    if (genLangPyBtn) genLangPyBtn.classList.add("active");
  }
  if (lang === "lua") {
    if (genLangLuaBtn) genLangLuaBtn.classList.add("active");
  }
  if (lang === "php") {
    if (genLangPhpBtn) genLangPhpBtn.classList.add("active");
  }
  // Синхронизация подписи и выбранного пункта в dropdown в шапке
  if (genLangHeaderSelectedOption) {
    const compact = window.matchMedia("(max-width: 530px)").matches;
    const label = compact
      ? lang === "javascript"
        ? "JS"
        : lang === "python"
          ? "Py"
          : lang === "lua"
            ? "Lua"
            : "PHP"
      : lang === "javascript"
        ? "JavaScript"
        : lang === "python"
          ? "Python"
          : lang === "lua"
            ? "Lua"
            : "PHP";
    genLangHeaderSelectedOption.textContent = label;
  }
  if (genLangHeaderDropdownOptions) {
    Array.from(
      genLangHeaderDropdownOptions.querySelectorAll(".option"),
    ).forEach((opt) => {
      opt.classList.toggle(
        "selected",
        (opt as HTMLElement).dataset.value === lang,
      );
    });
  }
}

function updatePresetsByGenLang() {
  const lang = selectedGeneratorLanguage;
  const letBtn = presetLetBtn;
  const constBtn = presetConstBtn;
  const returnBtn = presetReturnBtn;
  if (!letBtn || !constBtn || !returnBtn) return;

  const currentLang = getAppLang();

  if (lang === "javascript") {
    letBtn.disabled = false;
    letBtn.textContent =
      currentLang === "ru" ? "let переменная" : "let variable";
    constBtn.disabled = false;
    constBtn.textContent = currentLang === "ru" ? "константа" : "constant";
    returnBtn.disabled = false;
    returnBtn.textContent =
      currentLang === "ru" ? "return значение" : "return value";
    if (presetNotice) {
      presetNotice.style.display = "none";
      presetNotice.textContent = "";
    }
  } else if (lang === "python") {
    // Переменная, print и return
    letBtn.disabled = false;
    letBtn.textContent = currentLang === "ru" ? "переменная" : "variable";
    constBtn.disabled = false;
    constBtn.textContent = "print(...)";
    returnBtn.disabled = false;
    returnBtn.textContent =
      currentLang === "ru" ? "return значение" : "return value";
    if (presetNotice) {
      presetNotice.style.display = "none";
      presetNotice.textContent = "";
    }
  } else {
    // Язык Lua
    // local переменная, print и return
    letBtn.disabled = false;
    letBtn.textContent =
      currentLang === "ru" ? "local переменная" : "local variable";
    constBtn.disabled = false;
    constBtn.textContent = "print(...)";
    returnBtn.disabled = false;
    returnBtn.textContent =
      currentLang === "ru" ? "return значение" : "return value";
    if (presetNotice) {
      presetNotice.style.display = "none";
      presetNotice.textContent = "";
    }
  }
}

function validateGeneratorUI() {
  if (!blockGeneratorTextarea || !generatorErrorEl || !generatorOkEl) return;
  const code = blockGeneratorTextarea.value.trim();
  if (selectedGeneratorLanguage === "javascript" && code) {
    try {
      // Простая синтаксическая проверка через new Function
      new Function("block", "javascriptGenerator", "Order", code);
      generatorErrorEl.style.display = "none";
      generatorOkEl.style.display = "block";
      const t = (window as any)._currentLocalizedStrings;
      generatorOkEl.textContent =
        t && t.GeneratorValid ? t.GeneratorValid : "✓ Генератор корректен";
    } catch (error) {
      const msg =
        error && (error as any).message
          ? (error as any).message
          : String(error);
      const t = (window as any)._currentLocalizedStrings;
      generatorErrorEl.style.display = "block";
      generatorErrorEl.textContent = `${
        t?.GeneratorErrorPrefix || "Ошибка:"
      } ${msg}`;
      generatorOkEl.style.display = "none";
    }
  } else {
    generatorErrorEl.style.display = "none";
    generatorOkEl.style.display = "none";
  }
}

// Функция для установки placeholder в зависимости от языка
function setGeneratorPlaceholder(lang: "ru" | "en") {
  if (!blockGeneratorTextarea) return;
  const placeholders = {
    javascript: {
      ru: "Например:\nconst value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `console.log(${value});\\n`;",
      en: "Example:\nconst value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `console.log(${value});\\n`;",
    },
    python: {
      ru: "Например:\nconst value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
      en: "Example:\nconst value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
    },
    lua: {
      ru: "Например:\nconst value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
      en: "Example:\nconst value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
    },
    php: {
      ru: "Пример:\n// PHP генератор функции пишется на JS (как и для других языков).\nconst value = phpGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `echo ${value};\\n`;",
      en: "Example:\n// PHP generator function is written in JS (like other languages).\nconst value = phpGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `echo ${value};\\n`;",
    },
  };
  const placeholder =
    (placeholders as any)?.[selectedGeneratorLanguage]?.[lang] ||
    placeholders.javascript[lang];
  blockGeneratorTextarea.placeholder = placeholder;
}

function normalizeGenLang(
  raw: unknown,
): "javascript" | "python" | "lua" | "php" | null {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "javascript" || v === "python" || v === "lua" || v === "php")
    return v;
  return null;
}

function setGenLang(rawLang: unknown) {
  const lang = normalizeGenLang(rawLang);
  if (!lang) return;
  selectedGeneratorLanguage = lang;
  setActiveGenLangButton(lang);
  updatePresetsByGenLang();
  validateGeneratorUI();
  const currentLang = getAppLang();
  setGeneratorPlaceholder(currentLang);
  // Синхронизация Ace с workspace (без авто-выполнения)
  scheduleAceSync();
}

if (genLangJsBtn)
  genLangJsBtn.addEventListener("click", () => setGenLang("javascript"));
if (genLangPyBtn)
  genLangPyBtn.addEventListener("click", () => setGenLang("python"));
if (genLangLuaBtn)
  genLangLuaBtn.addEventListener("click", () => setGenLang("lua"));
if (genLangPhpBtn)
  genLangPhpBtn.addEventListener("click", () => setGenLang("php"));
// Обработчики для кастомного dropdown в шапке
if (
  genLangHeaderContainer &&
  genLangHeaderSelectedOption &&
  genLangHeaderDropdownOptions
) {
  // Открыть/закрыть список по клику на выбранной области
  genLangHeaderContainer.addEventListener("click", (e) => {
    const isOpen = genLangHeaderContainer.classList.contains("open");
    genLangHeaderContainer.classList.toggle("open", !isOpen);
    genLangHeaderDropdownOptions.style.display = isOpen ? "none" : "block";
  });

  // Выбор опции
  genLangHeaderDropdownOptions.querySelectorAll(".option").forEach((opt) => {
    opt.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const el = ev.currentTarget as HTMLElement | null;
      const value = el?.dataset?.value || el?.innerText || "";
      setGenLang(value);
      genLangHeaderContainer.classList.remove("open");
      genLangHeaderDropdownOptions.style.display = "none";
    });
  });

  // Закрытие по клику вне
  document.addEventListener("click", (evt) => {
    if (!genLangHeaderContainer.contains(evt.target as Node)) {
      genLangHeaderContainer.classList.remove("open");
      genLangHeaderDropdownOptions.style.display = "none";
    }
  });
}

if (importBtn) {
  importBtn.addEventListener("click", () => openImportModal());
}
// closeModalBtn, cancelImportBtn, confirmImportBtn — обработка внутри initImportModal (ui/modals.ts)

// Контекстные меню вынесены в ui/contextMenu.ts

function applyPreset(kind: "let" | "const" | "print" | "return") {
  if (!blockJsonTextarea) return;
  const lang = selectedGeneratorLanguage;

  if (lang === "javascript") {
    if (kind === "let") {
      const blockType = `let_variable`;
      const jsonDef = {
        type: blockType,
        message0: "let %1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "x" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
        tooltip: "let variable declaration",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'x';",
          "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';",
          "return 'let ' + name + ' = ' + value + ';\\n';",
        ].join("\n");
      }
    } else if (kind === "const") {
      const blockType = `const_constant`;
      const jsonDef = {
        type: blockType,
        message0: "const %1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "PI" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 200,
        tooltip: "constant declaration",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'PI';",
          "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';",
          "return 'const ' + name + ' = ' + value + ';\\n';",
        ].join("\n");
      }
    } else if (kind === "return") {
      const blockType = `return_value`;
      const jsonDef = {
        type: blockType,
        message0: "return %1",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 20,
        tooltip: "return with value",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null';",
          "return 'return ' + value + ';\\n';",
        ].join("\n");
      }
    }
  } else if (lang === "python") {
    if (kind === "let") {
      const blockType = `py_variable`;
      const jsonDef = {
        type: blockType,
        message0: "%1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "x" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
        tooltip: "Присваивание переменной (Python)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'x';",
          "const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return name + ' = ' + value + '\\n';",
        ].join("\n");
      }
    } else if (kind === "print") {
      const blockType = `py_print`;
      const jsonDef = {
        type: blockType,
        message0: "print(%1)",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 210,
        tooltip: "Печать значения (Python)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return `print(${value})\\n`;",
        ].join("\n");
      }
    } else if (kind === "return") {
      const blockType = `return_value`;
      const jsonDef = {
        type: blockType,
        message0: "return %1",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 20,
        tooltip: "Оператор return (Python)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'None';",
          "return 'return ' + value + '\\n';",
        ].join("\n");
      }
    }
  } else {
    // Генератор для Lua
    if (kind === "let") {
      const blockType = `lua_local_variable`;
      const jsonDef = {
        type: blockType,
        message0: "local %1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "x" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
        tooltip: "Локальная переменная (Lua)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'x';",
          "const value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return 'local ' + name + ' = ' + value + '\\n';",
        ].join("\n");
      }
    } else if (kind === "print") {
      const blockType = `lua_print`;
      const jsonDef = {
        type: blockType,
        message0: "print(%1)",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 210,
        tooltip: "Вывод значения (Lua)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return 'print(' + value + ')\\n';",
        ].join("\n");
      }
    } else if (kind === "return") {
      const blockType = `return_value`;
      const jsonDef = {
        type: blockType,
        message0: "return %1",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 20,
        tooltip: "Оператор return (Lua)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'nil';",
          "return 'return ' + value + '\\n';",
        ].join("\n");
      }
    }
  }

  updatePresetsByGenLang();
  validateGeneratorUI();
}

function buildLetGetterPreset(
  lang: "javascript" | "python" | "lua" | "php",
  sourceType: string,
): {
  definition: { type: string } & Record<string, unknown>;
  generator: string;
} | null {
  const getterType = `${sourceType}_get`;
  const definition = {
    type: getterType,
    message0: "%1",
    args0: [{ type: "field_input", name: "NAME", text: "x" }],
    output: ["String", "Number"],
    colour: 180,
    tooltip: "variable getter",
    helpUrl: "",
  } as { type: string } & Record<string, unknown>;

  if (lang === "javascript") {
    return {
      definition,
      generator: [
        "const name = block.getFieldValue('NAME') || 'x';",
        "return [name, Order.ATOMIC];",
      ].join("\n"),
    };
  }
  if (lang === "python") {
    return {
      definition,
      generator: [
        "const name = block.getFieldValue('NAME') || 'x';",
        "return [name, Order.ATOMIC];",
      ].join("\n"),
    };
  }
  if (lang === "lua") {
    return {
      definition,
      generator: [
        "const name = block.getFieldValue('NAME') || 'x';",
        "return [name, Order.ATOMIC];",
      ].join("\n"),
    };
  }
  if (lang === "php") {
    return {
      definition,
      generator: [
        "const name = block.getFieldValue('NAME') || 'x';",
        "return ['$' + name, Order.ATOMIC];",
      ].join("\n"),
    };
  }
  return null;
}

function ensureLetCompanionGetter(
  blockType: string,
  lang: "javascript" | "python" | "lua" | "php",
) {
  if (
    blockType !== "let_variable" &&
    blockType !== "py_variable" &&
    blockType !== "lua_local_variable"
  ) {
    return;
  }
  const preset = buildLetGetterPreset(lang, blockType);
  if (!preset) return;
  addCustomBlock(preset.definition, preset.generator, lang);
}
if (presetLetBtn)
  presetLetBtn.addEventListener("click", () => applyPreset("let"));
if (presetConstBtn)
  presetConstBtn.addEventListener("click", () => {
    const lang = selectedGeneratorLanguage;
    if (lang === "javascript") return applyPreset("const");
    return applyPreset("print");
  });
if (presetReturnBtn)
  presetReturnBtn.addEventListener("click", () => applyPreset("return"));
// удалено: presetVarBtn listener

// Инициализация состояний при загрузке
setActiveGenLangButton(selectedGeneratorLanguage);
updatePresetsByGenLang();
validateGeneratorUI();
{
  const currentLang = getAppLang();
  setGeneratorPlaceholder(currentLang);
}
// Синхронизируем кастомный dropdown с выбранным языком при старте
if (genLangHeaderSelectedOption && genLangHeaderDropdownOptions) {
  const compact = window.matchMedia("(max-width: 530px)").matches;
  const label = compact
    ? selectedGeneratorLanguage === "javascript"
      ? "JS"
      : selectedGeneratorLanguage === "python"
        ? "Py"
        : selectedGeneratorLanguage === "lua"
          ? "Lua"
          : "PHP"
    : selectedGeneratorLanguage === "javascript"
      ? "JavaScript"
      : selectedGeneratorLanguage === "python"
        ? "Python"
        : selectedGeneratorLanguage === "lua"
          ? "Lua"
          : "PHP";
  genLangHeaderSelectedOption.textContent = label;
  Array.from(genLangHeaderDropdownOptions.querySelectorAll(".option")).forEach(
    (opt) => {
      opt.classList.toggle(
        "selected",
        (opt as HTMLElement).dataset.value === selectedGeneratorLanguage,
      );
    },
  );
}

function syncGenLangHeaderDropdownLabels() {
  if (!genLangHeaderDropdownOptions) return;
  const compact = window.matchMedia("(max-width: 530px)").matches;
  Array.from(genLangHeaderDropdownOptions.querySelectorAll(".option")).forEach(
    (opt) => {
      const el = opt as HTMLElement;
      const value = el.dataset.value || "";
      const label = compact
        ? value === "javascript"
          ? "JS"
          : value === "python"
            ? "Py"
            : value === "lua"
              ? "Lua"
              : value === "php"
                ? "PHP"
                : el.textContent || ""
        : value === "javascript"
          ? "JavaScript"
          : value === "python"
            ? "Python"
            : value === "lua"
              ? "Lua"
              : value === "php"
                ? "PHP"
                : el.textContent || "";
      if (el.textContent !== label) el.textContent = label;
    },
  );
}

if (genLangHeaderSelectedOption) {
  window.addEventListener("resize", () => {
    const compact = window.matchMedia("(max-width: 530px)").matches;
    const lang = selectedGeneratorLanguage;
    const label = compact
      ? lang === "javascript"
        ? "JS"
        : lang === "python"
          ? "Py"
          : lang === "lua"
            ? "Lua"
            : "PHP"
      : lang === "javascript"
        ? "JavaScript"
        : lang === "python"
          ? "Python"
          : lang === "lua"
            ? "Lua"
            : "PHP";
    if (genLangHeaderSelectedOption.textContent !== label)
      genLangHeaderSelectedOption.textContent = label;
    syncGenLangHeaderDropdownLabels();
  });
}

syncGenLangHeaderDropdownLabels();

// Инициализация темы (вынесено в ui/theme.ts)
initThemeUI();

// Подписываемся на смену темы: обновляем Blockly workspace (или пересоздаём)
onThemeChange((theme) => {
  try {
    const canSetTheme = ws && typeof (ws as any).setTheme === "function";
    if (canSetTheme) {
      (ws as any).setTheme(getBlocklyTheme());
    } else {
      refreshWorkspaceWithCustomToolbox();
    }
  } catch {}
  scheduleAceSync();
});

// Инициализация UI локализации
localizeImportUI(defaultLang);
localizeTooltips(defaultLang);
// Локализуем кнопку и модалку справки
localizeHelpUI(defaultLang);
localizeSupportUI(defaultLang);
// Локализуем кнопку и модалку классов (дашборд учителя)
localizeClassesUI(defaultLang);
// Локализуем кнопку заданий ученика
localizeStudentTasksUI(defaultLang);
// Локализуем кнопку и модалку уведомлений учителя
localizeNotificationsUI(defaultLang);
// Локализуем кнопку и модалку обратной связи
localizeFeedbackUI(defaultLang);
// Локализуем кнопку и модалку статистики
localizeStatsUI(defaultLang);

// Дашборд учителя «Мои классы» (кнопка видна только авторизованным)
initClassesUI();
// Экран «Мои задания» для учеников
initStudentTasksUI();
// Лента уведомлений учителя + бейдж непрочитанных на кнопке «⋯»
initNotificationsUI();
// Обратная связь (доступна всем)
initFeedbackUI();
// Экран статистики: задачи, звёзды, серия дней, достижения
initStatsUI();
// Экспортируем список задач для диалога назначения задания в классах
try {
  (window as any).__BC_TASKS__ = tasks;
} catch {}

localizeTaskSidebarStaticUI(defaultLang);

// Определяем, была ли страница перезагружена
const __navEntries =
  (performance as any)?.getEntriesByType?.("navigation") || [];
const __isInitialReload =
  __navEntries[0]?.type === "reload" ||
  (performance as any)?.navigation?.type === 1;

// При перезагрузке очищаем локальный слепок рабочей области:
// для авторизованных актуальные данные подтянет сервер, для гостей
// свежая сессия начинается с чистого поля. Прогресс задач
// (task_progress_v1) НЕ трогаем — он должен переживать F5.
if (__isInitialReload) {
  try {
    window.localStorage?.removeItem("mainWorkspace");
  } catch {}
}

// Инициализация рабочей области при загрузке страницы
refreshWorkspaceWithCustomToolbox();
initMobileUIModule({
  onToolboxResize: () => scheduleUIResize(),
});
// Пошаговый отладчик (подсветка блоков при выполнении кода)
initDebugger({
  getWorkspace: () => ws,
  getLanguage: () => selectedGeneratorLanguage,
});

// Обработчик переключения языка
const langSwitchInput = document.getElementById(
  "langSwitchInput",
) as HTMLInputElement | null;
if (langSwitchInput) {
  // Установить состояние переключателя в соответствии с текущим языком
  langSwitchInput.checked = defaultLang === "en";

  langSwitchInput.addEventListener("change", () => {
    const newLang = langSwitchInput.checked ? "en" : "ru";
    if (__langSwitchTimer) clearTimeout(__langSwitchTimer);
    __langSwitchTimer = window.setTimeout(() => {
      setAppLang(newLang);
      // Обновляем рабочую область с локализованным тулбоксом
      try {
        const canUpdate = ws && typeof (ws as any).updateToolbox === "function";
        if (canUpdate) {
          (ws as any).updateToolbox(localizedToolbox(newLang));
        } else {
          refreshWorkspaceWithCustomToolbox();
        }
      } catch {}
      // Локализуем импорт-модалку
      localizeImportUI(newLang);
      // Локализуем тултипы и окно настроек Ace
      localizeTooltips(newLang);
      localizeAceSettingsPanel(newLang);
      // Локализуем кнопку и модалку справки
      localizeHelpUI(newLang);
      localizeSupportUI(newLang);
      // Локализуем кнопку и модалку классов
      localizeClassesUI(newLang);
      // Локализуем кнопку заданий ученика
      localizeStudentTasksUI(newLang);
      // Локализуем кнопку и модалку уведомлений учителя
      localizeNotificationsUI(newLang);
      // Локализуем кнопку и модалку обратной связи
      localizeFeedbackUI(newLang);
      // Локализуем кнопку и модалку статистики
      localizeStatsUI(newLang);
      // ACE строки (кнопка Save, статус-бар)
      refreshAceUILanguage();
      localizeTaskSidebarStaticUI(newLang);
      localizeOnboardingUI();
      try {
        setActiveTask(getActiveTask());
      } catch {}
      scheduleAceSync();
      requestAnimationFrame(() => updateToolboxBlockCounterLabel(ws));
    }, 120);
  });
}

// Аннотации загружаются лениво: Konva не входит в основной бандл и
// подгружается при первом включении режима аннотаций (кнопка «Аннотация»).
{
  const annotateToggleBtn = document.getElementById("annotateToggleBtn");
  if (annotateToggleBtn) {
    annotateToggleBtn.addEventListener(
      "click",
      () => {
        void import("./ui/annotations").then((m) =>
          m.setupAnnotationUI({ open: true }),
        );
      },
      { once: true },
    );
  }
}

// "Ещё" dropdown in header — secondary buttons
{
  const moreBtn = document.getElementById("headerMoreBtn");
  const morePanel = document.getElementById("headerMorePanel");
  if (moreBtn && morePanel) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = morePanel.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!morePanel.contains(e.target as Node) && e.target !== moreBtn) {
        morePanel.classList.remove("open");
        moreBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
}

// Инициализация Ace Editor
setupAceEditor(() => selectedGeneratorLanguage);

// Ряды кнопок над панелью кода: два плотных ряда, при сужении — три
setupEditorToolbarLayout();

// После инициализации Ace синхронизируем строки UI с текущим языком приложения
try {
  refreshAceUILanguage();
} catch {}

// Элементы split-layout (ресайзеры)
const pageContainer = document.getElementById(
  "pageContainer",
) as HTMLDivElement | null;
const outputPaneEl = document.getElementById(
  "outputPane",
) as HTMLDivElement | null;
const codePaneEl = document.getElementById("codePane") as HTMLDivElement | null;
const mobileVerticalResizer = document.getElementById(
  "mobileVerticalResizer",
) as HTMLDivElement | null;
const verticalResizer = document.getElementById(
  "verticalResizer",
) as HTMLDivElement | null;
const horizontalResizer = document.getElementById(
  "horizontalResizer",
) as HTMLDivElement | null;

// Делаем финальный resize после завершения transition по flex-basis
if (blocklyDiv) {
  blocklyDiv.addEventListener("transitionend", (e: TransitionEvent) => {
    if (e.propertyName === "flex-basis" || e.propertyName === "flex") {
      scheduleUIResize();
    }
  });
}
if (outputPaneEl) {
  outputPaneEl.addEventListener("transitionend", (e: TransitionEvent) => {
    if (e.propertyName === "flex-basis" || e.propertyName === "flex") {
      scheduleUIResize();
    }
  });
}

(function initSplitters() {
  if (!pageContainer || !blocklyDiv || !outputPaneEl) return;

  const V_KEY = "layout.split.v";
  const H_KEY = "layout.split.h";
  const MOBILE_H_KEY = "layout.mobile.outputHeightPx";
  const RESIZER_W = Math.max(4, verticalResizer?.offsetWidth || 6);
  const RESIZER_H = Math.max(4, horizontalResizer?.offsetHeight || 6);
  const MOBILE_RESIZER_H = Math.max(
    6,
    mobileVerticalResizer?.offsetHeight || 10,
  );

  function resizeAceSoon() {
    // Оставлено для совместимости: делегируем в единый планировщик
    scheduleUIResize();
  }

  function applyVerticalByRatio(ratio: number) {
    if (document.body.classList.contains("mobile")) return;
    // Ограничиваем ratio минимальными ширинами
    const total = (pageContainer as HTMLDivElement).clientWidth;
    const minLeft = 320; // минимальная ширина Blockly
    const minRight = 300; // минимальная ширина панели кода/вывода
    const minRatio = minLeft / total;
    const maxRatio = 1 - (minRight + RESIZER_W) / total;
    const r = Math.max(minRatio, Math.min(maxRatio, ratio));

    const leftPx = Math.round(r * total);
    const rightPx = Math.max(minRight, total - leftPx - RESIZER_W);

    (blocklyDiv as HTMLDivElement).style.flex = `0 0 ${leftPx}px`;
    (outputPaneEl as HTMLDivElement).style.flex = `0 0 ${rightPx}px`;

    // Перерисовываем зависимые виджеты (объединённо)
    scheduleUIResize();
  }

  function applyHorizontalByRatio(ratio: number) {
    if (!codePaneEl || !outputPaneEl) return;
    const totalH = (outputPaneEl as HTMLDivElement).clientHeight;
    const minTop = 140; // минимальная высота редактора (панель+код)
    const minBottom = 80; // минимальная высота окна вывода
    const minR = minTop / totalH;
    const maxR = 1 - (minBottom + RESIZER_H) / totalH;
    const r = Math.max(minR, Math.min(maxR, ratio));

    const topPx = Math.round(r * totalH);
    const bottomPx = Math.max(minBottom, totalH - topPx - RESIZER_H);

    codePaneEl.style.flex = `0 0 ${topPx}px`;
    (outputDiv as HTMLDivElement).style.flex = `0 0 ${bottomPx}px`;
    resizeAceSoon();
  }

  // Drag на Pointer Events (единый путь для мыши/тача)

  // Вертикальный drag (Pointer Events)
  if (verticalResizer) {
    const startV = (e: PointerEvent) => {
      if (document.body.classList.contains("mobile")) return;
      e.preventDefault();
      const rect = pageContainer.getBoundingClientRect();
      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const x = ev.clientX - rect.left;
        const ratio = x / rect.width;
        applyVerticalByRatio(ratio);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          verticalResizer.releasePointerCapture(e.pointerId);
        } catch {}
        // Сохраняем ratio
        const left = (blocklyDiv as HTMLDivElement).getBoundingClientRect()
          .width;
        const total = (pageContainer as HTMLDivElement).clientWidth;
        localStorage.setItem(V_KEY, String(left / total));
      };
      const onUp = () => cleanup();
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      try {
        verticalResizer.setPointerCapture(e.pointerId);
      } catch {}
    };
    verticalResizer.addEventListener("pointerdown", startV);
  }

  // Горизонтальный drag (Pointer Events)
  if (horizontalResizer && codePaneEl) {
    const startH = (e: PointerEvent) => {
      e.preventDefault();
      const rect = (outputPaneEl as HTMLDivElement).getBoundingClientRect();
      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const y = ev.clientY - rect.top;
        const ratio = y / rect.height;
        applyHorizontalByRatio(ratio);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          horizontalResizer.releasePointerCapture(e.pointerId);
        } catch {}
        // Сохраняем ratio
        const h = (codePaneEl as HTMLDivElement).getBoundingClientRect().height;
        const totalH = (outputPaneEl as HTMLDivElement).clientHeight;
        localStorage.setItem(H_KEY, String(h / totalH));
      };
      const onUp = () => cleanup();
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      try {
        horizontalResizer.setPointerCapture(e.pointerId);
      } catch {}
    };
    horizontalResizer.addEventListener("pointerdown", startH);
  }

  // Mobile: вертикальный стек (Blockly сверху, outputPane снизу) — drag по высоте
  if (mobileVerticalResizer) {
    const applyMobileHeightPx = (outputHeightPx: number) => {
      const isMobile = document.body.classList.contains("mobile");
      if (!isMobile) return;
      const rect = (pageContainer as HTMLDivElement).getBoundingClientRect();
      const minOutput = 140;
      const minBlockly = 160;
      const maxOutput = Math.max(
        minOutput,
        Math.floor(rect.height - minBlockly - MOBILE_RESIZER_H),
      );
      const h = Math.max(minOutput, Math.min(maxOutput, outputHeightPx));
      document.body.style.setProperty("--mobile-output-height", `${h}px`);
      scheduleUIResize();
    };

    const startM = (e: PointerEvent) => {
      e.preventDefault();
      const rect = (pageContainer as HTMLDivElement).getBoundingClientRect();
      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const y = ev.clientY - rect.top;
        const outputHeight = rect.height - y - MOBILE_RESIZER_H;
        applyMobileHeightPx(outputHeight);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          mobileVerticalResizer.releasePointerCapture(e.pointerId);
        } catch {}
        const computed = getComputedStyle(document.body).getPropertyValue(
          "--mobile-output-height",
        );
        const px = parseFloat(computed || "0");
        if (px > 0) localStorage.setItem(MOBILE_H_KEY, String(px));
      };
      const onUp = () => cleanup();
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      try {
        mobileVerticalResizer.setPointerCapture(e.pointerId);
      } catch {}
    };
    mobileVerticalResizer.addEventListener("pointerdown", startM);
  }

  // Применяем сохранённые ratio или значения по умолчанию
  const savedV = parseFloat(localStorage.getItem(V_KEY) || "0");
  if (savedV > 0 && savedV < 1) applyVerticalByRatio(savedV);
  const savedH = parseFloat(localStorage.getItem(H_KEY) || "0");
  if (savedH > 0 && savedH < 1) applyHorizontalByRatio(savedH);
  const savedMobileH = parseFloat(localStorage.getItem(MOBILE_H_KEY) || "0");
  if (savedMobileH > 0) {
    document.body.style.setProperty(
      "--mobile-output-height",
      `${savedMobileH}px`,
    );
  }

  // Ограничиваем перерасчёт на resize окна до одного rAF на кадр
  let __splitReapplyScheduled = false;
  window.addEventListener("resize", () => {
    if (__splitReapplyScheduled) return;
    __splitReapplyScheduled = true;
    requestAnimationFrame(() => {
      __splitReapplyScheduled = false;
      const v = parseFloat(localStorage.getItem(V_KEY) || "0");
      if (v > 0 && v < 1 && !document.body.classList.contains("mobile"))
        applyVerticalByRatio(v);
      const h = parseFloat(localStorage.getItem(H_KEY) || "0");
      if (h > 0 && h < 1) applyHorizontalByRatio(h);
      const mh = parseFloat(localStorage.getItem(MOBILE_H_KEY) || "0");
      if (mh > 0 && document.body.classList.contains("mobile")) {
        document.body.style.setProperty("--mobile-output-height", `${mh}px`);
      }
    });
  });
})();

if (blockGeneratorTextarea) {
  blockGeneratorTextarea.addEventListener("input", () => validateGeneratorUI());
}


// Инициализация модалки импорта (открытие/закрытие + drag) — в ui/modals.ts
const importModalApi = initImportModal({
  importModal: importModal as HTMLElement,
  modalContent,
  modalHeader,
  blockJsonTextarea,
  blockGeneratorTextarea,
  confirmImportBtn,
  cancelImportBtn,
  closeModalBtn,
  onConfirm: () => {
    if (!blockJsonTextarea) return;
    const json = blockJsonTextarea.value;
    const gen = blockGeneratorTextarea?.value?.trim() || undefined;
    const t = (window as any)._currentLocalizedStrings;
    if (
      selectedGeneratorLanguage === "javascript" &&
      generatorErrorEl &&
      generatorErrorEl.style.display !== "none"
    ) {
      alert(
        t?.FixJsGenerator ||
          "Исправьте ошибки в генераторе JavaScript перед импортом",
      );
      return;
    }
    const { success, error, blockType } = importBlockFromJson(
      json,
      gen,
      selectedGeneratorLanguage as any,
    );
    if (success) {
      if (blockType) {
        ensureLetCompanionGetter(
          blockType,
          selectedGeneratorLanguage as "javascript" | "python" | "lua" | "php",
        );
      }
      registerCustomBlocks();
      refreshWorkspaceWithCustomToolbox();
      importModalApi.close();
      if (outputDiv) {
        const p = document.createElement("p");
        p.textContent = `${
          t?.ImportedBlock || "Импортирован блок:"
        } ${blockType}`;
        outputDiv.appendChild(p);
      }
    } else {
      alert(`${t?.ImportErrorPrefix || "Ошибка импорта:"} ` + error);
    }
  },
});

function openImportModal() {
  importModalApi.open();
  setActiveGenLangButton(selectedGeneratorLanguage);
}

function closeImportModal() {
  importModalApi.close();
}

function refreshWorkspaceWithCustomToolbox() {
  const lang = getAppLang();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const currentState = ws
    ? Blockly.serialization.workspaces.save(ws as Blockly.Workspace)
    : null;
  if (ws) ws.dispose();
  const newWs = Blockly.inject(blocklyDiv!, {
    toolbox: localizedToolbox(lang),
    plugins: {
      connectionPreviewer: (BlockDynamicConnection as any).decoratePreviewer(),
    },
    grid: {
      spacing: 20,
      length: 3,
      colour: getGridColor(),
      snap: true,
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: isMobile ? 0.9 : 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
      pinch: true,
    },
    move: {
      scrollbars: { horizontal: true, vertical: true },
      drag: true,
      wheel: true,
    },
    trashcan: true,
    maxTrashcanContents: 32,
    comments: true,
    collapse: true,
    disable: true,
    sounds: true,
    maxBlocks: Infinity,
    maxInstances: { controls_if: 10, controls_repeat_ext: 5 },
    scrollbars: true,
    renderer: "geras",
    theme: getBlocklyTheme(),
    media: "media/",
    horizontalLayout: false,
    toolboxPosition: "start",
    css: true,
    rtl: false,
    oneBasedIndex: true,
    modalInputs: false,
    readOnly: false,
  });
  registerVariablesSetDefaultValue(newWs as Blockly.WorkspaceSvg);
  try {
    if (ENABLE_KBD_NAV)
      (window as any).__keyboardNav = new KeyboardNavigation(newWs);
  } catch {}
  try {
    const fm =
      (Blockly as any).getFocusManager?.() ||
      (newWs as any).getFocusManager?.() ||
      (newWs as any).focusManager;
    if (fm && typeof fm.focusNode === "function") {
      const origFocusNode = fm.focusNode.bind(fm);
      fm.focusNode = function (node: any) {
        if (!node || typeof node.canBeFocused !== "function") return;
        return origFocusNode(node);
      };
    }
  } catch {}
  try {
    newWs.addChangeListener(
      (BlockDynamicConnection as any).finalizeConnections,
    );
  } catch {}
  if (currentState)
    Blockly.serialization.workspaces.load(
      currentState,
      newWs as Blockly.Workspace,
      undefined,
    );
  ws = newWs as Blockly.WorkspaceSvg;
  if (isMobile) {
    try {
      const s = (ws as any).getScale?.();
      if (typeof s === "number" && Math.abs(s - 1) < 0.001) {
        (ws as any).setScale?.(0.9);
      }
    } catch {}
  }
  initMobileToolboxUI(ws);

  try {
    const multiOptions = {
      useDoubleClick: false,
      bumpNeighbours: false,
      multiFieldUpdate: true,
      workspaceAutoFocus: true,
      multiselectIcon: { hideIcon: true },
      multiSelectKeys: ["Shift"],
      multiselectCopyPaste: { crossTab: true, menu: true },
    } as any;
    const multiselect = new Multiselect(newWs);
    multiselect.init(multiOptions);
    (window as any).__multiselect = multiselect;
    try {
      const controls = (multiselect as any).controls_;
      if (controls && typeof controls.updateMultiselect === "function") {
        const origUpdate = controls.updateMultiselect.bind(controls);
        controls.updateMultiselect = function () {
          try {
            origUpdate();
          } catch {}
        };
      }
      const origSetSelected = (Blockly as any).common.setSelected.bind(
        (Blockly as any).common,
      );
      (Blockly as any).common.setSelected = function (sel: any) {
        try {
          return origSetSelected(sel);
        } catch {}
      };
    } catch {}
  } catch {}

  // Инициализация авторизации и переключения провайдера хранения
  setupAuthBootstrap(ws as Blockly.Workspace);
  initAuthUI();
  // Инициализация загрузки/сохранения через bootstrap-модуль (не блокирует UI)
  setupAppBootstrap(ws, { shouldLoad: !__isInitialReload });

  // Синхронизация прогресса задач с сервером (после определения авторизации):
  // подтягивает серверные решения, льёт локальные наверх, обновляет UI задач
  void syncTaskProgress();
  // Повторная синхронизация после логина (прогресс гостя уезжает на сервер)
  addAuthChangeListener((user) => {
    if (user) void syncTaskProgress();
    // Move feedback/stats to dropdown after login; keep in header before login
    const moreWrap = document.getElementById("headerMoreWrap");
    const morePanel = document.getElementById("headerMorePanel");
    const feedbackBtn = document.getElementById("feedbackBtn");
    const statsBtn = document.getElementById("statsBtn");
    const onboardingBtn = document.getElementById("onboardingReplayBtn");
    if (moreWrap && morePanel && feedbackBtn && statsBtn) {
      if (user) {
        // Authenticated: show dropdown, move feedback+stats into it
        moreWrap.style.display = "";
        morePanel.insertBefore(feedbackBtn, onboardingBtn);
        morePanel.insertBefore(statsBtn, onboardingBtn);
      } else {
        // Guest: hide dropdown, keep feedback+stats in header
        moreWrap.style.display = "none";
        const iconBtns = moreWrap.parentElement;
        if (iconBtns) {
          iconBtns.insertBefore(feedbackBtn, moreWrap);
          iconBtns.insertBefore(statsBtn, moreWrap);
        }
      }
    }
  });
  // Apply initial header layout based on current auth state
  {
    const user = getCurrentUser();
    const moreWrap = document.getElementById("headerMoreWrap");
    const morePanel = document.getElementById("headerMorePanel");
    const feedbackBtn = document.getElementById("feedbackBtn");
    const statsBtn = document.getElementById("statsBtn");
    const onboardingBtn = document.getElementById("onboardingReplayBtn");
    if (moreWrap && morePanel && feedbackBtn && statsBtn) {
      if (user) {
        moreWrap.style.display = "";
        morePanel.insertBefore(feedbackBtn, onboardingBtn);
        morePanel.insertBefore(statsBtn, onboardingBtn);
      } else {
        moreWrap.style.display = "none";
        const iconBtns = moreWrap.parentElement;
        if (iconBtns) {
          iconBtns.insertBefore(feedbackBtn, moreWrap);
          iconBtns.insertBefore(statsBtn, moreWrap);
        }
      }
    }
  }

  // Подключаем обновление индикатора активного хранилища и времени последнего сохранения
  const storageIndicatorEl = document.getElementById("storageIndicator");
  if (storageIndicatorEl) {
    setStorageIndicatorUpdater(({ kind, lastSavedAt }) => {
      const label = kind === "server" ? "Сервер" : "Локально";
      let suffix = "";
      if (lastSavedAt) {
        const d = new Date(lastSavedAt);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        suffix = ` • ${hh}:${mm}:${ss}`;
      }
      (storageIndicatorEl as HTMLElement).textContent = `${label}${suffix}`;
      const titleBase = "Активное хранилище и время последнего сохранения";
      (storageIndicatorEl as HTMLElement).setAttribute(
        "title",
        lastSavedAt
          ? `${titleBase}: ${new Date(lastSavedAt).toLocaleString()}`
          : titleBase,
      );
    });
  }

  if (ws) {
    let __ensuringInputShadows = false;
    const ensureInputShadows = () => {
      if (__ensuringInputShadows) return;
      __ensuringInputShadows = true;
      const eventsApi = (Blockly as any).Events;
      const hadEventsApi =
        eventsApi &&
        typeof eventsApi.disable === "function" &&
        typeof eventsApi.enable === "function";
      try {
        if (hadEventsApi) eventsApi.disable();
        const cleanupOrphanAutoShadows = () => {
          const all = ws.getAllBlocks(false);
          for (const b of all) {
            const anyB = b as any;
            const isShadow =
              typeof anyB.isShadow === "function" ? anyB.isShadow() : false;
            if (!isShadow) continue;
            if (anyB.data !== "__auto_shadow_placeholder__") continue;
            const parent =
              typeof anyB.getParent === "function" ? anyB.getParent() : null;
            if (parent) continue;
            try {
              b.dispose(false);
            } catch {}
          }
        };

        cleanupOrphanAutoShadows();

        const blocks = ws.getAllBlocks(false);
        for (const b of blocks) {
          const t = (b as any).type;
          let shadowType: string | null = null;
          let shadowFieldName: string | null = null;
          let shadowFieldValue: string | null = null;

          if (t === "lists_create_with") {
            shadowType = "math_number";
            shadowFieldName = "NUM";
            shadowFieldValue = "0";
          } else if (t === "text_join") {
            shadowType = "text";
            shadowFieldName = "TEXT";
            shadowFieldValue = "";
          } else {
            continue;
          }

          const inputList = (b as any).inputList as Blockly.Input[] | undefined;
          if (!Array.isArray(inputList)) continue;
          for (const input of inputList) {
            const name = (input as any)?.name;
            if (typeof name !== "string" || !/^ADD\d+$/.test(name)) continue;
            const conn = (input as any)
              ?.connection as Blockly.Connection | null;
            if (!conn || typeof (conn as any).targetBlock !== "function")
              continue;
            if ((conn as any).targetBlock()) continue;
            const shadow = ws.newBlock(shadowType) as any;
            if (typeof shadow.setShadow === "function") shadow.setShadow(true);
            shadow.data = "__auto_shadow_placeholder__";
            if (
              typeof shadow.setFieldValue === "function" &&
              shadowFieldName &&
              shadowFieldValue !== null
            ) {
              shadow.setFieldValue(shadowFieldValue, shadowFieldName);
            }
            if (typeof shadow.initSvg === "function") shadow.initSvg();
            if (typeof shadow.render === "function") shadow.render();
            const outConn =
              shadow.outputConnection as Blockly.Connection | null;
            if (outConn && typeof outConn.connect === "function") {
              outConn.connect(conn);
            }
          }
        }
      } catch {
      } finally {
        if (hadEventsApi) eventsApi.enable();
        __ensuringInputShadows = false;
      }
    };

    const mediaPath =
      ((ws as any).options?.pathToMedia as string | undefined) ||
      ((ws as any).options?.media as string | undefined) ||
      "media/";
    const clickSoundUrl = (() => {
      const base = mediaPath.endsWith("/") ? mediaPath : `${mediaPath}/`;
      try {
        return new URL(`${base}click.mp3`, window.location.href).toString();
      } catch {
        return `${base}click.mp3`;
      }
    })();
    const playClickSound = (() => {
      let audio: HTMLAudioElement | null = null;
      return () => {
        try {
          if (!audio) audio = new Audio(clickSoundUrl);
          audio.currentTime = 0;
          const p = audio.play();
          if (p && typeof (p as any).catch === "function")
            (p as any).catch(() => {});
        } catch {}
      };
    })();

    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      // сохраняем через провайдер с дебаунсом
      persistWorkspaceDebounced(ws);
    });
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (
        e.isUiEvent ||
        e.type == Blockly.Events.FINISHED_LOADING ||
        ws.isDragging()
      ) {
        return;
      }
      const et = (e as any).type;
      const createType =
        (Blockly as any).Events?.BLOCK_CREATE ||
        ((Blockly as any).Events?.BLOCK_CREATE as any);
      const isCreate =
        et === createType || et === "create" || et === "block_create";
      if (isCreate) {
        try {
          const ids: string[] = Array.isArray((e as any).ids)
            ? (e as any).ids
            : [];
          const created = ids
            .map((id) => ws.getBlockById(id))
            .filter(Boolean) as Blockly.Block[];
          const hasRealCreated = created.some((b) => {
            const anyB = b as any;
            const isShadow =
              typeof anyB.isShadow === "function" ? anyB.isShadow() : false;
            if (isShadow) return false;
            if (anyB.data === "__auto_shadow_placeholder__") return false;
            return true;
          });
          if (hasRealCreated) playClickSound();
        } catch {}
      }
      ensureInputShadows();
      // Авто-разворачивание и инициализация мультитекстового поля

      // Держим Ace в синхронизации (без авто-выполнения)
      scheduleAceSync();

      // Если блок был удален, очищаем окно вывода
      // Тип события удаления может называться 'BLOCK_DELETE' в текущих версиях Blockly
      if (
        (e as any).type === (Blockly as any).Events?.BLOCK_DELETE ||
        (e as any).type === "block_delete"
      ) {
        try {
          updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
        } catch {}
        const out = document.getElementById("output") as HTMLElement | null;
        clearOutput(out);
      }

      // Обновляем счётчик блоков
      updateToolboxBlockCounterLabel(ws);
    });
  }
  // Инициализируем проверку задач во внешнем модуле
  initTaskValidation(ws, {
    checkButton: checkTaskBtn,
    feedbackEl: taskFeedbackEl,
    starsEl: taskStarsEl,
    nextButton: nextTaskBtn,
    prevButton: prevTaskBtn,
  });
  const setDifficultyUI = () => {
    const diff = getActiveDifficulty();
    // Цвета кнопок фиксированы («Найди ошибку» — акцентная),
    // активный уровень подсвечивается рамкой (is-active)
    const toggle = (btn: HTMLButtonElement | null, key: TaskDifficulty) => {
      if (!btn) return;
      btn.classList.toggle("is-active", diff === key);
    };
    toggle(taskDifficultyBasicBtn, "basic");
    toggle(taskDifficultyFixbugsBtn, "fixbugs");
    toggle(taskDifficultyAdvancedBtn, "advanced");
  };
  const activateDifficulty = (difficulty: TaskDifficulty) => {
    setActiveDifficulty(difficulty);
    setActiveTask(getEntryTask(difficulty));
    setDifficultyUI();
    if (taskSidebar) taskSidebar.classList.remove("mode-select");
    try {
      localStorage.setItem(TASK_DIFFICULTY_PREF_KEY, difficulty);
    } catch {}
  };
  if (taskDifficultyBasicBtn) {
    taskDifficultyBasicBtn.addEventListener("click", () => {
      activateDifficulty("basic");
    });
  }
  if (taskDifficultyFixbugsBtn) {
    taskDifficultyFixbugsBtn.addEventListener("click", () => {
      activateDifficulty("fixbugs");
    });
  }
  if (taskDifficultyAdvancedBtn) {
    taskDifficultyAdvancedBtn.addEventListener("click", () => {
      activateDifficulty("advanced");
    });
  }
  try {
    const savedDifficulty = localStorage.getItem(TASK_DIFFICULTY_PREF_KEY);
    if (
      savedDifficulty === "basic" ||
      savedDifficulty === "fixbugs" ||
      savedDifficulty === "advanced"
    ) {
      const restored: TaskDifficulty = savedDifficulty;
      setActiveDifficulty(restored);
      setActiveTask(getEntryTask(restored));
      if (taskSidebar) taskSidebar.classList.remove("mode-select");
      // Статус авторизованности ещё не известен (запрос /api/auth/me в пути):
      // как только выяснится, что пользователь зарегистрирован и всё ещё
      // стоит на первой задаче уровня — переключаем на первую нерешённую.
      const guestEntry = getActiveTask();
      let entryResumed = false;
      addAuthChangeListener((user) => {
        if (entryResumed || !user || getActiveTask() !== guestEntry) return;
        entryResumed = true;
        const resume = getFirstUnsolvedTask(restored);
        if (resume !== guestEntry) setActiveTask(resume);
      });
    }
  } catch {}
  setDifficultyUI();
  // Первичная синхронизация после инициализации workspace (без авто-выполнения)
  scheduleAceSync();
  // Начальная отрисовка счётчика
  // На всякий случай немного отложим, чтобы DOM тулбокса гарантированно создался
  requestAnimationFrame(() => updateToolboxBlockCounterLabel(ws));
  watchToolboxCounterLayout(() => {
    if (ws) updateToolboxBlockCounterLabel(ws);
  });
}
const saveXmlBtn = document.getElementById(
  "saveXmlBtn",
) as HTMLButtonElement | null;
const loadXmlBtn = document.getElementById(
  "loadXmlBtn",
) as HTMLButtonElement | null;
const loadXmlInput = document.getElementById(
  "loadXmlInput",
) as HTMLInputElement | null;
if (saveXmlBtn) {
  saveXmlBtn.addEventListener("click", async () => {
    if (!ws) return;
    try {
      const xmlDom = Blockly.Xml.workspaceToDom(ws);
      const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
      const suggested = `workspace_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19)}.xml`;
      await saveTextFile({
        suggestedName: suggested,
        text: xmlText,
        description: "Blockly XML",
        accept: { "application/xml": [".xml"] },
        mime: "application/xml;charset=utf-8",
        promptLabel: getAppLang() === "ru" ? "Имя файла:" : "File name:",
      });
    } catch (e) {
      console.error("Не удалось сохранить XML", e);
    }
  });
}
if (loadXmlBtn) {
  loadXmlBtn.addEventListener("click", () => {
    if (!loadXmlInput) return;
    loadXmlInput.value = "";
    loadXmlInput.click();
  });
}
if (loadXmlInput) {
  loadXmlInput.addEventListener("change", async () => {
    if (!ws || !loadXmlInput.files || loadXmlInput.files.length === 0) return;
    const file = loadXmlInput.files[0];
    try {
      const text = await file.text();
      // Парсим XML через DOMParser (для совместимости), а не через Blockly.Xml.textToDom
      const doc = new DOMParser().parseFromString(text, "text/xml");
      const xml = doc.documentElement as Element;
      Blockly.Events.disable();
      ws.clear();
      Blockly.Xml.domToWorkspace(xml, ws);
      Blockly.Events.enable();
      // Синхронизируем Ace после загрузки
      scheduleAceSync();
      // Обновить счётчик блоков
      updateToolboxBlockCounterLabel(ws);
      // Сохраняем через выбранный провайдер (bootstrap)
      persistWorkspaceDebounced(ws);
    } catch (e) {
      console.error("Load XML failed", e);
    }
  });
}

// Логика проверки задач перенесена в ./tasks и инициализируется через initTaskValidation(ws, ...)

// Обработчик кнопки проверки навешивается в tasks.ts через initTaskValidation

// ===== Предупреждение о потере данных при перезагрузке страницы =====
/**
 * Проверяет, есть ли несохранённые данные в рабочей области или редакторе
 */
function hasUnsavedChanges(): boolean {
  // Проверяем блоки в workspace
  const hasBlocks =
    ws?.getAllBlocks(false).filter((b: any) => !b.isShadow()).length > 0;

  // Проверяем код в ACE редакторе
  const aceEditor = getAceEditor();
  const val = aceEditor ? aceEditor.getValue() : "";
  const hasCode = val.trim().length > 0;

  return hasBlocks || hasCode;
}

/**
 * Обработчик события beforeunload для предупреждения о потере данных
 */
function handleBeforeUnload(event: BeforeUnloadEvent): string | undefined {
  if (hasUnsavedChanges()) {
    const lang = getAppLang();
    const message =
      lang === "ru"
        ? "У вас есть несохранённые изменения. Вы уверены, что хотите покинуть страницу?"
        : "You have unsaved changes. Are you sure you want to leave this page?";

    // Стандартный способ для современных браузеров
    event.preventDefault();
    event.returnValue = message;
    return message;
  }
  return undefined;
}

// Подключаем обработчик предупреждения о потере данных
window.addEventListener("beforeunload", handleBeforeUnload);


// Вызываем инициализацию модального окна справки
initHelpModalLocal();
initSupportModalLocal();
// Онбординг-тур: кнопка повторного запуска + автопоказ первому визиту
initOnboardingReplay();
maybeStartOnboarding();
