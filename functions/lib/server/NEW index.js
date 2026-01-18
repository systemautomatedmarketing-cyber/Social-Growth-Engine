"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const tasks_js_1 = require("./tasks.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
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
        const tasks = await (0, tasks_js_1.getTasksForDay)({ program, day, user });
        res.json({ program, day, count: tasks.length, tasks });
    }
    catch (err) {
        res.status(500).json({ error: err.message || String(err) });
    }
});
exports.default = app;
