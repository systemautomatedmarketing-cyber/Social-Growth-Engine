"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertKpiEntrySchema = exports.insertUserTaskSchema = exports.insertUserSchema = exports.userTasksRelations = exports.userRelations = exports.aiUsages = exports.redeemCodeUses = exports.redeemCodes = exports.creditTransactions = exports.kpiEntries = exports.userTasks = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_zod_1 = require("drizzle-zod");
// === TABLE DEFINITIONS ===
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(), // email
    password: (0, pg_core_1.text)("password").notNull(),
    plan: (0, pg_core_1.text)("plan").default("FREE").notNull(), // FREE, PRO
    creditsBalance: (0, pg_core_1.integer)("credits_balance").default(0).notNull(),
    currentProgram: (0, pg_core_1.text)("current_program").default("TASKS_30D").notNull(), // TASKS_30D, TASKS_PRO_60
    currentDay: (0, pg_core_1.integer)("current_day").default(1).notNull(),
    onboarding: (0, pg_core_1.jsonb)("onboarding").$type(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.userTasks = (0, pg_core_1.pgTable)("user_tasks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    taskId: (0, pg_core_1.text)("task_id").notNull(),
    day: (0, pg_core_1.integer)("day").notNull(),
    programId: (0, pg_core_1.text)("program_id").notNull(),
    status: (0, pg_core_1.text)("status").notNull(), // Pending, Done, Skipped, Deferred
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.kpiEntries = (0, pg_core_1.pgTable)("kpi_entries", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    day: (0, pg_core_1.integer)("day").notNull(),
    programId: (0, pg_core_1.text)("program_id").notNull(),
    data: (0, pg_core_1.jsonb)("data").notNull().$type(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.creditTransactions = (0, pg_core_1.pgTable)("credit_transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    amount: (0, pg_core_1.integer)("amount").notNull(), // positive or negative
    type: (0, pg_core_1.text)("type").notNull(), // REDEEM, AI_USAGE, BONUS
    description: (0, pg_core_1.text)("description"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.redeemCodes = (0, pg_core_1.pgTable)("redeem_codes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    code: (0, pg_core_1.text)("code").notNull().unique(),
    credits: (0, pg_core_1.integer)("credits").notNull(),
    maxUses: (0, pg_core_1.integer)("max_uses").default(1).notNull(),
    usedCount: (0, pg_core_1.integer)("used_count").default(0).notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.redeemCodeUses = (0, pg_core_1.pgTable)("redeem_code_uses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    codeId: (0, pg_core_1.integer)("code_id").notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.aiUsages = (0, pg_core_1.pgTable)("ai_usages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    featureId: (0, pg_core_1.text)("feature_id"),
    inputData: (0, pg_core_1.jsonb)("input_data"),
    outputText: (0, pg_core_1.text)("output_text"),
    cost: (0, pg_core_1.integer)("cost").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// === RELATIONS ===
exports.userRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    tasks: many(exports.userTasks),
    kpiEntries: many(exports.kpiEntries),
    transactions: many(exports.creditTransactions),
    redeemUses: many(exports.redeemCodeUses),
    aiUsages: many(exports.aiUsages),
}));
exports.userTasksRelations = (0, drizzle_orm_1.relations)(exports.userTasks, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userTasks.userId],
        references: [exports.users.id],
    }),
}));
// === BASE SCHEMAS ===
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({ id: true, createdAt: true, creditsBalance: true, currentProgram: true, currentDay: true });
exports.insertUserTaskSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userTasks).omit({ id: true, createdAt: true, completedAt: true });
exports.insertKpiEntrySchema = (0, drizzle_zod_1.createInsertSchema)(exports.kpiEntries).omit({ id: true, createdAt: true });
