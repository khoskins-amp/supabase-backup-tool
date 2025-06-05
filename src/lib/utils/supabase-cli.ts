import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

const execAsync = promisify(exec);

// CLI Command Schemas
export const SupabaseCLICommandSchema = z.object({
  projectRef: z.string(),
  databaseUrl: z.string().url(),
  outputDir: z.string(),
  includeAuth: z.boolean().default(true),
  includeStorage: z.boolean().default(true),
  includeEdgeFunctions: z.boolean().default(false),
});

export type SupabaseCLICommand = z.infer<typeof SupabaseCLICommandSchema>;

export class SupabaseCLIError extends Error {
  constructor(
    message: string,
    public command: string,
    public exitCode?: number,
    public stderr?: string
  ) {
    super(message);
    this.name = 'SupabaseCLIError';
  }
}

export class SupabaseCLI {
  private static instance: SupabaseCLI;
  private isInstalled: boolean | null = null;
  
  private constructor() {}
  
  static getInstance(): SupabaseCLI {
    if (!SupabaseCLI.instance) {
      SupabaseCLI.instance = new SupabaseCLI();
    }
    return SupabaseCLI.instance;
  }

  /**
   * Check if Supabase CLI is installed and accessible
   */
  async checkInstallation(): Promise<{ installed: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync('supabase --version');
      const version = stdout.trim();
      this.isInstalled = true;
      return { installed: true, version };
    } catch (error: any) {
      this.isInstalled = false;
      return { 
        installed: false, 
        error: `Supabase CLI not found. Please install it: npm install -g supabase` 
      };
    }
  }

  /**
   * Test connection to a Supabase project
   */
  async testConnection(
    projectRef: string, 
    databaseUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isInstalled) {
      const installCheck = await this.checkInstallation();
      if (!installCheck.installed) {
        return { success: false, error: installCheck.error };
      }
    }

    try {
      // Test basic connection using pg_dump --version first
      const { stdout } = await execAsync('pg_dump --version');
      if (!stdout.includes('pg_dump')) {
        return { 
          success: false, 
          error: 'PostgreSQL client tools not found. Please install PostgreSQL client.' 
        };
      }

      // Test actual connection to database
      const testCmd = `psql "${databaseUrl}" -c "SELECT 1;" --quiet --no-align --tuples-only`;
      await execAsync(testCmd, { timeout: 10000 });
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: `Connection failed: ${error.message}` 
      };
    }
  }

  /**
   * Create full database backup (schema + data)
   */
  async createFullBackup(
    config: SupabaseCLICommand,
    onProgress?: (stage: string, percentage: number) => void
  ): Promise<{ success: boolean; filePath?: string; error?: string; fileSize?: number }> {
    try {
      // Ensure output directory exists
      await fs.mkdir(config.outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${config.projectRef}-${timestamp}.sql`;
      const filePath = path.join(config.outputDir, fileName);

      onProgress?.('Initializing backup...', 0);

      // Create comprehensive backup command
      const backupCmd = [
        'pg_dump',
        config.databaseUrl,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file="${filePath}"`
      ];

      onProgress?.('Starting database dump...', 10);

      // Execute backup command
      const { stdout, stderr } = await execAsync(backupCmd.join(' '), {
        timeout: 300000, // 5 minutes timeout
      });

      onProgress?.('Backup completed, verifying...', 90);

      // Verify backup file exists and has content
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      onProgress?.('Backup verification completed', 100);

      return {
        success: true,
        filePath,
        fileSize: stats.size,
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Backup failed: ${error.message}`,
      };
    }
  }

  /**
   * Create schema-only backup
   */
  async createSchemaBackup(
    config: SupabaseCLICommand,
    onProgress?: (stage: string, percentage: number) => void
  ): Promise<{ success: boolean; filePath?: string; error?: string; fileSize?: number }> {
    try {
      await fs.mkdir(config.outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `schema-${config.projectRef}-${timestamp}.sql`;
      const filePath = path.join(config.outputDir, fileName);

      onProgress?.('Starting schema dump...', 20);

      const schemaCmd = [
        'pg_dump',
        config.databaseUrl,
        '--schema-only',
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--no-owner',
        '--no-privileges',
        `--file="${filePath}"`
      ];

      await execAsync(schemaCmd.join(' '), { timeout: 60000 });

      onProgress?.('Schema backup completed', 100);

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileSize: stats.size,
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Schema backup failed: ${error.message}`,
      };
    }
  }

  /**
   * Create data-only backup
   */
  async createDataBackup(
    config: SupabaseCLICommand,
    onProgress?: (stage: string, percentage: number) => void
  ): Promise<{ success: boolean; filePath?: string; error?: string; fileSize?: number }> {
    try {
      await fs.mkdir(config.outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `data-${config.projectRef}-${timestamp}.sql`;
      const filePath = path.join(config.outputDir, fileName);

      onProgress?.('Starting data dump...', 20);

      const dataCmd = [
        'pg_dump',
        config.databaseUrl,
        '--data-only',
        '--verbose',
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file="${filePath}"`
      ];

      await execAsync(dataCmd.join(' '), { timeout: 300000 });

      onProgress?.('Data backup completed', 100);

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileSize: stats.size,
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Data backup failed: ${error.message}`,
      };
    }
  }

  /**
   * List all available databases in the project
   */
  async listDatabases(databaseUrl: string): Promise<{ success: boolean; databases?: string[]; error?: string }> {
    try {
      const listCmd = `psql "${databaseUrl}" -c "SELECT datname FROM pg_database WHERE datistemplate = false;" --quiet --no-align --tuples-only`;
      const { stdout } = await execAsync(listCmd, { timeout: 10000 });
      
      const databases = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      return { success: true, databases };
    } catch (error: any) {
      return { 
        success: false, 
        error: `Failed to list databases: ${error.message}` 
      };
    }
  }

  /**
   * Get database size information
   */
  async getDatabaseInfo(databaseUrl: string): Promise<{ 
    success: boolean; 
    info?: { size: string; tables: number; schemas: number }; 
    error?: string 
  }> {
    try {
      const sizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')) as tables,
          (SELECT count(*) FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')) as schemas;
      `;
      
      const cmd = `psql "${databaseUrl}" -c "${sizeQuery}" --quiet --no-align --tuples-only --field-separator="|"`;
      const { stdout } = await execAsync(cmd, { timeout: 10000 });
      
      const [size, tables, schemas] = stdout.trim().split('|');
      
      return {
        success: true,
        info: {
          size,
          tables: parseInt(tables),
          schemas: parseInt(schemas),
        },
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: `Failed to get database info: ${error.message}` 
      };
    }
  }
}

// Export singleton instance
export const supabaseCLI = SupabaseCLI.getInstance(); 