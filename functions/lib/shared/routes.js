"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.errorSchemas = void 0;
exports.buildUrl = buildUrl;
const zod_1 = require("zod");
const schema_1 = require("./schema");
exports.errorSchemas = {
    validation: zod_1.z.object({
        message: zod_1.z.string(),
        field: zod_1.z.string().optional(),
    }),
    notFound: zod_1.z.object({
        message: zod_1.z.string(),
    }),
    internal: zod_1.z.object({
        message: zod_1.z.string(),
    }),
    forbidden: zod_1.z.object({
        message: zod_1.z.string(),
    }),
};
exports.api = {
    auth: {
        register: {
            method: 'POST',
            path: '/api/register',
            input: schema_1.insertUserSchema,
            responses: {
                201: zod_1.z.custom(),
                400: exports.errorSchemas.validation,
            },
        },
        login: {
            method: 'POST',
            path: '/api/login',
            input: zod_1.z.object({
                username: zod_1.z.string(),
                password: zod_1.z.string(),
            }),
            responses: {
                200: zod_1.z.custom(),
                401: exports.errorSchemas.validation,
            },
        },
        logout: {
            method: 'POST',
            path: '/api/logout',
            responses: {
                200: zod_1.z.void(),
            },
        },
        user: {
            method: 'GET',
            path: '/api/user',
            responses: {
                200: zod_1.z.custom(),
                401: zod_1.z.null(),
            },
        },
    },
    onboarding: {
        update: {
            method: 'POST',
            path: '/api/onboarding',
            input: zod_1.z.object({
                platform: zod_1.z.array(zod_1.z.string()),
                productType: zod_1.z.array(zod_1.z.string()),
                goal: zod_1.z.array(zod_1.z.string()),
                timeMode: zod_1.z.number(),
                level: zod_1.z.string(),
                target: zod_1.z.string(),
                tone: zod_1.z.string(),
            }),
            responses: {
                200: zod_1.z.custom(),
            },
        },
    },
    tasks: {
        today: {
            method: 'GET',
            path: '/api/tasks/today',
            responses: {
                200: zod_1.z.object({
                    day: zod_1.z.number(),
                    program: zod_1.z.string(),
                    tasks: zod_1.z.array(zod_1.z.any()), // Typed as Task[] in frontend
                    isComplete: zod_1.z.boolean(),
                }),
            },
        },
        updateStatus: {
            method: 'PATCH',
            path: '/api/tasks/:taskId/status',
            input: zod_1.z.object({
                status: zod_1.z.enum(['Pending', 'Done', 'Skipped', 'Deferred']),
                day: zod_1.z.number(),
            }),
            responses: {
                200: zod_1.z.object({ success: zod_1.z.boolean() }),
            },
        },
        completeDay: {
            method: 'POST',
            path: '/api/tasks/complete-day',
            responses: {
                200: zod_1.z.object({
                    newDay: zod_1.z.number(),
                    newProgram: zod_1.z.string(),
                }),
                400: exports.errorSchemas.validation,
            },
        },
    },
    kpi: {
        submit: {
            method: 'POST',
            path: '/api/kpi',
            input: schema_1.insertKpiEntrySchema.omit({ userId: true, programId: true }),
            responses: {
                201: zod_1.z.any(),
            },
        },
    },
    credits: {
        redeem: {
            method: 'POST',
            path: '/api/credits/redeem',
            input: zod_1.z.object({ code: zod_1.z.string() }),
            responses: {
                200: zod_1.z.object({
                    success: zod_1.z.boolean(),
                    creditsAdded: zod_1.z.number(),
                    newBalance: zod_1.z.number(),
                }),
                400: exports.errorSchemas.validation,
            },
        },
    },
    ai: {
        generate: {
            method: 'POST',
            path: '/api/ai/generate',
            input: zod_1.z.object({
                taskId: zod_1.z.string(),
                variables: zod_1.z.record(zod_1.z.string()),
            }),
            responses: {
                200: zod_1.z.object({
                    output: zod_1.z.string(),
                    creditsDeducted: zod_1.z.number(),
                }),
                403: exports.errorSchemas.forbidden,
            },
        },
    },
    pro: {
        upgrade: {
            method: 'POST',
            path: '/api/pro/upgrade',
            responses: {
                200: zod_1.z.custom(),
            },
        },
    },
};
function buildUrl(path, params) {
    let url = path;
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (url.includes(`:${key}`)) {
                url = url.replace(`:${key}`, String(value));
            }
        });
    }
    return url;
}
