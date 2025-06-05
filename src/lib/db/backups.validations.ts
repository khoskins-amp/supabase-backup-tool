import { z } from 'zod';

// Manual validation schemas for backups (avoiding drizzle-zod compatibility issues)

// Base backup validation schema
export const createBackupSchema = z.object({
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long"),
  description: z.string().max(500, "Description too long").optional(),
  type: z.enum(["manual", "scheduled", "pre-migration"]).default("manual"),
  projectId: z.string().min(1, "Project ID is required"),
  
  // Backup options
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
});

// Update backup schema (all fields optional except ID)
export const updateBackupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long").optional(),
  description: z.string().max(500, "Description too long").nullish(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).optional(),
  filePath: z.string().nullish(),
  fileName: z.string().nullish(),
  fileSize: z.number().int().min(0).nullish(),
  checksum: z.string().nullish(),
  duration: z.number().int().min(0).nullish(),
  errorMessage: z.string().nullish(),
  retryCount: z.number().int().min(0).default(0).optional(),
  expiresAt: z.date().nullish(),
  isArchived: z.boolean().default(false).optional(),
});

// Backup filter schema for queries
export const backupFilterSchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]).optional(),
  type: z.enum(["manual", "scheduled", "pre-migration"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["createdAt", "updatedAt", "name", "fileSize"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Start backup schema for manual backups
export const startBackupSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long"),
  description: z.string().max(500, "Description too long").optional(),
  type: z.enum(["manual", "scheduled", "pre-migration"]).default("manual"),
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
});

// Type exports
export type CreateBackupInput = z.infer<typeof createBackupSchema>;
export type UpdateBackupInput = z.infer<typeof updateBackupSchema>;
export type BackupFilterInput = z.infer<typeof backupFilterSchema>;
export type StartBackupInput = z.infer<typeof startBackupSchema>;

// Backup configuration schema
export const backupConfigSchema = z.object({
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
});

// Backup restore schema
export const backupRestoreSchema = z.object({
  backupId: z.string().uuid(),
  targetProjectId: z.string().uuid().optional(),
  restoreAuth: z.boolean().default(true),
  restoreStorage: z.boolean().default(true),
  restoreDatabase: z.boolean().default(true),
  restoreEdgeFunctions: z.boolean().default(false),
  overwriteExisting: z.boolean().default(false),
});

// Additional type exports
export type BackupConfigInput = z.infer<typeof backupConfigSchema>;
export type BackupRestoreInput = z.infer<typeof backupRestoreSchema>; 