import { z } from 'zod';
import { insertUserSchema, insertKpiEntrySchema, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
  },
  onboarding: {
    update: {
      method: 'POST' as const,
      path: '/api/onboarding',
      input: z.object({
        platform: z.array(z.string()),
        productType: z.array(z.string()),
        goal: z.array(z.string()),
        timeMode: z.number(),
        level: z.string(),
        target: z.string(),
        tone: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
  },
  tasks: {
    today: {
      method: 'GET' as const,
      path: '/api/tasks/today',
      responses: {
        200: z.object({
          day: z.number(),
          program: z.string(),
          tasks: z.array(z.any()), // Typed as Task[] in frontend
          isComplete: z.boolean(),
        }),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/tasks/:taskId/status',
      input: z.object({
        status: z.enum(['Pending', 'Done', 'Skipped', 'Deferred']),
        day: z.number(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    completeDay: {
      method: 'POST' as const,
      path: '/api/tasks/complete-day',
      responses: {
        200: z.object({
          newDay: z.number(),
          newProgram: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  kpi: {
    submit: {
      method: 'POST' as const,
      path: '/api/kpi',
      input: insertKpiEntrySchema.omit({ userId: true, programId: true }),
      responses: {
        201: z.any(),
      },
    },
  },
  credits: {
    redeem: {
      method: 'POST' as const,
      path: '/api/credits/redeem',
      input: z.object({ code: z.string() }),
      responses: {
        200: z.object({
          success: z.boolean(),
          creditsAdded: z.number(),
          newBalance: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  ai: {
    generate: {
      method: 'POST' as const,
      path: '/api/ai/generate',
      input: z.object({
        taskId: z.string(),
        variables: z.record(z.string()),
      }),
      responses: {
        200: z.object({
          output: z.string(),
          creditsDeducted: z.number(),
        }),
        403: errorSchemas.forbidden,
      },
    },
  },
  pro: {
    upgrade: {
      method: 'POST' as const,
      path: '/api/pro/upgrade',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
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
