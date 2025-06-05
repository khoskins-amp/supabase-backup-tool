import { z } from "zod";

// Cron validation helper
const cronRegex = /^(\*|[0-5]?\d) (\*|[01]?\d|2[0-3]) (\*|[0-2]?\d|3[01]) (\*|[0-9]|1[0-2]) (\*|[0-6])$/;

// Enhanced validation schemas with custom rules
export const createJobSchema = z.object({
  name: z.string().min(1, "Job name is required").max(100, "Job name too long"),
  description: z.string().max(500, "Description too long").optional(),
  projectId: z.string().min(1, "Project ID is required"),
  scheduleType: z.enum(["manual", "interval", "cron"]).default("manual"),
  cronExpression: z
    .string()
    .regex(cronRegex, "Invalid cron expression format")
    .optional(),
  intervalMinutes: z
    .number()
    .int()
    .min(1, "Interval must be at least 1 minute")
    .max(10080, "Interval cannot exceed 1 week") // 7 days * 24 hours * 60 minutes
    .optional(),
  backupName: z.string().max(100, "Backup name template too long").optional(),
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
  retentionDays: z
    .number()
    .int()
    .min(1, "Must retain backups for at least 1 day")
    .max(365, "Maximum retention is 365 days")
    .default(30),
  maxBackupsToKeep: z
    .number()
    .int()
    .min(1, "Must keep at least 1 backup")
    .max(100, "Cannot keep more than 100 backups")
    .default(10),
  timeoutMinutes: z
    .number()
    .int()
    .min(1, "Timeout must be at least 1 minute")
    .max(1440, "Timeout cannot exceed 24 hours")
    .default(60),
  retryAttempts: z
    .number()
    .int()
    .min(0, "Retry attempts cannot be negative")
    .max(10, "Cannot retry more than 10 times")
    .default(3),
  retryDelayMinutes: z
    .number()
    .int()
    .min(1, "Retry delay must be at least 1 minute")
    .max(60, "Retry delay cannot exceed 1 hour")
    .default(5),
}).refine(
  (data) => {
    if (data.scheduleType === "cron") {
      return !!data.cronExpression;
    }
    if (data.scheduleType === "interval") {
      return !!data.intervalMinutes;
    }
    return true;
  },
  {
    message: "Cron expression required for cron schedule, interval required for interval schedule",
    path: ["scheduleType"],
  }
);

export const updateJobSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Job name is required").max(100, "Job name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  isActive: z.boolean().optional(),
  scheduleType: z.enum(["manual", "interval", "cron"]).optional(),
  cronExpression: z
    .string()
    .regex(cronRegex, "Invalid cron expression format")
    .optional(),
  intervalMinutes: z
    .number()
    .int()
    .min(1, "Interval must be at least 1 minute")
    .max(10080, "Interval cannot exceed 1 week")
    .optional(),
  backupName: z.string().max(100, "Backup name template too long").optional(),
  includeAuth: z.boolean().optional(),
  includeStorage: z.boolean().optional(),
  includeDatabase: z.boolean().optional(),
  includeEdgeFunctions: z.boolean().optional(),
  retentionDays: z
    .number()
    .int()
    .min(1, "Must retain backups for at least 1 day")
    .max(365, "Maximum retention is 365 days")
    .optional(),
  maxBackupsToKeep: z
    .number()
    .int()
    .min(1, "Must keep at least 1 backup")
    .max(100, "Cannot keep more than 100 backups")
    .optional(),
  timeoutMinutes: z
    .number()
    .int()
    .min(1, "Timeout must be at least 1 minute")
    .max(1440, "Timeout cannot exceed 24 hours")
    .optional(),
  retryAttempts: z
    .number()
    .int()
    .min(0, "Retry attempts cannot be negative")
    .max(10, "Cannot retry more than 10 times")
    .optional(),
  retryDelayMinutes: z
    .number()
    .int()
    .min(1, "Retry delay must be at least 1 minute")
    .max(60, "Retry delay cannot exceed 1 hour")
    .optional(),
});

// Job execution schema
export const jobExecutionSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  executionId: z.string().optional(),
  runNow: z.boolean().default(false),
  skipScheduleUpdate: z.boolean().default(false),
});

// Job filter schema
export const jobFilterSchema = z.object({
  projectId: z.string().optional(),
  isActive: z.boolean().optional(),
  scheduleType: z.enum(["manual", "interval", "cron"]).optional(),
  lastStatus: z.enum(["success", "failed", "skipped"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "lastRunAt", "nextRunAt", "totalRuns"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

// Cron expression validation schema
export const cronExpressionSchema = z.object({
  expression: z.string().regex(cronRegex, "Invalid cron expression format"),
  timezone: z.string().optional(),
});

// Job schedule test schema
export const jobScheduleTestSchema = z.object({
  scheduleType: z.enum(["interval", "cron"]),
  cronExpression: z.string().regex(cronRegex, "Invalid cron expression format").optional(),
  intervalMinutes: z.number().int().min(1).max(10080).optional(),
  count: z.number().int().min(1).max(20).default(5), // Number of next run times to calculate
}).refine(
  (data) => {
    if (data.scheduleType === "cron") {
      return !!data.cronExpression;
    }
    if (data.scheduleType === "interval") {
      return !!data.intervalMinutes;
    }
    return true;
  },
  {
    message: "Cron expression required for cron schedule, interval required for interval schedule",
    path: ["scheduleType"],
  }
);

// Job statistics schema
export const jobStatsSchema = z.object({
  projectId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
});

// Type exports
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobExecutionInput = z.infer<typeof jobExecutionSchema>;
export type JobFilterInput = z.infer<typeof jobFilterSchema>;
export type CronExpressionInput = z.infer<typeof cronExpressionSchema>;
export type JobScheduleTestInput = z.infer<typeof jobScheduleTestSchema>;
export type JobStatsInput = z.infer<typeof jobStatsSchema>; 