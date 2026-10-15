/**
 * Дашборд учителя «Мои классы»: список классов, управление учениками,
 * таблица прогресса, назначение задач. Ванильный TS без фреймворков —
 * как остальной UI приложения. Строки берутся из strings/ru|en.ts.
 */

import { addAuthChangeListener, isAuthenticated } from "../authClient";
import { getAppLang } from "../localization";
import {
  getBillingState,
  upgradeWithPromoCode,
  cancelSubscription,
  startCheckout,
  parsePlanLimitError,
  type BillingState,
  type PlanLimitError,
} from "./billing";

export interface ClassItem {
  id: string;
  teacher_id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

interface ClassMember {
  id: string;
  class_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: { id: string; email: string; name: string };
}

interface ClassTask {
  id: string;
  class_id: string;
  task_id: string;
  assigned_to: string;
  status: string;
  due_date?: string | null;
  assignedTo?: { id: string; email: string; name: string };
}

// Список ID задач берём из глобального списка задач (tasks.ts экспортирует Record)
declare global {
  interface Window {
    __BC_TASKS__?: Record<string, { id: string }>;
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function t(key: string, ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

async function api<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`) as Error & {
      status?: number;
      payload?: unknown;
    };
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

// ---------- Состояние ----------
let currentView: "classes" | "classDetail" | "students" | "billing" = "classes";
let selectedClass: ClassItem | null = null;
let loadedStudents: ClassMember[] = [];
let billingState: BillingState | null = null;

/** Исход возврата с платёжной страницы: ?billing=success|failed|pending */
type BillingNotice = "success" | "failed" | "pending" | null;
let billingNotice: BillingNotice = null;

/**
 * Читает исход оплаты из URL и убирает параметр, чтобы перезагрузка
 * страницы не показывала баннер повторно.
 */
function readBillingNotice(): void {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("billing");
  if (raw !== "success" && raw !== "failed" && raw !== "pending") return;
  billingNotice = raw;
  params.delete("billing");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
}

function billingNoticeHtml(): string {
  if (!billingNotice) return "";
  const copy: Record<Exclude<BillingNotice, null>, [string, string]> = {
    success: [
      "Оплата прошла. Если Pro не активировался в течение минуты — напишите нам через «Фидбэк», мы включим вручную.",
      "Payment completed. If Pro is not active within a minute, contact us via Feedback and we will enable it.",
    ],
    failed: [
      "Оплата не завершена — подписка осталась на текущем тарифе.",
      "Payment was not completed — your plan is unchanged.",
    ],
    pending: [
      "Возврат с платёжной страницы. Дождитесь подтверждения от платёжного сервиса.",
      "Returned from the payment page. Waiting for the provider's confirmation.",
    ],
  };
  const [ru, en] = copy[billingNotice];
  return `<div class="billing-notice ${billingNotice}">${esc(t("billingNotice", ru, en))}</div>`;
}

function setView(view: typeof currentView) {
  currentView = view;
  render();
}

/** Загружает состояние биллинга с сервера (тихо при ошибке). */
async function refreshBilling(): Promise<void> {
  if (!isAuthenticated()) {
    billingState = null;
    return;
  }
  try {
    billingState = await getBillingState();
  } catch {
    billingState = null;
  }
}

/** Индикатор тарифа и расходования лимитов над списком классов. */
function planBadgeHtml(): string {
  const st = billingState;
  if (!st) return "";
  const isPro = st.plan.id === "pro";
  const badgeClass = isPro ? "plan-badge pro" : "plan-badge free";
  const label = isPro
    ? t("planPro", "PRO", "PRO")
    : t("planFree", "FREE", "FREE");
  const fmtLimit = (used: number, max: number | null) =>
    max == null
      ? `${used} / ∞`
      : `${used} / ${max}${used >= max ? " ⚠" : ""}`;
  return `
    <div class="${badgeClass}" data-action-view="billing" title="${esc(t("planBadgeTitle", "Тариф и лимиты — нажмите для управления подпиской", "Plan and limits — click to manage subscription"))}">
      <span class="plan-badge-name">${esc(label)}</span>
      <span class="plan-badge-limits">
        ${esc(t("limitClasses", "классы", "classes"))}: ${esc(fmtLimit(st.usage.classes, st.plan.maxClasses))}
        · ${esc(t("limitStudents", "ученики", "students"))}: ${esc(fmtLimit(st.usage.students, st.plan.maxStudents))}
        · ${esc(t("limitAssignments", "задания/мес", "assignments/mo"))}: ${esc(fmtLimit(st.usage.monthlyAssignments, st.plan.monthlyAssignments))}
      </span>
    </div>`;
}

/** Обрабатывает ошибку лимита тарифа: показывает paywall-модал вместо alert. */
function handlePlanLimitError(e: unknown): boolean {
  const err = e as { status?: number; payload?: unknown };
  if (err?.status !== 402) return false;
  const limit = parsePlanLimitError(err.payload);
  if (!limit) return false;
  showPaywall(limit);
  return true;
}

/** Paywall: сообщение о достижении лимита + кнопка перехода на Pro. */
function showPaywall(limit: PlanLimitError) {
  const messageByCode: Record<string, [string, string]> = {
    PLAN_LIMIT_CLASSES: [
      "На бесплатном тарифе доступен только 1 класс.",
      "The free plan allows only 1 class.",
    ],
    PLAN_LIMIT_STUDENTS: [
      "На бесплатном тарифе — до 5 учеников.",
      "The free plan allows up to 5 students.",
    ],
    PLAN_LIMIT_ASSIGNMENTS: [
      "На бесплатном тарифе — до 3 назначений заданий в месяц.",
      "The free plan allows up to 3 task assignments per month.",
    ],
  };
  const msg = t(
    "paywallMsg",
    messageByCode[limit.code]?.[0] || limit.message,
    messageByCode[limit.code]?.[1] || limit.message,
  );
  const el = byId("classesPaywall");
  if (!el) {
    alert(msg);
    return;
  }
  el.innerHTML = `
    <div class="paywall-banner">
      <div class="paywall-icon">🔒</div>
      <div class="paywall-text">${esc(msg)}</div>
      <button id="paywallUpgradeBtn" class="btn primary">${esc(t("paywallBtn", "Перейти на Pro", "Upgrade to Pro"))}</button>
      <button class="btn small paywall-close" aria-label="${esc(t("close", "Закрыть", "Close"))}">&times;</button>
    </div>`;
  el.style.display = "block";
  byId("paywallUpgradeBtn")?.addEventListener("click", () => {
    el.style.display = "none";
    setView("billing");
  });
  el.querySelector<HTMLButtonElement>(".paywall-close")?.addEventListener("click", () => {
    el.style.display = "none";
  });
}

function hidePaywall() {
  const el = byId("classesPaywall");
  if (el) el.style.display = "none";
}

// ---------- Рендер ----------
function render() {
  const body = byId("classesModalBody");
  if (!body) return;

  if (!isAuthenticated()) {
    body.innerHTML = `<p class="classes-empty">${esc(
      t("auth", "Войдите в аккаунт, чтобы управлять классами.", "Sign in to manage your classes."),
    )}</p>`;
    return;
  }

  hidePaywall();
  if (currentView === "classes") renderClassesList(body);
  else if (currentView === "classDetail") renderClassDetail(body);
  else if (currentView === "billing") renderBilling(body);
  else renderStudentsManage(body);
}

async function renderClassesList(body: HTMLElement) {
  body.innerHTML = `<p class="classes-empty">${esc(t("load", "Загрузка…", "Loading…"))}</p>`;
  let classes: ClassItem[] = [];
  try {
    [classes] = await Promise.all([
      api<{ classes: ClassItem[] }>("/api/classes", "GET").then((r) => r.classes),
      refreshBilling(),
    ]);
  } catch (e) {
    body.innerHTML = `<p class="classes-error">${esc((e as Error).message)}</p>`;
    return;
  }

  // Пустой список — тоже показываем индикатор тарифа и кнопку создания
  body.innerHTML = `
    ${planBadgeHtml()}
    <div class="classes-actions">
      <button id="subscriptionBtn" class="btn small">${esc(t("subscription", "Подписка", "Subscription"))}</button>
      <button id="createClassBtn" class="btn primary">${esc(t("create", "+ Создать класс", "+ Create class"))}</button>
    </div>
    ${
      classes.length
        ? `<div class="classes-grid">
      ${classes
        .map(
          (c) => `
        <div class="class-card" data-id="${esc(c.id)}">
          <div class="class-card-title">${esc(c.name)}</div>
          <div class="class-card-desc">${esc(c.description || "")}</div>
          <div class="class-card-actions">
            <button class="btn small primary" data-action="open" data-id="${esc(c.id)}">${esc(t("open", "Открыть", "Open"))}</button>
            <button class="btn small" data-action="students" data-id="${esc(c.id)}">${esc(t("students", "Ученики", "Students"))}</button>
            <button class="btn small danger" data-action="delete" data-id="${esc(c.id)}">${esc(t("delete", "Удалить", "Delete"))}</button>
          </div>
        </div>`,
        )
        .join("")}
    </div>`
        : `<p class="classes-empty">${esc(
            t("empty", "У вас пока нет классов. Создайте первый!", "You have no classes yet. Create your first one!"),
          )}</p>`
    }`;

  byId("subscriptionBtn")?.addEventListener("click", () => setView("billing"));
  const badge = body.querySelector<HTMLElement>("[data-action-view='billing']");
  badge?.addEventListener("click", () => setView("billing"));
  byId("createClassBtn")?.addEventListener("click", showCreateClassDialog);
  body.querySelectorAll<HTMLButtonElement>(".class-card-actions button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id || "";
      const action = btn.dataset.action;
      const cls = classes.find((c) => c.id === id);
      if (!cls) return;
      if (action === "open") {
        selectedClass = cls;
        setView("classDetail");
      } else if (action === "students") {
        selectedClass = cls;
        setView("students");
      } else if (action === "delete") {
        confirmDeleteClass(cls);
      }
    });
  });
}

function confirmDeleteClass(cls: ClassItem) {
  if (!confirm(t("confirmDelete", `Удалить класс «${cls.name}»?`, `Delete class "${cls.name}"?`))) return;
  api(`/api/classes/${cls.id}`, "DELETE")
    .then(() => render())
    .catch((e) => alert((e as Error).message));
}

function showCreateClassDialog() {
  const name = prompt(t("namePrompt", "Название класса:", "Class name:"));
  if (!name || !name.trim()) return;
  api("/api/classes", "POST", { name: name.trim(), description: "" })
    .then(() => render())
    .catch((e) => {
      if (!handlePlanLimitError(e)) alert((e as Error).message);
    });
}

async function renderClassDetail(body: HTMLElement) {
  const cls = selectedClass;
  if (!cls) return setView("classes");

  body.innerHTML = `<p class="classes-empty">${esc(t("load", "Загрузка…", "Loading…"))}</p>`;

  let students: ClassMember[] = [];
  let tasks: ClassTask[] = [];
  try {
    [students, tasks] = await Promise.all([
      api<{ students: ClassMember[] }>(`/api/classes/${cls.id}/students`, "GET").then((r) => r.students),
      api<{ tasks: ClassTask[] }>(`/api/classes/${cls.id}/tasks`, "GET").then((r) => r.tasks),
    ]);
  } catch (e) {
    body.innerHTML = `<p class="classes-error">${esc((e as Error).message)}</p>`;
    return;
  }

  const taskIds = new Set(tasks.map((t) => t.task_id));

  body.innerHTML = `
    <button id="backToClassesBtn" class="btn small">← ${esc(t("back", "К списку классов", "Back to classes"))}</button>
    <h3 class="class-detail-title">${esc(cls.name)}</h3>
    ${
      students.length
        ? `<table class="classes-table">
      <thead><tr>
        <th>${esc(t("colStudent", "Ученик", "Student"))}</th>
        <th>${esc(t("colEmail", "Email", "Email"))}</th>
        <th>${esc(t("colActions", "Действия", "Actions"))}</th>
      </tr></thead>
      <tbody>
        ${students
          .map(
            (s) => `
          <tr>
            <td>${esc(s.user?.name || s.user_id)}</td>
            <td>${esc(s.user?.email || "")}</td>
            <td>
              <button class="btn small" data-action="progress" data-user="${esc(s.user_id)}">${esc(t("progress", "Прогресс", "Progress"))}</button>
              <button class="btn small primary" data-action="assign" data-user="${esc(s.user_id)}">${esc(t("assign", "Задание", "Assign"))}</button>
            </td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`
        : `<p class="classes-empty">${esc(t("noStudents", "В классе нет учеников.", "No students in this class."))}</p>`
    }
    ${
      taskIds.size
        ? `<h4 class="class-tasks-title">${esc(t("assignedTasks", "Назначенные задания", "Assigned tasks"))}</h4>
      <ul class="class-tasks-list">
        ${[...taskIds]
          .map(
            (tid) =>
              `<li>${esc(tid)} — ${tasks.filter((t) => t.task_id === tid).length} ${esc(
                t("assignedTo", "учеников", "students",
              ))}</li>`,
          )
          .join("")}
      </ul>`
        : ""
    }`;

  byId("backToClassesBtn")?.addEventListener("click", () => setView("classes"));
  body.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const userId = btn.dataset.user || "";
      if (btn.dataset.action === "progress") {
        showStudentProgress(userId).catch((e) => alert((e as Error).message));
      } else if (btn.dataset.action === "assign") {
        showAssignTaskDialog(userId);
      }
    });
  });
}

