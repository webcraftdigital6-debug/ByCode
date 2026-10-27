// Типы и контракты реестра обучающих задач.
import * as Blockly from "blockly";
import type { GlossaryTopicId } from "../ui/glossary";

export type InitTaskValidationOptions = {
  checkButton: HTMLButtonElement | null;
  feedbackEl: HTMLDivElement | null;
  starsEl: HTMLDivElement | null;
  // Кнопка перехода к следующей задаче (опционально)
  nextButton?: HTMLButtonElement | null;
  // Кнопка перехода к предыдущей задаче (опционально)
  prevButton?: HTMLButtonElement | null;
};

export type ValidationResult = { ok: boolean; stars: number };

export type TaskId =
  | "hello_world"
  | "add_2_7"
  | "var_my_age"
  | "calc_sum"
  | "greet_concat"
  | "inc_counter"
  | "discount_calc"
  | "even_or_odd"
  | "time_of_day"
  | "first_loop"
  | "sum_1_to_n"
  | "guess_game"
  | "list_foreach"
  | "sublist_foreach"
  | "list_filter_even"
  | "list_filter_even_min_max"
  | "list_filter_even_avg"
  | "list_filter_even_median"
  | "list_sum_even_positions"
  | "list_sort_min_max"
  | "list_inventory_index"
  | "list_inventory_replace"
  | "list_inventory_add"
  | "list_inventory_remove"
  | "list_inventory_random"
  | "proj_inventory"
  | "mult_table"
  | "first_even_break"
  | "in_greet"
  | "in_two_numbers"
  | "in_adult_gate"
  | "in_count_to_n"
  | "in_times_table"
  | "first_function"
  | "function_with_param"
  | "function_return"
  | "first_condition"
  | "dice_rolls"
  | "chatterbox"
  | "loop_while_count"
  | "loop_while_input"
  | "list_until_empty"
  | "list_grid"
  | "function_predicate"
  | "proj_treasure_hunt"
  | "str_length"
  | "str_charat"
  | "str_echo"
  | "str_substring"
  | "str_clean"
  | "str_indexof"
  | "str_count"
  | "str_replace"
  | "logic_and_or_not"
  | "logic_gate_check"
  | "logic_ternary_task"
  | "math_functions"
  | "math_round_clamp"
  | "list_split_join"
  | "list_operations"
  | "a1_number_analyzer"
  | "sum_array"
  | "min_max"
  | "char_freq"
  | "fb_area"
  | "fb_join"
  | "fb_parity"
  | "fb_loop"
  | "fb_list"
  | "fb_double"
  | "fb_input";

export type TaskDifficulty = "basic" | "fixbugs" | "advanced";

// «build» — собрать программу с нуля; «fix» — дана готовая программа
// с ошибкой (starterXml), её нужно найти и исправить.
export type TaskKind = "build" | "fix";

export type TaskDef = {
  id: TaskId;
  difficulty: TaskDifficulty;
  // По умолчанию «build»
  kind?: TaskKind;
  // XML «сломанной» программы для kind="fix"
  starterXml?: string;
  // Темы справочника, показываемые под условием задачи (ui/glossary.ts)
  infoTopics?: readonly GlossaryTopicId[];
  title: (lang: "ru" | "en") => string;
  description: (lang: "ru" | "en") => string; // может содержать HTML
  hint: (lang: "ru" | "en") => string;
  validate: (
    ws: Blockly.WorkspaceSvg,
    outputLines: string[],
    lang?: "ru" | "en"
  ) => Promise<ValidationResult>;
};

export type TaskRegistry = Record<TaskId, TaskDef>;
