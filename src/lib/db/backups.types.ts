import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { backups } from "./backups.schema";

// Base types inferred from schema
export type Backup = InferSelectModel<typeof backups>;
export type NewBackup = InferInsertModel<typeof backups>;

// Status types
export type BackupStatus = "pending" | "in-progress" | "completed" | "failed" | "cancelled";
export type BackupType = "manual" | "scheduled" | "pre-migration";

// Derived types for API and UI
export type BackupWithProject = Backup & {
  project: {
    id: string;
    name: string;
    supabaseUrl: string;
  };
};

export type BackupSummary = Pick<Backup, 
  | "id" 
  | "name" 
  | "type"
  | "status" 
  | "fileSize"
  | "duration"
  | "createdAt" 
  | "completedAt"
>;

export type BackupProgress = {
  backupId: string;
  status: BackupStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // seconds
  error?: string;
};

// Form types
export type BackupFormData = Omit<NewBackup, 
  | "id" 
  | "status"
  | "filePath"
  | "fileName"
  | "fileSize"
  | "checksum"
  | "startedAt"
  | "completedAt"
  | "duration"
  | "errorMessage"
  | "retryCount"
  | "createdAt" 
  | "updatedAt"
  | "expiresAt"
  | "isArchived"
>;

export type BackupUpdateData = Partial<Pick<Backup,
  | "name"
  | "description"
  | "status"
  | "filePath"
  | "fileName"
  | "fileSize"
  | "checksum"
  | "startedAt"
  | "completedAt"
  | "duration"
  | "errorMessage"
  | "retryCount"
  | "expiresAt"
  | "isArchived"
>>;

// Backup configuration
export type BackupConfig = Pick<Backup,
  | "includeAuth"
  | "includeStorage" 
  | "includeDatabase"
  | "includeEdgeFunctions"
>;

// Statistics types
export type BackupStats = {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalSize: number; // bytes
  averageDuration: number; // seconds
};

// Input types for API operations (matching validation schemas)
export type CreateBackupInput = {
  name: string;
  description?: string;
  projectId: string;
  type?: "manual" | "scheduled" | "pre-migration";
  includeAuth?: boolean;
  includeStorage?: boolean;
  includeDatabase?: boolean;
  includeEdgeFunctions?: boolean;
};

export type UpdateBackupInput = {
  id: string;
  name?: string;
  description?: string;
  status?: "pending" | "in-progress" | "completed" | "failed" | "cancelled";
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  checksum?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  errorMessage?: string;
  retryCount?: number;
  expiresAt?: Date;
  isArchived?: boolean;
};

export type BackupConfigInput = {
  includeAuth?: boolean;
  includeStorage?: boolean;
  includeDatabase?: boolean;
  includeEdgeFunctions?: boolean;
};

export type BackupFilterInput = {
  projectId?: string;
  status?: "pending" | "in-progress" | "completed" | "failed" | "cancelled";
  type?: "manual" | "scheduled" | "pre-migration";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "createdAt" | "completedAt" | "fileSize" | "duration";
  sortOrder?: "asc" | "desc";
};

export type BackupRestoreInput = {
  backupId: string;
  targetProjectId?: string;
  restoreAuth?: boolean;
  restoreStorage?: boolean;
  restoreDatabase?: boolean;
  restoreEdgeFunctions?: boolean;
  overwriteExisting?: boolean;
}; 