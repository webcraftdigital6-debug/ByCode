/**
 * Интеграционные тесты оплаты подписки картой (supertest + mock-провайдер).
 *
 * Проверяют, что подписка включается только по проверенному уведомлению
 * провайдера, повторная доставка не удваивает срок, а подделка подписи,
 * несовпадение суммы/валюты и чужой счёт ACTIVATION не дают.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "bc-billing-pay-"));
process.env.DATA_DIR = DATA_DIR;
process.env.BC_TEST = "1";
process.env.BILLING_PROVIDER = "mock";
delete process.env.BILLING_PROMO_ENABLED;
delete process.env.BILLING_REQUIRE_CONFIRM;
delete process.env.APP_BASE_URL;

const app = (await import("../index.js")).default;
const store = (await import("../store.js")).default;
const mockProvider = (await import("../billing/mock.js")).default;
const { linkSignature } = await import("../billing/signature.js");

let server;
beforeAll(() => {
  server = app.listen(0);
});
afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  try {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  } catch {}
});

// ---------- helpers ----------
function agent() {
  const jar = {};
  const a = {
    async call(method, url, body, type) {
      const cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
      const req = request(server)[method](url);
      if (cookie) req.set("Cookie", cookie);
      if (body !== undefined) {
        if (type === "form") req.type("form").send(body);
        else req.send(body);
      }
      const res = await req;
      const setCookie = res.headers["set-cookie"];
      if (Array.isArray(setCookie)) {
        for (const c of setCookie) {
          const m = /^([^=]+)=([^;]*)/.exec(c);
          if (m && !/Expires=Thu, 01 Jan 1970/.test(c)) jar[m[1]] = m[2];
        }
      }
      return res;
    },
  };
  a.get = (u) => a.call("get", u);
  a.post = (u, b, type) => a.call("post", u, b, type);
  return a;
}

async function registerUser() {
  const email = `pay${Date.now()}${Math.floor(Math.random() * 100000)}@pay.local`;
  const a = agent();
  const res = await a.post("/api/auth/register", { email, password: "secret123" });
  expect(res.status).toBe(201);
  return { a, email, userId: res.body.user.id };
}

/** Уведомление провайдера на ResultURL: form-encoded, как в реальном Robokassa. */
function notificationFor(payment, overrides = {}) {
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
    SignatureValue: linkSignature({
      login: c.login,
      amount,
      invoiceId: payment.id,
      secret: c.secret,
    }),
    ...overrides,
  };
}

async function payWith(a, userId) {
  const checkout = await a.post("/api/billing/checkout", {});
  expect(checkout.status).toBe(200);
  const payment = store.getPayment(checkout.body.paymentId);
  expect(payment.status).toBe("pending");
  const ipn = await a.post(
    "/api/billing/result/mock",
    notificationFor(payment),
    "form",
  );
  expect(ipn.status).toBe(200);
  expect(ipn.text).toBe(`OK${payment.id}`);
  return { checkout, payment, ipn };
}

