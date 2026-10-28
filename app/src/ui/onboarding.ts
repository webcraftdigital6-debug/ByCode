/**
 * Онбординг-тур: пошаговый показ интерфейса с подсветкой элементов
 * (spotlight). Показывается один раз каждому посетителю (флаг в
 * localStorage); повторный запуск — кнопка «🧭 Обучение» (меню «⋯»
 * на десктопе, бургер-меню на мобильных).
 */

import { getAppLang } from "../localization";

export const ONBOARDING_FLAG_KEY = "onboarding_shown_v1";
export const ONBOARDING_FLAG_VALUE = "v1";

export type TourStep = {
  id: string;
  // CSS-селектор элемента подсветки; null — шаг без цели (приветствие/финал)
  target: string | null;
  title: () => string;
  body: () => string;
};

export type VisibilityCheck = (selector: string) => boolean;

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: () => t("Добро пожаловать в ByCode!", "Welcome to ByCode!"),
    body: () =>
      t(
        "Здесь программы собирают из блоков, как конструктор, и сразу проверяют автоматически. Тур займёт меньше минуты.",
        "Here you build programs from blocks, like a construction set, and get them checked automatically. The tour takes under a minute.",
      ),
  },
  {
    id: "toolbox",
    target: ".blocklyToolbox, .blocklyToolboxDiv",
    title: () => t("Панель блоков", "Block palette"),
    body: () =>
      t(
        "Открой категорию — её блоки появятся в выезжающей панели. Перетащи нужный блок в рабочую область. На телефоне сначала коснись панели категорий.",
        "Open a category to reveal its blocks, then drag a block onto the workspace. On phones, tap the category strip first.",
      ),
  },
  {
    id: "workspace",
    target: "#blocklyDiv",
    title: () => t("Рабочая область", "Workspace"),
    body: () =>
      t(
        "Здесь живёт твоя программа: блоки сцепляются сами. Правый клик по блоку — копирование, удаление и справка.",
        "Your program lives here: blocks snap together on their own. Right-click a block to copy, delete or get help.",
      ),
  },
  {
    id: "code",
    target: "#editor",
    title: () => t("Сгенерированный код", "Generated code"),
    body: () =>
      t(
        "Любое изменение блоков мгновенно превращается в настоящий код — JavaScript, Python, Lua или PHP на выбор.",
        "Every block change instantly becomes real code — JavaScript, Python, Lua or PHP of your choice.",
      ),
  },
  {
    id: "run",
    target: "#aceRunBtn",
    title: () => t("Запуск", "Run"),
    body: () =>
      t(
        "Нажми ▶ — программа выполнится прямо в браузере, ничего никуда отправлять не нужно.",
        "Press ▶ — the program runs right in the browser; nothing is sent anywhere.",
      ),
  },
  {
    id: "output",
    target: "#output",
    title: () => t("Окно вывода", "Output"),
    body: () =>
      t(
        "Сюда печатает твоя программа. Сравни вывод с ожидаемым до проверки задачи.",
        "Your program prints here. Compare the output with the expected result before checking the task.",
      ),
  },
  {
    id: "tasks",
    target: "#taskSolutionBtn",
    title: () => t("Задачи и проверка", "Tasks and checking"),
    body: () =>
      t(
        "В панели задач — условие, пошаговая подсказка и кнопка «Проверить решение». За оптимальность дают звёзды, а эталонное решение откроется только после того, как справишься сам.",
        "The task panel holds the description, step-by-step hints and the 'Check solution' button. Stars reward an optimal solution, and the reference opens only after you solve it yourself.",
      ),
  },
  {
    id: "langs",
    target: "#genLangHeaderSelect",
    title: () => t("Языки и тема", "Language & theme"),
    body: () =>
      t(
        "В шапке переключают язык интерфейса (RU/EN), тему (☀️/🌙) и язык генерации кода.",
        "The header switches the UI language (RU/EN), theme (☀️/🌙) and code generation language.",
      ),
  },
  {
    id: "customBlocks",
    target: "#importBlockBtn",
    title: () => t("Создай свой блок", "Create your own block"),
    body: () =>
      t(
        "Кнопка «Создать блок» открывает редактор: опиши новый блок JSON-определением и добавь генератор кода — блок появится в категории «Кастомные блоки» в тулбоксе.",
        "The 'Create block' button opens an editor: describe a new block with a JSON definition and a code generator — it appears in the 'Custom blocks' toolbox category.",
      ),
  },
  {
    id: "finish",
    target: null,
    title: () => t("Готово — начни решать!", "You're set — start solving!"),
    body: () =>
      t(
        "Открой «Решение задач», выбери уровень «Основа» и собери первую программу. Вернуться к туру можно кнопкой «Обучение» в меню «⋯» или в бургер-меню.",
        "Open 'Tasks', pick the Basic level and build your first program. You can replay this tour via the 'Tutorial' button in the '⋯' menu or the burger menu.",
      ),
  },
];

