import type * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import type { SupportedLanguage } from "./types/messages";
import { getAppLang, getAceUIStrings } from "./localization";
import { saveTextFile } from "./fileSave";
import { lintPythonCode } from "./pythonLinter";
import {
  annotateRenamedVariables,
  type RenameNoteGenerator,
} from "./variableRenameNotes";

// Импорты Ace и базовая настройка путей/расширений
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-beautify";
import "ace-builds/src-noconflict/ext-keybinding_menu";
import "ace-builds/src-noconflict/keybinding-vim";
import "ace-builds/src-noconflict/keybinding-emacs";
import "ace-builds/src-noconflict/snippets/javascript";
import "ace-builds/src-noconflict/snippets/python";
import "ace-builds/src-noconflict/snippets/lua";
import "ace-builds/src-noconflict/snippets/php";
// Режимы и темы импортируются статически: они регистрируются в том же
// экземпляре Ace через бандлер. Динамическая загрузка script-инжектом
// ненадёжна (404/COEP) — из-за неё сессия оставалась в mode-javascript
// и валидатор JS-синтаксиса помечал корректный Python/Lua/PHP-код ошибками.
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-lua";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-monokai";

(ace as any).config.set("basePath", "ace");
(ace as any).config.set("modePath", "ace");
(ace as any).config.set("themePath", "ace");
(ace as any).config.set("workerPath", "ace");

type AceMode = { $id?: string } | any;
interface AceDocument {
  getAllLines(): string[];
}
interface AceSession {
  setMode(mode: any): void;
  getMode(): AceMode;
  getLength(): number;
  setTabSize(size: number): void;
  setUseWrapMode(use: boolean): void;
  setUseSoftTabs(use: boolean): void;
  on(event: string, handler: (...args: any[]) => void): void;
  getDocument(): AceDocument;
  addMarker(range: any, clazz: string, type: string, inFront?: boolean): number;
  removeMarker(id: number): void;
  setAnnotations(
    annotations: {
      row: number;
      column: number;
      text: string;
      type: "error" | "warning" | "info";
    }[],
  ): void;
}
interface AceSelection {
  on(event: string, handler: (...args: any[]) => void): void;
}
interface AceEditor {
  session: AceSession;
  selection: AceSelection;
  setOptions(options: {
    enableBasicAutocompletion?: boolean;
    enableLiveAutocompletion?: boolean;
    enableSnippets?: boolean;
    fontSize?: number;
    showGutter?: boolean;
    highlightActiveLine?: boolean;
  }): void;
  setShowFoldWidgets(show: boolean): void;
  setShowInvisibles(show: boolean): void;
  setTheme(theme: string): void;
  setFontSize(size: number): void;
  setKeyboardHandler(handler: string | null): void;
  setValue(value: string, cursorPos?: number): void;
  getValue(): string;
  execCommand(command: string): void;
  on(event: string, handler: (...args: any[]) => void): void;
  setOption(name: string, value: any): void;
  setShowPrintMargin(show: boolean): void;
  setHighlightActiveLine(show: boolean): void;
  getCursorPosition(): { row: number; column: number };
  resize(force?: boolean): void;
}

let aceEditor: AceEditor | null = null;

const ACE_SETTINGS_KEY = "ace_editor_settings";

interface AceSettings {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  wrap?: boolean;
  showInvisibles?: boolean;
  highlightActiveLine?: boolean;
  showPrintMargin?: boolean;
  showGutter?: boolean;
  useSoftTabs?: boolean;
  showFoldWidgets?: boolean;
  keybinding?: string;
}