// ---------- tests ----------
describe("Оплата подписки картой", () => {
  it("plan отдаёт настройки оплаты и скрывает промокоды по умолчанию", async () => {
    const { a } = await registerUser();
    const res = await a.get("/api/billing/plan");
    expect(res.status).toBe(200);
    expect(res.body.checkout.available).toBe(true);
    expect(res.body.checkout.provider).toBe("mock");
    expect(res.body.checkout.price).toBe("490.00");
    expect(res.body.checkout.days).toBe(30);
    expect(res.body.promoEnabled).toBe(false);
  });

  it("checkout создаёт pending-платёж и ссылку на страницу оплаты", async () => {
    const { a, userId } = await registerUser();
    const res = await a.post("/api/billing/checkout", {});
    expect(res.status).toBe(200);
    expect(res.body.url).toContain("/api/billing/mock/");
    const payment = store.getPayment(res.body.paymentId);
    expect(payment.user_id).toBe(userId);
    expect(payment.status).toBe("pending");
    expect(payment.amount).toBe(49000);
    // до уведомления провайдера тариф не меняется
    const plan = await a.get("/api/billing/plan");
    expect(plan.body.plan.id).toBe("free");
  });

  it("уведомление с валидной подписью включает Pro на 30 дней", async () => {
    const { a } = await registerUser();
    const { payment } = await payWith(a);
    const plan = await a.get("/api/billing/plan");
    expect(plan.body.plan.id).toBe("pro");
    const expires = new Date(plan.body.subscription.expiresAt).getTime();
    const days = Math.round((expires - Date.now()) / 86400000);
    expect(days).toBe(30);
    expect(store.getPayment(payment.id).status).toBe("paid");
  });

  it("повторная доставка уведомления не продлевает подписку второй раз", async () => {
    const { a } = await registerUser();
    const { payment } = await payWith(a);
    const first = await a.get("/api/billing/plan");
    const replay = await a.post(
      "/api/billing/result/mock",
      notificationFor(payment),
      "form",
    );
    expect(replay.status).toBe(200);
    expect(replay.text).toBe(`OK${payment.id}`);
    const second = await a.get("/api/billing/plan");
    expect(second.body.subscription.expiresAt).toBe(
      first.body.subscription.expiresAt,
    );
  });

  it("поддельная подпись — 403 и без активации", async () => {
    const { a } = await registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    const payment = store.getPayment(checkout.body.paymentId);
    const res = await a.post(
      "/api/billing/result/mock",
      notificationFor(payment, { SignatureValue: "deadbeef" }),
      "form",
    );
    expect(res.status).toBe(403);
    const plan = await a.get("/api/billing/plan");
    expect(plan.body.plan.id).toBe("free");
    expect(store.getPayment(payment.id).status).toBe("pending");
  });

  it("несовпадение валюты — 403", async () => {
    const { a } = await registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    const payment = store.getPayment(checkout.body.paymentId);
    const res = await a.post(
      "/api/billing/result/mock",
      notificationFor(payment, { "Alpha-Currency": "USD" }),
      "form",
    );
    expect(res.status).toBe(403);
    expect(res.text).toBe("Currency mismatch");
  });

  it("несовпадение суммы — 403", async () => {
    const { a } = await registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    const payment = store.getPayment(checkout.body.paymentId);
    const notification = notificationFor(payment);
    // подпись считаем от честной суммы, а в теле присылаем другую
    const res = await a.post(
      "/api/billing/result/mock",
      { ...notification, Amount: "1.00" },
      "form",
    );
    expect(res.status).toBe(403);
  });

  it("уведомление по несуществующему счёту — 404", async () => {
    const { a } = await registerUser();
    const fake = notificationFor({
      id: "pay_missing",
      amount: 49000,
      currency: "RUB",
    });
    const res = await a.post("/api/billing/result/mock", fake, "form");
    expect(res.status).toBe(404);
  });

  it("отклонённый платёж помечается failed и не включает Pro", async () => {
    const { a } = await registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    const payment = store.getPayment(checkout.body.paymentId);
    const res = await a.post(
      "/api/billing/result/mock",
      notificationFor(payment, { MockOutcome: "fail" }),
      "form",
    );
    expect(res.status).toBe(200);
    expect(store.getPayment(payment.id).status).toBe("failed");
    const plan = await a.get("/api/billing/plan");
    expect(plan.body.plan.id).toBe("free");
  });

  it("оплата активной подписки продлевает её, а не обнуляет", async () => {
    const { a } = await registerUser();
    await payWith(a);
    const first = await a.get("/api/billing/plan");
    const firstExpiry = new Date(first.body.subscription.expiresAt).getTime();
    await payWith(a);
    const second = await a.get("/api/billing/plan");
    const secondExpiry = new Date(second.body.subscription.expiresAt).getTime();
    const added = Math.round((secondExpiry - firstExpiry) / 86400000);
    expect(added).toBe(30);
  });

  it("возврат с платёжной страницы — редирект с исходом оплаты", async () => {
    const res = await request(server).get("/api/billing/return/mock/success");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/?billing=success");
  });

  it("без настроенного провайдера checkout отвечает 503", async () => {
    const { a } = await registerUser();
    process.env.BILLING_PROVIDER = "none";
    try {
      const res = await a.post("/api/billing/checkout", {});
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("BILLING_UNAVAILABLE");
    } finally {
      process.env.BILLING_PROVIDER = "mock";
    }
  });

  it("промокод строго одноразовый: повторный ввод тем же аккаунтом — 400", async () => {
    const code = `ONCE-AGAIN-${Date.now()}`;
    store.createPromoCode({ code, plan: "pro", expiresInDays: 1 });
    const { a } = await registerUser();
    const first = await a.post("/api/billing/upgrade", { promoCode: code });
    expect(first.status).toBe(200);
    await a.post("/api/billing/cancel", {});
    const again = await a.post("/api/billing/upgrade", { promoCode: code });
    expect(again.status).toBe(400);
  });
});

describe("Лимит учеников считается по классам учителя", () => {
  it("ученик из чужого класса расходует слот Free-учителя", async () => {
    const owner = await registerUser();
    const ownerClass = await owner.a.post("/api/classes", { name: "Owner" });
    const student = await registerUser();
    const added = await owner.a.post(
      `/api/classes/${ownerClass.body.class.id}/students`,
      { email: student.email },
    );
    expect(added.status).toBe(201);

    // Второй учитель — Free: этот ученик для него новый и занимает слот
    const teacher = await registerUser();
    const cls = await teacher.a.post("/api/classes", { name: "Free class" });
    const classId = cls.body.class.id;

    for (let i = 0; i < 5; i++) {
      const s = await registerUser();
      expect(
        (await teacher.a.post(`/api/classes/${classId}/students`, { email: s.email })).status,
      ).toBe(201);
    }
    // лимит в 5 слотов исчерпан, ученик из чужого класса — шестой
    const blocked = await teacher.a.post(`/api/classes/${classId}/students`, {
      email: student.email,
    });
    expect(blocked.status).toBe(402);
    expect(blocked.body.code).toBe("PLAN_LIMIT_STUDENTS");
  });
});
