"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const auth_1 = require("./auth");
const storage_1 = require("./storage");
const routes_1 = require("@shared/routes");
const google_sheets_1 = require("./lib/google_sheets");
const openai_1 = require("./lib/openai");
const schema_1 = require("@shared/schema");
const db_1 = require("./db");
const schema_2 = require("@shared/schema");
async function seedDatabase() {
    const adminUser = await storage_1.storage.getUserByUsername("admin");
    if (!adminUser) {
        await storage_1.storage.createUser({
            username: "admin",
            password: "password123", // In production use hashed passwords
            plan: "PRO",
        });
        console.log("Seeded admin user");
    }
    // Seed redeem code
    const code = await storage_1.storage.getRedeemCode("WELCOME100");
    if (!code) {
        await db_1.db.insert(schema_2.redeemCodes).values({
            code: "WELCOME100",
            credits: 100,
            maxUses: 1000,
        });
        console.log("Seeded redeem code");
    }
}
async function registerRoutes(httpServer, app) {
    (0, auth_1.setupAuth)(app);
    // Run seed
    seedDatabase().catch(console.error);
    // Onboarding
    app.post(routes_1.api.onboarding.update.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const user = await storage_1.storage.updateUser(req.user.id, {
            onboarding: req.body,
            currentProgram: 'TASKS_30D',
            currentDay: 1,
        });
        res.json(user);
    });
    // Tasks
    app.get(routes_1.api.tasks.today.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const user = req.user;
        const programId = user.currentProgram;
        const day = user.currentDay;
        // Get tasks from sheet
        const sheetsData = await (0, google_sheets_1.getTasksFromSheets)();
        const allTasks = programId === 'TASKS_PRO_60' ? sheetsData.TASKS_PRO_60 : sheetsData.TASKS_30D;
        // Filter by day
        let dayTasks = allTasks.filter(t => t.day === day);
        // Filter by onboarding
        if (user.onboarding) {
            dayTasks = dayTasks.filter(t => {
                const p = t.platform; // IG/FB/BOTH
                const pt = t.product_type; // DIGITAL...
                // Basic filtering logic
                const userPlatform = user.onboarding?.platform || [];
                const userProduct = user.onboarding?.productType || [];
                const platformMatch = p === 'BOTH' || userPlatform.includes(p);
                const productMatch = pt === 'ALL' || userProduct.includes(pt);
                return platformMatch && productMatch;
            });
        }
        // Get user statuses
        const userTaskStatuses = await storage_1.storage.getUserTasks(user.id, day, programId);
        // Merge status
        const tasksWithStatus = dayTasks.map(t => {
            const statusEntry = userTaskStatuses.find(ut => ut.taskId === t.task_id);
            return { ...t, status: statusEntry?.status || 'Pending' };
        });
        // Deferred tasks from previous days? (Logic says deferred appear next day)
        // Complex logic: check tasks from previous day that were 'Deferred'?
        // Implementation: Query DB for Deferred tasks where day < currentDay
        // For MVP, just showing today's tasks.
        const isComplete = tasksWithStatus.every(t => ['Done', 'Skipped', 'Deferred'].includes(t.status));
        res.json({
            day,
            program: programId,
            tasks: tasksWithStatus,
            isComplete
        });
    });
    app.patch(routes_1.api.tasks.updateStatus.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const { status, day } = req.body;
        const taskId = req.params.taskId; // Fixed: taskId is in path
        // Upsert task
        const existing = await storage_1.storage.getUserTasks(req.user.id, day, req.user.currentProgram);
        const exists = existing.find(t => t.taskId === taskId);
        if (exists) {
            await storage_1.storage.updateUserTaskStatus(req.user.id, taskId, status);
        }
        else {
            await storage_1.storage.createUserTask({
                userId: req.user.id,
                taskId,
                day,
                programId: req.user.currentProgram,
                status,
                completedAt: status === 'Done' ? new Date() : null,
            });
        }
        res.json({ success: true });
    });
    app.post(routes_1.api.tasks.completeDay.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        // Verify completion...
        const nextDay = req.user.currentDay + 1;
        // Handle program switch if day > 30...
        await storage_1.storage.updateUser(req.user.id, { currentDay: nextDay });
        res.json({ newDay: nextDay, newProgram: req.user.currentProgram });
    });
    // KPI
    app.post(routes_1.api.kpi.submit.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const input = schema_1.insertKpiEntrySchema.omit({ userId: true, programId: true }).parse(req.body);
        const entry = await storage_1.storage.createKpiEntry({
            ...input,
            userId: req.user.id,
            programId: req.user.currentProgram,
        });
        res.status(201).json(entry);
    });
    // Credits
    app.post(routes_1.api.credits.redeem.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const { code } = req.body;
        const redeemCode = await storage_1.storage.getRedeemCode(code);
        if (!redeemCode)
            return res.status(400).json({ message: "Invalid code" });
        if (redeemCode.usedCount >= redeemCode.maxUses)
            return res.status(400).json({ message: "Code fully used" });
        // Check if user already used
        // (Implementation omitted for brevity in storage but logic should be there)
        await storage_1.storage.useRedeemCode(redeemCode.id, req.user.id);
        await storage_1.storage.createTransaction(req.user.id, redeemCode.credits, 'REDEEM', `Redeemed ${code}`);
        // Update user balance
        const user = await storage_1.storage.updateUser(req.user.id, {
            creditsBalance: req.user.creditsBalance + redeemCode.credits
        });
        res.json({ success: true, creditsAdded: redeemCode.credits, newBalance: user.creditsBalance });
    });
    // AI
    app.post(routes_1.api.ai.generate.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const { taskId, variables } = req.body;
        // Fetch task details to get prompt template (cached)
        const sheets = await (0, google_sheets_1.getTasksFromSheets)();
        const all = [...sheets.TASKS_30D, ...sheets.TASKS_PRO_60];
        const task = all.find(t => t.task_id === taskId);
        if (!task)
            return res.status(404).json({ message: "Task not found" });
        // Check credits
        const cost = parseInt(task.credits_cost || "0");
        const isPro = req.user.plan === 'PRO';
        if (!isPro && req.user.creditsBalance < cost) {
            return res.status(403).json({ message: "Crediti insufficienti. Gli utenti gratuiti devono ricaricare i crediti per utilizzare le funzioni AI." });
        }
        const output = await (0, openai_1.generateContent)(task.ai_prompt_template, variables);
        // Deduct credits only for non-PRO users
        if (!isPro && cost > 0) {
            await storage_1.storage.createTransaction(req.user.id, -cost, 'AI_USAGE', `AI for ${taskId}`);
            await storage_1.storage.updateUser(req.user.id, { creditsBalance: req.user.creditsBalance - cost });
        }
        // Log usage
        await storage_1.storage.logAiUsage(req.user.id, task.ai_feature_id, variables, output, isPro ? 0 : cost);
        res.json({ output, creditsDeducted: cost });
    });
    // PRO
    app.post(routes_1.api.pro.upgrade.path, async (req, res) => {
        if (!req.user)
            return res.sendStatus(401);
        const user = await storage_1.storage.updateUser(req.user.id, { plan: 'PRO' });
        res.json(user);
    });
    // Cron for daily reminders
    app.get('/api/cron/daily-reminder', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).send('Unauthorized');
        }
        // Logic to send emails
        // For MVP, just log
        console.log("Sending daily reminders...");
        // Fetch users with emails (username is email)
        // Send email via Resend
        // Not implemented fully for MVP to avoid complexity without real users
        res.send('Reminders sent');
    });
    return httpServer;
}
