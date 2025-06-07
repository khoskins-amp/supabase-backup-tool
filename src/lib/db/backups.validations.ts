import { z } from 'zod';

// Manual validation schemas for backups (avoiding drizzle-zod compatibility issues)

// Base enums for validation - CORRECTED naming for semantic clarity
const backupTypeEnum = z.enum(["full", "schema", "data", "incremental"]); // What is being backed up
const backupTriggerTypeEnum = z.enum(["manual", "scheduled", "pre-migration"]); // How backup was initiated
const compressionTypeEnum = z.enum(["none", "gzip", "bzip2"]);
const storageTypeEnum = z.enum(["browser_download", "s3", "google_drive", "nextcloud", "local_mapped"]);
const backupStatusEnum = z.enum(["pending", "in-progress", "completed", "failed", "cancelled"]);

// Enhanced backup creation schema with storage architecture
export const createManualBackupSchema = z.object({
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long"),
  description: z.string().max(500, "Description too long").optional(),
  projectId: z.string().min(1, "Project ID is required"),
  
  // Backup configuration
  backupType: backupTypeEnum.default("full"), // Changed from backupDataTypeEnum
  compressionType: compressionTypeEnum.default("gzip"),
  
  // Storage configuration
  storageType: storageTypeEnum.default("browser_download"),
  storageDestinationId: z.string().uuid().optional(),
  
  // Backup inclusion options
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
  includeMigrationHistory: z.boolean().default(true),
  
  // Table filtering
  includeTables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
});

// Legacy create backup schema for backward compatibility
export const createBackupSchema = z.object({
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long"),
  description: z.string().max(500, "Description too long").optional(),
  triggerType: backupTriggerTypeEnum.default("manual"), // Renamed from 'type' for clarity
  projectId: z.string().min(1, "Project ID is required"),
  
  // Backup options
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
});

// Update backup schema (for progress updates and completion)
export const updateBackupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long").optional(),
  description: z.string().max(500, "Description too long").nullish(),
  status: backupStatusEnum.optional(),
  
  // File information
  filePath: z.string().nullish(),
  fileName: z.string().nullish(),
  fileSize: z.number().int().min(0).nullish(),
  compressedSize: z.number().int().min(0).nullish(),
  checksum: z.string().nullish(),
  
  // Storage information
  storageFilePath: z.string().nullish(),
  downloadUrl: z.string().url().nullish(),
  downloadToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  
  // Timing
  startedAt: z.date().nullish(),
  completedAt: z.date().nullish(),
  duration: z.number().int().min(0).nullish(), // seconds - keeping original unit
  
  // Error handling
  errorMessage: z.string().nullish(),
  errorCode: z.string().nullish(),
  retryCount: z.number().int().min(0).default(0).optional(),
  
  // Validation
  validated: z.boolean().default(false).optional(),
  validationErrors: z.string().nullish(),
  
  // Archiving
  isArchived: z.boolean().default(false).optional(),
});

// Backup filter schema for queries
export const backupFilterSchema = z.object({
  projectId: z.string().uuid().optional(),
  status: backupStatusEnum.optional(),
  triggerType: backupTriggerTypeEnum.optional(), // Renamed from 'type' for clarity
  backupType: backupTypeEnum.optional(), // Changed from backupDataTypeEnum
  storageType: storageTypeEnum.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["name", "createdAt", "completedAt", "fileSize", "duration"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Backup progress schema for real-time updates
export const backupProgressSchema = z.object({
  backupId: z.string().uuid(),
  status: backupStatusEnum,
  progress: z.number().min(0).max(100),
  currentStep: z.string(),
  currentPhase: z.string(),
  startTime: z.date().optional(),
  estimatedEndTime: z.date().optional(),
  estimatedTimeRemaining: z.number().min(0).optional(), // seconds
  errorMessage: z.string().optional(),
});

// Start backup schema for manual backups (legacy)
export const startBackupSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "Backup name is required").max(100, "Backup name too long"),
  description: z.string().max(500, "Description too long").optional(),
  triggerType: backupTriggerTypeEnum.default("manual"), // Renamed from 'type' for clarity
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
});

// Backup validation schema
export const validateBackupSchema = z.object({
  backupId: z.string().uuid(),
  expectedChecksum: z.string().optional(),
});

// Type exports
export type CreateManualBackupInput = z.infer<typeof createManualBackupSchema>;
export type CreateBackupInput = z.infer<typeof createBackupSchema>;
export type UpdateBackupInput = z.infer<typeof updateBackupSchema>;
export type BackupFilterInput = z.infer<typeof backupFilterSchema>;
export type BackupProgressInput = z.infer<typeof backupProgressSchema>;
export type StartBackupInput = z.infer<typeof startBackupSchema>;
export type ValidateBackupInput = z.infer<typeof validateBackupSchema>;

// Backup configuration schema
export const backupConfigSchema = z.object({
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeDatabase: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
  includeMigrationHistory: z.boolean().default(true),
});

// Backup options schema for service layer
export const backupOptionsSchema = z.object({
  backupType: backupTypeEnum, // Changed from backupDataTypeEnum
  compressionType: compressionTypeEnum,
  includeTables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
  includeSchema: z.boolean().default(true),
  includeData: z.boolean().default(true),
  includeMigrationHistory: z.boolean().default(true),
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

// Storage result schema for validation
export const storageResultSchema = z.object({
  success: z.boolean(),
  storagePath: z.string(),
  url: z.string().url().optional(),
  downloadToken: z.string().optional(),
  etag: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  error: z.string().optional(),
});

// Additional type exports
export type BackupConfigInput = z.infer<typeof backupConfigSchema>;
export type BackupOptionsInput = z.infer<typeof backupOptionsSchema>;
export type BackupRestoreInput = z.infer<typeof backupRestoreSchema>;
export type StorageResultInput = z.infer<typeof storageResultSchema>; 