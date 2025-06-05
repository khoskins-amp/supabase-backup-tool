import { pgTable, text, integer, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";
import { projects } from "./projects.schema";

export const jobs = pgTable("jobs", {
  // Use PostgreSQL native UUID with auto-generation
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  
  // Job configuration
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Schedule configuration (cron-like)
  scheduleType: text("schedule_type").$type<"manual" | "interval" | "cron">().notNull().default("manual"),
  cronExpression: text("cron_expression"), // e.g., "0 2 * * *" for daily at 2 AM
  intervalMinutes: integer("interval_minutes"), // Alternative to cron for simple intervals
  
  // Backup configuration
  backupName: text("backup_name"), // Template for backup names
  includeAuth: boolean("include_auth").notNull().default(true),
  includeStorage: boolean("include_storage").notNull().default(true),
  includeDatabase: boolean("include_database").notNull().default(true),
  includeEdgeFunctions: boolean("include_edge_functions").notNull().default(false),
  
  // Job execution tracking
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  lastStatus: text("last_status").$type<"success" | "failed" | "skipped">(),
  lastErrorMessage: text("last_error_message"),
  
  // Statistics
  totalRuns: integer("total_runs").notNull().default(0),
  successfulRuns: integer("successful_runs").notNull().default(0),
  failedRuns: integer("failed_runs").notNull().default(0),
  
  // Retention policy
  retentionDays: integer("retention_days").notNull().default(30),
  maxBackupsToKeep: integer("max_backups_to_keep").notNull().default(10),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Job settings
  timeoutMinutes: integer("timeout_minutes").notNull().default(60), // Max time for job execution
  retryAttempts: integer("retry_attempts").notNull().default(3),
  retryDelayMinutes: integer("retry_delay_minutes").notNull().default(5),
}, (table) => ({
  // Indexes for performance
  projectIdIdx: index("jobs_project_id_idx").on(table.projectId),
  isActiveIdx: index("jobs_is_active_idx").on(table.isActive),
  scheduleTypeIdx: index("jobs_schedule_type_idx").on(table.scheduleType),
  nextRunAtIdx: index("jobs_next_run_at_idx").on(table.nextRunAt),
  lastRunAtIdx: index("jobs_last_run_at_idx").on(table.lastRunAt),
  lastStatusIdx: index("jobs_last_status_idx").on(table.lastStatus),
  createdAtIdx: index("jobs_created_at_idx").on(table.createdAt),
  
  // Composite indexes for common queries
  projectActiveIdx: index("jobs_project_active_idx").on(table.projectId, table.isActive),
  activeScheduleIdx: index("jobs_active_schedule_idx").on(table.isActive, table.scheduleType),
  projectScheduleIdx: index("jobs_project_schedule_idx").on(table.projectId, table.scheduleType),
  activeNextRunIdx: index("jobs_active_next_run_idx").on(table.isActive, table.nextRunAt),
  projectStatusIdx: index("jobs_project_status_idx").on(table.projectId, table.lastStatus),
})); 