async function showStudentProgress(userId: string) {
  const cls = selectedClass;
  if (!cls) return;
  // Сначала находим имя (детальный экран ещё требует списка учеников класса)
  let name = userId;
  try {
    const students = await api<{ students: ClassMember[] }>(
      `/api/classes/${cls.id}/students`,
      "GET",
    );
    const s = students.students.find((m) => m.user_id === userId);
    name = s?.user?.name || s?.user?.email || userId;
  } catch {}

  const data = await api<{
    student: { name?: string; email?: string };
    stats: { tasksSolved: number; tasksTotal: number; stars: number; lastActivity: string | null };
    progress: Record<string, { solved: boolean; stars: number; updatedAt: string }>;
    assignments: Array<{
      id: string;
      taskId: string;
      status: string;
      assignedAt: string;
      dueDate: string | null;
      completedAt: string | null;
    }>;
  }>(`/api/classes/${cls.id}/students/${userId}/progress`, "GET");

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const assignmentRows = data.assignments.length
    ? `<table class="classes-table">
        <thead><tr>
          <th>${esc(t("assignTaskCol", "Задача", "Task"))}</th>
          <th>${esc(t("assignStatusCol", "Статус", "Status"))}</th>
          <th>${esc(t("assignDateCol", "Назначено", "Assigned"))}</th>
          <th>${esc(t("assignDueCol", "Срок", "Due"))}</th>
        </tr></thead>
        <tbody>
          ${data.assignments
            .map(
              (a) => `
            <tr>
              <td>${esc(a.taskId)}</td>
              <td>${
                a.status === "completed"
                  ? `✅ ${esc(t("assignDone", "выполнено", "done"))}`
                  : `⏳ ${esc(a.status)}`
              }</td>
              <td>${esc(fmtDate(a.assignedAt))}</td>
              <td>${esc(fmtDate(a.dueDate))}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>`
    : `<p class="classes-empty">${esc(t("noAssignments", "Задания этому ученику не назначались.", "No tasks assigned to this student."))}</p>`;

  const solvedCount = data.stats.tasksSolved;
  const totalStars = data.stats.stars;

  const body = byId("classesModalBody");
  if (!body) return;
  body.innerHTML = `
    <button id="backFromClassProgressBtn" class="btn small">← ${esc(t("back", "Назад", "Back"))}</button>
    <h3 class="class-detail-title">${esc(t("progressTitle", "Прогресс", "Progress"))}: ${esc(data.student?.name || name)}</h3>
    <div class="student-stats">
      <div class="student-stat">
        <div class="student-stat-value">${esc(String(solvedCount))}</div>
        <div class="student-stat-label">${esc(t("statSolved", "задач решено", "tasks solved"))}</div>
      </div>
      <div class="student-stat">
        <div class="student-stat-value">${esc(String(totalStars))}</div>
        <div class="student-stat-label">${esc(t("statStars", "звёзд", "stars"))}</div>
      </div>
      <div class="student-stat">
        <div class="student-stat-value">${esc(fmtDate(data.stats.lastActivity))}</div>
        <div class="student-stat-label">${esc(t("statLastActive", "активность", "last active"))}</div>
      </div>
    </div>
    <h4 class="class-tasks-title">${esc(t("assignedTasks", "Назначенные задания", "Assigned tasks"))}</h4>
    ${assignmentRows}`;

  byId("backFromClassProgressBtn")?.addEventListener("click", () => setView("classDetail"));
}

function showAssignTaskDialog(userId: string) {
  const tasksObj = window.__BC_TASKS__ || {};
  const taskIds = Object.keys(tasksObj);
  if (!taskIds.length) {
    alert(t("noTasks", "Список задач недоступен.", "Task list unavailable."));
    return;
  }
  const cls = selectedClass;
  if (!cls) return;

  // Небольшая диалоговая панель поверх списка (в духе остального UI)
  const body = byId("classesModalBody");
  if (!body) return;
  const dialog = document.createElement("div");
  dialog.className = "assign-dialog";
  dialog.innerHTML = `
    <div class="assign-dialog-inner">
      <div class="assign-dialog-title">${esc(t("assignTitle", "Назначить задание", "Assign task"))}</div>
      <select id="assignTaskSelect" class="assign-dialog-select">
        ${taskIds
          .map(
            (id) =>
              `<option value="${esc(id)}">${esc(t(id, id, id))} — ${esc(id)}</option>`,
          )
          .join("")}
      </select>
      <div class="assign-dialog-actions">
        <button id="assignCancelBtn" class="btn small">${esc(t("cancel", "Отмена", "Cancel"))}</button>
        <button id="assignConfirmBtn" class="btn small primary">${esc(t("assign", "Назначить", "Assign"))}</button>
      </div>
    </div>`;
  body.appendChild(dialog);

  const close = () => dialog.remove();
  byId("assignCancelBtn")?.addEventListener("click", close);
  byId("assignConfirmBtn")?.addEventListener("click", () => {
    const select = byId<HTMLSelectElement>("assignTaskSelect");
    const taskId = select?.value || "";
    close();
    if (!taskId) return;
    api(`/api/classes/${cls.id}/tasks`, "POST", {
      taskId,
      studentId: userId,
    })
      .then(() => {
        alert(t("assigned", "Задание назначено.", "Task assigned."));
        render();
      })
      .catch((e) => {
        if (!handlePlanLimitError(e)) alert((e as Error).message);
      });
  });
}

async function renderStudentsManage(body: HTMLElement) {
  const cls = selectedClass;
  if (!cls) return setView("classes");

  body.innerHTML = `<p class="classes-empty">${esc(t("load", "Загрузка…", "Loading…"))}</p>`;
  try {
    loadedStudents = (
      await api<{ students: ClassMember[] }>(`/api/classes/${cls.id}/students`, "GET")
    ).students;
  } catch (e) {
    body.innerHTML = `<p class="classes-error">${esc((e as Error).message)}</p>`;
    return;
  }

  body.innerHTML = `
    <button id="backToClassesBtn" class="btn small">← ${esc(t("back", "Назад", "Back"))}</button>
    <h3 class="class-detail-title">${esc(cls.name)} — ${esc(t("studentsTitle", "ученики", "students"))}</h3>
    <div class="add-student-row">
      <input id="addStudentEmail" type="email" placeholder="${esc(t("emailPlaceholder", "email ученика", "student email"))}" />
      <button id="addStudentBtn" class="btn primary">${esc(t("addStudent", "Добавить", "Add"))}</button>
    </div>
    ${
      loadedStudents.length
        ? `<table class="classes-table">
      <thead><tr>
        <th>${esc(t("colStudent", "Ученик", "Student"))}</th>
        <th>${esc(t("colEmail", "Email", "Email"))}</th>
        <th>${esc(t("colActions", "Действия", "Actions"))}</th>
      </tr></thead>
      <tbody>
        ${loadedStudents
          .map(
            (s) => `
          <tr>
            <td>${esc(s.user?.name || s.user_id)}</td>
            <td>${esc(s.user?.email || "")}</td>
            <td><button class="btn small danger" data-action="remove" data-user="${esc(s.user_id)}">${esc(
              t("remove", "Удалить", "Remove"),
            )}</button></td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`
        : `<p class="classes-empty">${esc(t("noStudents", "В классе нет учеников.", "No students in this class."))}</p>`
    }`;

  byId("backToClassesBtn")?.addEventListener("click", () => setView("classDetail"));
  byId("addStudentBtn")?.addEventListener("click", async () => {
    const input = byId<HTMLInputElement>("addStudentEmail");
    const email = input?.value?.trim();
    if (!email || !cls) return;
    try {
      await api(`/api/classes/${cls.id}/students`, "POST", { email });
      if (input) input.value = "";
      render();
    } catch (e) {
      if (!handlePlanLimitError(e)) alert((e as Error).message);
    }
  });
  body.querySelectorAll<HTMLButtonElement>("[data-action='remove']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.user || "";
      if (!cls || !userId) return;
      if (!confirm(t("confirmRemove", "Удалить ученика из класса?", "Remove student from class?"))) return;
      try {
        await api(`/api/classes/${cls.id}/students/${userId}`, "DELETE");
        render();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  });
}

// ---------- Вкладка «Подписка» (биллинг) ----------
async function renderBilling(body: HTMLElement) {
  body.innerHTML = `<p class="classes-empty">${esc(t("load", "Загрузка…", "Loading…"))}</p>`;
  try {
    await refreshBilling();
  } catch {
    // refreshBilling глушит ошибки сам
  }
  const st = billingState;
  if (!st) {
    body.innerHTML = `<p class="classes-error">${esc(
      t("billingUnavailable", "Не удалось загрузить данные подписки.", "Could not load subscription data."),
    )}</p>
    <button class="btn small" id="billingBackBtn">← ${esc(t("back", "Назад", "Back"))}</button>`;
    byId("billingBackBtn")?.addEventListener("click", () => setView("classes"));
    return;
  }

  const isPro = st.plan.id === "pro";
  const checkout = st.checkout || null;
  const currencySymbols: Record<string, string> = {
    RUB: "₽",
    USD: "$",
    EUR: "€",
    KZT: "₸",
    UAH: "₴",
    BYN: "Br",
  };
  const priceLabel = checkout
    ? `${checkout.price} ${currencySymbols[checkout.currency] || checkout.currency}`
    : "490 ₽";
  const proDays = checkout ? checkout.days : 30;

  const payHtml = checkout?.available
    ? `<button id="payCardBtn" class="btn primary">${esc(
        t(
          "billingPayBtn",
          `Оплатить картой ${priceLabel} — Pro на ${proDays} дней`,
          `Pay by card ${priceLabel} — Pro for ${proDays} days`,
        ),
      )}</button>
      <div class="billing-note">${esc(
        t(
          "billingPayNote",
          "Откроем защищённую страницу платёжного сервиса. Принимаем карты, выпущенные в любой стране, в том числе в странах СНГ.",
          "You will be taken to the payment service's secure page. We accept cards issued in any country, including CIS countries.",
        ),
      )}</div>`
    : `<div class="billing-note">${esc(
        t(
          "billingPayDisabled",
          "Оплата картой временно недоступна.",
          "Card payment is temporarily unavailable.",
        ),
      )}</div>`;

  const promoHtml = st.promoEnabled
    ? `<div class="billing-upgrade">
        <div class="billing-upgrade-label">${esc(t("billingPromoLabel", "Есть промокод? Введите его для активации Pro:", "Have a promo code? Enter it to activate Pro:"))}</div>
        <div class="add-student-row">
          <input id="promoCodeInput" type="text" placeholder="PRO-XXXX" />
          <button id="applyPromoBtn" class="btn primary">${esc(t("billingActivate", "Активировать", "Activate"))}</button>
        </div>
      </div>`
    : "";

  body.innerHTML = `
    <button id="billingBackBtn" class="btn small">← ${esc(t("back", "К списку классов", "Back to classes"))}</button>
    <h3 class="class-detail-title">${esc(t("billingTitle", "Подписка", "Subscription"))}</h3>

    ${billingNoticeHtml()}

    <div class="billing-current">
      <span class="plan-badge ${isPro ? "pro" : "free"}">${esc(isPro ? "PRO" : "FREE")}</span>
      ${
        isPro && st.subscription?.expiresAt
          ? `<span class="billing-expires">${esc(
              t("billingExpires", `активна до ${new Date(st.subscription.expiresAt).toLocaleDateString()}`, `active until ${new Date(st.subscription.expiresAt).toLocaleDateString()}`),
            )}</span>`
          : ""
      }
    </div>

    <div class="plans-grid">
      <div class="plan-card ${isPro ? "" : "current"}">
        <div class="plan-card-name">Free</div>
        <div class="plan-card-price">${esc(t("planFreePrice", "0 ₽", "free"))}</div>
        <ul class="plan-features">
          <li>${esc(t("planF1", "1 класс", "1 class"))}</li>
          <li>${esc(t("planF2", "до 5 учеников", "up to 5 students"))}</li>
          <li>${esc(t("planF3", "3 назначения заданий в месяц", "3 task assignments per month"))}</li>
        </ul>
        ${isPro ? "" : `<div class="plan-current-label">${esc(t("planCurrent", "Текущий тариф", "Current plan"))}</div>`}
      </div>
      <div class="plan-card pro ${isPro ? "current" : ""}">
        <div class="plan-card-name">Pro</div>
        <div class="plan-card-price">${esc(priceLabel)}<span class="plan-period">/${esc(t("planMonth", "мес", "mo"))}</span></div>
        <ul class="plan-features">
          <li>${esc(t("planP1", "до 10 классов", "up to 10 classes"))}</li>
          <li>${esc(t("planP2", "до 200 учеников", "up to 200 students"))}</li>
          <li>${esc(t("planP3", "неограниченные назначения заданий", "unlimited task assignments"))}</li>
        </ul>
        ${isPro ? `<div class="plan-current-label">${esc(t("planCurrent", "Текущий тариф", "Current plan"))}</div>` : ""}
      </div>
    </div>

    <div class="billing-upgrade">
      ${payHtml}
      ${isPro ? `<button id="cancelSubBtn" class="btn small danger">${esc(t("billingCancel", "Отменить подписку", "Cancel subscription"))}</button>` : ""}
    </div>
    ${promoHtml}`;

  byId("billingBackBtn")?.addEventListener("click", () => setView("classes"));
  byId("payCardBtn")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const label = btn.textContent || "";
    btn.disabled = true;
    btn.textContent = t(
      "billingOpening",
      "Открываем платёжную страницу…",
      "Opening the payment page…",
    );
    try {
      const r = await startCheckout();
      window.location.assign(r.url);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = label;
      alert((err as Error).message);
    }
  });
  byId("applyPromoBtn")?.addEventListener("click", async () => {
    const input = byId<HTMLInputElement>("promoCodeInput");
    const code = input?.value?.trim() || "";
    if (!code) return;
    try {
      const r = await upgradeWithPromoCode(code);
      alert(
        t(
          "billingUpgraded",
          `Pro активирован до ${new Date(r.expiresAt).toLocaleDateString()}.`,
          `Pro activated until ${new Date(r.expiresAt).toLocaleDateString()}.`,
        ),
      );
      render();
    } catch (e) {
      alert((e as Error).message);
    }
  });
  byId("cancelSubBtn")?.addEventListener("click", async () => {
    if (!confirm(t("billingCancelConfirm", "Отменить подписку Pro? Вернётесь на Free.", "Cancel Pro subscription? You will return to Free."))) return;
    try {
      await cancelSubscription();
      render();
    } catch (e) {
      alert((e as Error).message);
    }
  });
}

