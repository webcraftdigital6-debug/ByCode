// Веб-воркер-песочница: безопасное выполнение кода (JS/Python/Lua/PHP) с выводом и сообщениями
import type { WorkerInMsg, WorkerOutMsg } from "./types/messages";

// Ограничиваем количество строк, отправляемых в главный поток, чтобы снизить нагрузку
const MAX_POST_LINES = 300;
let _postedLines = 0;
function post(msg: WorkerOutMsg) {
  try {
    if (msg.type === "stdout" || msg.type === "stderr") {
      if (_postedLines >= MAX_POST_LINES) {
        // Один раз сообщим, что вывод сокращён
        if (_postedLines === MAX_POST_LINES) {
          (self as any).postMessage({
            type: "status",
            text: "Вывод сокращён: достигнут лимит строк",
          });
          _postedLines++;
        }
        return;
      }
      _postedLines++;
    }
    (self as any).postMessage(msg);
  } catch {
    // игнорируем
  }
}

// Глобальный дедлайн для ожиданий ввода/выполнения
let _deadlineEpochMs: number = 0;

// ---------- Отладчик: канал управления и подсветка блоков ----------
// debugCtrl — Int32Array над SharedArrayBuffer из UI:
// [0] режим (0=свободно, 1=шаг/пауза, 2=замедленно),
// [1] сигнал шага, [2] задержка замедленного режима (мс).
let debugCtrl: Int32Array | null = null;

function debugWaitAfterHighlight() {
  const ctrl = debugCtrl;
  if (!ctrl) return;
  for (;;) {
    const mode = Atomics.load(ctrl, 0);
    if (mode === 0) return;
    if (mode === 2) {
      // Замедленный режим: просто спим после каждого блока
      const delay = Math.max(30, Atomics.load(ctrl, 2) || 400);
      Atomics.wait(ctrl, 1, 0, delay);
      return;
    }
    // Шаг/пауза: ждём сигнал от UI (кнопка ⏭ или ▶)
    while (Atomics.load(ctrl, 1) === 0) {
      // Просыпаемся каждые 100 мс, чтобы видеть смену режима
      Atomics.wait(ctrl, 1, 0, 100);
    }
    Atomics.store(ctrl, 1, 0); // потребляем сигнал
    if (Atomics.load(ctrl, 0) === 1) return; // остаёмся в шаге: следующий блок снова остановит
    // Режим сменился (run/slow) — пересматриваем
  }
}

function highlightBlock(id: unknown) {
  post({ type: "highlight", id: String(id ?? "") });
  debugWaitAfterHighlight();
}

// Синхронный ввод с использованием SharedArrayBuffer и Atomics.wait в воркере
function syncInput(prompt: string): string {
  try {
    const headerBytes = 8; // 2 * Int32: [status, length]
    const capacity = 4096; // максимум символов ввода
    const sab = new SharedArrayBuffer(headerBytes + capacity);
    const ctrl = new Int32Array(sab, 0, 2);
    const data = new Uint8Array(sab, headerBytes);
    // Сообщаем главному потоку о необходимости ввода
    post({ type: "input_request", prompt, buffer: sab });

    // Ждём ответа пользователя либо таймаута
    const remainingMs = Math.max(0, (_deadlineEpochMs || 0) - Date.now());
    const result = (Atomics as any).wait(ctrl, 0, 0, remainingMs);
    if (result !== "ok") {
      if (result === "timed-out") {
        throw new Error("Ввод прерван по таймауту");
      }
      throw new Error("Ввод отменён");
    }
    const len = ctrl[1] | 0;
    const dec = new TextDecoder();
    const text = dec.decode(
      data.slice(0, Math.max(0, Math.min(len, data.length))),
    );
    return text;
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : String(e);
    throw new Error(msg || "Ошибка ввода");
  }
}

