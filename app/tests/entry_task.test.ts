/**
 * Тесты выбора стартовой задачи уровня (tasks/state.ts getEntryTask):
 * гость всегда открывается с первой задачи раздела, авторизованный —
 * продолжает с первой нерешённой.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getEntryTask, getFirstUnsolvedTask } from "../src/tasks/state";

const auth = vi.hoisted(() => ({ authenticated: false }));
vi.mock("../src/authClient", () => ({
  isAuthenticated: () => auth.authenticated,
}));

function setProgress(map: Record<string, boolean>) {
  localStorage.setItem(
    "task_progress_v1",
    JSON.stringify(
      Object.fromEntries(
        Object.entries(map).map(([id, solved]) => [id, { solved, stars: 3 }]),
      ),
    ),
  );
}

describe("getEntryTask", () => {
  beforeEach(() => {
    localStorage.clear();
    auth.authenticated = false;
  });

  it("гость без прогресса открывается с первой задачи уровня", () => {
    expect(getEntryTask("basic")).toBe("hello_world");
    expect(getEntryTask("fixbugs")).toBe("fb_join");
    expect(getEntryTask("advanced")).toBe("a1_number_analyzer");
  });

  it("гость с решёнными задачами всё равно открывается с первой", () => {
    setProgress({ hello_world: true, add_2_7: true });
    expect(getEntryTask("basic")).toBe("hello_world");
  });

  it("авторизованный продолжается с первой нерешённой", () => {
    setProgress({ hello_world: true, add_2_7: true });
    auth.authenticated = true;
    expect(getEntryTask("basic")).toBe("var_my_age");
  });

  it("авторизованный с полным уровнем остаётся на последней задаче", () => {
    auth.authenticated = true;
    setProgress({ fb_join: true, fb_area: true });
    expect(getFirstUnsolvedTask("fixbugs")).toBe("fb_parity");
    setProgress({
      fb_join: true,
      fb_area: true,
      fb_parity: true,
      fb_loop: true,
      fb_list: true,
      fb_double: true,
      fb_input: true,
    });
    expect(getEntryTask("fixbugs")).toBe("fb_input");
  });
});
