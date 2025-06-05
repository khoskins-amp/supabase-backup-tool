import { createClient } from "@supabase/supabase-js";
import { execa } from "execa";
import * as fs from "fs/promises";
import * as path from "path";

export type SupabaseConnection = {
  url: string;
  anonKey: string;
  serviceKey?: string;
};

export type BackupOptions = {
  includeAuth?: boolean;
  includeStorage?: boolean;
  includeDatabase?: boolean;
  includeEdgeFunctions?: boolean;
  outputPath?: string;
};

export class SupabaseService {
  /**
   * Test connection to a Supabase project
   */
  static async testConnection(connection: SupabaseConnection): Promise<boolean> {
    try {
      const client = createClient(connection.url, connection.anonKey);
      const { error } = await client.from("_test").select("*").limit(1);
      
      // If we get a permissions error, connection is working
      // If we get a different error, connection might be bad
      return !error || error.message.includes("permission");
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  /**
   * Check if Supabase CLI is installed and accessible
   */
  static async checkCLIInstallation(): Promise<{ installed: boolean; version?: string }> {
    try {
      const { stdout } = await execa("supabase", ["--version"]);
      return { installed: true, version: stdout.trim() };
    } catch (error) {
      return { installed: false };
    }
  }

  /**
   * Create a backup using Supabase CLI
   */
  static async createBackup(
    connection: SupabaseConnection,
    options: BackupOptions = {}
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Check CLI installation first
      const { installed } = await this.checkCLIInstallation();
      if (!installed) {
        throw new Error("Supabase CLI is not installed. Please install it with: npm i supabase --save-dev");
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = options.outputPath || "./data/backups";
      const projectName = new URL(connection.url).hostname.split(".")[0];
      const fileName = `${projectName}-backup-${timestamp}`;
      const filePath = path.join(backupDir, fileName);

      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      // Prepare environment variables for CLI
      const env = {
        ...process.env,
        SUPABASE_PROJECT_REF: this.extractProjectRef(connection.url),
        SUPABASE_ACCESS_TOKEN: connection.serviceKey || connection.anonKey,
      };

      const commands: string[] = [];

      // Database backup (most common)
      if (options.includeDatabase !== false) {
        try {
          await execa(
            "supabase",
            [
              "db",
              "dump",
              "--schema", "public",
              "--file", `${filePath}-database.sql`
            ],
            { env }
          );
          commands.push("database");
        } catch (error) {
          console.warn("Database dump failed:", error);
        }
      }

      // Note: Storage and Auth backups require custom implementation
      // as CLI doesn't have direct backup commands for these
      if (options.includeStorage) {
        await this.backupStorage(connection, `${filePath}-storage`);
        commands.push("storage");
      }

      if (options.includeAuth) {
        await this.backupAuth(connection, `${filePath}-auth.json`);
        commands.push("auth");
      }

      return {
        success: true,
        filePath: filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Backup storage buckets and files
   */
  private static async backupStorage(
    connection: SupabaseConnection,
    outputPath: string
  ): Promise<void> {
    const client = createClient(connection.url, connection.serviceKey || connection.anonKey);
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
    if (bucketsError) throw bucketsError;

    const storageBackup: {
      buckets: any[];
      files: Record<string, any[]>;
    } = {
      buckets: [],
      files: {},
    };

    for (const bucket of buckets || []) {
      storageBackup.buckets.push(bucket);
      
      // List files in bucket
      const { data: files, error: filesError } = await client.storage
        .from(bucket.name)
        .list();
        
      if (!filesError && files) {
        storageBackup.files[bucket.name] = files;
      }
    }

    await fs.writeFile(`${outputPath}.json`, JSON.stringify(storageBackup, null, 2));
  }

  /**
   * Backup auth users and settings
   */
  private static async backupAuth(
    connection: SupabaseConnection,
    outputPath: string
  ): Promise<void> {
    const client = createClient(connection.url, connection.serviceKey!);
    
    // Note: This requires service key and appropriate RLS policies
    try {
      const { data: users, error } = await client.auth.admin.listUsers();
      if (error) throw error;

      const authBackup = {
        users: users.users,
        timestamp: new Date().toISOString(),
      };

      await fs.writeFile(outputPath, JSON.stringify(authBackup, null, 2));
    } catch (error) {
      console.warn("Auth backup requires service key:", error);
    }
  }

  /**
   * Extract project reference from Supabase URL
   */
  private static extractProjectRef(url: string): string {
    // Extract from URLs like: https://abcdefgh.supabase.co
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0];
  }

  /**
   * Get project information
   */
  static async getProjectInfo(connection: SupabaseConnection) {
    try {
      const client = createClient(connection.url, connection.anonKey);
      
      // Try to get some basic project info
      const { data, error } = await client.rpc("version");
      
      return {
        connected: !error,
        projectRef: this.extractProjectRef(connection.url),
        version: data,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List available databases/schemas
   */
  static async listSchemas(connection: SupabaseConnection): Promise<string[]> {
    try {
      const client = createClient(connection.url, connection.serviceKey || connection.anonKey);
      
      // This requires appropriate permissions
      const { data, error } = await client.rpc("get_schemas");
      
      if (error) {
        // Fallback to common schemas
        return ["public", "auth", "storage"];
      }
      
      return data || ["public"];
    } catch (error) {
      return ["public"];
    }
  }
} 