// JS исполнение в изолированном контексте
function runJS(code: string, timeoutMs?: number) {
  const print = (s: unknown) => post({ type: "stdout", text: String(s ?? "") });
  const printColored = (s: unknown, color: unknown) => {
    try {
      post({
        type: "stdout_color",
        text: String(s ?? ""),
        color: String(color ?? ""),
      });
    } catch {
      post({ type: "stdout", text: String(s ?? "") });
    }
  };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  try {
    // Устанавливаем общий дедлайн для операций ввода
    _deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
    console.log = (...args: unknown[]) => {
      try {
        originalLog.apply(console, args);
      } catch {}
      post({
        type: "stdout",
        text: args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" "),
      });
    };
    console.warn = (...args: unknown[]) => {
      try {
        originalWarn.apply(console, args);
      } catch {}
      post({
        type: "stderr",
        text: args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" "),
      });
    };
    console.error = (...args: unknown[]) => {
      try {
        originalError.apply(console, args);
      } catch {}
      post({
        type: "stderr",
        text: args
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" "),
      });
    };
    // Подставляем window/self/globalThis и определяем input() без eval
    const prelude = [
      "try{var window=windowRef;var self=selfRef;var globalThis=globalRef;}catch(e){}",
      "var input = function(prompt){ try { return syncInputRef(String(prompt ?? '')); } catch (e) { throw e; } };",
      "var highlightBlock = function(id){ try { highlightRef(String(id)); } catch (e) {} };",
    ].join("\n");
    const fn = new Function(
      "print",
      "printColored",
      "consoleObj",
      "selfRef",
      "windowRef",
      "globalRef",
      "syncInputRef",
      "highlightRef",
      prelude + "\n" + String(code),
    ) as (
      print: (s: unknown) => void,
      printColored: (s: unknown, color: unknown) => void,
      consoleObj: Console,
      selfRef: unknown,
      windowRef: unknown,
      globalRef: unknown,
      syncInputRef: (p: string) => string,
      highlightRef: (id: string) => void,
    ) => void;
    fn(
      print,
      printColored,
      console,
      self as unknown,
      self as unknown,
      self as unknown,
      syncInput,
      highlightBlock,
    );
    post({ type: "done" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    post({ type: "error", message: msg });
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

// Python через Pyodide внутри воркера
async function runPython(code: string, timeoutMs?: number) {
  try {
    post({ type: "status", text: "Загрузка Pyodide..." });
    (self as any).importScripts(
      "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js",
    );
    const loadPyodide = (self as any).loadPyodide;
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/",
    });

    pyodide.globals.set("print_to_dom", (s: any) => {
      const str = String(s ?? "");
      const parts = str.split(/\n/);
      for (const line of parts) {
        if (!line) continue;
        post({ type: "stdout", text: line });
      }
    });

    // Цветной вывод для Python
    pyodide.globals.set("print_to_dom_color", (s: any, color: any) => {
      try {
        const text = String(s ?? "");
        const clr = String(color ?? "");
        post({ type: "stdout_color", text, color: clr });
      } catch (e) {
        post({ type: "stdout", text: String(s ?? "") });
      }
    });

    // Мост подсветки блоков для отладчика (highlight_block('ID'))
    pyodide.globals.set("highlight_to_js", (id: any) => {
      highlightBlock(String(id ?? ""));
    });
    await pyodide.runPythonAsync(
      "def highlight_block(_bid):\n    highlight_to_js(str(_bid))",
    );

    _deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
    await pyodide.runPythonAsync(`
import sys
class _JsWriter:
    def write(self, s):
        try:
            print_to_dom(str(s))
        except Exception as _e:
            pass
    def flush(self):
        pass
sys.stdout = _JsWriter()
sys.stderr = _JsWriter()

# Устанавливаем трассировщик, который прерывает выполнение по истечении времени
import time
_deadline_ms = ${_deadlineEpochMs}
def _trace(frame, event, arg):
    if time.time() * 1000 > _deadline_ms:
        raise TimeoutError('Превышен лимит времени')
    return _trace
sys.settrace(_trace)
`);

    // Убираем статус
    post({ type: "status", text: "" });

    // Переопределяем input -> синхронный ввод через SharedArrayBuffer
    pyodide.globals.set("input", (prompt: any) =>
      syncInput(String(prompt ?? "")),
    );

    try {
      // Обёртка: добавляем удобную функцию print_colored
      await pyodide.runPythonAsync(
        "def print_colored(s, c):\n    print_to_dom_color(str(s), str(c))",
      );
      await pyodide.runPythonAsync(code);
    } finally {
      await pyodide.runPythonAsync("import sys; sys.settrace(None)");
    }
    post({ type: "done" });
  } catch (e: any) {
    post({ type: "error", message: String(e?.message || e) });
  }
}

