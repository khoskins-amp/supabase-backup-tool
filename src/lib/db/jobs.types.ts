import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { jobs } from "./jobs.schema";

// Base types inferred from schema
export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;

// Schedule types
export type ScheduleType = "manual" | "interval" | "cron";
export type JobStatus = "success" | "failed" | "skipped";

// Derived types for API and UI
export type JobWithProject = Job & {
  project: {
    id: string;
    name: string;
    supabaseUrl: string;
  };
};

export type JobSummary = Pick<Job, 
  | "id" 
  | "name" 
  | "scheduleType"
  | "isActive"
  | "lastRunAt"
  | "nextRunAt"
  | "lastStatus"
  | "totalRuns"
  | "successfulRuns"
  | "failedRuns"
  | "createdAt"
>;

export type JobExecution = {
  jobId: string;
  executionId: string;
  status: "running" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  backupId?: string;
  error?: string;
  logs: string[];
};

// Form types
export type JobFormData = Omit<NewJob, 
  | "id" 
  | "lastRunAt"
  | "nextRunAt"
  | "lastStatus"
  | "lastErrorMessage"
  | "totalRuns"
  | "successfulRuns"
  | "failedRuns"
  | "createdAt" 
  | "updatedAt"
>;

export type JobUpdateData = Partial<Pick<Job,
  | "name"
  | "description"
  | "isActive"
  | "scheduleType"
  | "cronExpression"
  | "intervalMinutes"
  | "backupName"
  | "includeAuth"
  | "includeStorage"
  | "includeDatabase"
  | "includeEdgeFunctions"
  | "retentionDays"
  | "maxBackupsToKeep"
  | "timeoutMinutes"
  | "retryAttempts"
  | "retryDelayMinutes"
>>;

// Schedule configuration
export type JobScheduleConfig = {
  type: ScheduleType;
  cronExpression?: string;
  intervalMinutes?: number;
  timezone?: string;
};

// Job configuration for backup
export type JobBackupConfig = Pick<Job,
  | "backupName"
  | "includeAuth"
  | "includeStorage" 
  | "includeDatabase"
  | "includeEdgeFunctions"
>;

// Job execution settings
export type JobExecutionConfig = Pick<Job,
  | "timeoutMinutes"
  | "retryAttempts"
  | "retryDelayMinutes"
>;

// Statistics types
export type JobStats = {
  totalJobs: number;
  activeJobs: number;
  totalExecutions: number;
  successRate: number; // 0-100
  averageExecutionTime: number; // seconds
  nextScheduledRun?: Date;
};

// Cron helper types
export type CronPreset = {
  name: string;
  expression: string;
  description: string;
};

export const CRON_PRESETS: CronPreset[] = [
  { name: "Every hour", expression: "0 * * * *", description: "At minute 0 of every hour" },
  { name: "Daily at 2 AM", expression: "0 2 * * *", description: "At 2:00 AM every day" },
  { name: "Weekly on Sunday", expression: "0 2 * * 0", description: "At 2:00 AM every Sunday" },
  { name: "Monthly on 1st", expression: "0 2 1 * *", description: "At 2:00 AM on the 1st of every month" },
  { name: "Every 15 minutes", expression: "*/15 * * * *", description: "Every 15 minutes" },
  { name: "Twice daily", expression: "0 2,14 * * *", description: "At 2:00 AM and 2:00 PM every day" },
];

// Input types for API operations (matching validation schemas)
export type CreateJobInput = {
  name: string;
  description?: string;
  projectId: string;
  scheduleType?: "manual" | "interval" | "cron";
  cronExpression?: string;
  intervalMinutes?: number;
  backupName?: string;
  includeAuth?: boolean;
  includeStorage?: boolean;
  includeDatabase?: boolean;
  includeEdgeFunctions?: boolean;
  retentionDays?: number;
  maxBackupsToKeep?: number;
  timeoutMinutes?: number;
  retryAttempts?: number;
  retryDelayMinutes?: number;
};

export type UpdateJobInput = {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  scheduleType?: "manual" | "interval" | "cron";
  cronExpression?: string;
  intervalMinutes?: number;
  backupName?: string;
  includeAuth?: boolean;
  includeStorage?: boolean;
  includeDatabase?: boolean;
  includeEdgeFunctions?: boolean;
  retentionDays?: number;
  maxBackupsToKeep?: number;
  timeoutMinutes?: number;
  retryAttempts?: number;
  retryDelayMinutes?: number;
};

export type JobExecutionInput = {
  jobId: string;
  executionId?: string;
  runNow?: boolean;
  skipScheduleUpdate?: boolean;
};

export type JobFilterInput = {
  projectId?: string;
  isActive?: boolean;
  scheduleType?: "manual" | "interval" | "cron";
  lastStatus?: "success" | "failed" | "skipped";
  search?: string;
  sortBy?: "name" | "createdAt" | "lastRunAt" | "nextRunAt" | "totalRuns";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}; 