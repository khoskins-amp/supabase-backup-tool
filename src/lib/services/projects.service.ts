import { db } from "../db/client";
import { projects } from "../db/projects.schema";
import { eq } from "drizzle-orm";
import { encryptForDatabase, decryptFromDatabase } from "../crypto";
import type { NewProject, Project } from "../db/projects.types";

/**
 * Project data with decrypted sensitive fields for application use
 */
export interface DecryptedProject extends Omit<Project, 'databaseUrl' | 'supabaseServiceKey' | 'supabaseAnonKey'> {
  databaseUrl: string; // Always decrypted for app use
  supabaseServiceKey?: string | null; // Decrypted if present
  supabaseAnonKey?: string | null; // Decrypted if present
}

/**
 * Project input data that will be encrypted before storage
 */
export interface ProjectInput {
  name: string;
  description?: string | null;
  environment?: "production" | "staging" | "development" | null;
  databaseUrl: string; // Plain text input
  supabaseServiceKey?: string | null; // Plain text input
  supabaseAnonKey?: string | null; // Plain text input
  isActive?: boolean | null;
  backupRetentionDays?: number | null;
}

export class ProjectsService {
  /**
   * Creates a new project with encrypted sensitive fields
   */
  static async create(input: ProjectInput): Promise<DecryptedProject> {
    // Encrypt sensitive fields before storage
    const insertData: any = {
      name: input.name,
      description: input.description,
      environment: input.environment || "production",
      databaseUrl: await encryptForDatabase(input.databaseUrl),
      supabaseServiceKey: await encryptForDatabase(input.supabaseServiceKey || null),
      supabaseAnonKey: await encryptForDatabase(input.supabaseAnonKey || null),
      isActive: input.isActive ?? true,
      backupRetentionDays: input.backupRetentionDays ?? 30,
    };

    const result = await db
      .insert(projects)
      .values(insertData)
      .returning();

    return this.decryptProject(result[0]);
  }

  /**
   * Gets a project by ID with decrypted sensitive fields
   */
  static async getById(id: string): Promise<DecryptedProject | null> {
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.decryptProject(result[0]);
  }

  /**
   * Gets all projects with decrypted sensitive fields
   */
  static async getAll(): Promise<DecryptedProject[]> {
    const result = await db
      .select()
      .from(projects);

    return Promise.all(result.map(project => this.decryptProject(project)));
  }

  /**
   * Updates a project with encryption for sensitive fields
   */
  static async update(id: string, input: Partial<ProjectInput>): Promise<DecryptedProject | null> {
    const updateData: any = {};

    // Copy non-sensitive fields directly
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.environment !== undefined) updateData.environment = input.environment;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.backupRetentionDays !== undefined) updateData.backupRetentionDays = input.backupRetentionDays;

    // Encrypt sensitive fields if they're being updated
    if (input.databaseUrl !== undefined) {
      updateData.databaseUrl = await encryptForDatabase(input.databaseUrl);
    }
    if (input.supabaseServiceKey !== undefined) {
      updateData.supabaseServiceKey = await encryptForDatabase(input.supabaseServiceKey || null);
    }
    if (input.supabaseAnonKey !== undefined) {
      updateData.supabaseAnonKey = await encryptForDatabase(input.supabaseAnonKey || null);
    }

    updateData.updatedAt = new Date();

    const result = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.decryptProject(result[0]);
  }

  /**
   * Deletes a project by ID
   */
  static async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Internal method to decrypt sensitive fields from database row
   */
  private static async decryptProject(project: Project): Promise<DecryptedProject> {
    try {
      const decrypted: DecryptedProject = {
        ...project,
        databaseUrl: await decryptFromDatabase(project.databaseUrl) || '',
        supabaseServiceKey: await decryptFromDatabase(project.supabaseServiceKey),
        supabaseAnonKey: await decryptFromDatabase(project.supabaseAnonKey),
      };

      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt project ${project.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to a project's database (decrypts URL temporarily)
   */
  static async testConnection(id: string): Promise<{
    success: boolean;
    error?: string;
    features: {
      database: boolean;
      auth: boolean;
      storage: boolean;
      functions: boolean;
    };
  }> {
    const project = await this.getById(id);
    if (!project) {
      return {
        success: false,
        error: 'Project not found',
        features: { database: false, auth: false, storage: false, functions: false }
      };
    }

    // Here you would implement actual connection testing
    // For now, return a mock response
    return {
      success: true,
      features: {
        database: true,
        auth: !!project.supabaseServiceKey,
        storage: !!project.supabaseServiceKey,
        functions: !!project.supabaseServiceKey,
      }
    };
  }
} 