// Lua через Fengari внутри воркера
async function runLua(code: string, timeoutMs?: number) {
  try {
    post({ type: "status", text: "Загрузка Lua..." });
    // Загружаем Fengari локально, скопированный в сборку вебпака
    // Формируем относительный URL к скопированному в сборку файлу fengari-web.js,
    // чтобы корректно работать под subpath (GitHub Pages)
    const href = (self as any).location?.href || "";
    const localUrl = href
      ? new URL("libs/fengari-web.js", href).toString()
      : "libs/fengari-web.js";
    // Полифиллы для окружения: некоторые сборки fengari-web ожидают window/globalThis
    const g: any = self as any;
    try {
      if (!g.window) g.window = g;
      if (!g.globalThis) g.globalThis = g;
    } catch {}
    g.importScripts(localUrl);
    const fengari = (self as any).fengari;
    if (!fengari) throw new Error("Fengari недоступен");
    const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari as any;
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);
    post({ type: "status", text: "" });

    // Устанавливаем хук дебаггера для прерывания по времени
    const deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
    // Сохраняем дедлайн для syncInput
    _deadlineEpochMs = deadlineEpochMs;
    const hook = (L2: any, ar: any) => {
      if (Date.now() > deadlineEpochMs) {
        // Вызов ошибки внутри VM
        lauxlib.luaL_error(L2, to_luastring("Превышен лимит времени"));
      }
    };
    // Проверяем чаще, чтобы быстрее ловить бесконечные циклы
    // Включаем маски по счётчику и по линиям/вызовам для лучшей реакции
    const mask = lua.LUA_MASKCOUNT | lua.LUA_MASKLINE | lua.LUA_MASKCALL;
    lua.lua_sethook(L, hook as any, mask, 1000);

    // Переопределяем print -> постим в главный поток
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      const parts: string[] = [];
      for (let i = 1; i <= n; i++) {
        const s = to_jsstring(lauxlib.luaL_tolstring(L2, i));
        lua.lua_pop(L2, 1);
        parts.push(s);
      }
      post({ type: "stdout", text: parts.join("\t") });
      return 0;
    });
    lua.lua_setglobal(L, to_luastring("print"));

    // Цветной вывод: print_colored(text, color)
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      let txt = "";
      let clr = "";
      if (n >= 1) {
        const s = to_jsstring(lauxlib.luaL_tolstring(L2, 1));
        lua.lua_pop(L2, 1);
        txt = s ?? "";
      }
      if (n >= 2) {
        const c = to_jsstring(lauxlib.luaL_tolstring(L2, 2));
        lua.lua_pop(L2, 1);
        clr = c ?? "";
      }
      try {
        post({ type: "stdout_color", text: String(txt), color: String(clr) });
      } catch {
        post({ type: "stdout", text: String(txt) });
      }
      return 0;
    });
    lua.lua_setglobal(L, to_luastring("print_colored"));

    // Мост подсветки блоков для отладчика (highlight_block('ID'))
    lua.lua_pushcfunction(L, (L2: any) => {
      let bid = "";
      try {
        const s = to_jsstring(lauxlib.luaL_tolstring(L2, 1));
        lua.lua_pop(L2, 1);
        bid = s ?? "";
      } catch {}
      highlightBlock(bid);
      return 0;
    });
    lua.lua_setglobal(L, to_luastring("highlight_block"));

    // Определяем глобальную функцию input(prompt) -> string, использующую syncInput
    lua.lua_pushcfunction(L, (L2: any) => {
      const n = lua.lua_gettop(L2);
      let promptStr = "";
      if (n >= 1) {
        try {
          const s = to_jsstring(lauxlib.luaL_tolstring(L2, 1));
          lua.lua_pop(L2, 1);
          promptStr = s ?? "";
        } catch {
          promptStr = "";
        }
      }
      try {
        const inputText = syncInput(String(promptStr));
        lua.lua_pushstring(L2, to_luastring(String(inputText)));
        return 1;
      } catch (e: any) {
        const msg = String(e?.message || e);
        // Возвращаем nil и сообщение как ошибка через stderr
        post({ type: "stderr", text: msg });
        lua.lua_pushnil(L2);
        return 1;
      }
    });
    lua.lua_setglobal(L, to_luastring("input"));

    const status = lauxlib.luaL_loadstring(L, to_luastring(code));
    if (status === lua.LUA_OK) {
      const callStatus = lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0);
      if (callStatus !== lua.LUA_OK) {
        const err = to_jsstring(lua.lua_tostring(L, -1));
        lua.lua_pop(L, 1);
        post({ type: "error", message: err });
        return;
      }
      post({ type: "done" });
    } else {
      const err = to_jsstring(lua.lua_tostring(L, -1));
      lua.lua_pop(L, 1);
      post({ type: "error", message: err });
    }
  } catch (e: any) {
    post({ type: "error", message: String(e?.message || e) });
  }
}

