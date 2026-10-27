// Реестр всех задач: объединяет группы. Полнота покрытия TaskId
// проверяется компилятором: не хватится любой id — ошибка типов.
import type { TaskRegistry } from "./types";
import { outputTasks } from "./output";
import { variablesTasks } from "./variables";
import { conditionsTasks } from "./conditions";
import { loopsTasks } from "./loops";
import { listsTasks } from "./lists";
import { functionsTasks } from "./functions";
import { textTasks } from "./text";
import { mathTasks } from "./math";
import { userInputTasks } from "./userinput";
import { fixbugsTasks } from "./fixbugs";
import { advancedTasks } from "./advanced";

export const tasks: TaskRegistry = {
  ...outputTasks,
  ...variablesTasks,
  ...conditionsTasks,
  ...loopsTasks,
  ...listsTasks,
  ...functionsTasks,
  ...textTasks,
  ...mathTasks,
  ...userInputTasks,
  ...fixbugsTasks,
  ...advancedTasks,
};
