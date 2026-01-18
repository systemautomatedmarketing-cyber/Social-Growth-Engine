import { readSheetAsObjects } from "./googleSheets.js";

function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function normalizeTask(o) {
  return {
    day: toInt(o.day),
    task_id: o.task_id,
    task_order: toInt(o.task_order),
    task_type: o.task_type,
    title: o.title,
    instructions: o.instructions,
    estimated_time: toInt(o.estimated_time),

    platform: o.platform,
    product_type: o.product_type,
    goal: o.goal,
    time_mode: String(o.time_mode || ""),
    level: o.level,

    kpi_name: o.kpi_name,
    kpi_target: toInt(o.kpi_target),
    fallback_task_id: o.fallback_task_id || null,
    critical_task: o.critical_task,

    ai_support_available: o.ai_support_available,
    ai_feature_id: o.ai_feature_id || "NONE",
    ai_feature_label: o.ai_feature_label || "",
    ai_prompt_template: o.ai_prompt_template || "",
    ai_variables: o.ai_variables || "",
    ai_output_type: o.ai_output_type || "",
    ai_complexity: o.ai_complexity || "",

    pro_only: o.pro_only,
    credits_cost: toInt(o.credits_cost),
    unlock_type: o.unlock_type,
    ai_visible_trigger: o.ai_visible_trigger,
  };
}

function matchesPlatform(taskPlatform, userPlatform) {
  if (taskPlatform === "BOTH") return true;
  if (userPlatform === "BOTH") return true;
  return taskPlatform === userPlatform;
}
function matches(field, userValue) {
  if (!field || field === "ALL") return true;
  return field === userValue;
}

export async function getTasksForDay({ program, day, user }) {
  const raw = await readSheetAsObjects(program, 300);
  const tasks = raw.map(normalizeTask);

  return tasks
    .filter((t) => t.day === day)
    .filter((t) => matchesPlatform(t.platform, user.platform))
    .filter((t) => t.product_type === "ALL" || matches(t.product_type, user.product_type))
    .filter((t) => matches(t.goal, user.goal))
    .filter((t) => String(t.time_mode) === String(user.time_mode))
    .filter((t) => t.level === user.level || t.level === "ALL")
    .sort((a, b) => a.task_order - b.task_order);
}
