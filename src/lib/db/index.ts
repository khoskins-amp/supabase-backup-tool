// Database client
export { db, type Database } from "./client";

// Schemas
export * from "./projects.schema";
export * from "./backups.schema";
export * from "./jobs.schema";

// Relations
export * from "./relations";

// Types
export * from "./projects.types";
export * from "./backups.types";
export * from "./jobs.types";

// Validations
export * from "./projects.validations";
export * from "./backups.validations";
export * from "./jobs.validations";

// Re-export commonly used types for convenience
export type {
  // Project types
  Project,
  NewProject,
  ProjectFormData,
  ProjectUpdateData,
  ProjectWithStats,
  ProjectSummary,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectConnectionInput,
  ProjectFilterInput,
} from "./projects.types";

export type {
  // Backup types
  Backup,
  NewBackup,
  BackupFormData,
  BackupUpdateData,
  BackupWithProject,
  BackupSummary,
  BackupProgress,
  BackupConfig,
  BackupStats,
  CreateBackupInput,
  UpdateBackupInput,
  BackupConfigInput,
  BackupFilterInput,
  BackupRestoreInput,
} from "./backups.types";

export type {
  // Job types
  Job,
  NewJob,
  JobFormData,
  JobUpdateData,
  JobWithProject,
  JobSummary,
  JobExecution,
  JobScheduleConfig,
  JobBackupConfig,
  JobExecutionConfig,
  JobStats,
  CreateJobInput,
  UpdateJobInput,
  JobExecutionInput,
  JobFilterInput,
} from "./jobs.types";

// Re-export commonly used validation schemas
export {
  // Project schemas
  createProjectSchema,
  updateProjectSchema,
  projectConnectionSchema,
  projectFilterSchema,
} from "./projects.validations";

export {
  // Backup schemas
  createBackupSchema,
  updateBackupSchema,
  backupConfigSchema,
  backupFilterSchema,
  backupRestoreSchema,
} from "./backups.validations";

export {
  // Job schemas
  createJobSchema,
  updateJobSchema,
  jobExecutionSchema,
  jobFilterSchema,
  cronExpressionSchema,
  jobScheduleTestSchema,
} from "./jobs.validations";

// Database table references (for direct queries)
export { projects } from "./projects.schema";
export { backups } from "./backups.schema";
export { jobs } from "./jobs.schema";

// Helper constants
export { CRON_PRESETS } from "./jobs.types"; 