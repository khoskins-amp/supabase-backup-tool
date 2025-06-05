import { pgTable, text, integer, timestamp, boolean, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  // Use PostgreSQL native UUID with auto-generation
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Basic project info
  name: text("name").notNull(),
  description: text("description"),
  environment: text("environment").$type<"production" | "staging" | "development">().default("production"),
  
  // SENSITIVE - Contains password and should be encrypted
  // Main connection - this is all we really need for database operations
  databaseUrl: text("database_url").notNull(), // ENCRYPTED FIELD
  
  // SENSITIVE - API keys should be encrypted
  // Optional keys for additional features
  supabaseServiceKey: text("supabase_service_key"), // ENCRYPTED FIELD - Optional - for auth, storage, functions
  supabaseAnonKey: text("supabase_anon_key"), // ENCRYPTED FIELD - Optional - for client-side testing
  
  // Auto-extracted from databaseUrl (we can parse these) - NOT SENSITIVE
  projectRef: text("project_ref").notNull().unique(), // Extracted from URL, must be unique
  region: text("region").notNull(), // Extracted from URL, default to 'us-east-1'
  // Note: supabaseUrl removed - can be constructed as `https://${projectRef}.supabase.co`
  
  // Organization support for multi-tenant usage
  organizationId: text("organization_id"), // Optional - for organizing projects
  
  // Project settings - NOT SENSITIVE
  isActive: boolean("is_active").notNull().default(true),
  backupRetentionDays: integer("backup_retention_days").notNull().default(30),
  
  // Metadata - NOT SENSITIVE
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastBackupAt: timestamp("last_backup_at"),
  
  // Stats - NOT SENSITIVE
  totalBackups: integer("total_backups").notNull().default(0),
  totalSize: integer("total_size").notNull().default(0), // in bytes
}, (table) => ({
  // Indexes for performance
  projectRefIdx: uniqueIndex("projects_project_ref_idx").on(table.projectRef),
  organizationIdx: index("projects_organization_idx").on(table.organizationId),
  environmentIdx: index("projects_environment_idx").on(table.environment),
  isActiveIdx: index("projects_is_active_idx").on(table.isActive),
  createdAtIdx: index("projects_created_at_idx").on(table.createdAt),
  lastBackupAtIdx: index("projects_last_backup_at_idx").on(table.lastBackupAt),
  
  // Composite indexes for common queries
  orgEnvironmentIdx: index("projects_org_environment_idx").on(table.organizationId, table.environment),
  activeCreatedIdx: index("projects_active_created_idx").on(table.isActive, table.createdAt),
})); 