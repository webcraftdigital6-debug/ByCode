// Хранилище на SQLite (node:sqlite, встроен в Node 22+). Если недоступен — JSON-файл.
// Единый интерфейс: run/get/all + отдельные методы для сущностей.
"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJsonFile(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

let driver = "sqlite";
let db = null;

// ---------- Попытка подключить SQLite ----------
try {
  const { DatabaseSync } = require("node:sqlite");
  db = new DatabaseSync(path.join(DATA_DIR, "blocklycode.db"));
  db.exec("PRAGMA journal_mode = WAL;");
} catch (e) {
  driver = "json";
  console.warn(
    "[store] node:sqlite недоступен (" +
      (e && e.message ? e.message : e) +
      "), используется JSON-файл",
  );
}

const JSON_FILE = path.join(DATA_DIR, "db.json");

// ---------- Схема ----------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  password_salt TEXT,
  provider TEXT NOT NULL DEFAULT 'local',
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workspaces (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_blocks (
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, type)
);
CREATE TABLE IF NOT EXISTS task_progress (
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  solved INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, task_id)
);
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS class_members (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  joined_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS class_tasks (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  due_date TEXT,
  completed_at TEXT,
  completion_notes TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  class_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at);
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  promo_code TEXT,
  started_at TEXT,
  expires_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS promo_codes (
  code TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'pro',
  expires_at TEXT,
  used_by TEXT,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'pro',
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT,
  raw TEXT
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments (provider, provider_ref);
`;

// ---------- Загрузка JSON-драйвера ----------
function loadJsonDb() {
  try {
    const raw = fs.readFileSync(JSON_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: new Map(parsed.users || []),
      sessions: new Map(parsed.sessions || []),
      workspaces: new Map(parsed.workspaces || []),
      customBlocks: new Map(parsed.customBlocks || []),
      taskProgress: new Map(parsed.taskProgress || []),
    };
  } catch {
    return {
      users: new Map(),
      sessions: new Map(),
      workspaces: new Map(),
      customBlocks: new Map(),
      taskProgress: new Map(),
    };
  }
}

const json = loadJsonDb();

const CLASSES_JSON_FILE = path.join(DATA_DIR, "classes.json");
const CLASS_MEMBERS_JSON_FILE = path.join(DATA_DIR, "class_members.json");
const CLASS_TASKS_JSON_FILE = path.join(DATA_DIR, "class_tasks.json");
const SUBSCRIPTIONS_JSON_FILE = path.join(DATA_DIR, "subscriptions.json");
const PROMO_CODES_JSON_FILE = path.join(DATA_DIR, "promo_codes.json");
const NOTIFICATIONS_JSON_FILE = path.join(DATA_DIR, "notifications.json");
const PAYMENTS_JSON_FILE = path.join(DATA_DIR, "payments.json");

let classesJson = loadJsonFile(CLASSES_JSON_FILE);
let classMembersJson = loadJsonFile(CLASS_MEMBERS_JSON_FILE);
let classTasksJson = loadJsonFile(CLASS_TASKS_JSON_FILE);
let subscriptionsJson = loadJsonFile(SUBSCRIPTIONS_JSON_FILE);
let promoCodesJson = loadJsonFile(PROMO_CODES_JSON_FILE);
let notificationsJson = loadJsonFile(NOTIFICATIONS_JSON_FILE);
let paymentsJson = loadJsonFile(PAYMENTS_JSON_FILE);

// Приводим подписки из JSON-файла к Map (если сохранились как массивы)
if (!Array.isArray(subscriptionsJson)) subscriptionsJson = [];
if (!Array.isArray(promoCodesJson)) promoCodesJson = [];
if (!Array.isArray(notificationsJson)) notificationsJson = [];
if (!Array.isArray(paymentsJson)) paymentsJson = [];

let jsonSaveTimer = null;
let classesSaveTimer = null;
let classMembersSaveTimer = null;
let classTasksSaveTimer = null;
let subscriptionsSaveTimer = null;
let promoCodesSaveTimer = null;
let notificationsSaveTimer = null;
let paymentsSaveTimer = null;

function persistJson() {
  if (jsonSaveTimer) return;
  jsonSaveTimer = setTimeout(() => {
    jsonSaveTimer = null;
    const payload = {
      users: [...json.users.entries()],
      sessions: [...json.sessions.entries()],
      workspaces: [...json.workspaces.entries()],
      customBlocks: [...json.customBlocks.entries()],
      taskProgress: [...json.taskProgress.entries()],
    };
    try {
      const tmp = JSON_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(payload), "utf8");
      fs.renameSync(tmp, JSON_FILE);
    } catch (e) {
      console.error("[store] JSON persist failed:", e && e.message);
    }
  }, 250);
}

if (db) db.exec(SCHEMA);
else persistJson();

// ---------- Универсальные помощники ----------
function now() {
  return new Date().toISOString();
}

function userRow(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    provider: u.provider || "local",
    avatarUrl: u.avatar_url || u.avatarUrl || null,
    createdAt: u.created_at || u.createdAt || null,
  };
}

// ---------- API хранилища ----------
const store = {
  driver,
  DATA_DIR,

  // --- users ---
  getUserByEmail(email) {
    const e = String(email || "").toLowerCase();
    if (driver === "sqlite") {
      return userRow(
        db.prepare("SELECT * FROM users WHERE email = ?").get(e) || null,
      );
    }
    for (const u of json.users.values()) {
      if (String(u.email).toLowerCase() === e) return userRow(u);
    }
    return null;
  },

  getUserById(id) {
    if (driver === "sqlite") {
      return userRow(db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null);
    }
    return userRow(json.users.get(id) || null);
  },

  // Возвращает полные данные (включая хэш пароля) — только для auth
  _getUserRawByEmail(email) {
    const e = String(email || "").toLowerCase();
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM users WHERE email = ?").get(e) || null;
    }
    for (const u of json.users.values()) {
      if (String(u.email).toLowerCase() === e) return u;
    }
    return null;
  },

  createUser({ id, email, name, passwordHash, passwordSalt, provider }) {
    const t = now();
    const user = {
      id,
      email: String(email).toLowerCase(),
      name: name || String(email).split("@")[0],
      password_hash: passwordHash || null,
      password_salt: passwordSalt || null,
      provider: provider || "local",
      avatar_url: null,
      created_at: t,
      updated_at: t,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, password_salt, provider, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        user.id,
        user.email,
        user.name,
        user.password_hash,
        user.password_salt,
        user.provider,
        user.avatar_url,
        user.created_at,
        user.updated_at,
      );
    } else {
      json.users.set(user.id, user);
      persistJson();
    }
    return userRow(user);
  },

  updateUserProfile(id, { name, avatarUrl }) {
    const t = now();
    if (driver === "sqlite") {
      const sets = [];
      const vals = [];
      if (name !== undefined) {
        sets.push("name = ?");
        vals.push(String(name));
      }
      if (avatarUrl !== undefined) {
        sets.push("avatar_url = ?");
        vals.push(avatarUrl == null ? null : String(avatarUrl));
      }
      if (!sets.length) return this.getUserById(id);
      sets.push("updated_at = ?");
      vals.push(t, id);
      db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    } else {
      const u = json.users.get(id);
      if (!u) return null;
      if (name !== undefined) u.name = String(name);
      if (avatarUrl !== undefined)
        u.avatar_url = avatarUrl == null ? null : String(avatarUrl);
      u.updated_at = t;
      persistJson();
    }
    return this.getUserById(id);
  },

  // --- sessions ---
  createSession(sid, userId, ttlMs) {
    const expires = new Date(Date.now() + ttlMs).toISOString();
    if (driver === "sqlite") {
      db.prepare(
        "INSERT OR REPLACE INTO sessions (sid, user_id, expires_at) VALUES (?, ?, ?)",
      ).run(sid, userId, expires);
    } else {
      json.sessions.set(sid, { user_id: userId, expires_at: expires });
      persistJson();
    }
  },

  getSession(sid) {
    if (!sid) return null;
    if (driver === "sqlite") {
      const row = db
        .prepare("SELECT * FROM sessions WHERE sid = ? AND expires_at > ?")
        .get(sid, now());
      return row ? { userId: row.user_id, expiresAt: row.expires_at } : null;
    }
    const row = json.sessions.get(sid);
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      json.sessions.delete(sid);
      persistJson();
      return null;
    }
    return { userId: row.user_id, expiresAt: row.expires_at };
  },

  destroySession(sid) {
    if (!sid) return;
    if (driver === "sqlite") {
      db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
    } else {
      json.sessions.delete(sid);
      persistJson();
    }
  },

  // --- workspaces ---
  getWorkspace(userId) {
    if (driver === "sqlite") {
      const row = db
        .prepare("SELECT data, updated_at FROM workspaces WHERE user_id = ?")
        .get(userId);
      if (!row) return null;
      try {
        return { data: JSON.parse(row.data), updatedAt: row.updated_at };
      } catch {
        return null;
      }
    }
    const row = json.workspaces.get(userId);
    if (!row) return null;
    try {
      return { data: JSON.parse(row.data), updatedAt: row.updated_at };
    } catch {
      return null;
    }
  },

  saveWorkspace(userId, data) {
    const t = now();
    const serialized = JSON.stringify(data);
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO workspaces (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      ).run(userId, serialized, t);
    } else {
      json.workspaces.set(userId, { data: serialized, updated_at: t });
      persistJson();
    }
    return { updatedAt: t };
  },

  // --- custom blocks ---
  getCustomBlocks(userId) {
    let rows;
    if (driver === "sqlite") {
      rows = db
        .prepare("SELECT type, data, updated_at FROM custom_blocks WHERE user_id = ?")
        .all(userId);
    } else {
      const m = json.customBlocks.get(userId) || new Map();
      rows = [...m.entries()].map(([type, v]) => ({
        type,
        data: v.data,
        updated_at: v.updated_at,
      }));
    }
    return rows.map((r) => {
      let def;
      try {
        def = JSON.parse(r.data);
      } catch {
        return null;
      }
      return {
        type: r.type,
        definition: def,
        updatedAt: r.updated_at,
      };
    }).filter(Boolean);
  },

  upsertCustomBlock(userId, type, definition) {
    const t = now();
    const serialized = JSON.stringify(definition);
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO custom_blocks (user_id, type, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, type) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      ).run(userId, type, serialized, t);
    } else {
      const m = json.customBlocks.get(userId) || new Map();
      m.set(type, { data: serialized, updated_at: t });
      json.customBlocks.set(userId, m);
      persistJson();
    }
    return { updatedAt: t };
  },

  deleteCustomBlock(userId, type) {
    if (driver === "sqlite") {
      db.prepare("DELETE FROM custom_blocks WHERE user_id = ? AND type = ?").run(
        userId,
        type,
      );
    } else {
      const m = json.customBlocks.get(userId);
      if (m && m.delete(type)) persistJson();
    }
  },

  // --- task progress ---
  getTaskProgress(userId) {
    let rows;
    if (driver === "sqlite") {
      rows = db
        .prepare("SELECT task_id, solved, stars, updated_at FROM task_progress WHERE user_id = ?")
        .all(userId);
    } else {
      const m = json.taskProgress.get(userId) || new Map();
      rows = [...m.entries()].map(([taskId, v]) => ({
        task_id: taskId,
        solved: v.solved,
        stars: v.stars,
        updated_at: v.updated_at,
      }));
    }
    const progress = {};
    for (const r of rows) {
      progress[r.task_id] = {
        solved: !!r.solved,
        stars: r.stars,
        updatedAt: r.updated_at,
      };
    }
    return progress;
  },

  setTaskProgress(userId, taskId, solved, stars) {
    const t = now();
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO task_progress (user_id, task_id, solved, stars, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, task_id) DO UPDATE SET solved = excluded.solved, stars = excluded.stars, updated_at = excluded.updated_at",
      ).run(userId, taskId, solved ? 1 : 0, Math.max(0, Math.min(3, stars | 0)), t);
    } else {
      const m = json.taskProgress.get(userId) || new Map();
      m.set(taskId, { solved: solved ? 1 : 0, stars, updated_at: t });
      json.taskProgress.set(userId, m);
      persistJson();
    }
  },

  // --- статистика ---
  getStats(userId) {
    const progress = this.getTaskProgress(userId);
    const tasks = Object.keys(progress);
    const solved = tasks.filter((t) => progress[t].solved);
    const stars = solved.reduce((acc, t) => acc + (progress[t].stars || 0), 0);
    const blocks = this.getCustomBlocks(userId).length;
    let lastActivity = null;
    for (const t of tasks) {
      const ua = progress[t].updatedAt;
      if (ua && (!lastActivity || ua > lastActivity)) lastActivity = ua;
    }
    return {
      tasksSolved: solved.length,
      tasksTotal: tasks.length,
      stars,
      customBlocks: blocks,
      lastActivity,
    };
  },

  // --- billing: тарифы и лимиты ---
  PLANS: {
    free: {
      id: "free",
      name: "Free",
      maxClasses: 1,
      maxStudents: 5,
      monthlyAssignments: 3,
    },
    pro: {
      id: "pro",
      name: "Pro",
      maxClasses: 10,
      maxStudents: 200,
      monthlyAssignments: Infinity,
    },
  },

  getSubscription(userId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").get(userId) || null;
    }
    return subscriptionsJson.find((s) => s.user_id === userId) || null;
  },

  getPlan(userId) {
    const sub = this.getSubscription(userId);
    if (!sub) return this.PLANS.free;
    // Проверка срока действия
    if (sub.expires_at && sub.expires_at < now()) {
      return this.PLANS.free;
    }
    if (sub.status !== "active") return this.PLANS.free;
    return this.PLANS[sub.plan] || this.PLANS.free;
  },

  getUsage(userId) {
    const classes = this.getClasses(userId);
    // Учеников считаем суммарно по всем классам (уникальные пользователи)
    const studentIds = new Set();
    for (const c of classes) {
      for (const m of this.getClassMembers(c.id)) {
        if (m.role === "student") studentIds.add(m.user_id);
      }
    }
    // Назначения за текущий календарный месяц
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartIso = monthStart.toISOString();
    let monthlyAssignments = 0;
    for (const c of classes) {
      for (const t of this.getClassTasks(c.id)) {
        if (t.assigned_at >= monthStartIso) monthlyAssignments++;
      }
    }
    return {
      classes: classes.length,
      students: studentIds.size,
      monthlyAssignments,
    };
  },

  setSubscription({ userId, plan, status, promoCode, expiresAt }) {
    const t = now();
    const existing = this.getSubscription(userId);
    const sub = {
      user_id: userId,
      plan,
      status: status || "active",
      promo_code: promoCode || (existing ? existing.promo_code : null),
      started_at: existing ? existing.started_at : t,
      expires_at: expiresAt || null,
      updated_at: t,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT OR REPLACE INTO subscriptions (user_id, plan, status, promo_code, started_at, expires_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(sub.user_id, sub.plan, sub.status, sub.promo_code, sub.started_at, sub.expires_at, sub.updated_at);
    } else {
      const idx = subscriptionsJson.findIndex((s) => s.user_id === userId);
      if (idx >= 0) subscriptionsJson[idx] = sub;
      else subscriptionsJson.push(sub);
      this.persistSubscriptions();
    }
    return sub;
  },

  // --- billing: промокоды ---
  getPromoCode(code) {
    const c = String(code || "").trim().toUpperCase();
    if (!c) return null;
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(c) || null;
    }
    return promoCodesJson.find((p) => p.code === c) || null;
  },

  usePromoCode(code, userId) {
    const promo = this.getPromoCode(code);
    if (!promo) return { ok: false, error: "Промокод не найден" };
    // Код строго одноразовый: повторная активация тем же аккаунтом
    // превращала разовый код в бессрочную подписку.
    if (promo.used_by) return { ok: false, error: "Промокод уже использован" };
    if (promo.expires_at && promo.expires_at < now()) {
      return { ok: false, error: "Срок действия промокода истёк" };
    }
    const t = now();
    if (driver === "sqlite") {
      db.prepare(
        "UPDATE promo_codes SET used_by = ?, used_at = ? WHERE code = ?",
      ).run(userId, t, promo.code);
    } else {
      const p = promoCodesJson.find((x) => x.code === promo.code);
      if (p) {
        p.used_by = userId;
        p.used_at = t;
      }
      this.persistPromoCodes();
    }
    // Промокод активирует PRO на 30 дней
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const sub = this.setSubscription({
      userId,
      plan: promo.plan || "pro",
      status: "active",
      promoCode: promo.code,
      expiresAt: expires,
    });
    return { ok: true, subscription: sub, expiresAt: expires };
  },

  createPromoCode({ code, plan, expiresInDays }) {
    const t = now();
    const expires = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const promo = {
      code: String(code || "").trim().toUpperCase(),
      plan: plan || "pro",
      expires_at: expires,
      used_by: null,
      used_at: null,
      created_at: t,
    };
    if (!promo.code) throw new Error("Промокод не может быть пустым");
    if (driver === "sqlite") {
      db.prepare(
        "INSERT OR REPLACE INTO promo_codes (code, plan, expires_at, used_by, used_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(promo.code, promo.plan, promo.expires_at, promo.used_by, promo.used_at, promo.created_at);
    } else {
      const idx = promoCodesJson.findIndex((p) => p.code === promo.code);
      if (idx >= 0) promoCodesJson[idx] = promo;
      else promoCodesJson.push(promo);
      this.persistPromoCodes();
    }
    return promo;
  },

  // --- billing: платежи (карточная оплата подписки) ---
  // amount хранится в копейках (целое), чтобы не сравнивать дроби из
  // уведомления провайдера с ценой из конфигурации.
  createPayment({ id, userId, provider, plan, amount, currency, days }) {
    const t = now();
    const payment = {
      id,
      user_id: userId,
      provider,
      plan: plan || "pro",
      amount: Math.round(Number(amount) || 0),
      currency: currency || "RUB",
      days: Number(days) || 30,
      status: "pending",
      provider_ref: null,
      created_at: t,
      updated_at: t,
      paid_at: null,
      raw: null,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO payments (id, user_id, provider, plan, amount, currency, days, status, provider_ref, created_at, updated_at, paid_at, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        payment.id, payment.user_id, payment.provider, payment.plan,
        payment.amount, payment.currency, payment.days, payment.status,
        payment.provider_ref, payment.created_at, payment.updated_at,
        payment.paid_at, payment.raw,
      );
    } else {
      paymentsJson.push(payment);
      this.persistPayments();
    }
    return payment;
  },

  getPayment(id) {
    if (!id) return null;
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM payments WHERE id = ?").get(String(id)) || null;
    }
    return paymentsJson.find((p) => p.id === String(id)) || null;
  },

  findByProviderRef(provider, ref) {
    if (!ref) return null;
    const wanted = String(ref);
    if (driver === "sqlite") {
      return (
        db
          .prepare("SELECT * FROM payments WHERE provider = ? AND provider_ref = ?")
          .get(provider, wanted) ||
        db
          .prepare("SELECT * FROM payments WHERE provider = ? AND id = ?")
          .get(provider, wanted) ||
        null
      );
    }
    return (
      paymentsJson.find((p) => p.provider === provider && p.provider_ref === wanted) ||
      paymentsJson.find((p) => p.provider === provider && p.id === wanted) ||
      null
    );
  },

  listPayments(userId, limit = 50) {
    let rows;
    if (driver === "sqlite") {
      rows = userId
        ? db
            .prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
            .all(userId, limit)
        : db
            .prepare("SELECT * FROM payments ORDER BY created_at DESC LIMIT ?")
            .all(limit);
    } else {
      rows = (userId ? paymentsJson.filter((p) => p.user_id === userId) : paymentsJson)
        .slice()
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, limit);
    }
    return rows;
  },

  /**
   * Идемпортентный перевод платежа в paid. Возвращает false, если платёж
   * уже был оплачен или не найден — вызывающий код не должен продлевать
   * подписку повторно на повторном уведомлении провайдера.
   */
  markPaymentPaid(id, { providerRef, raw } = {}) {
    const payment = this.getPayment(id);
    if (!payment) return { ok: false, reason: "not_found" };
    if (payment.status === "paid") return { ok: false, reason: "already_paid", payment };
    const t = now();
    const next = {
      ...payment,
      status: "paid",
      provider_ref: providerRef ? String(providerRef) : payment.provider_ref,
      updated_at: t,
      paid_at: t,
      raw: raw ? JSON.stringify(raw) : payment.raw,
    };
    if (driver === "sqlite") {
      const res = db
        .prepare(
          "UPDATE payments SET status = ?, provider_ref = ?, updated_at = ?, paid_at = ?, raw = ? WHERE id = ? AND status <> 'paid'",
        )
        .run(
          next.status, next.provider_ref, next.updated_at, next.paid_at,
          next.raw, next.id,
        );
      // 0 изменённых строк = параллельный запрос уже пометил платёж оплаченным
      if (!res || res.changes === 0) {
        return { ok: false, reason: "already_paid", payment: this.getPayment(id) };
      }
    } else {
      const idx = paymentsJson.findIndex((p) => p.id === payment.id);
      if (idx >= 0) paymentsJson[idx] = next;
      this.persistPayments();
    }
    return { ok: true, payment: next };
  },

  markPaymentFailed(id, { providerRef, raw } = {}) {
    const payment = this.getPayment(id);
    if (!payment || payment.status === "paid") return payment;
    const t = now();
    const next = {
      ...payment,
      status: "failed",
      provider_ref: providerRef ? String(providerRef) : payment.provider_ref,
      updated_at: t,
      raw: raw ? JSON.stringify(raw) : payment.raw,
    };
    if (driver === "sqlite") {
      db.prepare(
        "UPDATE payments SET status = ?, provider_ref = ?, updated_at = ?, raw = ? WHERE id = ?",
      ).run(next.status, next.provider_ref, next.updated_at, next.raw, next.id);
    } else {
      const idx = paymentsJson.findIndex((p) => p.id === payment.id);
      if (idx >= 0) paymentsJson[idx] = next;
      this.persistPayments();
    }
    return next;
  },

  // --- classes ---
  createClass({ id, teacherId, name, description }) {
    const t = now();
    const classItem = {
      id,
      teacher_id: teacherId,
      name,
      description,
      created_at: t,
      updated_at: t,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO classes (id, teacher_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(classItem.id, classItem.teacher_id, classItem.name, classItem.description, classItem.created_at, classItem.updated_at);
    } else {
      classesJson.push(classItem);
      this.persistClasses();
    }
    return classItem;
  },

  getClasses(teacherId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM classes WHERE teacher_id = ?").all(teacherId);
    }
    return classesJson.filter(c => c.teacher_id === teacherId);
  },

  getClass(classId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM classes WHERE id = ?").get(classId);
    }
    return classesJson.find(c => c.id === classId) || null;
  },

  updateClass(classId, updates) {
    const t = now();
    const classItem = this.getClass(classId);
    if (!classItem) return null;
    const updated = {
      ...classItem,
      ...updates,
      updated_at: t,
    };
    if (driver === "sqlite") {
      const sets = [];
      const vals = [];
      for (const key in updates) {
        if (key === 'id') continue;
        sets.push(`${key} = ?`);
        vals.push(updates[key]);
      }
      sets.push("updated_at = ?");
      vals.push(t, classId);
      db.prepare(`UPDATE classes SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    } else {
      const idx = classesJson.findIndex(c => c.id === classId);
      if (idx >= 0) {
        classesJson[idx] = updated;
        this.persistClasses();
      }
    }
    return updated;
  },

  deleteClass(classId) {
    if (driver === "sqlite") {
      db.prepare("DELETE FROM classes WHERE id = ?").run(classId);
      db.prepare("DELETE FROM class_members WHERE class_id = ?").run(classId);
      db.prepare("DELETE FROM class_tasks WHERE class_id = ?").run(classId);
      db.prepare("DELETE FROM notifications WHERE class_id = ?").run(classId);
    } else {
      const idx = classesJson.findIndex((c) => c.id === classId);
      if (idx >= 0) {
        classesJson.splice(idx, 1);
        this.persistClasses();
      }
      classMembersJson = classMembersJson.filter((m) => m.class_id !== classId);
      this.persistClassMembers();
      classTasksJson = classTasksJson.filter((t) => t.class_id !== classId);
      this.persistClassTasks();
      notificationsJson = notificationsJson.filter(
        (n) => n.class_id !== classId,
      );
      this.persistNotifications();
    }
  },

  // --- class members ---
  addStudentToClass({ id, classId, userId, role }) {
    const t = now();
    const member = {
      id,
      class_id: classId,
      user_id: userId,
      role,
      joined_at: t,
      status: "active",
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO class_members (id, class_id, user_id, role, joined_at, status) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(member.id, member.class_id, member.user_id, member.role, member.joined_at, member.status);
    } else {
      classMembersJson.push(member);
      this.persistClassMembers();
    }
    return member;
  },

  getClassMembers(classId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_members WHERE class_id = ?").all(classId);
    }
    return classMembersJson.filter(m => m.class_id === classId);
  },

  getUserClass(userId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_members WHERE user_id = ?").all(userId);
    }
    return classMembersJson.filter(m => m.user_id === userId);
  },

  removeStudentFromClass(classId, userId) {
    if (driver === "sqlite") {
      db.prepare(
        "DELETE FROM class_members WHERE class_id = ? AND user_id = ?",
      ).run(classId, userId);
      db.prepare(
        "DELETE FROM class_tasks WHERE class_id = ? AND assigned_to = ?",
      ).run(classId, userId);
    } else {
      classMembersJson = classMembersJson.filter(
        (m) => !(m.class_id === classId && m.user_id === userId),
      );
      this.persistClassMembers();
      classTasksJson = classTasksJson.filter(
        (t) => !(t.class_id === classId && t.assigned_to === userId),
      );
      this.persistClassTasks();
    }
  },

  // --- class tasks ---
  assignTask({ id, classId, taskId, assignedBy, assignedTo, dueDate }) {
    const t = now();
    const task = {
      id,
      class_id: classId,
      task_id: taskId,
      assigned_by: assignedBy,
      assigned_to: assignedTo,
      assigned_at: t,
      status: "assigned",
      due_date: dueDate || null,
      completed_at: null,
      completion_notes: null,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO class_tasks (id, class_id, task_id, assigned_by, assigned_to, assigned_at, status, due_date, completed_at, completion_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(task.id, task.class_id, task.task_id, task.assigned_by, task.assigned_to, task.assigned_at, task.status, task.due_date, task.completed_at, task.completion_notes);
    } else {
      classTasksJson.push(task);
      this.persistClassTasks();
    }
    return task;
  },

  getClassTasks(classId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_tasks WHERE class_id = ?").all(classId);
    }
    return classTasksJson.filter(t => t.class_id === classId);
  },

  getStudentTasks(studentId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_tasks WHERE assigned_to = ?").all(studentId);
    }
    return classTasksJson.filter(t => t.assigned_to === studentId);
  },

  updateTaskStatus(taskId, status, completionNotes) {
    const t = now();
    const updateFields = {
      status,
      completed_at: status === "completed" ? t : null,
      completion_notes: completionNotes || null,
    };
    if (driver === "sqlite") {
      const sets = [];
      const vals = [];
      for (const key in updateFields) {
        if (updateFields[key] !== undefined) {
          sets.push(`${key} = ?`);
          vals.push(updateFields[key]);
        }
      }
      if (!sets.length) return;
      vals.push(taskId);
      db.prepare(`UPDATE class_tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    } else {
      const idx = classTasksJson.findIndex((t) => t.id === taskId);
      if (idx >= 0) {
        classTasksJson[idx] = { ...classTasksJson[idx], ...updateFields };
        this.persistClassTasks();
      }
    }
  },

  // --- notifications (учителю: «ученик выполнил задание») ---
  createNotification({ id, userId, type, classId, payload }) {
    const t = now();
    const notif = {
      id,
      user_id: userId,
      type,
      class_id: classId || null,
      payload: JSON.stringify(payload || {}),
      created_at: t,
      read_at: null,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO notifications (id, user_id, type, class_id, payload, created_at, read_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(notif.id, notif.user_id, notif.type, notif.class_id, notif.payload, notif.created_at, notif.read_at);
    } else {
      notificationsJson.push(notif);
      this.persistNotifications();
    }
    return notif;
  },

  getNotifications(userId, limit = 50) {
    let rows;
    if (driver === "sqlite") {
      rows = db
        .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
        .all(userId, limit);
    } else {
      rows = notificationsJson
        .filter((n) => n.user_id === userId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, limit);
    }
    return rows.map((n) => {
      let payload = {};
      try {
        payload = JSON.parse(n.payload);
      } catch {}
      return { ...n, payload };
    });
  },

  countUnreadNotifications(userId) {
    if (driver === "sqlite") {
      return (
        db
          .prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL")
          .get(userId)?.c || 0
      );
    }
    return notificationsJson.filter(
      (n) => n.user_id === userId && !n.read_at,
    ).length;
  },

  markNotificationsRead(userId) {
    const t = now();
    if (driver === "sqlite") {
      db.prepare(
        "UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL",
      ).run(t, userId);
    } else {
      let changed = false;
      for (const n of notificationsJson) {
        if (n.user_id === userId && !n.read_at) {
          n.read_at = t;
          changed = true;
        }
      }
      if (changed) this.persistNotifications();
    }
  },

  // --- persistence helpers ---
  persistClasses() {
    if (classesSaveTimer) return;
    classesSaveTimer = setTimeout(() => {
      classesSaveTimer = null;
      try {
        const tmp = CLASSES_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(classesJson), "utf8");
        fs.renameSync(tmp, CLASSES_JSON_FILE);
      } catch (e) {
        console.error("[store] classes persist failed:", e && e.message);
      }
    }, 250);
  },

  persistClassMembers() {
    if (classMembersSaveTimer) return;
    classMembersSaveTimer = setTimeout(() => {
      classMembersSaveTimer = null;
      try {
        const tmp = CLASS_MEMBERS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(classMembersJson), "utf8");
        fs.renameSync(tmp, CLASS_MEMBERS_JSON_FILE);
      } catch (e) {
        console.error("[store] class_members persist failed:", e && e.message);
      }
    }, 250);
  },

  persistClassTasks() {
    if (classTasksSaveTimer) return;
    classTasksSaveTimer = setTimeout(() => {
      classTasksSaveTimer = null;
      try {
        const tmp = CLASS_TASKS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(classTasksJson), "utf8");
        fs.renameSync(tmp, CLASS_TASKS_JSON_FILE);
      } catch (e) {
        console.error("[store] class_tasks persist failed:", e && e.message);
      }
    }, 250);
  },

  persistSubscriptions() {
    if (subscriptionsSaveTimer) return;
    subscriptionsSaveTimer = setTimeout(() => {
      subscriptionsSaveTimer = null;
      try {
        const tmp = SUBSCRIPTIONS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(subscriptionsJson), "utf8");
        fs.renameSync(tmp, SUBSCRIPTIONS_JSON_FILE);
      } catch (e) {
        console.error("[store] subscriptions persist failed:", e && e.message);
      }
    }, 250);
  },

  persistPromoCodes() {
    if (promoCodesSaveTimer) return;
    promoCodesSaveTimer = setTimeout(() => {
      promoCodesSaveTimer = null;
      try {
        const tmp = PROMO_CODES_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(promoCodesJson), "utf8");
        fs.renameSync(tmp, PROMO_CODES_JSON_FILE);
      } catch (e) {
        console.error("[store] promo_codes persist failed:", e && e.message);
      }
    }, 250);
  },

  persistPayments() {
    if (paymentsSaveTimer) return;
    paymentsSaveTimer = setTimeout(() => {
      paymentsSaveTimer = null;
      try {
        const tmp = PAYMENTS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(paymentsJson), "utf8");
        fs.renameSync(tmp, PAYMENTS_JSON_FILE);
      } catch (e) {
        console.error("[store] payments persist failed:", e && e.message);
      }
    }, 250);
  },

  persistNotifications() {
    if (notificationsSaveTimer) return;
    notificationsSaveTimer = setTimeout(() => {
      notificationsSaveTimer = null;
      try {
        const tmp = NOTIFICATIONS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(notificationsJson), "utf8");
        fs.renameSync(tmp, NOTIFICATIONS_JSON_FILE);
      } catch (e) {
        console.error("[store] notifications persist failed:", e && e.message);
      }
    }, 250);
  },
};

module.exports = store;
