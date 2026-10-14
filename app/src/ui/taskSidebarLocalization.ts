// Локализация статичных элементов панели задач: заголовки, кнопки и критерии
// звёзд. Строки берутся из глобального (window)._currentLocalizedStrings с
// фолбэком на inline RU/EN тексты. Инфоблоки под условием задачи рендерит
// справочник тем (ui/glossary.ts), поэтому здесь их локализации больше нет.
// Вынесено из index.ts.

export function localizeTaskSidebarStaticUI(lang: "ru" | "en") {
  const t = (window as any)._currentLocalizedStrings;

  const nextLabel =
    t?.NextTask || (lang === "ru" ? "Следующая задача" : "Next task");
  const prevLabel =
    t?.PrevTask || (lang === "ru" ? "Предыдущая задача" : "Previous task");
  const btn = document.getElementById("nextTaskBtn");
  if (btn) btn.textContent = `${nextLabel} →`;
  const prev = document.getElementById("prevTaskBtn");
  if (prev) prev.textContent = `← ${prevLabel}`;

  const solText = document.getElementById("taskSolutionBtnText");
  if (solText)
    (solText as HTMLElement).textContent = `ℹ️ ${
      t?.TaskSolutions || (lang === "ru" ? "Решение задач" : "Task Solutions")
    }`;

  const checkBtn = document.getElementById("checkTaskBtn");
  if (checkBtn)
    (checkBtn as HTMLElement).textContent =
      t?.CheckSolution ||
      (lang === "ru" ? "Проверить решение" : "Check solution");

  const hintSummary = document.getElementById("taskHintSummary");
  if (hintSummary)
    (hintSummary as HTMLElement).textContent =
      t?.TaskHintLabel || (lang === "ru" ? "Подсказка" : "Hint");

  const diffBasic = document.getElementById("taskDifficultyBasic");
  if (diffBasic)
    (diffBasic as HTMLElement).textContent =
      t?.TaskDifficultyBasic || (lang === "ru" ? "Основа" : "Basic");
  const diffFixbugs = document.getElementById("taskDifficultyFixbugs");
  if (diffFixbugs)
    (diffFixbugs as HTMLElement).textContent =
      t?.TaskDifficultyFixbugs ||
      (lang === "ru" ? "Найди ошибку" : "Find the Bug");
  const diffAdvanced = document.getElementById("taskDifficultyAdvanced");
  if (diffAdvanced)
    (diffAdvanced as HTMLElement).textContent =
      t?.TaskDifficultyAdvanced || (lang === "ru" ? "Продвинутый" : "Advanced");

  const criteriaLabel = document.getElementById("taskStarsCriteriaLabel");
  if (criteriaLabel) {
    (criteriaLabel as HTMLElement).textContent =
      t?.StarsCriteria ||
      (lang === "ru" ? "Критерии звёзд:" : "Stars criteria:");
  }
  const starsOptimal =
    t?.StarsOptimal ||
    (lang === "ru"
      ? "оптимально (минимум блоков)"
      : "optimal (minimum blocks)");
  const starsGood = t?.StarsGood || (lang === "ru" ? "хорошо" : "good");
  const starsCorrect =
    t?.StarsCorrect || (lang === "ru" ? "решение верное" : "solution correct");
  const optimalEl = document.getElementById("taskStarsCriteriaOptimal");
  if (optimalEl)
    (optimalEl as HTMLElement).textContent = `★★★ — ${starsOptimal}`;
  const goodEl = document.getElementById("taskStarsCriteriaGood");
  if (goodEl) (goodEl as HTMLElement).textContent = `★★ — ${starsGood}`;
  const correctEl = document.getElementById("taskStarsCriteriaCorrect");
  if (correctEl) (correctEl as HTMLElement).textContent = `★ — ${starsCorrect}`;

}
