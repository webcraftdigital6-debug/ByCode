/**
 * Интеграционные тесты классов: изменение, удаление, состав учеников,
 * прогресс ученика и назначения заданий.
 *
 * Отдельно проверяется, что ответы учителя не содержат хэш и соль пароля —
 * список учеников собирается из полных записей пользователей.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTeacherWithStudent, setup } from "./helpers.js";

let ctx;
beforeAll(async () => {
  ctx = await setup();
});
afterAll(async () => {
  await ctx.close();
});

/** Ответы никогда не должны нести секреты. */
function expectNoSecrets(value) {
  const json = JSON.stringify(value);
  expect(json).not.toContain("passwordHash");
  expect(json).not.toContain("passwordSalt");
}

describe("Изменение и удаление класса", () => {
  it("PUT меняет имя и описание", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    const res = await teacher.a.put(`/api/classes/${classId}`, {
      name: "  5 «Б»  ",
      description: "Алгоритмы",
    });
    expect(res.status).toBe(200);
    expect(res.body.class.name).toBe("5 «Б»");
    expect(res.body.class.description).toBe("Алгоритмы");

    const list = await teacher.a.get("/api/classes");
    expect(list.body.classes[0].name).toBe("5 «Б»");
    expectNoSecrets(list.body);
  });

  it("PUT требует непустое имя", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    expect(
      (await teacher.a.put(`/api/classes/${classId}`, { name: "   " })).status,
    ).toBe(400);
    expect((await teacher.a.put(`/api/classes/${classId}`, {})).status).toBe(200);
  });

  it("чужому учителю недоступны PUT, DELETE и GET класса", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    const intruder = await ctx.registerUser();
    for (const [method, url] of [
      ["get", `/api/classes/${classId}`],
      ["put", `/api/classes/${classId}`],
      ["delete", `/api/classes/${classId}`],
      ["get", `/api/classes/${classId}/students`],
      ["get", `/api/classes/${classId}/tasks`],
    ]) {
      const res = await intruder.a.call(
        method,
        url,
        method === "put" ? { name: "X" } : undefined,
      );
      expect({ method, status: res.status }).toEqual({ method, status: 403 });
    }

    const untouched = await teacher.a.get(`/api/classes/${classId}`);
    expect(untouched.status).toBe(200);
    expect(untouched.body.class.name).toBe("Тестовый класс");
  });

  it("несуществующий класс даёт 404 на все операции", async () => {
    const { teacher } = await createTeacherWithStudent(ctx);
    const missing = "00000000-0000-4000-8000-000000000000";
    for (const url of [
      `/api/classes/${missing}`,
      `/api/classes/${missing}/students`,
      `/api/classes/${missing}/tasks`,
    ]) {
      expect((await teacher.a.get(url)).status).toBe(404);
    }
    expect((await teacher.a.del(`/api/classes/${missing}`)).status).toBe(404);
  });

  it("DELETE удаляет класс вместе с учениками и назначениями", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    const assign = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    expect(assign.status).toBe(201);

    expect((await teacher.a.del(`/api/classes/${classId}`)).status).toBe(200);
    expect((await teacher.a.get("/api/classes")).body.classes).toEqual([]);
    expect((await teacher.a.get(`/api/classes/${classId}`)).status).toBe(404);
    // Ученик больше ни к какому классу не привязан.
    expect(ctx.store.getUserClass(student.userId)).toEqual([]);
    expect(ctx.store.getClassTasks(classId)).toEqual([]);
    // Класс и его состав удалены: создание нового работает как обычно.
    const again = await teacher.a.post("/api/classes", { name: "Снова" });
    expect(again.status).toBe(201);
  });
});