// ---------- PHP: интерактивный stdin ----------
// php-wasm читает stdin по одному байту. Когда очередь пуста, блокируемся на
// том же syncInput(), что используют JS/Python/Lua, и кладём в очередь следующую
// строку вместе с переводом. Очередь обнуляется перед каждым запуском, чтобы
// недопитые байты отменённого прогона не попали в следующий.
let _phpStdinQueue: number[] = [];

function phpStdinByte(): number | null {
  if (_phpStdinQueue.length === 0) {
    let text: string;
    try {
      text = syncInput("");
    } catch (e: any) {
      // Через границу wasm бросать нельзя: сообщаем причину и даём EOF
      post({ type: "stderr", text: String(e?.message || e) });
      return null;
    }
    _phpStdinQueue = Array.from(new TextEncoder().encode(text + "\n"));
  }
  return _phpStdinQueue.shift() ?? null;
}

// Объявляется один раз (function_exists) — процесс PHP переиспользуется.
// stream_set_read_buffer(0) + fgetc обязательны: fgets() жадно вычитает весь
// буфер stdin и попросил бы у пользователя строки, которые программа ещё не
// досчитала, ломая порядок вывода.
const PHP_INPUT_PRELUDE = [
  "<?php",
  "if (!function_exists('input')) {",
  "  function input($prompt = '') {",
  "    if ($prompt !== '') { echo $prompt; }",
  "    static $h = null;",
  "    if ($h === null) {",
  "      $h = fopen('php://stdin', 'r');",
  "      if ($h !== false) { stream_set_read_buffer($h, 0); }",
  "    }",
  "    if ($h === false) { return ''; }",
  "    $line = '';",
  "    for (;;) {",
  "      $c = fgetc($h);",
  "      if ($c === false || $c === '') { return $line; }",
  "      if ($c === \"\\n\") { return $line; }",
  "      if ($c === \"\\r\") { continue; }",
  "      $line .= $c;",
  "    }",
  "  }",
  "}",
  "?>",
].join("\n");

