/**
 * Общая обвязка интеграционных тестов API-сервера.
 *
 * `setup` выставляет временную DATA_DIR и поднимает приложение на эфемерном
 * порту. Переменные окружения задаются до импорта `index.js`, потому что часть
 * поведения (флаг `Secure` у куки, сид промокода) читается при загрузке модуля.
 *
 * Каждый тестовый файл получает собственный реестр модулей и свой экземпляр
 * сервера, поэтому файлы могут спорить о NODE_ENV и BILLING_PROVIDER.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
// CJS-модуль подписей: default-интероп надёжнее именных экспортов.
import signature from "../billing/signature.js";

/**
 * @param {Record<string, string | null>} [env] переменные окружения; `null` удаляет переменную.
 * @returns {Promise<TestContext>}
 */
export async function setup(env = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "bc-test-"));
  process.env.DATA_DIR = dataDir;
  process.env.BC_TEST = "1";
  for (const [key, value] of Object.entries(env)) {
    if (value === null) delete process.env[key];
    else process.env[key] = String(value);
  }

  const app = (await import("../index.js")).default;
  const store = (await import("../store.js")).default;
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));

  const ctx = {
    app,
    store,
    server,
    dataDir,
    raw: (method, url) => request(server)[method](url),
    close() {
      return new Promise((resolve) => server.close(resolve)).finally(() => {
        try {
          fs.rmSync(dataDir, { recursive: true, force: true });
        } catch {}
      });
    },
  };

  ctx.agent = () => createAgent(server);
  ctx.registerUser = (email = randomEmail(), password = "secret123") =>
    registerUser(ctx, email, password);
  return ctx;
}

function randomEmail() {
  return `t${Date.now()}${Math.floor(Math.random() * 1e6)}@test.local`;
}

/** Минимальный cookie-джар: сессия сервера живёт в куке `bc_sid`. */
function createAgent(server) {
  const jar = {};
  const call = async (method, url, body, opts = {}) => {
    const cookie = Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    const req = request(server)[method](url);
    if (cookie) req.set("Cookie", cookie);
    for (const [name, value] of Object.entries(opts.headers || {})) {
      req.set(name, value);
    }
    if (opts.form) req.type("form").send(body);
    else if (body !== undefined) req.send(body);
    const res = await req;
    for (const c of [].concat(res.headers["set-cookie"] || [])) {
      const m = /^([^=]+)=([^;]*)/.exec(c);
      if (m && !/Expires=Thu, 01 Jan 1970/.test(c)) jar[m[1]] = m[2];
    }
    return res;
  };

  const agent = { jar, call };
  agent.get = (u, o) => call("get", u, undefined, o);
  agent.post = (u, b, o) => call("post", u, b, o);
  agent.put = (u, b, o) => call("put", u, b, o);
  agent.patch = (u, b, o) => call("patch", u, b, o);
  agent.del = (u, o) => call("delete", u, undefined, o);
  return agent;
}

/** Регистрация нового пользователя; возвращает агент, email и id. */
async function registerUser(ctx, email, password) {
  const a = ctx.agent();
  const res = await a.post("/api/auth/register", { email, password });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { a, email, userId: res.body.user.id };
}

/**
 * Учитель с Pro (безлимитные лимиты) + класс + ученик, добавленный в класс.
 * Промокод создаётся через store — маршруты лимитов проверяются на свободном
 * тарифе отдельно.
 */
export async function createTeacherWithStudent(ctx, className = "Тестовый класс") {
  const teacher = await ctx.registerUser();
  const code = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  ctx.store.createPromoCode({ code, plan: "pro", expiresInDays: 1 });
  const up = await teacher.a.post("/api/billing/upgrade", { promoCode: code });
  if (up.status !== 200) {
    throw new Error(`promo upgrade failed: ${up.status} ${JSON.stringify(up.body)}`);
  }
  const cls = await teacher.a.post("/api/classes", { name: className });
  if (cls.status !== 201) {
    throw new Error(`create class failed: ${cls.status}`);
  }
  const classId = cls.body.class.id;
  const student = await ctx.registerUser();
  const add = await teacher.a.post(`/api/classes/${classId}/students`, {
    email: student.email,
  });
  if (add.status !== 201) {
    throw new Error(`add student failed: ${add.status} ${JSON.stringify(add.body)}`);
  }
  return { teacher, student, classId };
}

/** Подписанное уведомление mock-провайдера для form-encoded POST на ResultURL. */
export function mockNotification(payment, mockProvider, overrides = {}) {
  const c = mockProvider.credentials();
  const amount = (payment.amount / 100).toFixed(2);
  return {
    IsTest: "1",
    PaymentID: `rp_${payment.id}`,
    PaymentMethod: "AC",
    "Alpha-Currency": payment.currency,
    Amount: amount,
    InvoiceID: payment.id,
    Description: "BlocklyCode Pro",
    SignatureValue: signature.linkSignature({
      login: c.login,
      amount,
      invoiceId: payment.id,
      secret: c.secret,
    }),
    ...overrides,
  };
}