export function shouldShowOnboarding(stored: string | null): boolean {
  return stored !== ONBOARDING_FLAG_VALUE;
}

export function elementVisible(selector: string): boolean {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Шаг недоступен, если его цель не видна (например, кнопка спрятана
// в мобильном layout) — тур пропускает такие шаги автоматически.
export function nextVisibleIndex(
  steps: TourStep[],
  from: number,
  isVisible: VisibilityCheck,
): number {
  for (let i = from + 1; i < steps.length; i++) {
    const s = steps[i];
    if (!s.target || isVisible(s.target)) return i;
  }
  return -1;
}

export function prevVisibleIndex(
  steps: TourStep[],
  from: number,
  isVisible: VisibilityCheck,
): number {
  for (let i = from - 1; i >= 0; i--) {
    const s = steps[i];
    if (!s.target || isVisible(s.target)) return i;
  }
  return -1;
}

type TourUI = {
  root: HTMLDivElement;
  spot: HTMLDivElement;
  card: HTMLDivElement;
  titleEl: HTMLHeadingElement;
  bodyEl: HTMLParagraphElement;
  counterEl: HTMLSpanElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  skipBtn: HTMLButtonElement;
  index: number;
  onResize: () => void;
  onKey: (e: KeyboardEvent) => void;
};

let ui: TourUI | null = null;
const SPOT_PAD = 8;

function markShown(): void {
  try {
    localStorage.setItem(ONBOARDING_FLAG_KEY, ONBOARDING_FLAG_VALUE);
  } catch {}
}

function destroy(): void {
  if (!ui) return;
  window.removeEventListener("resize", ui.onResize);
  window.removeEventListener("scroll", ui.onResize, true);
  document.removeEventListener("keydown", ui.onKey);
  ui.root.remove();
  ui = null;
}

function targetRect(step: TourStep): DOMRect | null {
  if (!step.target) return null;
  const el = document.querySelector(step.target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;
  return r;
}

function positionSpot(step: TourStep): void {
  if (!ui) return;
  const r = targetRect(step);
  if (r) {
    ui.spot.style.display = "";
    ui.spot.style.left = `${r.left - SPOT_PAD}px`;
    ui.spot.style.top = `${r.top - SPOT_PAD}px`;
    ui.spot.style.width = `${r.width + SPOT_PAD * 2}px`;
    ui.spot.style.height = `${r.height + SPOT_PAD * 2}px`;
  } else {
    ui.spot.style.display = "none";
  }
}

function positionCard(step: TourStep): void {
  if (!ui) return;
  const cw = ui.card.offsetWidth || 360;
  const ch = ui.card.offsetHeight || 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 16;
  if (vw <= 768) return; // раскладка — через CSS (нижний лист)
  const r = targetRect(step);
  if (!r) {
    ui.card.style.left = `${Math.max(margin, (vw - cw) / 2)}px`;
    ui.card.style.top = `${Math.max(margin, (vh - ch) / 2)}px`;
    return;
  }
  const below = r.bottom + SPOT_PAD + 10;
  const fitsBelow = below + ch <= vh - margin;
  const top = fitsBelow
    ? below
    : Math.max(margin, r.top - SPOT_PAD - 10 - ch);
  const left = Math.min(
    Math.max(margin, r.left + r.width / 2 - cw / 2),
    vw - cw - margin,
  );
  ui.card.style.left = `${left}px`;
  ui.card.style.top = `${top}px`;
}

function render(): void {
  if (!ui) return;
  const step = TOUR_STEPS[ui.index];
  const last = nextVisibleIndex(TOUR_STEPS, ui.index, elementVisible) === -1;
  ui.titleEl.textContent = step.title();
  ui.bodyEl.textContent = step.body();
  ui.counterEl.textContent = `${ui.index + 1} / ${TOUR_STEPS.length}`;
  ui.skipBtn.textContent = t("Пропустить", "Skip");
  ui.prevBtn.textContent = t("Назад", "Back");
  ui.nextBtn.textContent = last
    ? t("Готово", "Done")
    : t("Далее", "Next");
  ui.prevBtn.style.visibility =
    prevVisibleIndex(TOUR_STEPS, ui.index, elementVisible) === -1
      ? "hidden"
      : "";
  ui.card.setAttribute("aria-label", step.title());
  positionSpot(step);
  positionCard(step);
}

function goNext(): void {
  if (!ui) return;
  const n = nextVisibleIndex(TOUR_STEPS, ui.index, elementVisible);
  if (n === -1) {
    markShown();
    destroy();
    return;
  }
  ui.index = n;
  render();
}

function goPrev(): void {
  if (!ui) return;
  const n = prevVisibleIndex(TOUR_STEPS, ui.index, elementVisible);
  if (n === -1) return;
  ui.index = n;
  render();
}

function skip(): void {
  markShown();
  destroy();
}

export function startOnboarding(): void {
  destroy();

  const root = document.createElement("div");
  root.className = "ob-root";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");

  const spot = document.createElement("div");
  spot.className = "ob-spot";
  spot.setAttribute("aria-hidden", "true");

  const card = document.createElement("div");
  card.className = "ob-card";

  const titleEl = document.createElement("h3");
  titleEl.className = "ob-title";
  const bodyEl = document.createElement("p");
  bodyEl.className = "ob-body";
  const actions = document.createElement("div");
  actions.className = "ob-actions";

  const skipBtn = document.createElement("button");
  skipBtn.type = "button";
  skipBtn.className = "ob-skip";
  const counterEl = document.createElement("span");
  counterEl.className = "ob-counter";
  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "btn small ob-prev";
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn small primary ob-next";

  skipBtn.addEventListener("click", skip);
  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  actions.append(skipBtn, counterEl, prevBtn, nextBtn);
  card.append(titleEl, bodyEl, actions);
  root.append(spot, card);
  document.body.appendChild(root);

  const onResize = () => render();
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") skip();
    else if (e.key === "ArrowRight" || e.key === "Enter") goNext();
    else if (e.key === "ArrowLeft") goPrev();
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onResize, true);
  document.addEventListener("keydown", onKey);

  ui = {
    root,
    spot,
    card,
    titleEl,
    bodyEl,
    counterEl,
    prevBtn,
    nextBtn,
    skipBtn,
    index: 0,
    onResize,
    onKey,
  };
  render();
  nextBtn.focus();
}

/**
 * Показывает тур при первом визите. Задержка по умолчанию даёт
 * layout'у стабилизироваться, чтобы замеры целей были корректны.
 */
export function maybeStartOnboarding(delayMs = 700): void {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(ONBOARDING_FLAG_KEY);
  } catch {
    return;
  }
  if (!shouldShowOnboarding(stored)) return;
  window.setTimeout(() => startOnboarding(), delayMs);
}

export function localizeOnboardingUI(): void {
  const span = document.getElementById("onboardingReplayBtnText");
  if (span) span.textContent = t("🧭 Обучение", "🧭 Tutorial");
  const btn = document.getElementById("onboardingReplayBtn");
  if (btn) {
    btn.setAttribute("title", t("Как пользоваться", "How to use"));
    btn.setAttribute("aria-label", t("Как пользоваться", "How to use"));
  }
  const item = document.querySelector(
    ".mobile-menu-item[data-action='onboardingReplayBtn']",
  );
  if (item) item.textContent = t("🧭 Обучение (тур)", "🧭 Tutorial tour");
  if (ui) render();
}

/** Привязывает кнопку повторного запуска тура (существующую в DOM). */
export function initOnboardingReplay(): void {
  localizeOnboardingUI();
  document
    .getElementById("onboardingReplayBtn")
    ?.addEventListener("click", () => startOnboarding());
}