// ---------- Открытие/закрытие ----------
function openClassesModal() {
  const modal = byId<HTMLDivElement>("classesModal");
  const content = modal?.querySelector<HTMLElement>(".modal-content");
  if (!modal) return;
  currentView = billingNotice ? "billing" : "classes";
  selectedClass = null;
  modal.style.display = "block";
  if (content) {
    content.style.left = "50%";
    content.style.top = "50%";
    content.style.transform = "translate(-50%, -50%)";
  }
  render();
}

function closeClassesModal() {
  const modal = byId<HTMLDivElement>("classesModal");
  if (modal) modal.style.display = "none";
  // Итог оплаты показываем один раз: закрыв окно, пользователь его уже видел.
  billingNotice = null;
}

export function initClassesUI(): void {
  readBillingNotice();

  const openBtn = byId<HTMLButtonElement>("classesBtn");
  const closeBtn = byId("closeClassesModal");
  const modal = byId<HTMLDivElement>("classesModal");

  openBtn?.addEventListener("click", openClassesModal);
  closeBtn?.addEventListener("click", closeClassesModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeClassesModal();
  });

  // Возврат с платёжной страницы: сами открываем «Подписку» с итогом оплаты
  let noticeOpened = false;
  const autoOpenBilling = (authed: boolean) => {
    if (!billingNotice || !authed || noticeOpened) return;
    noticeOpened = true;
    openClassesModal();
  };

  // Кнопка «Классы» показывается только авторизованным (шапка + мобильное меню)
  const mobileBtn = byId<HTMLButtonElement>("mobileClassesBtn");
  addAuthChangeListener((user) => {
    if (openBtn) openBtn.style.display = user ? "inline-flex" : "none";
    if (mobileBtn) mobileBtn.style.display = user ? "" : "none";
    autoOpenBilling(Boolean(user));
  });
  const authed = isAuthenticated();
  if (openBtn) openBtn.style.display = authed ? "inline-flex" : "none";
  if (mobileBtn) mobileBtn.style.display = authed ? "" : "none";
  autoOpenBilling(authed);
}
