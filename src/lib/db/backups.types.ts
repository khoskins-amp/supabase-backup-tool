import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { backups } from "./backups.schema";

// Base types inferred from schema
export type Backup = InferSelectModel<typeof backups>;
export type NewBackup = InferInsertModel<typeof backups>;

// Status and type enums to match schema - CORRECTED naming for clarity
export type BackupStatus = "pending" | "in-progress" | "completed" | "failed" | "cancelled";

// Renamed for semantic clarity:
// - BackupTriggerType: HOW the backup was initiated (manual/scheduled/pre-migration)  
// - BackupType: WHAT is being backed up (full/schema/data/incremental)
export type BackupTriggerType = "manual" | "scheduled" | "pre-migration";
export type BackupType = "full" | "schema" | "data" | "incremental";
export type CompressionType = "none" | "gzip" | "bzip2";
export type StorageType = "browser_download" | "s3" | "google_drive" | "nextcloud" | "local_mapped";

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
  | "triggerType"
  | "backupType"
  | "status" 
  | "fileSize"
  | "compressedSize"
  | "duration"
  | "storageType"
  | "createdAt" 
  | "completedAt"
>;

export type BackupProgress = {
  backupId: string;
  status: BackupStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // seconds
  startTime?: Date;
  estimatedEndTime?: Date;
  currentPhase: string;
  errorMessage?: string;
};

// Storage-related types
export type BackupFile = {
  id: string;
  fileName: string;
  filePath: string;
  size: number;
  checksum: string;
  contentType: string;
  metadata: Record<string, any>;
};

export type StorageResult = {
  success: boolean;
  storagePath: string;
  url?: string;
  downloadToken?: string;
  etag?: string;
  metadata?: any;
  error?: string;
};

// Form types for creating backups
export type ManualBackupFormData = {
  name: string;
  description?: string;
  projectId: string;
  backupType: BackupType;
  compressionType: CompressionType;
  storageType: StorageType;
  storageDestinationId?: string;
  
  // What to include in backup
  includeAuth: boolean;
  includeStorage: boolean;
  includeDatabase: boolean;
  includeEdgeFunctions: boolean;
  includeMigrationHistory: boolean;
  
  // Table filtering
  includeTables?: string[];
  excludeTables?: string[];
};

// API input types
export type CreateManualBackupInput = {
  name: string;
  description?: string;
  projectId: string;
  backupType: BackupType;
  compressionType?: CompressionType;
  storageType: StorageType;
  storageDestinationId?: string;
  
  // Configuration options
  includeAuth?: boolean;
  includeStorage?: boolean; 
  includeDatabase?: boolean;
  includeEdgeFunctions?: boolean;
  includeMigrationHistory?: boolean;
  includeTables?: string[];
  excludeTables?: string[];
};

export type UpdateBackupInput = {
  id: string;
  name?: string;
  description?: string;
  status?: BackupStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // seconds - keeping original unit
  fileSize?: number;
  compressedSize?: number;
  filePath?: string;
  fileName?: string;
  checksum?: string;
  storageFilePath?: string;
  downloadUrl?: string;
  downloadToken?: string;
  expiresAt?: Date;
  errorMessage?: string;
  errorCode?: string;
  retryCount?: number;
  validated?: boolean;
  validationErrors?: string;
  isArchived?: boolean;
};

// Backup configuration types
export type BackupConfig = Pick<Backup,
  | "includeAuth"
  | "includeStorage" 
  | "includeDatabase"
  | "includeEdgeFunctions"
  | "includeMigrationHistory"
>;

export type BackupOptions = {
  backupType: BackupType;
  compressionType: CompressionType;
  includeTables?: string[];
  excludeTables?: string[];
  includeSchema?: boolean;
  includeData?: boolean;
  includeMigrationHistory?: boolean;
};

// Statistics types
export type BackupStats = {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number; // Changed from 'running' to 'inProgress' to match schema
  totalSize: number; // bytes
  totalCompressedSize: number; // bytes
  averageDuration: number; // seconds - keeping original unit
  compressionRatio: number; // percentage
};

// Filter and query types
export type BackupFilterInput = {
  projectId?: string;
  status?: BackupStatus;
  triggerType?: BackupTriggerType; // Renamed from 'type' for clarity
  backupType?: BackupType;
  storageType?: StorageType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "createdAt" | "completedAt" | "fileSize" | "duration";
  sortOrder?: "asc" | "desc";
};

// Backup execution result
export type BackupResult = {
  id: string;
  success: boolean;
  filePath?: string;
  downloadUrl?: string;
  downloadToken?: string;
  fileSize?: number;
  compressedSize?: number;
  duration?: number; // seconds - keeping original unit
  error?: string;
  checksum?: string;
};

// Validation types  
export type ValidationResult = {
  valid: boolean;
  availableSpace?: number;
  lastTested: Date;
  error?: string;
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