let _phpWasmLoaded: Promise<{
  php: any;
  flushStdout: () => void;
  flushStderr: () => void;
}> | null = null;
async function loadPhpWasm(): Promise<{
  php: any;
  flushStdout: () => void;
  flushStderr: () => void;
}> {
  if (_phpWasmLoaded) return _phpWasmLoaded;
  _phpWasmLoaded = (async () => {
    const href = (self as any).location?.href || "";
    const jsUrl = href
      ? new URL("libs/php-wasm/php-worker.js", href).toString()
      : "libs/php-wasm/php-worker.js";
    try {
      (self as any).importScripts(jsUrl);
    } catch (e) {
      throw new Error("php-wasm не удалось загрузить");
    }
    const factory = (self as any).PHP;
    if (!factory) {
      throw new Error("php-wasm не инициализирован");
    }
    const locateFile = (path: string) => {
      const base = href
        ? new URL("libs/php-wasm/", href).toString()
        : "libs/php-wasm/";
      try {
        return new URL(path, base).toString();
      } catch {
        return base + path;
      }
    };
    const stdoutDec = new TextDecoder("utf-8");
    let stdoutBuf = "";
    const stdoutState = (bytes: Uint8Array) => {
      stdoutBuf += stdoutDec.decode(bytes, { stream: true });
      while (true) {
        const nl = stdoutBuf.indexOf("\n");
        if (nl === -1) break;
        const line = stdoutBuf.slice(0, nl).replace(/\r$/, "");
        stdoutBuf = stdoutBuf.slice(nl + 1);
        if (line.length) post({ type: "stdout", text: line });
      }
    };

    const stderrDec = new TextDecoder("utf-8");
    let stderrBuf = "";
    const stderrState = (bytes: Uint8Array) => {
      stderrBuf += stderrDec.decode(bytes, { stream: true });
      while (true) {
        const nl = stderrBuf.indexOf("\n");
        if (nl === -1) break;
        const line = stderrBuf.slice(0, nl).replace(/\r$/, "");
        stderrBuf = stderrBuf.slice(nl + 1);
        if (line.length) post({ type: "stderr", text: line });
      }
    };

    const php = await factory({
      locateFile,
      stdin: phpStdinByte,
      print: (s: any) => {
        const text = String(s ?? "");
        const parts = text.split(/\r?\n/);
        for (const line of parts) {
          if (!line) continue;
          post({ type: "stdout", text: line });
        }
      },
      printErr: (s: any) => {
        const text = String(s ?? "");
        const parts = text.split(/\r?\n/);
        for (const line of parts) {
          if (!line) continue;
          post({ type: "stderr", text: line });
        }
      },
    });

    try {
      php.stdout = stdoutState;
      php.stderr = stderrState;
    } catch {}
    try {
      php.ccall("pib_storage_init", "number", [], []);
    } catch {}
    try {
      if (!php.FS.analyzePath("/preload").exists) php.FS.mkdir("/preload");
    } catch {}
    try {
      php.FS.writeFile("/php.ini", "\n", { encoding: "utf8" });
    } catch {}
    await php.ccall("pib_init", "number", ["string"], ["embed"], {
      async: true,
    });
    const flushStdout = () => {
      const line = stdoutBuf.replace(/\r?\n/g, "").trimEnd();
      if (line.length) post({ type: "stdout", text: line });
      stdoutBuf = "";
    };
    const flushStderr = () => {
      const line = stderrBuf.replace(/\r?\n/g, "").trimEnd();
      if (line.length) post({ type: "stderr", text: line });
      stderrBuf = "";
    };

    return { php, flushStdout, flushStderr };
  })();
  return _phpWasmLoaded;
}