describe("Состав класса", () => {
  it("добавляет по email и по studentId, дубликат — 409", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    const second = await ctx.registerUser();
    const byId = await teacher.a.post(`/api/classes/${classId}/students`, {
      studentId: second.userId,
    });
    expect(byId.status).toBe(201);
    expect(byId.body.member.user_id).toBe(second.userId);

    const dup = await teacher.a.post(`/api/classes/${classId}/students`, {
      email: second.email,
    });
    expect(dup.status).toBe(409);
  });

  it("неизвестный ученик — 404, пустой запрос — 404", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    const missing = await teacher.a.post(`/api/classes/${classId}/students`, {
      email: "ghost@example.com",
    });
    expect(missing.status).toBe(404);
    expect(
      (await teacher.a.post(`/api/classes/${classId}/students`, {})).status,
    ).toBe(404);
  });

  it("GET списка учеников отдаёт пользователя без секретов", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    const res = await teacher.a.get(`/api/classes/${classId}/students`);
    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].user.id).toBe(student.userId);
    expect(res.body.students[0].role).toBe("student");
    expectNoSecrets(res.body);
  });

  it("DELETE снимает ученика и освобождает слот тарифа", async () => {
    const teacher = await ctx.registerUser();
    const cls = await teacher.a.post("/api/classes", { name: "Free класс" });
    const classId = cls.body.class.id;

    const students = [];
    for (let i = 0; i < 5; i++) {
      const s = await ctx.registerUser();
      const add = await teacher.a.post(`/api/classes/${classId}/students`, {
        email: s.email,
      });
      expect(add.status).toBe(201);
      students.push(s);
    }
    const sixth = await ctx.registerUser();
    const overflow = await teacher.a.post(`/api/classes/${classId}/students`, {
      email: sixth.email,
    });
    expect(overflow.status).toBe(402);
    expect(overflow.body.code).toBe("PLAN_LIMIT_STUDENTS");

    expect(
      (await teacher.a.del(`/api/classes/${classId}/students/${students[0].userId}`))
        .status,
    ).toBe(200);
    const list = await teacher.a.get(`/api/classes/${classId}/students`);
    expect(list.body.students).toHaveLength(4);

    // Освободившийся слот позволяет добавить того, кого только что отклонили.
    const retry = await teacher.a.post(`/api/classes/${classId}/students`, {
      email: sixth.email,
    });
    expect(retry.status).toBe(201);
  });

  it("чужой ученик не удаляется, а класс остаётся целым", async () => {
    const owner = await createTeacherWithStudent(ctx);
    const intruder = await ctx.registerUser();
    const res = await intruder.a.del(
      `/api/classes/${owner.classId}/students/${owner.student.userId}`,
    );
    expect(res.status).toBe(403);
    const list = await owner.teacher.a.get(`/api/classes/${owner.classId}/students`);
    expect(list.body.students).toHaveLength(1);
  });

  it("удаление несуществующего ученика — ok, список не меняется", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    const res = await teacher.a.del(
      `/api/classes/${classId}/students/ghost-user`,
    );
    expect(res.status).toBe(200);
    expect((await teacher.a.get(`/api/classes/${classId}/students`)).body.students).toHaveLength(1);
  });
});

describe("Прогресс ученика в классе", () => {
  it("отдаёт статистику, прогресс и назначения", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    await student.a.post("/api/progress/hello_world", { solved: true, stars: 3 });

    const res = await teacher.a.get(
      `/api/classes/${classId}/students/${student.userId}/progress`,
    );
    expect(res.status).toBe(200);
    expect(res.body.student.id).toBe(student.userId);
    expect(res.body.stats.tasksSolved).toBe(1);
    expect(res.body.progress.hello_world.stars).toBe(3);
    expect(res.body.assignments[0].taskId).toBe("hello_world");
    expect(res.body.assignments[0].status).toBe("completed");
    expectNoSecrets(res.body);
  });

  it("ученик вне класса — 404", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    const stranger = await ctx.registerUser();
    const res = await teacher.a.get(
      `/api/classes/${classId}/students/${stranger.userId}/progress`,
    );
    expect(res.status).toBe(404);
  });

  it("чужому учителю прогресс недоступен", async () => {
    const owner = await createTeacherWithStudent(ctx);
    const intruder = await ctx.registerUser();
    const res = await intruder.a.get(
      `/api/classes/${owner.classId}/students/${owner.student.userId}/progress`,
    );
    expect(res.status).toBe(403);
  });
});

