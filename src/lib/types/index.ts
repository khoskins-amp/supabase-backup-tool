import { z } from 'zod';

// Supabase Project Configuration Schema
export const ProjectConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  supabaseUrl: z.string().url("Must be a valid URL"),
  anonKey: z.string().min(1, "Anonymous key is required"),
  serviceRoleKey: z.string().min(1, "Service role key is required"),
  databaseUrl: z.string().url("Must be a valid database URL"),
  projectRef: z.string().min(1, "Project reference is required"),
  region: z.string().optional(),
  plan: z.enum(['free', 'pro', 'team', 'enterprise']).default('free'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  isActive: z.boolean().default(true),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

// Backup Configuration Schema
export const BackupConfigSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1, "Backup name is required"),
  description: z.string().optional(),
  scheduleType: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
  scheduleTime: z.string().optional(), // HH:MM format
  scheduleDays: z.array(z.number().min(0).max(6)).optional(), // 0-6 for days of week
  retentionDays: z.number().min(1).max(365).default(30),
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type BackupConfig = z.infer<typeof BackupConfigSchema>;

// Backup Execution Schema
export const BackupExecutionSchema = z.object({
  id: z.string().uuid(),
  configId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(), // in bytes
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type BackupExecution = z.infer<typeof BackupExecutionSchema>;

// Backup File Schema
export const BackupFileSchema = z.object({
  id: z.string().uuid(),
  executionId: z.string().uuid(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  fileType: z.enum(['sql', 'tar', 'zip']),
  checksum: z.string().optional(),
  isEncrypted: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export type BackupFile = z.infer<typeof BackupFileSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Form Input Types for UI Components
export const CreateProjectInputSchema = ProjectConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const CreateBackupConfigInputSchema = BackupConfigSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBackupConfigInput = z.infer<typeof CreateBackupConfigInputSchema>;

// Supabase CLI Operations
export const SupabaseOperationSchema = z.object({
  operation: z.enum([
    'dump_schema',
    'dump_data', 
    'dump_all',
    'restore_schema',
    'restore_data',
    'restore_all',
    'list_migrations',
    'push_migrations',
    'pull_schema'
  ]),
  projectRef: z.string(),
  databaseUrl: z.string(),
  outputPath: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});

export type SupabaseOperation = z.infer<typeof SupabaseOperationSchema>;

// File System Operations
export const FileOperationSchema = z.object({
  operation: z.enum(['create', 'read', 'update', 'delete', 'list']),
  path: z.string(),
  content: z.string().optional(),
  encoding: z.enum(['utf8', 'base64']).default('utf8'),
});

export type FileOperation = z.infer<typeof FileOperationSchema>;

// Progress Tracking
export const ProgressUpdateSchema = z.object({
  executionId: z.string().uuid(),
  stage: z.string(),
  percentage: z.number().min(0).max(100),
  message: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;

// Export all schemas for validation
// export {
//   ProjectConfigSchema,
//   BackupConfigSchema,
//   BackupExecutionSchema,
//   BackupFileSchema,
//   ApiResponseSchema,
//   CreateProjectInputSchema,
//   CreateBackupConfigInputSchema,
//   SupabaseOperationSchema,
//   FileOperationSchema,
//   ProgressUpdateSchema,
// };