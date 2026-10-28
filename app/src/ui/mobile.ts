/**
 * Мобильная логика: обнаружение мобильного устройства, меню, тулбокс для мобильных.
 */

import * as Blockly from "blockly/core";

const MOBILE_BREAKPOINT = "(max-width: 768px)";
const COMPACT_MOBILE_BREAKPOINT = "(max-width: 540px)";
const MOBILE_OUTPUT_HEIGHT_KEY = "layout.mobile.outputHeightPx";

// Состояние мобильного UI (глобальное, чтобы не создавать обработчики дважды)
let isMobile = false;
let mobileMenuBackdrop: HTMLElement | null = null;
let mobileMenuPanel: HTMLElement | null = null;
let mobileMenuCloseBtn: HTMLElement | null = null;
let mobileToolboxBackdrop: HTMLElement | null = null;
let taskSidebar: HTMLElement | null = null;
let taskSolutionBtn: HTMLElement | null = null;

// Коллбеки для интеграции с основным приложением
type MobileMenuAction = (action: string) => void;
let onMenuAction: MobileMenuAction | null = null;

type ToolboxResizeCallback = () => void;
let onToolboxResize: ToolboxResizeCallback | null = null;

/**
 * Подгоняет высоту полноэкранных оверлеев под видимую область.
 * Layout viewport на мобильных браузерах выше видимой (панель инструментов
 * перекрывает низ), из-за чего последние пункты меню не доскролливаются.
 */
function syncOverlayHeight(): void {
  const vv = window.visualViewport;
  if (!vv) return;
  const height = isMobile ? `${Math.round(vv.height)}px` : "";
  if (mobileMenuBackdrop) mobileMenuBackdrop.style.height = height;
  if (taskSidebar) taskSidebar.style.height = height;
}

/**
 * Инициализация: находим DOM-элементы
 */
export function initMobileUI(options: {
  onMenuAction?: MobileMenuAction;
  onToolboxResize?: ToolboxResizeCallback;
}): void {
  onMenuAction = options.onMenuAction ?? null;
  onToolboxResize = options.onToolboxResize ?? null;

  mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");
  mobileMenuPanel = document.getElementById("mobileMenuPanel");
  mobileMenuCloseBtn = document.getElementById("mobileMenuCloseBtn");
  mobileToolboxBackdrop = document.getElementById("mobileToolboxBackdrop");
  taskSidebar = document.getElementById("taskSidebar");
  taskSolutionBtn = document.getElementById("taskSolutionBtn");

  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mq = window.matchMedia(MOBILE_BREAKPOINT);

  const apply = () => {
    isMobile = mq.matches;
    document.body.classList.toggle("mobile", isMobile);

    if (!isMobile) {
      setMobileMenuOpen(false);
      setMobileToolboxOpen(false);
      document.body.style.removeProperty("--mobile-output-height");
    } else {
      const outputPane = document.getElementById("outputPane");
      const blocklyDiv = document.getElementById("blocklyDiv");
      if (outputPane) outputPane.style.flex = "";
      if (blocklyDiv) blocklyDiv.style.flex = "";
      setMobileToolboxOpen(false);

      const saved = parseFloat(
        localStorage.getItem(MOBILE_OUTPUT_HEIGHT_KEY) || "0",
      );
      if (saved > 0) {
        document.body.style.setProperty("--mobile-output-height", `${saved}px`);
      }
    }
    onToolboxResize?.();
    syncOverlayHeight();
  };

  apply();
  try {
    mq.addEventListener("change", apply);
  } catch {
    try {
      (mq as any).addListener(apply);
    } catch {}
  }
  try {
    window.visualViewport?.addEventListener("resize", syncOverlayHeight);
  } catch {}

  // Обработчики кнопок мобильного меню
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMobileMenuOpen(true);
    });
  }

  if (mobileMenuCloseBtn) {
    mobileMenuCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMobileMenuOpen(false);
    });
  }

  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.addEventListener("click", (e) => {
      if (e.target === mobileMenuBackdrop) setMobileMenuOpen(false);
    });
  }

  if (mobileMenuPanel) {
    mobileMenuPanel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const actionEl = target?.closest?.("[data-action]") as HTMLElement | null;
      const genLangEl = target?.closest?.("[data-genlang]") as HTMLElement | null;

      if (actionEl) {
        const action = actionEl.getAttribute("data-action") || "";
        if (action === "toggleLang") {
          const input = document.getElementById("langSwitchInput");
          if (input) {
            (input as HTMLInputElement).checked = !(input as HTMLInputElement).checked;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
          setMobileMenuOpen(false);
          return;
        }
        if (action === "toggleTheme") {
          const input = document.getElementById("themeSwitchInput");
          if (input) {
            (input as HTMLInputElement).checked = !(input as HTMLInputElement).checked;
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
          setMobileMenuOpen(false);
          return;
        }
        if (action === "taskDifficultySelect") {
          const isCompactMobile = window.matchMedia(
            COMPACT_MOBILE_BREAKPOINT,
          ).matches;
          if (!isCompactMobile) {
            setMobileMenuOpen(false);
            return;
          }
          toggleTaskSidebar(true);
          if (taskSidebar) taskSidebar.classList.add("mode-select");
          setMobileMenuOpen(false);
          return;
        }
        const btn = document.getElementById(action);
        if (btn) {
          btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
        setMobileMenuOpen(false);
        return;
      }

      if (genLangEl) {
        const value = genLangEl.getAttribute("data-genlang") || "";
        const option = document.querySelector(
          `#dropdownOptions .option[data-value="${value}"]`,
        );
        option?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        setMobileMenuOpen(false);
      }
    });
  }
}

