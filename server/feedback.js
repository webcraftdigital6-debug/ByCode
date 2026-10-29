/**
 * Обратная связь: отправка сообщений пользователей на почту владельца.
 * Транспорт: Nodemailer SMTP (настройки из переменных окружения).
 * Если SMTP не настроен — сообщения складываются в data/feedback.json,
 * чтобы ничего не терялось до подключения почты.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const FEEDBACK_TO = process.env.FEEDBACK_TO || "thomaspartymaker@gmail.com";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "ByCode <no-reply@bycode.local>";

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SMTP_CONFIGURED = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (SMTP_CONFIGURED) {
  try {
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    console.log("[feedback] SMTP настроен, письма будут отправляться на " + FEEDBACK_TO);
  } catch (e) {
    console.warn("[feedback] nodemailer недоступен (" + (e && e.message) + "), фолбэк в файл");
    transporter = null;
  }
} else {
  console.warn(
    "[feedback] SMTP не настроен (SMTP_HOST/SMTP_USER/SMTP_PASS), " +
      "сообщения сохраняются в " + FEEDBACK_FILE,
  );
}

const TYPES = ["bug", "idea", "question", "other"];
const MAX_MESSAGE = 4000;

function loadFeedbackFile() {
  try {
    return JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveFeedbackFile(list) {
  const tmp = FEEDBACK_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, FEEDBACK_FILE);
}

function typeLabel(type) {
  switch (type) {
    case "bug":
      return "Баг";
    case "idea":
      return "Пожелание";
    case "question":
      return "Вопрос";
    default:
      return "Другое";
  }
}

/**
 * Принимает { type, message, email, page }.
 * Возвращает { ok, delivered } — delivered=true, если ушло письмом,
 * иначе сохранено в файл (ок без SMTP — это норма, не ошибка).
 */
async function submitFeedback({ type, message, email, page }) {
  const t = new Date().toISOString();
  const entry = {
    id: require("crypto").randomUUID(),
    type: TYPES.includes(type) ? type : "other",
    typeLabel: typeLabel(type),
    message: String(message || "").slice(0, MAX_MESSAGE),
    email: email ? String(email).slice(0, 200) : null,
    page: page ? String(page).slice(0, 200) : null,
    createdAt: t,
  };
  if (!entry.message.trim()) {
    throw new Error("Сообщение не может быть пустым");
  }

  // Всегда сохраняем копию в файл — журнал обращений
  const list = loadFeedbackFile();
  list.push(entry);
  saveFeedbackFile(list);

  // Пытаемся доставить письмом
  if (transporter) {
    const subject = `[ByCode] ${entry.typeLabel} от ${entry.email || "анонимно"}`;
    const text =
      `Тип: ${entry.typeLabel}\n` +
      `От: ${entry.email || "(не указан)"}\n` +
      `Страница: ${entry.page || "(не указана)"}\n` +
      `Время: ${entry.createdAt}\n\n` +
      `${entry.message}\n`;
    try {
      await transporter.sendMail({ from: SMTP_FROM, to: FEEDBACK_TO, subject, text });
      return { ok: true, delivered: true };
    } catch (e) {
      console.error("[feedback] SMTP send failed:", e && e.message);
      // Письмо не ушло, но копия уже в файле — не считаем это ошибкой для клиента
      return { ok: true, delivered: false };
    }
  }
  return { ok: true, delivered: false };
}

module.exports = { submitFeedback, SMTP_CONFIGURED, FEEDBACK_TO, TYPES };
