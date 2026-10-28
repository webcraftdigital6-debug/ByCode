/**
 * Интеграционные тесты HTTP-слоя: заголовки изоляции для wasm-песочниц, флаги
 * сессионной куки, разбор тела, статика фронтенда и rate-limit фидбэка.
 *
 * Отдельно проверяется, что SPA-фолбэк не перехватывает `/api/*`: иначе
 * опечатка в URL метода вернула бы 200 с HTML вместо ошибки.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setup } from "./helpers.js";

let ctx;
beforeAll(async () => {
  ctx = await setup();
});
afterAll(async () => {
  await ctx.close();
});

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const DIST_DIR = path.join(REPO_ROOT, "app", "dist");
const distReady = fs.existsSync(path.join(DIST_DIR, "index.html"));

describe("Заголовки безопасности", () => {
  it("COOP/COEP/Origin-Agent-Cluster стоят и на API, и на статике", async () => {
    const api = await ctx.raw("get", "/api/auth/me");
    expect(api.headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(api.headers["cross-origin-embedder-policy"]).toBe("require-corp");
    expect(api.headers["origin-agent-cluster"]).toBe("?1");

    const asset = await ctx.raw("get", "/");
    expect(asset.headers["cross-origin-opener-policy"]).toBe("same-origin");
  });
});

describe("Сессионная кука", () => {
  it("ставится httpOnly + SameSite=Lax без Secure в разработке", async () => {
    const email = `cookie${Date.now()}@test.local`;
    const res = await ctx.raw("post", "/api/auth/register").send({
      email,
      password: "secret123",
    });
    expect(res.status).toBe(201);
    const raw = [].concat(res.headers["set-cookie"] || []).find((c) =>
      /^bc_sid=/.test(c),
    );
    expect(raw).toBeTruthy();
    expect(raw).toContain("HttpOnly");
    expect(raw).toMatch(/SameSite=Lax/i);
    expect(raw).toContain("Path=/");
    expect(raw).toMatch(/Max-Age=/i);
    expect(raw).not.toMatch(/Secure/i);
  });

  it("logout куку снимает, а сессия перестаёт работать", async () => {
    const { a } = await ctx.registerUser();
    const sid = a.jar.bc_sid;
    expect(sid).toBeTruthy();

    const out = await a.post("/api/auth/logout");
    expect(out.status).toBe(200);
    const cleared = [].concat(out.headers["set-cookie"] || []).find((c) =>
      /^bc_sid=/.test(c),
    );
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);

    // Старое значение куки больше не принимается сервером.
    const stale = await ctx.raw("get", "/api/auth/me").set(`Cookie`, `bc_sid=${sid}`);
    expect(stale.status).toBe(401);
  });

  it("неизвестная и битая кука сессии дают 401, а не ошибку", async () => {
    const unknown = await ctx
      .raw("get", "/api/profile")
      .set("Cookie", "bc_sid=00000000000000000000000000000000");
    expect(unknown.status).toBe(401);

    const garbage = await ctx
      .raw("get", "/api/profile")
      .set("Cookie", "bc_sid=");
    expect(garbage.status).toBe(401);

    const otherCookie = await ctx
      .raw("get", "/api/profile")
      .set("Cookie", "another=1");
    expect(otherCookie.status).toBe(401);
  });
});

describe("Разбор тела запроса", () => {
  it("битый JSON — 400, а не 500", async () => {
    const res = await ctx
      .raw("post", "/api/auth/register")
      .set("Content-Type", "application/json")
      .send('{"email": "broken@test.local"');
    expect(res.status).toBe(400);
  });

  it("пустое тело у POST /api/auth/register — 400", async () => {
    const res = await ctx.raw("post", "/api/auth/register").send({});
    expect(res.status).toBe(400);
  });

  it("неизвестный API-метод — 404, а не index.html от SPA", async () => {
    const res = await ctx.raw("get", "/api/definitely-not-a-route");
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('id="blocklyDiv"');
  });
});

describe("Статика фронтенда", () => {
  it("отдаёт index.html на корень и на произвольный путь SPA", {
    skip: !distReady,
  }, async () => {
    const root = await ctx.raw("get", "/");
    expect(root.status).toBe(200);
    expect(root.headers["content-type"]).toMatch(/text\/html/);
    expect(root.text).toMatch(/<div id="blocklyDiv"/);

    const deep = await ctx.raw("get", "/kakoi-to/ne-knowno");
    expect(deep.status).toBe(200);
    expect(deep.text).toBe(root.text);
  });

  it("отдаёт собранный бандл с JavaScript content-type", { skip: !distReady }, async () => {
    const bundle = path.join(DIST_DIR, "bundle.js");
    if (!fs.existsSync(bundle)) return;
    const res = await ctx.raw("get", "/bundle.js");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/javascript/);
  });
});

describe("Rate-limit фидбэка", () => {
  it("пятое сообщение с одного IP за час пропускается, шестое — 429", async () => {
    const ip = `10.42.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
    const post = (message) =>
      ctx
        .raw("post", "/api/feedback")
        .set("X-Forwarded-For", ip)
        .send({ type: "bug", message, email: "someone@test.local" });

    for (let i = 0; i < 5; i++) {
      const res = await post(`Проблема ${i}`);
      expect(res.status).toBe(201);
    }
    const sixth = await post("Шестая");
    expect(sixth.status).toBe(429);
    expect(sixth.body.error).toMatch(/позже/i);
  });

  it("другой IP не наследует лимит", async () => {
    const ip = `10.43.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const res = await ctx
      .raw("post", "/api/feedback")
      .set("X-Forwarded-For", ip)
      .send({ message: "Совсем другой посетитель" });
    expect(res.status).toBe(201);
  });
});
