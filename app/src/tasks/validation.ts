// Проверка решений и UI-обвязка панели задач (кнопка «Проверить»,
// навигация «назад/вперёд», отрисовка результата).
import * as Blockly from "blockly";
import { getAppLang } from "../localization";
import { syncProgress } from "../progressSync";
import { countNonShadowBlocks } from "../workspaceUtils";
import { mountGlossaryForTask } from "../ui/glossary";
import { mountHintSteps } from "../ui/hintSteps";
import { mountSolutionOffer } from "../ui/solutions";
import { tasks } from "./registry";
import {
  FREE_TASK_NAV,
  getActiveTask,
  getNextTaskId,
  getPrevTaskId,
  isSolved,
  markSolved,
  setActiveDifficulty,
  setActiveTaskId,
} from "./state";
import type { InitTaskValidationOptions, TaskDef, TaskId } from "./types";
import { applyCodeModeStars, getVisibleOutputLines } from "./utils";

function renderResult(
  feedbackEl: HTMLDivElement | null,
  starsEl: HTMLDivElement | null,
  ok: boolean,
  stars: number,
  failureHint: string
) {
  if (starsEl) {
    starsEl.innerHTML = "";
    const total = 3;
    for (let i = 0; i < total; i++) {
      const span = document.createElement("span");
      span.textContent = i < stars ? "★" : "☆";
      span.style.color = i < stars ? "#f5a623" : "#999";
      span.style.fontSize = "18px";
      span.style.marginRight = "2px";
      starsEl.appendChild(span);
    }
  }

  if (feedbackEl) {
    const t = (window as any)._currentLocalizedStrings;
    if (ok) {
      feedbackEl.style.color = "#2e7d32";
      feedbackEl.textContent =
        stars === 3
          ? t?.TaskPerfect || "Отлично! Решение оптимально."
          : t?.TaskPassed || "Решение верное.";
    } else {
      feedbackEl.style.color = "#c62828";
      feedbackEl.textContent = failureHint;
    }
  }
}

