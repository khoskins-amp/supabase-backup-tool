import { pgTable, text, integer, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";
import { projects } from "./projects.schema";

export const backups = pgTable("backups", {
  // Use PostgreSQL native UUID with auto-generation
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  
  // Backup metadata
  name: text("name").notNull(), // e.g., "Daily Backup", "Pre-migration Backup"
  description: text("description"),
  type: text("type").$type<"manual" | "scheduled" | "pre-migration">().notNull().default("manual"),
  
  // Backup details
  status: text("status").$type<"pending" | "in-progress" | "completed" | "failed" | "cancelled">().notNull().default("pending"),
  
  // What was backed up
  includeAuth: boolean("include_auth").notNull().default(true),
  includeStorage: boolean("include_storage").notNull().default(true),
  includeDatabase: boolean("include_database").notNull().default(true),
  includeEdgeFunctions: boolean("include_edge_functions").notNull().default(false),
  
  // File information
  filePath: text("file_path"), // Path to the backup file
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size").default(0), // Size in bytes
  checksum: text("checksum"), // File integrity check
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration").default(0), // Duration in seconds
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Retention
  expiresAt: timestamp("expires_at"), // When this backup should be cleaned up
  isArchived: boolean("is_archived").notNull().default(false),
}, (table) => ({
  // Indexes for performance
  projectIdIdx: index("backups_project_id_idx").on(table.projectId),
  statusIdx: index("backups_status_idx").on(table.status),
  typeIdx: index("backups_type_idx").on(table.type),
  createdAtIdx: index("backups_created_at_idx").on(table.createdAt),
  expiresAtIdx: index("backups_expires_at_idx").on(table.expiresAt),
  isArchivedIdx: index("backups_is_archived_idx").on(table.isArchived),
  
  // Composite indexes for common queries
  projectStatusIdx: index("backups_project_status_idx").on(table.projectId, table.status),
  projectCreatedIdx: index("backups_project_created_idx").on(table.projectId, table.createdAt),
  statusCreatedIdx: index("backups_status_created_idx").on(table.status, table.createdAt),
  projectTypeStatusIdx: index("backups_project_type_status_idx").on(table.projectId, table.type, table.status),
  archivedExpiresIdx: index("backups_archived_expires_idx").on(table.isArchived, table.expiresAt),
})); 