describe("Назначения заданий", () => {
  it("POST требует taskId и studentId, неизвестный ученик — 404", async () => {
    const { teacher, classId } = await createTeacherWithStudent(ctx);
    expect(
      (await teacher.a.post(`/api/classes/${classId}/tasks`, { studentId: "x" })).status,
    ).toBe(400);
    expect(
      (await teacher.a.post(`/api/classes/${classId}/tasks`, { taskId: "x" })).status,
    ).toBe(400);
    expect(
      (
        await teacher.a.post(`/api/classes/${classId}/tasks`, {
          taskId: "hello_world",
          studentId: "ghost",
        })
      ).status,
    ).toBe(404);
  });

  it("повторное активное назначение — 409, после завершения — снова можно", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    const first = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    expect(first.status).toBe(201);
    const dup = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    expect(dup.status).toBe(409);

    await student.a.put(`/api/student/tasks/${first.body.task.id}`, {
      status: "completed",
    });
    const after = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    expect(after.status).toBe(201);
  });

  it("GET класса показывает назначившего и ученика без секретов", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "add_2_7",
      studentId: student.userId,
    });
    const res = await teacher.a.get(`/api/classes/${classId}/tasks`);
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].assignedTo.id).toBe(student.userId);
    expect(res.body.tasks[0].assignedBy.id).toBe(teacher.userId);
    expectNoSecrets(res.body);
  });

  it("Free-лимит 3 назначения в месяц — 402", async () => {
    const teacher = await ctx.registerUser();
    const cls = await teacher.a.post("/api/classes", { name: "Месяц" });
    const classId = cls.body.class.id;
    const student = await ctx.registerUser();
    await teacher.a.post(`/api/classes/${classId}/students`, { email: student.email });

    for (const taskId of ["hello_world", "add_2_7", "lists_sort"]) {
      expect(
        (
          await teacher.a.post(`/api/classes/${classId}/tasks`, {
            taskId,
            studentId: student.userId,
          })
        ).status,
      ).toBe(201);
    }
    const fourth = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "quiz_1",
      studentId: student.userId,
    });
    expect(fourth.status).toBe(402);
    expect(fourth.body.code).toBe("PLAN_LIMIT_ASSIGNMENTS");
    expect(fourth.body.usage).toBe(3);
  });

  it("ученик видит только свои назначения с классом и прогрессом", async () => {
    const mine = await createTeacherWithStudent(ctx, "Мой класс");
    const other = await createTeacherWithStudent(ctx, "Чужой класс");
    await mine.teacher.a.post(`/api/classes/${mine.classId}/tasks`, {
      taskId: "hello_world",
      studentId: mine.student.userId,
    });

    const res = await mine.student.a.get("/api/student/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].task_id).toBe("hello_world");
    expect(res.body.tasks[0].class.id).toBe(mine.classId);
    expect(res.body.tasks[0].progress).toBeNull();

    // Ученик другой пары учитель/класс не видит чужих назначений.
    const theirs = await other.student.a.get("/api/student/tasks");
    expect(theirs.status).toBe(200);
    expect(theirs.body.tasks).toEqual([]);
  });

  it("PUT чужого назначения не найдено (404)", async () => {
    const { student, classId, teacher } = await createTeacherWithStudent(ctx);
    const assign = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    const stranger = await ctx.registerUser();
    const res = await stranger.a.put(
      `/api/student/tasks/${assign.body.task.id}`,
      { status: "completed" },
    );
    expect(res.status).toBe(404);

    const still = await student.a.get("/api/student/tasks");
    expect(still.body.tasks[0].status).toBe("assigned");
  });

  it("PUT со solved и stars пишет прогресс ученика", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    const assign = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    const res = await student.a.put(`/api/student/tasks/${assign.body.task.id}`, {
      solved: true,
      stars: 4,
    });
    expect(res.status).toBe(200);

    const { progress } = (await student.a.get("/api/progress")).body;
    expect(progress.hello_world.solved).toBe(true);
    // Хранилище режет звёзды до трёх — 4 из интерфейса не пройти.
    expect(progress.hello_world.stars).toBe(3);
    expect(progress.hello_world.updatedAt).toBeTruthy();
  });

  it("PUT статус completed не создаёт уведомление повторно", async () => {
    const { teacher, student, classId } = await createTeacherWithStudent(ctx);
    const assign = await teacher.a.post(`/api/classes/${classId}/tasks`, {
      taskId: "hello_world",
      studentId: student.userId,
    });
    const id = assign.body.task.id;
    await student.a.put(`/api/student/tasks/${id}`, { status: "completed" });
    await student.a.put(`/api/student/tasks/${id}`, { status: "completed" });

    const feed = await teacher.a.get("/api/notifications");
    expect(feed.body.notifications).toHaveLength(1);
  });
});