function loadAceSettings(): AceSettings {
  try {
    const saved = localStorage.getItem(ACE_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  } catch {
    return {};
  }
}

function saveAceSettings(settings: Partial<AceSettings>) {
  try {
    const current = loadAceSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(ACE_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // игнорируем ошибки сохранения (например, запрет на localStorage)
  }
}

// Состояние подсветки парных фигурных скобок
let braceHighlightEnabled = false;
let braceMarkerIds: number[] = [];
// Отложенное содержимое для Ace до инициализации редактора
let pendingAceInit: { code: string; mode: any } | null = null;

function clearBraceMarkers() {
  if (!aceEditor) return;
  const session = aceEditor.session;
  for (const id of braceMarkerIds) {
    try {
      session.removeMarker(id);
    } catch {}
  }
  braceMarkerIds = [];
}

function updateBraceMarkers() {
  if (!aceEditor) return;
  clearBraceMarkers();
  if (!braceHighlightEnabled) return;

  const session = aceEditor.session;
  const doc = session.getDocument();
  const lines: string[] = doc.getAllLines();
  const Range = (ace as any).require("ace/range").Range;

  type Open = { row: number; col: number; depth: number };
  const stack: Open[] = [];
  let depth = 0;

  let inBlockComment = false;
  let inString: '"' | "'" | "`" | null = null;
  let stringEscape = false;

  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    let inLineComment = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const prev = i > 0 ? line[i - 1] : "";
      const next = i + 1 < line.length ? line[i + 1] : "";

      // Обрабатываем конец блочного комментария
      if (inBlockComment) {
        if (prev === "*" && ch === "/" && i > 0) {
          inBlockComment = false;
        }
        continue;
      }

      // Обрабатываем однострочные комментарии //
      if (!inString && !inLineComment && ch === "/" && next === "/") {
        inLineComment = true; // оставшуюся часть строки игнорируем
        break;
      }
      // Обрабатываем начало блочного комментария /* */
      if (!inString && ch === "/" && next === "*") {
        inBlockComment = true;
        i++; // пропускаем '*'
        continue;
      }

      // Обрабатываем строки (' " `) с экранированием
      if (inString) {
        if (stringEscape) {
          stringEscape = false;
          continue;
        }
        if (ch === "\\") {
          stringEscape = true;
          continue;
        }
        if (ch === inString) {
          inString = null;
        }
        continue;
      } else {
        if (ch === '"' || ch === "'" || ch === "`") {
          inString = ch as any;
          stringEscape = false;
          continue;
        }
      }

      if (ch === "{") {
        depth += 1;
        stack.push({ row, col: i, depth });
        // Добавляем маркер для самой открывающей скобки
        const level = ((depth - 1) % 6) + 1; // 1..6
        const openRange = new Range(row, i, row, i + 1);
        try {
          const idOpen = session.addMarker(
            openRange,
            `brace-level-${level}`,
            "text",
            true,
          );
          braceMarkerIds.push(idOpen);
        } catch {}
      } else if (ch === "}") {
        const open = stack.pop();
        const level = open ? ((open.depth - 1) % 6) + 1 : ((depth - 1) % 6) + 1;
        // Добавляем маркер для закрывающей скобки
        const closeRange = new Range(row, i, row, i + 1);
        try {
          const idClose = session.addMarker(
            closeRange,
            `brace-level-${level}`,
            "text",
            true,
          );
          braceMarkerIds.push(idClose);
        } catch {}
        if (depth > 0) depth -= 1;
      }
    }
  }
}

export function getAceEditor(): AceEditor | null {
  return aceEditor;
}

// Синхронизация ACE редактора с текущей рабочей областью Blockly
export function updateAceEditorFromWorkspace(
  workspace: Blockly.Workspace | Blockly.WorkspaceSvg,
  lang: SupportedLanguage,
) {
  // Определяем генератор и режим подсветки
  let code = "";
  let mode: any = "ace/mode/javascript";
  let generator: RenameNoteGenerator = javascriptGenerator;
  try {
    if (lang === "python") {
      generator = pythonGenerator;
      code = pythonGenerator.workspaceToCode(workspace);
      mode = "ace/mode/python";
    } else if (lang === "lua") {
      generator = luaGenerator;
      code = luaGenerator.workspaceToCode(workspace);
      mode = "ace/mode/lua";
    } else if (lang === "php") {
      generator = phpGenerator;
      code = phpGenerator.workspaceToCode(workspace);
      mode = { path: "ace/mode/php", inline: true };
    } else {
      code = javascriptGenerator.workspaceToCode(workspace);
      mode = "ace/mode/javascript";
    }
  } catch (e) {
    // На случай ошибок генерации — не прерываем выполнение
    code = "" + (code || "");
  }

  // Поясняющие комментарии там, где Blockly изменил имя переменной
  // (служебное слово языка или конфликт с функцией).
  code = annotateRenamedVariables(code, workspace, generator, lang);

  // Сбрасываем подсветку фигурных скобок для языков без { }
  if (lang === "python" || lang === "lua") {
    if (braceHighlightEnabled) {
      braceHighlightEnabled = false;
      try {
        const btn = document.getElementById(
          "aceBracesBtn",
        ) as HTMLButtonElement | null;
        if (btn) {
          btn.classList.remove("active");
          btn.setAttribute("aria-pressed", "false");
        }
      } catch {}
      clearBraceMarkers();
    }
  }

  // Если редактор ещё не инициализирован — запомним и применим позже
  if (!aceEditor) {
    pendingAceInit = { code, mode };
    return;
  }

  // Применяем режим и содержимое, избегая лишних обновлений
  try {
    const session = aceEditor.session;
    if (session) session.setMode(mode);
    const current = aceEditor.getValue?.() ?? "";
    // Пустая рабочая область даёт пустой код: набранную в редакторе программу
    // не затираем — задачи можно сдавать и кодом, без блоков.
    const keepTypedCode = code.trim() === "" && current.trim() !== "";
    if (!keepTypedCode && current !== code) {
      // -1 чтобы не прыгал курсор к концу
      aceEditor.setValue(code, -1);
    }
    const shown = keepTypedCode ? current : code;
    // Python: аннотации pyflakes (опечатки, undefined-имена, синтаксис)
    if (lang === "python") {
      schedulePythonLint(shown);
    } else {
      cancelPythonLint();
      // Для языков без штатного воркера-линтера очищаем устаревшие аннотации.
      // Для JS/TS аннотациями управляет воркер Ace — не трогаем.
      if (lang !== "javascript" && lang !== "typescript") {
        session?.setAnnotations([]);
      }
    }
  } catch {}
}

