/**
 * Интеграционные тесты пользовательских данных: профиль, workspace,
 * пользовательские блоки и лимит тела запроса.
 *
 * Проверяют round-trip каждого хранилища, валидацию на границе и то, что
 * данные одного пользователя недоступны другому.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

let ctx;
beforeAll(async () => {
  ctx = await setup();
});
afterAll(async () => {
  await ctx.close();
});

describe("Профиль", () => {
  it("требует авторизацию", async () => {
    const a = ctx.agent();
    expect((await a.get("/api/profile")).status).toBe(401);
    expect((await a.patch("/api/profile", { name: "Аноним" })).status).toBe(401);
  });

  it("сохраняет имя с обрезкой пробелов и avatarUrl", async () => {
    const { a } = await ctx.registerUser();
    const res = await a.patch("/api/profile", {
      name: "  Ирина  ",
      avatarUrl: "/avatars/irina.png",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Ирина");
    expect(res.body.user.avatarUrl).toBe("/avatars/irina.png");

    const get = await a.get("/api/profile");
    expect(get.status).toBe(200);
    expect(get.body.user.name).toBe("Ирина");
    expect(get.body.user.avatarUrl).toBe("/avatars/irina.png");
  });

  it("отклоняет пустое имя (400) и не меняет профиль", async () => {
    const { a } = await ctx.registerUser();
    await a.patch("/api/profile", { name: "До" });
    expect((await a.patch("/api/profile", { name: "   " })).status).toBe(400);
    expect((await a.patch("/api/profile", { name: 42 })).status).toBe(400);
    const get = await a.get("/api/profile");
    expect(get.body.user.name).toBe("До");
  });

  it("stats считает решённые задачи, звёзды и число блоков", async () => {
    const { a } = await ctx.registerUser();
    const empty = await a.get("/api/profile");
    expect(empty.body.stats).toMatchObject({
      tasksSolved: 0,
      tasksTotal: 0,
      stars: 0,
      customBlocks: 0,
    });

    await a.post("/api/progress/hello_world", { solved: true, stars: 3 });
    await a.post("/api/progress/add_2_7", { solved: true, stars: 2 });
    // Засчитывается только solved: запись без флага попадает в tasksTotal.
    await a.post("/api/progress/lists_sort", { stars: 1 });
    await a.put("/api/blocks/my_tile", {
      definition: { type: "my_tile", message0: "%1" },
    });

    const { stats } = (await a.get("/api/profile")).body;
    expect(stats.tasksSolved).toBe(2);
    expect(stats.tasksTotal).toBe(3);
    expect(stats.stars).toBe(5);
    expect(stats.customBlocks).toBe(1);
    expect(stats.lastActivity).toBeTruthy();
  });
});

describe("Workspace", () => {
  it("отдаёт null, пока ничего не сохранено", async () => {
    const { a } = await ctx.registerUser();
    const res = await a.get("/api/workspace");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: null, updatedAt: null });
  });

  it("требует data в теле запроса", async () => {
    const { a } = await ctx.registerUser();
    expect((await a.post("/api/workspace", {})).status).toBe(400);
    expect((await a.post("/api/workspace", { data: null })).status).toBe(400);
    expect((await a.post("/api/workspace")).status).toBe(400);
  });

  it("сохраняет и возвращает структуру Blockly без изменений", async () => {
    const { a } = await ctx.registerUser();
    const data = {
      languageVersion: 0,
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: "controls_repeat_ext",
            id: "a1",
            inputs: { TIMINGS: { shadow: { type: "math_number", fields: { NUM: 10 } } } },
          },
        ],
      },
    }
    const save = await a.post("/api/workspace", { data });
    expect(save.status).toBe(200);
    expect(save.body.ok).toBe(true);
    expect(save.body.updatedAt).toBeTruthy();

    const load = await a.get("/api/workspace");
    expect(load.body.data).toEqual(data);
    expect(load.body.updatedAt).toBe(save.body.updatedAt);
  });

  it("хранит скаляр вместо объекта и перезаписывает его", async () => {
    const { a } = await ctx.registerUser();
    await a.post("/api/workspace", { data: "<xml/>" });
    expect((await a.get("/api/workspace")).body.data).toBe("<xml/>");
    await a.post("/api/workspace", { data: [1, 2, 3] });
    expect((await a.get("/api/workspace")).body.data).toEqual([1, 2, 3]);
  });

  it("не доступ без авторизации", async () => {
    const a = ctx.agent();
    expect((await a.get("/api/workspace")).status).toBe(401);
    expect((await a.post("/api/workspace", { data: {} })).status).toBe(401);
  });

  it("отклоняет тело больше лимита 4 МБ кодом 413", async () => {
    const { a } = await ctx.registerUser();
    const big = "x".repeat(4 * 1024 * 1024 + 64 * 1024);
    const res = await a.post("/api/workspace", { data: { blob: big } });
    expect(res.status).toBe(413);
    // Прежний workspace не должен пострадать от отклонённого запроса.
    expect((await a.get("/api/workspace")).body.data).toBeNull();
  });
});

describe("Пользовательские блоки", () => {
  it("требует авторизацию", async () => {
    const a = ctx.agent();
    expect((await a.get("/api/blocks")).status).toBe(401);
    expect((await a.put("/api/blocks/x", { definition: { type: "x" } })).status).toBe(401);
    expect((await a.del("/api/blocks/x")).status).toBe(401);
  });

  it("отклоняет пустой type и определение без type", async () => {
    const { a } = await ctx.registerUser();
    expect((await a.put("/api/blocks/%20", { definition: { type: "x" } })).status).toBe(400);
    expect((await a.put("/api/blocks/real_type", { definition: {} })).status).toBe(400);
    expect((await a.put("/api/blocks/real_type", {})).status).toBe(400);
    expect((await a.get("/api/blocks")).body.blocks).toEqual([]);
  });

  it("upsert обновляет определение, а не плодит дубликат", async () => {
    const { a } = await ctx.registerUser();
    await a.put("/api/blocks/tile", { definition: { type: "tile", message0: "%1" } });
    await a.put("/api/blocks/tile", { definition: { type: "tile", message0: "%1 %2" } });
    const blocks = (await a.get("/api/blocks")).body.blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("tile");
    expect(blocks[0].definition.message0).toBe("%1 %2");
  });

  it("удаление снимает блок и не мешает повторному созданию", async () => {
    const { a } = await ctx.registerUser();
    await a.put("/api/blocks/tile", { definition: { type: "tile" } });
    expect((await a.del("/api/blocks/tile")).status).toBe(200);
    expect((await a.get("/api/blocks")).body.blocks).toEqual([]);
    await a.put("/api/blocks/tile", { definition: { type: "tile", again: true } });
    const blocks = (await a.get("/api/blocks")).body.blocks;
    expect(blocks[0].definition.again).toBe(true);
  });

  it("чужой блок не виден и не удаляется", async () => {
    const owner = await ctx.registerUser();
    await owner.a.put("/api/blocks/secret_tile", { definition: { type: "secret_tile" } });

    const other = await ctx.registerUser();
    expect((await other.a.get("/api/blocks")).body.blocks).toEqual([]);
    const remove = await other.a.del("/api/blocks/secret_tile");
    expect(remove.status).toBe(200);

    const still = (await owner.a.get("/api/blocks")).body.blocks;
    expect(still).toHaveLength(1);
    expect(still[0].type).toBe("secret_tile");
  });

  it("разные пользователи могут использовать один type", async () => {
    const first = await ctx.registerUser();
    const second = await ctx.registerUser();
    await first.a.put("/api/blocks/common", { definition: { type: "common", who: 1 } });
    await second.a.put("/api/blocks/common", { definition: { type: "common", who: 2 } });
    expect((await first.a.get("/api/blocks")).body.blocks[0].definition.who).toBe(1);
    expect((await second.a.get("/api/blocks")).body.blocks[0].definition.who).toBe(2);
  });
});