export function setActiveTask(taskId: TaskId) {
  setActiveTaskId(taskId);
  setActiveDifficulty(tasks[taskId].difficulty);
  const lang = getAppLang();

  const titleEl = document.querySelector("#taskSidebar .task-title") as HTMLElement | null;
  const descEl = document.querySelector("#taskSidebar .task-desc") as HTMLElement | null;
  const hintDetails = document.getElementById("taskHintDetails") as HTMLDetailsElement | null;
  const feedbackEl = document.getElementById("taskFeedback") as HTMLDivElement | null;
  const starsEl = document.getElementById("taskStars") as HTMLDivElement | null;
  const nextButton = document.getElementById("nextTaskBtn") as HTMLButtonElement | null;
  const prevButton = document.getElementById("prevTaskBtn") as HTMLButtonElement | null;

  const tdef = tasks[getActiveTask()];
  if (titleEl) titleEl.textContent = tdef.title(lang);
  if (descEl) descEl.innerHTML = tdef.description(lang);
  // Пошаговая подсказка: шаги открываются по одному (ui/hintSteps.ts)
  if (hintDetails) {
    hintDetails.open = false;
    mountHintSteps(hintDetails, tdef.hint(lang));
  }
  if (feedbackEl) feedbackEl.textContent = "";
  if (starsEl) starsEl.innerHTML = "";
  // Кнопка «Сравнить с оптимальным» относится к конкретной задаче —
  // при переходе скрываем, иначе она «переезжает» на следующие задачи
  const offerEl = document.getElementById("taskSolutionOffer");
  if (offerEl) offerEl.innerHTML = "";
  const nextId = getNextTaskId(getActiveTask());
  if (nextButton)
    nextButton.disabled = nextId === null ? true : !FREE_TASK_NAV && !isSolved(getActiveTask());
  if (prevButton) prevButton.disabled = getPrevTaskId(getActiveTask()) === null;

  const consoleInfo = document.getElementById("consoleOutputInfoSection") as HTMLDivElement | null;
  const forLoopInfo = document.getElementById("forLoopInfoSection") as HTMLDivElement | null;
  const whileLoopInfo = document.getElementById("whileLoopInfoSection") as HTMLDivElement | null;
  const listInfo = document.getElementById("listInfoSection") as HTMLDivElement | null;
  const sublistInfo = document.getElementById("sublistInfoSection") as HTMLDivElement | null;
  const listFilterInfo = document.getElementById("listFilterInfoSection") as HTMLDivElement | null;
  const dataTypesInfo = document.getElementById("dataTypesInfoSection") as HTMLDivElement | null;
  const variableInfo = document.getElementById("variableInfoSection") as HTMLDivElement | null;
  const concatInfo = document.getElementById("concatInfoSection") as HTMLDivElement | null;
  const incDecInfo = document.getElementById("incDecInfoSection") as HTMLDivElement | null;
  const conditionInfo = document.getElementById("conditionInfoSection") as HTMLDivElement | null;
  const logicalOpsInfo = document.getElementById("logicalOpsInfoSection") as HTMLDivElement | null;
  // Справочник тем (ui/glossary.ts): рендерится под условием, если у
  // задачи заданы infoTopics; сам контейнер скрывает себя при пустом списке
  const glossaryInfo = document.getElementById("glossaryInfoSection") as HTMLDivElement | null;
  if (glossaryInfo) mountGlossaryForTask(glossaryInfo, getActiveTask());
  const hasGlossary = (tdef.infoTopics?.length ?? 0) > 0;
  const showDataTypes = getActiveTask() === "add_2_7";
  const showVariableInfo = getActiveTask() === "var_my_age" || getActiveTask() === "calc_sum";
  const showConcatInfo = getActiveTask() === "greet_concat";
  const showIncDecInfo = getActiveTask() === "inc_counter";
  const showForLoopInfo = getActiveTask() === "first_loop" || getActiveTask() === "sum_1_to_n";
  const showWhileLoopInfo = getActiveTask() === "guess_game";
  const showListInfo = getActiveTask() === "list_foreach";
  const showSublistInfo = getActiveTask() === "sublist_foreach";
  const showListFilterInfo =
    getActiveTask() === "list_filter_even" ||
    getActiveTask() === "list_filter_even_min_max" ||
    getActiveTask() === "list_filter_even_avg" ||
    getActiveTask() === "list_filter_even_median" ||
    getActiveTask() === "list_sum_even_positions";
  const showConditionInfo =
    getActiveTask() === "even_or_odd" || getActiveTask() === "first_condition";
  const showLogicalOpsInfo = getActiveTask() === "time_of_day";
  const showConsole =
    !hasGlossary &&
    !showDataTypes &&
    !showVariableInfo &&
    !showConcatInfo &&
    !showIncDecInfo &&
    !showForLoopInfo &&
    !showWhileLoopInfo &&
    !showListInfo &&
    !showSublistInfo &&
    !showListFilterInfo &&
    !showConditionInfo &&
    !showLogicalOpsInfo;
  if (consoleInfo) consoleInfo.style.display = showConsole ? "" : "none";
  if (forLoopInfo) forLoopInfo.style.display = showForLoopInfo ? "" : "none";
  if (whileLoopInfo) whileLoopInfo.style.display = showWhileLoopInfo ? "" : "none";
  if (listInfo) listInfo.style.display = showListInfo ? "" : "none";
  if (sublistInfo) sublistInfo.style.display = showSublistInfo ? "" : "none";
  if (listFilterInfo) listFilterInfo.style.display = showListFilterInfo ? "" : "none";
  if (dataTypesInfo) dataTypesInfo.style.display = showDataTypes ? "" : "none";
  if (variableInfo) variableInfo.style.display = showVariableInfo ? "" : "none";
  if (concatInfo) concatInfo.style.display = showConcatInfo ? "" : "none";
  if (incDecInfo) incDecInfo.style.display = showIncDecInfo ? "" : "none";
  if (conditionInfo) conditionInfo.style.display = showConditionInfo ? "" : "none";
  if (logicalOpsInfo) logicalOpsInfo.style.display = showLogicalOpsInfo ? "" : "none";
  // «Найди ошибку»: в пустое поле подкладываем сломанную программу
  if (tdef.kind === "fix") loadStarter(tdef);
}