async function runPhp(code: string, timeoutMs?: number) {
  try {
    post({ type: "status", text: "Загрузка PHP..." });
    const loaded = await loadPhpWasm();
    const php = loaded.php;

    _deadlineEpochMs = Date.now() + Math.max(0, (timeoutMs ?? 1000) - 50);
    _phpStdinQueue = [];
    post({ type: "status", text: "" });
    const trimmed = String(code ?? "");
    const source = trimmed.trimStart().startsWith("<?")
      ? trimmed
      : `<?php\n${trimmed}\n?>`;
    await php.ccall(
      "pib_run",
      "number",
      ["string"],
      [`?>${PHP_INPUT_PRELUDE}\n${source}`],
      { async: true },
    );
    loaded.flushStdout();
    loaded.flushStderr();
    post({ type: "done" });
  } catch (e: any) {
    post({ type: "error", message: String(e?.message || e) });
  }
}

// ---------- Python-линтер (pyflakes внутри отдельного экземпляра pyodide) ----------
// Экземпляр кэшируется: первый линт скачивает pyodide (~10 МБ, общий HTTP-кэш
// с рантаймом запуска), последующие — мгновенны.
let _lintPyodide: any = null;
let _lintLoading: Promise<any> | null = null;

async function getLintPyodide(): Promise<any> {
  if (_lintPyodide) return _lintPyodide;
  if (!_lintLoading) {
    _lintLoading = (async () => {
      (self as any).importScripts(
        "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js",
      );
      const py = await (self as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/",
      });
      // pyflakes не входит в дистрибутив pyodide — ставим из PyPI через micropip
      await py.loadPackage("micropip");
      const micropip = py.pyimport("micropip");
      await micropip.install("pyflakes");
      _lintPyodide = py;
      return py;
    })();
  }
  return _lintLoading;
}

async function lintPython(code: string, id: number) {
  try {
    const py = await getLintPyodide();
    py.globals.set("_lint_code", String(code ?? ""));
    const out = await py.runPythonAsync(`
import io
from pyflakes.api import check
from pyflakes.reporter import Reporter
_buf = io.StringIO()
check(_lint_code, "code.py", Reporter(_buf, _buf))
_buf.getvalue()
`);
    const text = String(out ?? "");
    const diagnostics = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        // формат pyflakes: code.py:СТРОКА:КОЛОНКА: сообщение
        const m = l.match(/^code\.py:(\d+):(\d+):\s*(.+)$/);
        if (!m) return null;
        return {
          line: Number(m[1]),
          column: Number(m[2]),
          message: m[3],
          severity: "error" as const,
        };
      })
      .filter(Boolean);
    (self as any).postMessage({ type: "lint_result", id, diagnostics });
  } catch {
    // Линтер недоступен (нет сети и т.п.) — молча возвращаем пустую диагностику
    (self as any).postMessage({ type: "lint_result", id, diagnostics: [] });
  }
}

self.onmessage = (ev: MessageEvent<WorkerInMsg>) => {
  const msg = ev.data as WorkerInMsg;
  // Запрос линтинга Python
  if ((msg as any).type === "lint_python") {
    const { code, id } = msg as any;
    void lintPython(String(code ?? ""), Number(id));
    return;
  }
  // Обрабатываем объединённый тип: запуск кода или ответ ввода
  if ("language" in msg) {
    const { language, code, timeoutMs } = msg;
    // Канал отладчика (если передан — функции подсветки активны)
    debugCtrl = msg.debugCtrl ? new Int32Array(msg.debugCtrl) : null;
    _postedLines = 0; // сбрасываем лимит на каждую новую задачу
    if (!code || !code.trim()) {
      post({ type: "done" });
      return;
    }
    try {
      if (language === "javascript" || language === "typescript") {
        runJS(code, timeoutMs);
      } else if (language === "python") {
        runPython(code, timeoutMs);
      } else if (language === "lua") {
        runLua(code, timeoutMs);
      } else if (language === "php") {
        runPhp(code, timeoutMs);
      } else {
        post({ type: "error", message: `Неизвестный язык: ${language}` });
      }
    } catch (e: any) {
      post({ type: "error", message: String(e?.message || e) });
    }
  } else {
    // Тип input_response обрабатывается рантаймами, здесь ничего не делаем
    return;
  }
};