// ---------- pyflakes-аннотации для Python ----------
let pythonLintTimer: ReturnType<typeof setTimeout> | null = null;
let pythonLintSeq = 0;

function schedulePythonLint(code: string) {
  if (!aceEditor) return;
  if (pythonLintTimer) clearTimeout(pythonLintTimer);
  const mySeq = ++pythonLintSeq;
  pythonLintTimer = setTimeout(() => {
    pythonLintTimer = null;
    void lintPythonCode(code).then((diags) => {
      if (mySeq !== pythonLintSeq) return; // код уже обновился — результат устарел
      if (!aceEditor) return;
      try {
        aceEditor.session.setAnnotations(
          diags.map((d) => ({
            row: Math.max(0, d.line - 1),
            column: Math.max(0, d.column),
            text: d.message,
            type: "error" as const,
          })),
        );
      } catch {}
    });
  }, 900);
}

function cancelPythonLint() {
  pythonLintSeq++;
  if (pythonLintTimer) {
    clearTimeout(pythonLintTimer);
    pythonLintTimer = null;
  }
}

export function setupAceEditor(getSelectedLanguage: () => SupportedLanguage) {
  const editorEl = document.getElementById("editor") as HTMLDivElement | null;
  if (!editorEl) return;

  aceEditor = ace.edit(editorEl, {
    mode: "ace/mode/javascript",
    theme: "ace/theme/chrome",
    wrap: true,
    showPrintMargin: false,
    useWorker: true,
    tabSize: 2,
  });

  (ace as any).require("ace/ext/language_tools");
  if (aceEditor) {
    aceEditor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      fontSize: 13,
      showGutter: true,
      highlightActiveLine: true,
    });
    aceEditor.setShowFoldWidgets(true);
    aceEditor.setShowInvisibles(false);

    // Регистрируем сниппеты и автодополнение (в дополнение к дефолтному)
    try {
      const langTools = (ace as any).require("ace/ext/language_tools");
      const snippetManager = (ace as any).require(
        "ace/snippets",
      ).snippetManager;

      // Вспомогательное: регистрация набора сниппетов для языка
      const registerSnippets = (
        lang: string,
        snippets: Array<{ name: string; tabTrigger: string; content: string }>,
      ) => {
        const list = snippets.map((s) => ({
          content: s.content,
          name: s.name,
          tabTrigger: s.tabTrigger,
          scope: lang,
        }));
        snippetManager.register(list, lang);
      };

      // Сниппеты для JavaScript (включая console.log)
      registerSnippets("javascript", [
        {
          name: "console.log",
          tabTrigger: "clg",
          content: "console.log(${1});",
        },
        {
          name: "console.error",
          tabTrigger: "cle",
          content: "console.error(${1});",
        },
        {
          name: "console.warn",
          tabTrigger: "clw",
          content: "console.warn(${1});",
        },
        {
          name: "function",
          tabTrigger: "fn",
          content: "function ${1:name}(${2:args}) {\n\t${3}// тело\n}",
        },
        {
          name: "arrow function",
          tabTrigger: "afn",
          content: "const ${1:name} = (${2:args}) => {\n\t${3}// тело\n};",
        },
        {
          name: "for index",
          tabTrigger: "fori",
          content:
            "for (let ${1:i} = 0; ${1} < ${2:arr}.length; ${1}++) {\n\t${3}// тело\n}",
        },
        {
          name: "try/catch",
          tabTrigger: "tryc",
          content:
            "try {\n\t${1}// тело\n} catch (${2:e}) {\n\tconsole.error(${2});\n}",
        },
        {
          name: "import",
          tabTrigger: "imp",
          content: "import ${1:what} from '${2:module}';",
        },
        {
          name: "export default",
          tabTrigger: "expd",
          content: "export default ${1:name};",
        },
      ]);

      // Сниппеты для Python
      registerSnippets("python", [
        { name: "print", tabTrigger: "pr", content: "print(${1})" },
        {
          name: "def",
          tabTrigger: "def",
          content: "def ${1:name}(${2:args}):\n\t${3:pass}",
        },
        {
          name: "for range",
          tabTrigger: "forr",
          content: "for ${1:i} in range(${2:n}):\n\t${3:pass}",
        },
        {
          name: "if __name__ == '__main__'",
          tabTrigger: "ifmain",
          content: "if __name__ == '__main__':\n\t${1}",
        },
        {
          name: "with",
          tabTrigger: "with",
          content: "with ${1:expr} as ${2:var}:\n\t${3:pass}",
        },
        {
          name: "class",
          tabTrigger: "class",
          content:
            "class ${1:Name}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}",
        },
        {
          name: "try/except",
          tabTrigger: "trye",
          content:
            "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\tprint(${3})",
        },
      ]);

      // Сниппеты для Lua
      registerSnippets("lua", [
        { name: "print", tabTrigger: "pr", content: "print(${1})" },
        {
          name: "function",
          tabTrigger: "fn",
          content: "function ${1:name}(${2:args})\n\t${3} \nend",
        },
        {
          name: "for i",
          tabTrigger: "fori",
          content: "for ${1:i}=1, ${2:n} do\n\t${3}\nend",
        },
        {
          name: "pairs",
          tabTrigger: "pairs",
          content: "for ${1:k}, ${2:v} in pairs(${3:t}) do\n\t${4}\nend",
        },
        {
          name: "ipairs",
          tabTrigger: "ipairs",
          content: "for ${1:i}, ${2:v} in ipairs(${3:t}) do\n\t${4}\nend",
        },
        {
          name: "local",
          tabTrigger: "loc",
          content: "local ${1:name} = ${2:value}",
        },
      ]);

      // Дополнительное автодополнение для JavaScript (console.*)
      const consoleCompleter = {
        getCompletions(
          editor: any,
          session: any,
          pos: any,
          prefix: string,
          cb: (err: unknown, results: unknown[]) => void,
        ) {
          const id = session.getMode()?.$id || "";
          if (!/javascript$/.test(id)) return cb(null, []);
          const items = [
            {
              caption: "console.log()",
              snippet: "console.log(${1});",
              meta: "console",
              score: 10000,
            },
            {
              caption: "console.error()",
              snippet: "console.error(${1});",
              meta: "console",
              score: 9999,
            },
            {
              caption: "console.warn()",
              snippet: "console.warn(${1});",
              meta: "console",
              score: 9998,
            },
            {
              caption: "console.table()",
              snippet: "console.table(${1});",
              meta: "console",
              score: 9997,
            },
          ];
          cb(null, items);
        },
        insertMatch(editor: any, data: any) {
          const sm = (ace as any).require("ace/snippets").snippetManager;
          sm.insertSnippet(editor, data.snippet);
        },
      } as any;

      // Подключаем наш completer поверх стандартных
      if (langTools && typeof langTools.addCompleter === "function") {
        langTools.addCompleter(consoleCompleter);
      }
    } catch {
      // не критично, если сниппеты/автодополнение не удалось зарегистрировать
    }
  }

  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    aceEditor?.setTheme("ace/theme/monokai");
    const themeSelect = document.getElementById(
      "aceThemeSelect",
    ) as HTMLSelectElement | null;
    if (themeSelect) themeSelect.value = "ace/theme/monokai";
  }

  // Привязываем кнопки панели инструментов
  const themeSelect = document.getElementById(
    "aceThemeSelect",
  ) as HTMLSelectElement | null;
  const fontSizeInput = document.getElementById(
    "aceFontSize",
  ) as HTMLInputElement | null;
  const tabSizeInput = document.getElementById(
    "aceTabSize",
  ) as HTMLInputElement | null;
  const wrapCheckbox = document.getElementById(
    "aceWrap",
  ) as HTMLInputElement | null;
  const invisiblesCheckbox = document.getElementById(
    "aceInvisibles",
  ) as HTMLInputElement | null;
  const activeLineCheckbox = document.getElementById(
    "aceActiveLine",
  ) as HTMLInputElement | null;
  const printMarginCheckbox = document.getElementById(
    "acePrintMargin",
  ) as HTMLInputElement | null;
  const gutterCheckbox = document.getElementById(
    "aceGutter",
  ) as HTMLInputElement | null;
  const softTabsCheckbox = document.getElementById(
    "aceSoftTabs",
  ) as HTMLInputElement | null;
  const foldWidgetsCheckbox = document.getElementById(
    "aceFoldWidgets",
  ) as HTMLInputElement | null;
  const keybindingSelect = document.getElementById(
    "aceKeybinding",
  ) as HTMLSelectElement | null;

  const copyBtn = document.getElementById(
    "copyCodeBtn",
  ) as HTMLButtonElement | null;
  const downloadBtn = document.getElementById(
    "downloadCodeBtn",
  ) as HTMLButtonElement | null;

  const searchBtn = document.getElementById(
    "aceSearchBtn",
  ) as HTMLButtonElement | null;
  const replaceBtn = document.getElementById(
    "aceReplaceBtn",
  ) as HTMLButtonElement | null;
  const gotoBtn = document.getElementById(
    "aceGotoBtn",
  ) as HTMLButtonElement | null;
  const formatBtn = document.getElementById(
    "aceFormatBtn",
  ) as HTMLButtonElement | null;
  const runBtn = document.getElementById(
    "aceRunBtn",
  ) as HTMLButtonElement | null;
  const shortcutsBtn = document.getElementById(
    "aceShortcutsBtn",
  ) as HTMLButtonElement | null;

  const settingsToggle = document.getElementById(
    "aceSettingsToggle",
  ) as HTMLButtonElement | null;
  const settingsPanel = document.getElementById(
    "aceSettingsPanel",
  ) as HTMLDivElement | null;
  const aceSaveBtn = document.getElementById(
    "aceSaveSettings",
  ) as HTMLButtonElement | null;

  const statusBar = document.getElementById(
    "editorStatusbar",
  ) as HTMLDivElement | null;

  // Кнопка подсветки парных фигурных скобок
  const bracesBtn = document.getElementById(
    "aceBracesBtn",
  ) as HTMLButtonElement | null;

  // Применяем сохранённые настройки Ace при старте (отложенно)
  setTimeout(() => {
    try {
      const saved = loadAceSettings();
      if (aceEditor) {
        if (saved.theme) {
          aceEditor.setTheme(saved.theme);
          if (themeSelect) themeSelect.value = saved.theme;
        }
        if (typeof saved.fontSize === "number") {
          aceEditor.setFontSize(saved.fontSize);
          if (fontSizeInput) fontSizeInput.value = String(saved.fontSize);
        }
        if (typeof saved.tabSize === "number") {
          aceEditor.session.setTabSize(saved.tabSize);
          if (tabSizeInput) tabSizeInput.value = String(saved.tabSize);
        }
        if (typeof saved.wrap === "boolean") {
          aceEditor.session.setUseWrapMode(saved.wrap);
          if (wrapCheckbox) wrapCheckbox.checked = saved.wrap;
        }
        if (typeof saved.showInvisibles === "boolean") {
          aceEditor.setShowInvisibles(saved.showInvisibles);
          if (invisiblesCheckbox)
            invisiblesCheckbox.checked = saved.showInvisibles;
        }
        if (typeof saved.highlightActiveLine === "boolean") {
          aceEditor.setHighlightActiveLine(saved.highlightActiveLine);
          if (activeLineCheckbox)
            activeLineCheckbox.checked = saved.highlightActiveLine;
        }
        if (typeof saved.showPrintMargin === "boolean") {
          aceEditor.setShowPrintMargin(saved.showPrintMargin);
          if (printMarginCheckbox)
            printMarginCheckbox.checked = saved.showPrintMargin;
        }
        if (typeof saved.showGutter === "boolean") {
          aceEditor.setOption("showGutter", saved.showGutter);
          if (gutterCheckbox) gutterCheckbox.checked = saved.showGutter;
        }
        if (typeof saved.useSoftTabs === "boolean") {
          aceEditor.session.setUseSoftTabs(saved.useSoftTabs);
          if (softTabsCheckbox) softTabsCheckbox.checked = saved.useSoftTabs;
        }
        if (typeof saved.showFoldWidgets === "boolean") {
          aceEditor.setShowFoldWidgets(saved.showFoldWidgets);
          if (foldWidgetsCheckbox)
            foldWidgetsCheckbox.checked = saved.showFoldWidgets;
        }
        if (saved.keybinding) {
          if (saved.keybinding === "vim")
            aceEditor.setKeyboardHandler("ace/keyboard/vim");
          else if (saved.keybinding === "emacs")
            aceEditor.setKeyboardHandler("ace/keyboard/emacs");
          else aceEditor.setKeyboardHandler(null);
          if (keybindingSelect) keybindingSelect.value = saved.keybinding;
        }
      }
    } catch {}
  }, 0);

  if (themeSelect)
    themeSelect.addEventListener("change", () => {
      if (aceEditor && themeSelect.value) {
        aceEditor.setTheme(themeSelect.value);
      }
    });
  if (fontSizeInput)
    fontSizeInput.addEventListener("input", () => {
      if (aceEditor && fontSizeInput.value) {
        const fontSize = Math.max(
          10,
          Math.min(24, parseInt(fontSizeInput.value, 10)),
        );
        aceEditor.setFontSize(fontSize);
      }
    });
  if (tabSizeInput)
    tabSizeInput.addEventListener("input", () => {
      if (aceEditor && tabSizeInput.value) {
        const tabSize = Math.max(
          2,
          Math.min(8, parseInt(tabSizeInput.value, 10)),
        );
        aceEditor.session.setTabSize(tabSize);
      }
    });
  if (wrapCheckbox)
    wrapCheckbox.addEventListener("input", () => {
      if (aceEditor) {
        aceEditor.session.setUseWrapMode(wrapCheckbox.checked);
      }
    });
  if (invisiblesCheckbox)
    invisiblesCheckbox.addEventListener("input", () => {
      if (aceEditor) {
        aceEditor.setShowInvisibles(invisiblesCheckbox.checked);
      }
    });
  if (activeLineCheckbox)
    activeLineCheckbox.addEventListener("change", () => {
      if (aceEditor) {
        aceEditor.setHighlightActiveLine(activeLineCheckbox.checked);
      }
    });
  if (printMarginCheckbox)
    printMarginCheckbox.addEventListener("change", () => {
      if (aceEditor) {
        aceEditor.setShowPrintMargin(printMarginCheckbox.checked);
      }
    });
  if (gutterCheckbox)
    gutterCheckbox.addEventListener("change", () => {
      if (aceEditor) {
        aceEditor.setOption("showGutter", gutterCheckbox.checked);
      }
    });
  if (softTabsCheckbox)
    softTabsCheckbox.addEventListener("change", () => {
      if (aceEditor) {
        aceEditor.session.setUseSoftTabs(softTabsCheckbox.checked);
      }
    });
  if (foldWidgetsCheckbox)
    foldWidgetsCheckbox.addEventListener("change", () => {
      if (aceEditor) {
        aceEditor.setShowFoldWidgets(foldWidgetsCheckbox.checked);
      }
    });
  if (keybindingSelect)
    keybindingSelect.addEventListener("change", () => {
      if (aceEditor && keybindingSelect.value) {
        const val = keybindingSelect.value;
        if (val === "vim") {
          aceEditor.setKeyboardHandler("ace/keyboard/vim");
        } else if (val === "emacs") {
          aceEditor.setKeyboardHandler("ace/keyboard/emacs");
        } else {
          aceEditor.setKeyboardHandler(null);
        }
      }
    });

  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      if (!aceEditor) return;
      const text = aceEditor.getValue();
      try {
        await navigator.clipboard.writeText(text);
        const { copySuccess } = getAceUIStrings(getAppLang());
        copyBtn.textContent = copySuccess;
        setTimeout(() => {
          copyBtn.textContent = "⧉";
        }, 1200);
      } catch {}
    });
  if (downloadBtn)
    downloadBtn.addEventListener("click", async () => {
      if (!aceEditor) return;
      const text = aceEditor.getValue();
      const lang = getSelectedLanguage();
      const ext =
        lang === "python"
          ? "py"
          : lang === "lua"
            ? "lua"
            : lang === "php"
              ? "php"
              : "js";
      const suggested = `code.${ext}`;
      await saveTextFile({
        suggestedName: suggested,
        text,
        description:
          lang === "python"
            ? "Python"
            : lang === "lua"
              ? "Lua"
              : lang === "php"
                ? "PHP"
                : "JavaScript",
        accept: { "text/plain": [`.${ext}`] },
        mime: "text/plain;charset=utf-8",
        promptLabel: getAppLang() === "ru" ? "Имя файла:" : "File name:",
      });
    });

  if (searchBtn)
    searchBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("find");
    });
  if (replaceBtn)
    replaceBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("replace");
    });
  if (gotoBtn)
    gotoBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("gotoline");
    });
  if (formatBtn)
    formatBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      try {
        const beautify = (ace as any).require("ace/ext/beautify");
        beautify.beautify(aceEditor.session);
      } catch (e) {
        // не критично: просто не форматируем
      }
    });
  if (runBtn)
    runBtn.addEventListener("click", async () => {
      if (!aceEditor) return;
      const code = aceEditor.getValue();
      const lang = getSelectedLanguage();
      const output = document.getElementById("output") as HTMLElement | null;
      try {
        const mod = await import("./codeExecution");
        await mod.runCodeString(lang, code, output);
      } catch (e) {
        console.error(e);
      }
    });
  if (shortcutsBtn)
    shortcutsBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      try {
        const kb = (ace as any).require("ace/ext/keybinding_menu");
        if (kb && typeof kb.init === "function") {
          kb.init(aceEditor);
        }
        aceEditor.execCommand("showKeyboardShortcuts");
      } catch {}
    });

  if (aceSaveBtn)
    aceSaveBtn.addEventListener("click", () => {
      const next: Partial<AceSettings> = {};
      if (themeSelect && themeSelect.value) {
        next.theme = themeSelect.value;
        if (aceEditor) aceEditor.setTheme(themeSelect.value);
      }
      if (fontSizeInput && fontSizeInput.value) {
        const v = Math.max(10, Math.min(24, parseInt(fontSizeInput.value, 10)));
        next.fontSize = v;
        if (aceEditor) aceEditor.setFontSize(v);
      }
      if (tabSizeInput && tabSizeInput.value) {
        const v = Math.max(2, Math.min(8, parseInt(tabSizeInput.value, 10)));
        next.tabSize = v;
        if (aceEditor) aceEditor.session.setTabSize(v);
      }
      if (wrapCheckbox) {
        next.wrap = !!wrapCheckbox.checked;
        if (aceEditor) aceEditor.session.setUseWrapMode(!!wrapCheckbox.checked);
      }
      if (invisiblesCheckbox) {
        next.showInvisibles = !!invisiblesCheckbox.checked;
        if (aceEditor)
          aceEditor.setShowInvisibles(!!invisiblesCheckbox.checked);
      }
      if (activeLineCheckbox) {
        next.highlightActiveLine = !!activeLineCheckbox.checked;
        if (aceEditor)
          aceEditor.setHighlightActiveLine(!!activeLineCheckbox.checked);
      }
      if (printMarginCheckbox) {
        next.showPrintMargin = !!printMarginCheckbox.checked;
        if (aceEditor)
          aceEditor.setShowPrintMargin(!!printMarginCheckbox.checked);
      }
      if (gutterCheckbox) {
        next.showGutter = !!gutterCheckbox.checked;
        if (aceEditor)
          aceEditor.setOption("showGutter", !!gutterCheckbox.checked);
      }
      if (softTabsCheckbox) {
        next.useSoftTabs = !!softTabsCheckbox.checked;
        if (aceEditor)
          aceEditor.session.setUseSoftTabs(!!softTabsCheckbox.checked);
      }
      if (foldWidgetsCheckbox) {
        next.showFoldWidgets = !!foldWidgetsCheckbox.checked;
        if (aceEditor)
          aceEditor.setShowFoldWidgets(!!foldWidgetsCheckbox.checked);
      }
      if (keybindingSelect && keybindingSelect.value) {
        const val = keybindingSelect.value;
        next.keybinding = val;
        if (aceEditor) {
          if (val === "vim") aceEditor.setKeyboardHandler("ace/keyboard/vim");
          else if (val === "emacs")
            aceEditor.setKeyboardHandler("ace/keyboard/emacs");
          else aceEditor.setKeyboardHandler(null);
        }
      }
      saveAceSettings(next);

      if (
        settingsPanel &&
        settingsToggle &&
        settingsPanel.classList.contains("open")
      ) {
        settingsPanel.classList.remove("open");
        settingsToggle.setAttribute("aria-expanded", "false");
        settingsToggle.focus();
      }

      const prev = aceSaveBtn.textContent;
      const ui = getAceUIStrings(getAppLang());
      aceSaveBtn.textContent = ui.saved;
      setTimeout(() => {
        aceSaveBtn.textContent = ui.save;
      }, 1200);
    });

  // Переключатель подсветки парных фигурных скобок
  if (bracesBtn)
    bracesBtn.addEventListener("click", () => {
      braceHighlightEnabled = !braceHighlightEnabled;
      bracesBtn.classList.toggle("active", braceHighlightEnabled);
      bracesBtn.setAttribute("aria-pressed", String(braceHighlightEnabled));
      updateBraceMarkers();
    });

  // Открытие/закрытие панели настроек + доступность
  if (settingsToggle && settingsPanel) {
    const isOpen = () => settingsPanel.classList.contains("open");
    const openPanel = () => {
      settingsPanel.classList.add("open");
      settingsToggle.setAttribute("aria-expanded", "true");
      const firstFocusable = settingsPanel.querySelector(
        'input, select, button, [href], [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement | null;
      if (firstFocusable) firstFocusable.focus();
    };
    const closePanel = () => {
      settingsPanel.classList.remove("open");
      settingsToggle.setAttribute("aria-expanded", "false");
    };

    settingsToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen()) {
        closePanel();
      } else {
        openPanel();
      }
    });

    document.addEventListener("click", (e) => {
      if (!isOpen()) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (settingsPanel.contains(target) || settingsToggle.contains(target))
        return;
      closePanel();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        e.stopPropagation();
        closePanel();
        settingsToggle.focus();
      }
    });
  }

  // Обновление статус-бара
  function updateStatusBar() {
    if (!aceEditor || !statusBar) return;
    const pos = aceEditor.getCursorPosition();
    const row = pos.row + 1;
    const col = pos.column + 1;
    const total = aceEditor.session.getLength();
    const mode = aceEditor.session.getMode()?.$id?.split("/").pop() || "";
    const { statusLine } = getAceUIStrings(getAppLang());
    statusBar.textContent = statusLine(mode, row, col, total);
  }
  if (statusBar && aceEditor) {
    aceEditor.session.on("change", updateStatusBar);
    aceEditor.selection.on("changeCursor", updateStatusBar);
    updateStatusBar();
  }

  // Обновляем маркеры подсветки скобок при изменении текста (если включено)
  if (aceEditor) {
    aceEditor.session.on("change", () => {
      if (braceHighlightEnabled) updateBraceMarkers();
    });
    // Также обновляем при смене режима/структуры, чтобы корректно пересчитать позиции
    aceEditor.on("changeMode", () => {
      if (braceHighlightEnabled) updateBraceMarkers();
    });
  }
  // Применяем отложенное содержимое, если было рассчитано до инициализации ACE
  if (aceEditor && pendingAceInit) {
    try {
      aceEditor.session.setMode(pendingAceInit.mode);
      aceEditor.setValue(pendingAceInit.code, -1);
    } catch {}
    pendingAceInit = null;
  }
}

export function refreshAceUILanguage() {
  try {
    const ui = getAceUIStrings(getAppLang());
    // Обновить текст кнопки сохранения настроек
    const saveBtn = document.getElementById(
      "aceSaveSettings",
    ) as HTMLButtonElement | null;
    if (saveBtn) saveBtn.textContent = ui.save;

    // Обновить статус-бар редактора
    const statusBar = document.getElementById(
      "editorStatusbar",
    ) as HTMLDivElement | null;
    if (statusBar && aceEditor) {
      const pos = aceEditor.getCursorPosition();
      const row = pos.row + 1;
      const col = pos.column + 1;
      const total = aceEditor.session.getLength();
      const mode = aceEditor.session.getMode()?.$id?.split("/").pop() || "";
      statusBar.textContent = ui.statusLine(mode, row, col, total);
    }
  } catch {}
}
