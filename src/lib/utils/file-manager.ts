import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { z } from 'zod';
import { ProjectConfig, BackupExecution, BackupFile } from '../types';

// Base directories configuration
export const BACKUP_BASE_DIR = process.env.BACKUP_BASE_DIR || './backups';
export const CONFIG_BASE_DIR = process.env.CONFIG_BASE_DIR || './config';
export const LOGS_BASE_DIR = process.env.LOGS_BASE_DIR || './logs';

// File operation schemas
const FileStatsSchema = z.object({
  size: z.number(),
  isFile: z.boolean(),
  isDirectory: z.boolean(),
  createdAt: z.date(),
  modifiedAt: z.date(),
});

export type FileStats = z.infer<typeof FileStatsSchema>;

export class FileManagerError extends Error {
  constructor(message: string, public operation: string, public path?: string) {
    super(message);
    this.name = 'FileManagerError';
  }
}

export class FileManager {
  private static instance: FileManager;
  
  private constructor() {}
  
  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  /**
   * Initialize directory structure for a project
   */
  async initializeProjectDirectories(projectId: string, projectRef: string): Promise<{ success: boolean; paths?: any; error?: string }> {
    try {
      const basePath = path.join(BACKUP_BASE_DIR, projectRef);
      
      const directories = {
        base: basePath,
        backups: path.join(basePath, 'backups'),
        schemas: path.join(basePath, 'schemas'),
        data: path.join(basePath, 'data'),
        metadata: path.join(basePath, 'metadata'),
        logs: path.join(basePath, 'logs'),
      };

      // Create all directories
      for (const [key, dirPath] of Object.entries(directories)) {
        await fs.mkdir(dirPath, { recursive: true });
      }

      // Create project info file
      const projectInfo = {
        projectId,
        projectRef,
        createdAt: new Date().toISOString(),
        directories,
      };

      await this.writeJSON(path.join(directories.metadata, 'project-info.json'), projectInfo);

      return { success: true, paths: directories };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to initialize project directories: ${error.message}`,
      };
    }
  }

  /**
   * Get project directory structure
   */
  getProjectPaths(projectRef: string) {
    const basePath = path.join(BACKUP_BASE_DIR, projectRef);
    return {
      base: basePath,
      backups: path.join(basePath, 'backups'),
      schemas: path.join(basePath, 'schemas'),
      data: path.join(basePath, 'data'),
      metadata: path.join(basePath, 'metadata'),
      logs: path.join(basePath, 'logs'),
    };
  }

  /**
   * Save project configuration
   */
  async saveProjectConfig(projectConfig: ProjectConfig): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.mkdir(CONFIG_BASE_DIR, { recursive: true });
      const configPath = path.join(CONFIG_BASE_DIR, `${projectConfig.projectRef}.json`);
      
      // Don't store sensitive keys in plain text - this is a basic implementation
      // In production, you'd want to encrypt these or use a secure key store
      const configToSave = {
        ...projectConfig,
        serviceRoleKey: this.maskKey(projectConfig.serviceRoleKey),
        anonKey: this.maskKey(projectConfig.anonKey),
        savedAt: new Date().toISOString(),
      };
      
      await this.writeJSON(configPath, configToSave);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to save project config: ${error.message}`,
      };
    }
  }

  /**
   * Load project configuration
   */
  async loadProjectConfig(projectRef: string): Promise<{ success: boolean; config?: ProjectConfig; error?: string }> {
    try {
      const configPath = path.join(CONFIG_BASE_DIR, `${projectRef}.json`);
      const config = await this.readJSON<ProjectConfig>(configPath);
      return { success: true, config };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to load project config: ${error.message}`,
      };
    }
  }

  /**
   * List all project configurations
   */
  async listProjectConfigs(): Promise<{ success: boolean; configs?: ProjectConfig[]; error?: string }> {
    try {
      await fs.mkdir(CONFIG_BASE_DIR, { recursive: true });
      const files = await fs.readdir(CONFIG_BASE_DIR);
      const configs: ProjectConfig[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const configPath = path.join(CONFIG_BASE_DIR, file);
            const config = await this.readJSON<ProjectConfig>(configPath);
            configs.push(config);
          } catch (error) {
            // Skip invalid config files
            console.warn(`Skipping invalid config file: ${file}`);
          }
        }
      }

      return { success: true, configs };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to list project configs: ${error.message}`,
      };
    }
  }

  /**
   * Save backup execution metadata
   */
  async saveBackupExecution(execution: BackupExecution): Promise<{ success: boolean; error?: string }> {
    try {
      const projectPaths = this.getProjectPaths(execution.projectId);
      await fs.mkdir(projectPaths.metadata, { recursive: true });
      
      const executionPath = path.join(projectPaths.metadata, `execution-${execution.id}.json`);
      await this.writeJSON(executionPath, execution);
      
      // Also maintain an index of all executions
      await this.updateExecutionIndex(execution);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to save backup execution: ${error.message}`,
      };
    }
  }

  /**
   * Load backup execution metadata
   */
  async loadBackupExecution(projectRef: string, executionId: string): Promise<{ success: boolean; execution?: BackupExecution; error?: string }> {
    try {
      const projectPaths = this.getProjectPaths(projectRef);
      const executionPath = path.join(projectPaths.metadata, `execution-${executionId}.json`);
      const execution = await this.readJSON<BackupExecution>(executionPath);
      return { success: true, execution };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to load backup execution: ${error.message}`,
      };
    }
  }

  /**
   * List backup executions for a project
   */
  async listBackupExecutions(projectRef: string): Promise<{ success: boolean; executions?: BackupExecution[]; error?: string }> {
    try {
      const projectPaths = this.getProjectPaths(projectRef);
      const indexPath = path.join(projectPaths.metadata, 'executions-index.json');
      
      try {
        const index = await this.readJSON<{ executions: BackupExecution[] }>(indexPath);
        return { success: true, executions: index.executions || [] };
      } catch {
        // If index doesn't exist, scan directory
        const files = await fs.readdir(projectPaths.metadata);
        const executions: BackupExecution[] = [];
        
        for (const file of files) {
          if (file.startsWith('execution-') && file.endsWith('.json')) {
            try {
              const executionPath = path.join(projectPaths.metadata, file);
              const execution = await this.readJSON<BackupExecution>(executionPath);
              executions.push(execution);
            } catch (error) {
              console.warn(`Skipping invalid execution file: ${file}`);
            }
          }
        }
        
        // Sort by date descending
        executions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        return { success: true, executions };
      }
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to list backup executions: ${error.message}`,
      };
    }
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath: string): Promise<{ success: boolean; checksum?: string; error?: string }> {
    try {
      const data = await fs.readFile(filePath);
      const checksum = createHash('sha256').update(data).digest('hex');
      return { success: true, checksum };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to calculate checksum: ${error.message}`,
      };
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<{ success: boolean; stats?: FileStats; error?: string }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        stats: {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get file stats: ${error.message}`,
      };
    }
  }

  /**
   * Clean up old backup files based on retention policy
   */
  async cleanupOldBackups(projectRef: string, retentionDays: number): Promise<{ success: boolean; deletedFiles?: number; error?: string }> {
    try {
      const projectPaths = this.getProjectPaths(projectRef);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let deletedFiles = 0;
      const directories = [projectPaths.backups, projectPaths.schemas, projectPaths.data];
      
      for (const directory of directories) {
        try {
          const files = await fs.readdir(directory);
          
          for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedFiles++;
            }
          }
        } catch (error) {
          // Directory might not exist, skip
          continue;
        }
      }
      
      return { success: true, deletedFiles };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to cleanup old backups: ${error.message}`,
      };
    }
  }

  /**
   * Get storage usage for a project
   */
  async getProjectStorageUsage(projectRef: string): Promise<{ success: boolean; usage?: any; error?: string }> {
    try {
      const projectPaths = this.getProjectPaths(projectRef);
      
      const usage = {
        total: 0,
        backups: 0,
        schemas: 0,
        data: 0,
        metadata: 0,
        logs: 0,
      };
      
      for (const [key, dirPath] of Object.entries(projectPaths)) {
        if (key === 'base') continue;
        
        try {
          const size = await this.getDirectorySize(dirPath);
          usage[key as keyof typeof usage] = size;
          usage.total += size;
        } catch (error) {
          // Directory might not exist
          usage[key as keyof typeof usage] = 0;
        }
      }
      
      return { success: true, usage };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get storage usage: ${error.message}`,
      };
    }
  }

  // Private helper methods
  private async writeJSON(filePath: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf8');
  }

  private async readJSON<T>(filePath: string): Promise<T> {
    const jsonString = await fs.readFile(filePath, 'utf8');
    return JSON.parse(jsonString) as T;
  }

  private async updateExecutionIndex(execution: BackupExecution): Promise<void> {
    const projectPaths = this.getProjectPaths(execution.projectId);
    const indexPath = path.join(projectPaths.metadata, 'executions-index.json');
    
    let index: { executions: BackupExecution[] } = { executions: [] };
    
    try {
      index = await this.readJSON<{ executions: BackupExecution[] }>(indexPath);
    } catch {
      // Index doesn't exist yet
    }
    
    // Remove existing execution with same ID and add updated one
    index.executions = index.executions.filter(e => e.id !== execution.id);
    index.executions.push(execution);
    
    // Sort by date descending and keep only last 100 entries
    index.executions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    index.executions = index.executions.slice(0, 100);
    
    await this.writeJSON(indexPath, index);
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch {
      // Directory doesn't exist or is inaccessible
      return 0;
    }
    
    return totalSize;
  }

  private maskKey(key: string): string {
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  }
}

// Export singleton instance
export const fileManager = FileManager.getInstance(); 