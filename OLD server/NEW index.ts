import express from "express";
import "dotenv/config";
import { getTasksForDay } from "./tasks.js";

const app = express();
app.use(express.json());

// DEBUG endpoint
app.get("/api/debug/tasks", async (req, res) => {
  try {
    const program = req.query.program || "TASKS_30D";
    const day = parseInt(req.query.day || "1", 10);

    // mock onboarding
    const user = {
      platform: "BOTH",
      product_type: "ALL",
      goal: "ALL",
      time_mode: "30",
      level: "BEGINNER",
    };

    const tasks = await getTasksForDay({ program, day, user });
    res.json({ program, day, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
