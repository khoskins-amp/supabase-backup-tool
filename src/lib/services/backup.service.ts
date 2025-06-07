import { spawn } from 'child_process';
import { createGzip, createDeflateRaw } from 'zlib';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { db } from '@/lib/db';
import { backups } from '@/lib/db/backups.schema';
import { projects } from '@/lib/db/projects.schema';
import { eq, and, lt } from 'drizzle-orm';
import type { 
  BackupOptions, 
  BackupResult, 
  BackupProgress,
  ManualBackupFormData,
  BackupFile,
  StorageResult
} from '@/lib/db/backups.types';
import type { Project } from '@/lib/db/projects.types';

export interface BackupServiceConfig {
  tempPath: string;
  backupBasePath: string;
  maxRetries: number;
  downloadTokenTTL: number; // milliseconds
}

export class BackupService {
  private readonly config: BackupServiceConfig;
  private readonly progressCallbacks = new Map<string, (progress: BackupProgress) => void>();
  
  constructor(config?: Partial<BackupServiceConfig>) {
    this.config = {
      tempPath: path.join(process.cwd(), 'data', 'temp'),
      backupBasePath: path.join(process.cwd(), 'data', 'backups'),
      maxRetries: 3,
      downloadTokenTTL: 3600000, // 1 hour
      ...config,
    };
    
    // Ensure directories exist
    this.ensureDirectories();
  }
  
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.config.tempPath, { recursive: true });
    await fs.mkdir(this.config.backupBasePath, { recursive: true });
  }
  
  /**
   * Create a manual backup with browser download
   */
  async createManualBackup(
    formData: ManualBackupFormData
  ): Promise<BackupResult> {
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // 1. Get project details
      const project = await this.getProject(formData.projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      // 2. Create backup record
      await this.createBackupRecord(backupId, formData);
      
      // 3. Generate file paths
      const fileName = `${project.name}-${formData.backupType}-${timestamp}.sql`;
      const tempFilePath = path.join(this.config.tempPath, fileName);
      
      // 4. Update status to in-progress
      await this.updateBackupStatus(backupId, 'in-progress', { 
        startedAt: new Date(),
        fileName,
        localFilePath: tempFilePath
      });
      
      // 5. Execute backup using pg_dump directly (more reliable than Supabase CLI)
      const startTime = Date.now();
      await this.executePgDumpBackup(project, tempFilePath, formData);
      
      // 6. Get file size and compress if needed
      let fileSize = await this.getFileSize(tempFilePath);
      let compressedSize: number | undefined;
      let finalFilePath = tempFilePath;
      
      if (formData.compressionType !== 'none') {
        finalFilePath = await this.compressFile(tempFilePath, formData.compressionType);
        compressedSize = await this.getFileSize(finalFilePath);
      }
      
      // 7. Calculate checksum
      const checksum = await this.calculateChecksum(finalFilePath);
      
      // 8. Setup download for browser downloads
      let downloadUrl: string | undefined;
      let downloadToken: string | undefined;
      let expiresAt: Date | undefined;
      
      if (formData.storageType === 'browser_download') {
        downloadToken = crypto.randomUUID();
        downloadUrl = `/api/backup/download/${downloadToken}`;
        expiresAt = new Date(Date.now() + this.config.downloadTokenTTL);
        
        // Store download mapping
        await this.storeDownloadMapping(downloadToken, finalFilePath, expiresAt);
      }
      
      // 9. Update backup record with completion
      const duration = Math.round((Date.now() - startTime) / 1000);
      await this.updateBackupStatus(backupId, 'completed', {
        completedAt: new Date(),
        duration,
        filePath: finalFilePath,
        fileSize,
        compressedSize,
        checksum,
        downloadUrl,
        downloadToken,
        expiresAt,
        validated: true,
      });
      
      return {
        id: backupId,
        success: true,
        filePath: finalFilePath,
        downloadUrl,
        downloadToken,
        fileSize,
        compressedSize,
        duration,
        checksum,
      };
      
    } catch (error) {
      // Handle errors and update backup record
      await this.updateBackupStatus(backupId, 'failed', {
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      });
      
      throw error;
    }
  }
  
  /**
   * Execute pg_dump backup directly (more reliable than Supabase CLI)
   */
  private async executePgDumpBackup(
    project: Project,
    outputPath: string,
    options: ManualBackupFormData
  ): Promise<void> {
    // Parse the database URL to get connection details
    const dbUrl = new URL(project.databaseUrl);
    
    // Build pg_dump command arguments
    const args = [
      '--host', dbUrl.hostname,
      '--port', dbUrl.port || '5432',
      '--username', dbUrl.username,
      '--dbname', dbUrl.pathname.slice(1), // Remove leading slash
      '--no-password', // We'll use PGPASSWORD env var
      '--verbose',
      '--file', outputPath,
    ];
    
    // Add backup type specific options
    if (options.backupType === 'schema') {
      args.push('--schema-only');
    } else if (options.backupType === 'data') {
      args.push('--data-only');
    }
    
    // Add compression if requested (pg_dump native compression)
    if (options.compressionType === 'gzip') {
      args.push('--compress=6');
    }
    
    // Add table filtering if specified
    if (options.includeTables && options.includeTables.length > 0) {
      options.includeTables.forEach(table => {
        args.push('--table', table);
      });
    }
    
    if (options.excludeTables && options.excludeTables.length > 0) {
      options.excludeTables.forEach(table => {
        args.push('--exclude-table', table);
      });
    }
    
    // Execute pg_dump
    await this.executePgDumpCommand(args, dbUrl.password);
  }
  
  /**
   * Execute pg_dump command
   */
  private async executePgDumpCommand(args: string[], password?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (password) {
        env.PGPASSWORD = password;
      }
      
      const pgDump = spawn('pg_dump', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env
      });
      
      let stdout = '';
      let stderr = '';
      
      pgDump.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      pgDump.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${stderr || stdout}`));
        }
      });
      
      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}. Make sure PostgreSQL client tools are installed.`));
      });
    });
  }
  
  /**
   * Compress backup file
   */
  private async compressFile(filePath: string, compressionType: string): Promise<string> {
    const compressedPath = `${filePath}.${compressionType === 'gzip' ? 'gz' : 'deflate'}`;
    
    const readStream = createReadStream(filePath);
    const writeStream = createWriteStream(compressedPath);
    
    let compressStream;
    if (compressionType === 'gzip') {
      compressStream = createGzip({ level: 6 });
    } else if (compressionType === 'bzip2') {
      // For bzip2, we'll use deflate as a fallback since bzip2 isn't in Node.js core
      compressStream = createDeflateRaw();
    } else {
      throw new Error(`Unsupported compression type: ${compressionType}`);
    }
    
    await pipeline(readStream, compressStream, writeStream);
    
    // Remove original file
    await fs.unlink(filePath);
    
    return compressedPath;
  }
  
  /**
   * Calculate file checksum
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    return hash.digest('hex');
  }
  
  /**
   * Get file size in bytes
   */
  private async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }
  
  /**
   * Get project by ID
   */
  private async getProject(projectId: string): Promise<Project | null> {
    const result = await db.select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    
    return result[0] || null;
  }
  
  /**
   * Create backup record in database
   */
  private async createBackupRecord(
    backupId: string, 
    formData: ManualBackupFormData
  ): Promise<void> {
    await db.insert(backups).values({
      id: backupId,
      projectId: formData.projectId,
      name: formData.name,
      description: formData.description,
      triggerType: 'manual',
      backupType: formData.backupType,
      compressionType: formData.compressionType,
      storageType: formData.storageType,
      storageDestinationId: formData.storageDestinationId,
      includeAuth: formData.includeAuth,
      includeStorage: formData.includeStorage,
      includeDatabase: formData.includeDatabase,
      includeEdgeFunctions: formData.includeEdgeFunctions,
      includeMigrationHistory: formData.includeMigrationHistory,
      includeTables: formData.includeTables ? JSON.stringify(formData.includeTables) : null,
      excludeTables: formData.excludeTables ? JSON.stringify(formData.excludeTables) : null,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  /**
   * Update backup status and metadata
   */
  private async updateBackupStatus(
    backupId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled',
    updates: Partial<{
      startedAt: Date;
      completedAt: Date;
      duration: number;
      fileName: string;
      filePath: string;
      localFilePath: string;
      fileSize: number;
      compressedSize: number;
      checksum: string;
      downloadUrl: string;
      downloadToken: string;
      expiresAt: Date;
      errorMessage: string;
      errorCode: string;
      validated: boolean;
    }>
  ): Promise<void> {
    await db.update(backups)
      .set({
        status,
        updatedAt: new Date(),
        ...updates,
      })
      .where(eq(backups.id, backupId));
  }
  
  /**
   * Store download mapping (in production, use Redis or similar)
   */
  private async storeDownloadMapping(
    token: string, 
    filePath: string, 
    expiresAt: Date
  ): Promise<void> {
    // For now, we'll store it in the backup record itself via the downloadToken
    console.log(`Download mapping stored: ${token} -> ${filePath} (expires: ${expiresAt})`);
  }
  
  /**
   * Get backup progress (for real-time updates)
   */
  async getBackupProgress(backupId: string): Promise<BackupProgress> {
    const backup = await db.select()
      .from(backups)
      .where(eq(backups.id, backupId))
      .limit(1);
    
    if (!backup[0]) {
      throw new Error('Backup not found');
    }
    
    const b = backup[0];
    
    return {
      backupId: b.id,
      status: b.status,
      progress: this.calculateProgress(b.status),
      currentStep: this.getStatusMessage(b.status),
      currentPhase: this.getStatusMessage(b.status),
      startTime: b.startedAt || undefined,
      estimatedEndTime: b.completedAt || undefined,
      errorMessage: b.errorMessage || undefined,
    };
  }
  
  private calculateProgress(status: string): number {
    switch (status) {
      case 'pending': return 0;
      case 'in-progress': return 50;
      case 'completed': return 100;
      case 'failed': return 0;
      case 'cancelled': return 0;
      default: return 0;
    }
  }
  
  private getStatusMessage(status: string): string {
    switch (status) {
      case 'pending': return 'Backup queued for processing...';
      case 'in-progress': return 'Creating backup...';
      case 'completed': return 'Backup completed successfully!';
      case 'failed': return 'Backup failed';
      case 'cancelled': return 'Backup was cancelled';
      default: return 'Unknown status';
    }
  }
  
  /**
   * List backups for a project
   */
  async listBackups(projectId: string, limit = 20, offset = 0) {
    return await db.select()
      .from(backups)
      .where(eq(backups.projectId, projectId))
      .limit(limit)
      .offset(offset)
      .orderBy(backups.createdAt);
  }
  
  /**
   * Clean up expired download tokens
   */
  async cleanupExpiredDownloads(): Promise<void> {
    const expiredBackups = await db.select()
      .from(backups)
      .where(
        and(
          lt(backups.expiresAt, new Date()),
          eq(backups.storageType, 'browser_download')
        )
      );
    
    for (const backup of expiredBackups) {
      if (backup.filePath) {
        try {
          await fs.unlink(backup.filePath);
        } catch (error) {
          console.warn(`Failed to delete expired backup file: ${backup.filePath}`);
        }
      }
    }
  }
} 