import { pgTable, text, integer, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";
import { projects } from "./projects.schema";

export const backups = pgTable("backups", {
  // Use PostgreSQL native UUID with auto-generation
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  
  // Backup metadata
  name: text("name").notNull(), // e.g., "Daily Backup", "Pre-migration Backup"
  description: text("description"),
  triggerType: text("trigger_type").$type<"manual" | "scheduled" | "pre-migration">().notNull().default("manual"),
  
  // Backup configuration details
  backupType: text("backup_type").$type<"full" | "schema" | "data" | "incremental">().notNull().default("full"),
  compressionType: text("compression_type").$type<"none" | "gzip" | "bzip2">().default("gzip"),
  
  // Backup status
  status: text("status").$type<"pending" | "in-progress" | "completed" | "failed" | "cancelled">().notNull().default("pending"),
  
  // What was backed up (Supabase-specific components)
  includeAuth: boolean("include_auth").notNull().default(true),
  includeStorage: boolean("include_storage").notNull().default(true), 
  includeDatabase: boolean("include_database").notNull().default(true),
  includeEdgeFunctions: boolean("include_edge_functions").notNull().default(false),
  includeMigrationHistory: boolean("include_migration_history").notNull().default(true),
  
  // Table inclusion/exclusion (JSON arrays)
  includeTables: text("include_tables"), // JSON array of table names to include
  excludeTables: text("exclude_tables"), // JSON array of table names to exclude
  
  // File information
  filePath: text("file_path"), // Path to the backup file
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size").default(0), // Size in bytes
  compressedSize: integer("compressed_size"), // Compressed size in bytes
  checksum: text("checksum"), // File integrity check
  
  // Storage information
  storageType: text("storage_type").$type<"browser_download" | "s3" | "google_drive" | "nextcloud" | "local_mapped">().default("browser_download"),
  storageDestinationId: uuid("storage_destination_id"), // References storage_destinations table when implemented
  storageFilePath: text("storage_file_path"), // Path in the storage system
  localFilePath: text("local_file_path"), // Temporary local path during processing
  downloadUrl: text("download_url"), // For browser downloads or temporary URLs
  downloadToken: text("download_token"), // Secure token for downloads
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration").default(0), // Duration in seconds (keeping original unit)
  
  // Error handling and validation
  errorMessage: text("error_message"),
  errorCode: text("error_code"),
  retryCount: integer("retry_count").notNull().default(0),
  validated: boolean("validated").default(false),
  validationErrors: text("validation_errors"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Retention and archiving
  expiresAt: timestamp("expires_at"), // When this backup should be cleaned up
  isArchived: boolean("is_archived").notNull().default(false),
}, (table) => ({
  // Indexes for performance
  projectIdIdx: index("backups_project_id_idx").on(table.projectId),
  statusIdx: index("backups_status_idx").on(table.status),
  triggerTypeIdx: index("backups_trigger_type_idx").on(table.triggerType),
  backupTypeIdx: index("backups_backup_type_idx").on(table.backupType),
  storageTypeIdx: index("backups_storage_type_idx").on(table.storageType),
  createdAtIdx: index("backups_created_at_idx").on(table.createdAt),
  expiresAtIdx: index("backups_expires_at_idx").on(table.expiresAt),
  downloadTokenIdx: index("backups_download_token_idx").on(table.downloadToken),
  isArchivedIdx: index("backups_is_archived_idx").on(table.isArchived),
  
  // Composite indexes for common queries
  projectStatusIdx: index("backups_project_status_idx").on(table.projectId, table.status),
  projectCreatedIdx: index("backups_project_created_idx").on(table.projectId, table.createdAt),
  statusCreatedIdx: index("backups_status_created_idx").on(table.status, table.createdAt),
  projectTriggerTypeStatusIdx: index("backups_project_trigger_type_status_idx").on(table.projectId, table.triggerType, table.status),
  archivedExpiresIdx: index("backups_archived_expires_idx").on(table.isArchived, table.expiresAt),
  storageDestinationIdx: index("backups_storage_destination_idx").on(table.storageDestinationId),
})); 