/**
 * Загружает starterXml fix-задачи, только если поле пустое — так
 * переход «вперёд» (после ws.clear) и старт гостя получают сломанную
 * программу, а смена языка/синхронизация не затирают правки ученика.
 */
function loadStarter(tdef: TaskDef): void {
  if (!tdef.starterXml) return;
  const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
  if (!ws || countNonShadowBlocks(ws) > 0) return;
  try {
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(tdef.starterXml), ws);
  } catch (e) {
    console.error("Не удалось загрузить стартовую программу задачи:", e);
  }
}

/**
 * Синхронизирует прогресс с сервером (для авторизованных) и обновляет
 * UI текущей задачи. Вызывается при старте приложения и после логина.
 */
export async function syncTaskProgress(): Promise<void> {
  const before = isSolved(getActiveTask());
  await syncProgress();
  const after = isSolved(getActiveTask());
  // Если синхронизация изменила статус текущей задачи — перерисуем UI
  if (before !== after) {
    try {
      setActiveTask(getActiveTask());
    } catch {}
  }
}

export function initTaskValidation(ws: Blockly.WorkspaceSvg, opts: InitTaskValidationOptions) {
  const { checkButton, feedbackEl, starsEl, nextButton, prevButton } = opts;
  if (!checkButton) return;

  // Сброс визуального результата
  const resetResult = () => {
    if (feedbackEl) feedbackEl.textContent = "";
    if (starsEl) starsEl.innerHTML = "";
  };

  checkButton.addEventListener("click", () => {
    void (async () => {
      // Требуем, чтобы пользователь сначала выполнил код через кнопку запуска
      const currentLines = getVisibleOutputLines();
      const t = (window as any)._currentLocalizedStrings;
      if (currentLines.length === 0) {
        const msg =
          t?.RunFirst || (getAppLang() === "ru" ? "Сначала запустите код" : "Run the code first");
        renderResult(feedbackEl, starsEl, false, 0, msg || "");
        return;
      }

      const tdef = tasks[getActiveTask()];
      const { ok, stars } = applyCodeModeStars(
        await tdef.validate(ws, currentLines, getAppLang()),
        ws
      );
      const hint = tdef.hint(getAppLang());
      renderResult(feedbackEl, starsEl, ok, stars, hint);

      if (ok) {
        markSolved(getActiveTask(), stars);
        if (nextButton)
          nextButton.disabled =
            getNextTaskId(getActiveTask()) === null
              ? true
              : !FREE_TASK_NAV && !isSolved(getActiveTask());
        // Предложение сравнить с эталонным решением — только после
        // верного решения (ui/solutions.ts)
        const offerEl = document.getElementById("taskSolutionOffer");
        if (offerEl) mountSolutionOffer(offerEl, getActiveTask());
      } else {
        const offerEl = document.getElementById("taskSolutionOffer");
        if (offerEl) offerEl.innerHTML = "";
      }
    })();
  });

  if (nextButton) {
    // Кнопка активируется только если текущая задача решена и есть следующая
    nextButton.disabled =
      getNextTaskId(getActiveTask()) === null ? true : !FREE_TASK_NAV && !isSolved(getActiveTask());
    nextButton.addEventListener("click", () => {
      const next = getNextTaskId(getActiveTask());
      if (!next) return;
      ws.clear();
      setActiveTask(next);
      // после перехода — блокируем кнопку снова, пока новая задача не решена
      nextButton.disabled = getNextTaskId(next) === null ? true : !FREE_TASK_NAV && !isSolved(next);
      if (prevButton) prevButton.disabled = getPrevTaskId(next) === null;
      resetResult();
    });
  }

  if (prevButton) {
    // Кнопка предыдущей задачи активна, если есть предыдущая
    prevButton.disabled = getPrevTaskId(getActiveTask()) === null;
    prevButton.addEventListener("click", () => {
      const prev = getPrevTaskId(getActiveTask());
      if (!prev) return;
      setActiveTask(prev);
      // после перехода — пересчитываем состояния навигации
      prevButton.disabled = getPrevTaskId(prev) === null;
      if (nextButton)
        nextButton.disabled =
          getNextTaskId(prev) === null ? true : !FREE_TASK_NAV && !isSolved(prev);
      resetResult();
    });
  }
}
