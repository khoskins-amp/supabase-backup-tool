# Project Overview

**Application Name**: Supabase Backup Management Tool  
**Tech Stack**: TanStack Start + tRPC + Drizzle ORM + Zod + shadcn/ui  
**Database**: SQLite (local) using Drizzle ORM  
**Purpose**: Enterprise-grade backup management for multiple Supabase projects with local storage and automation

## Core Backup Functionality

### **1. Supabase CLI Integration**
Based on the documentation research, our app will utilize these key Supabase CLI commands:

**Complete Backup Commands:**
- supabase db dump --db-url "$supabase_db_url" -f roles.sql --role-only - Database roles
- supabase db dump --db-url "$supabase_db_url" -f schema.sql - Database schema
- supabase db dump --db-url "$supabase_db_url" -f data.sql --data-only --use-copy - Database data

**Advanced Backup Options:**
- supabase db dump --db-url "$OLD_DB_URL" -f history_schema.sql --schema supabase_migrations - Migration history
- Schema-specific dumps using `--schema auth,storage` for custom schemas
- Custom table filtering and selective backups

### **2. Project Connection Requirements**
Each Supabase project requires these connection details:

**Essential Connection Data:**
- **Project Reference ID** - PROJECT-REF from dashboard
- **Database URL** - postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
- **Database Password** - Reset from project settings
- **Access Token** - For CLI authentication
- **Service Role Key** - For administrative operations

## Database Schema Design (Drizzle ORM + Zod)

### **Drizzle Configuration Best Practices**
Following Context7 recommendations for optimal setup:

```typescript
// drizzle.config.ts - Multi-environment support
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*", // Organized schema files
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Schema Organization Pattern:**
- `./src/db/schema/projects.ts` - Project management
- `./src/db/schema/backups.ts` - Backup records
- `./src/db/schema/jobs.ts` - Scheduled jobs
- `./src/db/schema/analytics.ts` - Usage analytics

### **Core Database Tables**

**1. Projects Table**
```typescript
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  projectRef: text('project_ref').notNull().unique(),
  databaseUrl: text('database_url').notNull(),
  // Encrypted storage for sensitive data
  encryptedCredentials: blob('encrypted_credentials').notNull(),
  organizationId: text('organization_id'),
  environment: text('environment'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**2. Backups Table**
```typescript
export const backups = sqliteTable('backups', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  backupType: text('backup_type', { 
    enum: ['full', 'schema_only', 'data_only', 'roles_only', 'incremental'] 
  }).notNull(),
  status: text('status', { 
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] 
  }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  checksum: text('checksum'),
  metadata: blob('metadata', { mode: 'json' }),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**3. Backup Jobs Table**
```typescript
export const backupJobs = sqliteTable('backup_jobs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  name: text('name').notNull(),
  cronExpression: text('cron_expression').notNull(),
  backupConfig: blob('backup_config', { mode: 'json' }).notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  retentionDays: integer('retention_days').default(30),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**4. Analytics Table**
```typescript
export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey(),
  projectId: text('project_id').references(() => projects.id),
  eventType: text('event_type').notNull(),
  eventData: blob('event_data', { mode: 'json' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});
```

### **Zod Schema Validation Best Practices**

**Project Validation Schemas:**
```typescript
// Following Zod best practices from Context7
export const projectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  projectRef: z.string().regex(/^[a-z0-9-]+$/),
  databaseUrl: z.string().url(),
  databasePassword: z.string().min(8),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  organizationId: z.string().uuid().optional(),
});

export const backupConfigSchema = z.object({
  includeSchema: z.boolean().default(true),
  includeData: z.boolean().default(true),
  includeRoles: z.boolean().default(false),
  specificSchemas: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
  compressionLevel: z.number().min(0).max(9).default(6),
});
```

## Feature Categories

### **1. Project Management Features**
- **Add/Remove Projects**: Secure credential management with encryption
- **Connection Testing**: Validate database connectivity and permissions
- **Environment Grouping**: Organize by dev/staging/production
- **Bulk Operations**: Mass import/export of project configurations
- **Health Monitoring**: Real-time connection status and database metrics

### **2. Backup Operations Features**
- **Manual Backup Triggers**: On-demand backup creation with custom options
- **Scheduled Backups**: Cron-based automation with multiple schedules per project
- **Backup Types**:
  - Full database dumps (schema + data + roles)
  - Schema-only backups for structure migration
  - Data-only backups for content migration
  - Incremental backups (delta changes)
  - Custom schema-filtered backups
- **Backup Verification**: Automatic integrity checks and validation
- **Compression & Encryption**: Configurable compression levels and AES encryption

### **3. Storage & Organization Features**
- **Intelligent File Organization**: 
  ```
  backups/
  ├── {project-name}/
  │   ├── {YYYY-MM-DD}/
  │   │   ├── full-backup-{timestamp}.sql.gz
  │   │   ├── schema-{timestamp}.sql
  │   │   └── metadata.json
  ```
- **Retention Policies**: Automatic cleanup based on age and count limits
- **Deduplication**: Smart storage optimization for similar backups
- **Cloud Storage Integration**: Optional AWS S3/Google Cloud/Azure sync
- **Backup Versioning**: Git-like versioning for backup histories

### **4. Restoration Features**
- **Guided Restoration Wizard**: Step-by-step restore process
- **Selective Restoration**: Choose specific tables/schemas to restore
- **Preview Mode**: Show changes before applying restoration
- **Cross-Project Restoration**: Restore from one project to another
- **Rollback Capability**: Undo recent restorations

### **5. Monitoring & Analytics Features**
- **Backup Success Rates**: Track reliability metrics per project
- **Storage Usage Analytics**: Monitor disk space and growth trends
- **Performance Metrics**: Backup duration and throughput analysis
- **Alerting System**: Email/webhook notifications for failures
- **Dashboard Overview**: Real-time status of all projects and jobs

### **6. Security & Compliance Features**
- **Credential Encryption**: AES-256 encryption for stored passwords
- **Audit Logging**: Complete activity logs for compliance
- **Access Control**: Role-based permissions for multi-user scenarios
- **Backup Encryption**: Optional GPG encryption for backup files
- **Secure Transfer**: HTTPS/TLS for all external communications

### **7. Import/Export & Migration Features**
- **Configuration Export**: Backup tool settings and project configs
- **Migration Assistant**: Move backups between environments
- **Batch Import**: CSV/JSON import of multiple projects
- **Integration APIs**: REST endpoints for external tool integration

### **8. Advanced Automation Features**
- **Conditional Backups**: Trigger based on database size/changes
- **Backup Chaining**: Sequential backups across multiple projects
- **Pre/Post Backup Hooks**: Custom scripts before/after backup operations
- **Disaster Recovery**: Automated failover backup strategies
- **Backup Testing**: Automated restoration tests to verify backup integrity

## tRPC API Design

### **Router Structure**
```typescript
export const appRouter = router({
  projects: projectRouter,    // Project CRUD operations
  backups: backupRouter,      // Backup management
  jobs: jobRouter,           // Scheduled job management
  analytics: analyticsRouter, // Usage analytics
  system: systemRouter,      // System health and settings
});
```

## File System Architecture

### **Directory Structure**
```
data/
├── projects/              # Project configurations (encrypted)
├── backups/              # All backup files organized by project
├── logs/                 # Operation and error logs
├── temp/                 # Temporary files during operations
├── config/               # Global application settings
└── exports/              # Exported configurations and reports
```

This comprehensive feature set provides enterprise-grade backup management capabilities while maintaining simplicity for individual developers and scalability for teams managing multiple Supabase projects.