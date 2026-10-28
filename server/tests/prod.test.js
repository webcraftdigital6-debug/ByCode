/**
 * Интеграционные тесты продакшн-режима: NODE_ENV=production ставится до импорта
 * приложения, потому что флаги куки и текст ошибок вычисляются при загрузке.
 *
 * Проверяет `Secure` у сессионной куки и поведение фидбэка без настроенного SMTP
 * (сервер обязан вести журнал в файле, а не падать).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { setup } from "./helpers.js";

let ctx;
beforeAll(async () => {
  ctx = await setup({ NODE_ENV: "production", BILLING_PROVIDER: null });
});
afterAll(async () => {
  await ctx.close();
});

describe("NODE_ENV=production", () => {
  it("сессионная кука ставится с Secure", async () => {
    const res = await ctx
      .raw("post", "/api/auth/register")
      .send({ email: `prod${Date.now()}@test.local`, password: "secret123" });
    expect(res.status).toBe(201);
    const raw = [].concat(res.headers["set-cookie"] || []).find((c) =>
      /^bc_sid=/.test(c),
    );
    expect(raw).toMatch(/Secure/i);
    expect(raw).toContain("HttpOnly");
    expect(raw).toMatch(/SameSite=Lax/i);
  });

  it("ошибка тела запроса не выдаёт стек и внутренний текст", async () => {
    const res = await ctx
      .raw("post", "/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{oops");
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at Object|node_modules/);
  });

  it("фидбэк без SMTP сохраняется в журнал DATA_DIR и отвечает delivered: false", async () => {
    const ip = `10.90.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const res = await ctx
      .raw("post", "/api/feedback")
      .set("X-Forwarded-For", ip)
      .send({ type: "idea", message: "Прода-проверка журнала", email: "x@test.local" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true, delivered: false });

    const log = JSON.parse(
      fs.readFileSync(path.join(ctx.dataDir, "feedback.json"), "utf8"),
    );
    const entry = log.find((e) => e.message === "Прода-проверка журнала");
    expect(entry).toBeTruthy();
    expect(entry.type).toBe("idea");
    expect(entry.email).toBe("x@test.local");
  });

  it("неизвестный тип фидбэка не ломает журнал", async () => {
    const ip = `10.91.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const res = await ctx
      .raw("post", "/api/feedback")
      .set("X-Forwarded-For", ip)
      .send({ type: "спам-спам", message: "Мусорный тип" });
    expect(res.status).toBe(201);
    const log = JSON.parse(
      fs.readFileSync(path.join(ctx.dataDir, "feedback.json"), "utf8"),
    );
    expect(log.find((e) => e.message === "Мусорный тип").type).toBe("other");
  });
});
