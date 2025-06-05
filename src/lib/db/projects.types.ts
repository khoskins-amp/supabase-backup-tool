import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { projects } from "./projects.schema";

// Base types inferred from schema
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

// Derived types for API and UI
export type ProjectWithStats = Project & {
  backupCount: number;
  lastBackupStatus?: string;
  nextScheduledBackup?: Date;
};

export type ProjectSummary = Pick<Project, 
  | "id" 
  | "name" 
  | "description" 
  | "isActive" 
  | "createdAt" 
  | "lastBackupAt"
  | "totalBackups"
  | "totalSize"
>;

export type ProjectConnection = Pick<Project,
  | "supabaseUrl"
  | "supabaseAnonKey"
  | "supabaseServiceKey"
>;

// Form types
export type ProjectFormData = Omit<NewProject, 
  | "id" 
  | "createdAt" 
  | "updatedAt" 
  | "lastBackupAt"
  | "totalBackups"
  | "totalSize"
>;

export type ProjectUpdateData = Partial<Pick<Project,
  | "name"
  | "description"
  | "supabaseUrl"
  | "supabaseAnonKey"
  | "supabaseServiceKey"
  | "isActive"
  | "backupRetentionDays"
>>;

// Input types for API operations (matching validation schemas)
export type CreateProjectInput = {
  name: string;
  description?: string;
  environment?: "production" | "staging" | "development";
  databaseUrl: string;
  supabaseServiceKey?: string;
  supabaseAnonKey?: string;
};

export type UpdateProjectInput = {
  id: string;
  name?: string;
  description?: string;
  environment?: "production" | "staging" | "development";
  databaseUrl?: string;
  supabaseServiceKey?: string;
  supabaseAnonKey?: string;
};

export type ProjectConnectionInput = {
  databaseUrl: string;
  supabaseServiceKey?: string;
  supabaseAnonKey?: string;
};

export type ProjectFilterInput = {
  environment?: "production" | "staging" | "development";
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "lastBackupAt";
  sortOrder?: "asc" | "desc";
}; 