/**
 * Открыть/закрыть боковую панель задач
 */
export function toggleTaskSidebar(force?: boolean): void {
  const sidebar = document.getElementById("taskSidebar");
  const pageContainer = document.getElementById("pageContainer");
  const solutionBtn = document.getElementById("taskSolutionBtn");
  
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains("open");
  const next = force !== undefined ? force : !isOpen;

  sidebar.classList.toggle("open", next);
  if (next && !isMobile) {
    sidebar.classList.add("mode-select");
  }
  if (pageContainer && !isMobile) {
    pageContainer.classList.toggle("sidebar-open", next);
  }
  if (solutionBtn) {
    solutionBtn.setAttribute("aria-pressed", next ? "true" : "false");
  }

  onToolboxResize?.();
  syncOverlayHeight();
  requestAnimationFrame(() => {
    onToolboxResize?.();
  });
}

/**
 * Открыть/закрыть мобильное меню (гамбургер)
 */
export function setMobileMenuOpen(open: boolean): void {
  if (!mobileMenuBackdrop) return;
  mobileMenuBackdrop.style.display = open ? "" : "none";
  mobileMenuBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.style.overflow = open ? "hidden" : "";
  if (open) syncOverlayHeight();
}

/**
 * Открыть/закрыть мобильный тулбокс (панель блоков)
 *
 * Строка поиска блоков прячется только на мобильных устройствах в свёрнутом
 * тулбоксе. На десктопе она видна всегда: вызов с open=false (например,
 * при инициализации или пересечении брейкпоинта 768px) сбрасывает inline-стиль
 * и возвращает скрытую ранее строку.
 */
export function setMobileToolboxOpen(open: boolean): void {
  if (!isMobile) open = false;
  document.body.classList.toggle("toolbox-open", open);

  if (mobileToolboxBackdrop) {
    mobileToolboxBackdrop.style.display = open ? "" : "none";
    mobileToolboxBackdrop.setAttribute(
      "aria-hidden",
      open ? "false" : "true",
    );
  }

  try {
    const searchInput = document.querySelector(
      ".blocklyToolboxCategory input[type='search']",
    ) as HTMLInputElement | null;
    const searchCategory = searchInput?.closest?.(
      ".blocklyToolboxCategory",
    ) as HTMLElement | null;
    if (searchCategory) {
      searchCategory.style.display = isMobile && !open ? "none" : "";
    }
  } catch {}

  try {
    onToolboxResize?.();
  } catch {}
}

/**
 * Инициализация мобильного тулбокса (открытие по тапу, свайп для закрытия)
 */
export function initMobileToolboxUI(workspace: Blockly.WorkspaceSvg): void {
  try {
    if (mobileToolboxBackdrop) {
      const anyEl = mobileToolboxBackdrop as any;
      if (!anyEl.__mobileToolboxInit) {
        anyEl.__mobileToolboxInit = true;
        mobileToolboxBackdrop.addEventListener("click", () => {
          setMobileToolboxOpen(false);
        });
      }
    }

    const toolbox = (workspace as any).getToolbox?.();
    const toolboxDiv =
      toolbox && typeof toolbox.getHtmlDiv === "function"
        ? (toolbox.getHtmlDiv() as HTMLDivElement)
        : (document.querySelector(
            ".blocklyToolboxDiv, .blocklyToolbox",
          ) as HTMLDivElement | null);

    if (toolboxDiv) {
      const anyDiv = toolboxDiv as any;
      if (!anyDiv.__mobileToolboxInit) {
        anyDiv.__mobileToolboxInit = true;
        toolboxDiv.addEventListener("pointerdown", (e: PointerEvent) => {
          if (!isMobile) return;
          if (!document.body.classList.contains("toolbox-open")) {
            e.preventDefault();
            e.stopPropagation();
            setMobileToolboxOpen(true);
          }
        });
        toolboxDiv.addEventListener("click", (e) => {
          if (!isMobile) return;
          if (!document.body.classList.contains("toolbox-open")) return;
          const target = e.target as HTMLElement | null;
          if (!target) return;
          const cat = target.closest(
            ".blocklyToolboxCategory",
          ) as HTMLElement | null;
          if (!cat) return;
          if (cat.querySelector("input[type='search']")) return;
          requestAnimationFrame(() => {
            setMobileToolboxOpen(false);
            try {
              const flyoutWs = (workspace as any)
                .getFlyout?.()
                ?.getWorkspace?.() as Blockly.WorkspaceSvg | undefined;
              flyoutWs?.setScale?.(0.85);
            } catch {}
          });
        });
      }
    }

    const anyWs = workspace as any;
    if (!anyWs.__mobileToolboxCloseInit) {
      anyWs.__mobileToolboxCloseInit = true;
      workspace.addChangeListener((e: any) => {
        if (!isMobile) return;
        if (!document.body.classList.contains("toolbox-open")) return;
        if (!e || e.type !== (Blockly as any).Events?.BLOCK_CREATE) return;
        if (e.recordUndo === false) return;
        setMobileToolboxOpen(false);
        try {
          (workspace as any).getFlyout?.()?.hide?.();
        } catch {}
        try {
          (workspace as any).getToolbox?.()?.clearSelection?.();
        } catch {}
      });
    }
  } catch {}
}

/**
 * Закрыть все мобильные панели (меню + тулбокс)
 */
export function closeAllMobilePanels(): void {
  setMobileMenuOpen(false);
  setMobileToolboxOpen(false);
}
