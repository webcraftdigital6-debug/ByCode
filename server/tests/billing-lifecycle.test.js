/**
 * Интеграционные тесты жизненного цикла подписки поверх mock-провайдера:
 * ручная активация промокодом, отмена, страница теста платежа и возврат
 * браузера с платёжной страницы.
 *
 * Провайдер и база-URL читаются из окружения на каждый запрос, поэтому часть
 * проверок переключает BILLING_PROVIDER прямо в тесте.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mockNotification, setup } from "./helpers.js";

const mockProvider = (await import("../billing/mock.js")).default;

let ctx;
beforeAll(async () => {
  ctx = await setup({
    NODE_ENV: null,
    BILLING_PROVIDER: "mock",
    BILLING_PRICE_RUB: "490",
    BILLING_DAYS: "30",
    APP_BASE_URL: "http://localhost:4000",
  });
});
afterAll(async () => {
  await ctx.close();
});

/** Промокод через store: маршруты лимитов проверяются отдельно. */
async function activatePro(agent) {
  const code = `LIFE-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  ctx.store.createPromoCode({ code, plan: "pro", expiresInDays: 1 });
  const res = await agent.post("/api/billing/upgrade", { promoCode: code });
  expect(res.status).toBe(200);
  return { code, res };
}

describe("Активация и отмена подписки", () => {
  it("upgrade без кода и с несуществующим кодом — 400", async () => {
    const { a } = await ctx.registerUser();
    expect((await a.post("/api/billing/upgrade", {})).status).toBe(400);
    expect((await a.post("/api/billing/upgrade", { promoCode: "   " })).status).toBe(400);
    expect((await a.post("/api/billing/upgrade", { promoCode: "NET-V-TABLICE" })).status).toBe(400);
    expect((await a.get("/api/billing/plan")).body.plan.id).toBe("free");
  });

  it("upgrade требует авторизации", async () => {
    const a = ctx.agent();
    expect((await a.post("/api/billing/upgrade", { promoCode: "PRO-TEST" })).status).toBe(401);
    expect((await a.post("/api/billing/cancel")).status).toBe(401);
  });

  it("отмена возвращает на Free и помечает подписку cancelled", async () => {
    const { a } = await ctx.registerUser();
    await activatePro(a);

    const pro = await a.get("/api/billing/plan");
    expect(pro.body.plan.id).toBe("pro");
    expect(pro.body.subscription.status).toBe("active");

    const cancel = await a.post("/api/billing/cancel");
    expect(cancel.status).toBe(200);
    expect(cancel.body).toEqual({ ok: true, plan: "free" });

    const after = await a.get("/api/billing/plan");
    expect(after.body.plan.id).toBe("free");
    expect(after.body.subscription.status).toBe("cancelled");
    // Срок не обнуляется — запись остаётся для истории платежей.
    expect(after.body.subscription.expiresAt).toBeTruthy();
  });

  it("отмена без подписки — успешный ответ, а не ошибка", async () => {
    const { a } = await ctx.registerUser();
    const res = await a.post("/api/billing/cancel");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, plan: "free" });
    expect((await a.get("/api/billing/plan")).body.subscription).toBeNull();
  });

  it("лимит классов снова действует после отмены", async () => {
    const { a } = await ctx.registerUser();
    await activatePro(a);
    expect((await a.post("/api/classes", { name: "Первый" })).status).toBe(201);
    expect((await a.post("/api/classes", { name: "Второй" })).status).toBe(201);

    await a.post("/api/billing/cancel");
    const third = await a.post("/api/classes", { name: "Третий" });
    expect(third.status).toBe(402);
    expect(third.body.code).toBe("PLAN_LIMIT_CLASSES");
  });
});

describe("Страница теста платежа", () => {
  it("checkout ведёт на mock-страницу с подписанными параметрами", async () => {
    const { a } = await ctx.registerUser();
    const res = await a.post("/api/billing/checkout", {});
    expect(res.status).toBe(200);
    expect(res.body.price).toBe("490.00");
    expect(res.body.provider).toBe("mock");

    const url = new URL(res.body.url, "http://localhost:4000");
    expect(url.pathname).toBe(`/api/billing/mock/${res.body.paymentId}`);
    expect(url.searchParams.get("ResultURL")).toBe(
      "http://localhost:4000/api/billing/result/mock",
    );
    expect(url.searchParams.get("SuccessURL")).toBe(
      "http://localhost:4000/api/billing/return/mock/success",
    );
    expect(url.searchParams.get("SignatureValue")).toMatch(/^[0-9a-f]{32}$/i);
  });

  it("страница платежа отдаёт HTML со счётом и суммой", async () => {
    const { a } = await ctx.registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    const res = await ctx.raw("get", checkout.body.url);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain(checkout.body.paymentId);
    expect(res.text).toContain("490.00 RUB");
    expect(res.text).toContain("/api/billing/result/mock");
  });

  it("страница недоступна, когда провайдер выключен", async () => {
    const { a } = await ctx.registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    process.env.BILLING_PROVIDER = "none";
    try {
      expect((await ctx.raw("get", checkout.body.url)).status).toBe(404);
      expect((await a.post("/api/billing/checkout", {})).status).toBe(503);
      const plan = await a.get("/api/billing/plan");
      expect(plan.body.checkout).toMatchObject({ available: false, provider: "none" });
    } finally {
      process.env.BILLING_PROVIDER = "mock";
    }
  });

  it("уведомление MockOutcome=fail помечает платёж failed и не включает Pro", async () => {
    const { a, userId } = await ctx.registerUser();
    const checkout = await a.post("/api/billing/checkout", {});
    const payment = ctx.store.getPayment(checkout.body.paymentId);
    const ipn = await a.post(
      "/api/billing/result/mock",
      mockNotification(payment, mockProvider, { MockOutcome: "fail" }),
      { form: true },
    );
    expect(ipn.status).toBe(200);
    expect(ctx.store.getPayment(checkout.body.paymentId).status).toBe("failed");
    expect((await a.get("/api/billing/plan")).body.plan.id).toBe("free");
    expect(ctx.store.getSubscription(userId)).toBeNull();
  });
});

describe("Возврат с платёжной страницы", () => {
  it("редиректит на базовый URL с известным исходом", async () => {
    const res = await ctx.raw("get", "/api/billing/return/mock/success");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:4000/?billing=success");
  });

  it("неизвестный исход сводится к pending", async () => {
    const res = await ctx.raw("get", "/api/billing/return/mock/%D0%BC%D1%8F%D0%BA");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:4000/?billing=pending");
  });
});
