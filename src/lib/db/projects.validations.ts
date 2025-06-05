import { z } from "zod";

// Manual validation schemas to avoid drizzle-zod version conflicts
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").optional(),
  environment: z.enum(["production", "staging", "development"]).default("production"),
  databaseUrl: z
    .string()
    .url("Invalid database URL format")
    .refine(
      (url) => url.includes("supabase.co") || url.includes("pooler.supabase.com") || url.includes("localhost"),
      "Must be a valid Supabase database URL"
    ),
  supabaseServiceKey: z
    .string()
    .startsWith("eyJ", "Invalid service key format")
    .optional(),
  supabaseAnonKey: z
    .string()
    .startsWith("eyJ", "Invalid anon key format")
    .optional(),
  organizationId: z.string().optional(),
  backupRetentionDays: z
    .number()
    .int()
    .min(1, "Must retain backups for at least 1 day")
    .max(365, "Maximum retention is 365 days")
    .default(30),
  isActive: z.boolean().default(true),
});

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Project name is required").max(100, "Project name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  environment: z.enum(["production", "staging", "development"]).optional(),
  databaseUrl: z
    .string()
    .url("Invalid database URL format")
    .refine(
      (url) => url.includes("supabase.co") || url.includes("pooler.supabase.com") || url.includes("localhost"),
      "Must be a valid Supabase database URL"
    )
    .optional(),
  supabaseServiceKey: z
    .string()
    .startsWith("eyJ", "Invalid service key format")
    .optional(),
  supabaseAnonKey: z
    .string()
    .startsWith("eyJ", "Invalid anon key format")
    .optional(),
  organizationId: z.string().optional(),
  isActive: z.boolean().optional(),
  backupRetentionDays: z
    .number()
    .int()
    .min(1, "Must retain backups for at least 1 day")
    .max(365, "Maximum retention is 365 days")
    .optional(),
});

// Connection test schema - only database URL required
export const projectConnectionSchema = z.object({
  databaseUrl: z
    .string()
    .url("Invalid database URL format")
    .refine(
      (url) => url.includes("supabase.co") || url.includes("pooler.supabase.com") || url.includes("localhost"),
      "Must be a valid Supabase database URL"
    ),
  supabaseServiceKey: z
    .string()
    .startsWith("eyJ", "Invalid service key format")
    .optional(),
  supabaseAnonKey: z
    .string()
    .startsWith("eyJ", "Invalid anon key format")
    .optional(),
});

// Project search/filter schema
export const projectFilterSchema = z.object({
  isActive: z.boolean().optional(),
  environment: z.enum(["production", "staging", "development"]).optional(),
  organizationId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "lastBackupAt", "totalBackups"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

// Project statistics schema
export const projectStatsSchema = z.object({
  projectId: z.string().uuid(),
  includeBackupHistory: z.boolean().default(false),
  includeSizeBreakdown: z.boolean().default(false),
});

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectConnectionInput = z.infer<typeof projectConnectionSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
export type ProjectStatsInput = z.infer<typeof projectStatsSchema>; 