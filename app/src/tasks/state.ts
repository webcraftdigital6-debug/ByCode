// Состояние: активная задача/сложность, прогресс, навигация по порядку.
import { isAuthenticated } from "../authClient";
import { reportSolved } from "../progressSync";
import { tasks } from "./registry";
import type { TaskDifficulty, TaskId } from "./types";

let activeTaskId: TaskId = "hello_world";

let activeDifficulty: TaskDifficulty = "basic";

export const FREE_TASK_NAV = true;

// Порядок задач для последовательного прохождения.
// Номера в заголовках задач («Задача N») соответствуют позиции в этом
// массиве: менять порядок можно только вместе с перенумерацией заголовков.
const TASKS_ORDER_BY_DIFFICULTY: Record<TaskDifficulty, TaskId[]> = {
  basic: [
    "hello_world",
    "add_2_7",
    "var_my_age",
    "calc_sum",
    "greet_concat",
    "inc_counter",
    "discount_calc",
    "math_round_clamp",
    "math_functions",
    "first_condition",
    "even_or_odd",
    "logic_and_or_not",
    "logic_gate_check",
    "logic_ternary_task",
    "time_of_day",
    "first_loop",
    "dice_rolls",
    "sum_1_to_n",
    "mult_table",
    "in_greet",
    "in_two_numbers",
    "in_adult_gate",
    "in_count_to_n",
    "in_times_table",
    "chatterbox",
    "loop_while_count",
    "loop_while_input",
    "list_inventory_index",
    "list_inventory_replace",
    "list_inventory_add",
    "list_inventory_remove",
    "list_inventory_random",
    "list_until_empty",
    "list_foreach",
    "sublist_foreach",
    "list_filter_even",
    "list_filter_even_min_max",
    "list_sort_min_max",
    "list_filter_even_avg",
    "list_filter_even_median",
    "list_sum_even_positions",
    "list_grid",
    "first_even_break",
    "first_function",
    "function_with_param",
    "function_return",
    "function_predicate",
    "str_length",
    "str_charat",
    "str_echo",
    "str_substring",
    "str_clean",
    "str_indexof",
    "str_count",
    "str_replace",
    "list_split_join",
    "list_operations",
    "guess_game",
    "proj_treasure_hunt",
    "proj_inventory",
  ],
  fixbugs: [
    "fb_join",
    "fb_area",
    "fb_parity",
    "fb_loop",
    "fb_list",
    "fb_double",
    "fb_input",
  ],
  advanced: ["a1_number_analyzer", "sum_array", "min_max", "char_freq"],
};
const PROGRESS_KEY = "task_progress_v1";

type Progress = Partial<Record<TaskId, { solved: boolean; stars: number }>>;

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Progress;
  } catch {
    return {};
  }
}

export function markSolved(taskId: TaskId, stars: number) {
  // localStorage пишет progressSync (вместе с отправкой на сервер)
  reportSolved(taskId, stars);
}

export function isSolved(taskId: TaskId): boolean {
  const p = loadProgress();
  return !!p[taskId]?.solved;
}

export function getActiveDifficulty(): TaskDifficulty {
  return activeDifficulty;
}

/**
 * Порядок прохождения уровня. Номер в заголовке задачи («Задача N») равен её
 * позиции в этом массиве, поэтому перестановка требует перенумерации заголовков.
 */
export function getTaskOrder(difficulty: TaskDifficulty): TaskId[] {
  return [...(TASKS_ORDER_BY_DIFFICULTY[difficulty] || [])];
}

export function setActiveDifficulty(difficulty: TaskDifficulty) {
  activeDifficulty = difficulty;
}

export function getFirstUnsolvedTask(difficulty: TaskDifficulty = activeDifficulty): TaskId {
  const p = loadProgress();
  const order = TASKS_ORDER_BY_DIFFICULTY[difficulty] || [];
  for (const id of order) {
    if (!p[id]?.solved) return id;
  }
  return order[order.length - 1] || "hello_world";
}

/**
 * Задача, с которой открывается уровень: гость всегда начинает с первой,
 * авторизованный продолжает на первой нерешённой.
 */
export function getEntryTask(difficulty: TaskDifficulty = activeDifficulty): TaskId {
  if (isAuthenticated()) return getFirstUnsolvedTask(difficulty);
  return TASKS_ORDER_BY_DIFFICULTY[difficulty]?.[0] || "hello_world";
}

export function getNextTaskId(current: TaskId): TaskId | null {
  const order = TASKS_ORDER_BY_DIFFICULTY[tasks[current].difficulty] || [];
  const idx = order.indexOf(current);
  if (idx < 0) return null;
  return idx + 1 < order.length ? order[idx + 1] : null;
}

export function getPrevTaskId(current: TaskId): TaskId | null {
  const order = TASKS_ORDER_BY_DIFFICULTY[tasks[current].difficulty] || [];
  const idx = order.indexOf(current);
  if (idx < 0) return null;
  if (order.length === 0) return null;
  if (idx === 0) return order[order.length - 1] || null;
  return order[idx - 1] || null;
}

export function getActiveTask(): TaskId {
  return activeTaskId;
}

export function setActiveTaskId(taskId: TaskId): void {
  activeTaskId = taskId;
}
