# Backup Implementation Plan

Detailed technical implementation strategy for the core backup functionality in the Supabase Backup Tool.

## 🎯 Implementation Overview

This document outlines the step-by-step technical implementation of backup functionality, from database schema to user interface.

## 📊 Database Schema Implementation

### 1. Backup Records Schema

```typescript
// src/lib/db/backups.schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { projects } from './projects.schema'

export const backups = sqliteTable('backups', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  
  // Backup metadata
  backupType: text('backup_type', { enum: ['full', 'schema', 'data', 'incremental'] }).notNull(),
  name: text('name').notNull(), // User-friendly name
  description: text('description'),
  
  // File information
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'), // Original size in bytes
  compressedSize: integer('compressed_size'), // Compressed size in bytes
  compressionType: text('compression_type', { enum: ['none', 'gzip', 'bzip2'] }).default('gzip'),
  
  // Backup status and timing
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] }).notNull().default('pending'),
  startTime: integer('start_time', { mode: 'timestamp' }),
  endTime: integer('end_time', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  
  // Error handling
  errorMessage: text('error_message'),
  errorCode: text('error_code'),
  retryCount: integer('retry_count').default(0),
  
  // Backup configuration
  includeSchema: integer('include_schema', { mode: 'boolean' }).default(true),
  includeData: integer('include_data', { mode: 'boolean' }).default(true),
  includeTables: text('include_tables'), // JSON array of table names
  excludeTables: text('exclude_tables'), // JSON array of table names
  
  // Checksums and validation
  checksum: text('checksum'), // File integrity checksum
  validated: integer('validated', { mode: 'boolean' }).default(false),
  validationErrors: text('validation_errors'),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  projectIdIdx: index('backups_project_id_idx').on(table.projectId),
  statusIdx: index('backups_status_idx').on(table.status),
  createdAtIdx: index('backups_created_at_idx').on(table.createdAt),
}))
```

### 2. Backup Jobs Schema

```typescript
// src/lib/db/backup-jobs.schema.ts
export const backupJobs = sqliteTable('backup_jobs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  
  // Job configuration
  name: text('name').notNull(),
  description: text('description'),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  
  // Scheduling
  scheduleType: text('schedule_type', { enum: ['cron', 'interval', 'manual'] }).notNull(),
  cronExpression: text('cron_expression'),
  intervalMinutes: integer('interval_minutes'),
  timezone: text('timezone').default('UTC'),
  
  // Backup configuration
  backupType: text('backup_type', { enum: ['full', 'schema', 'data'] }).notNull().default('full'),
  compressionType: text('compression_type', { enum: ['none', 'gzip', 'bzip2'] }).default('gzip'),
  retentionDays: integer('retention_days').default(30),
  
  // Execution tracking
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  lastRunStatus: text('last_run_status', { enum: ['success', 'failed', 'cancelled'] }),
  lastRunBackupId: text('last_run_backup_id'),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  
  // Statistics
  totalRuns: integer('total_runs').default(0),
  successfulRuns: integer('successful_runs').default(0),
  failedRuns: integer('failed_runs').default(0),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  projectIdIdx: index('backup_jobs_project_id_idx').on(table.projectId),
  enabledIdx: index('backup_jobs_enabled_idx').on(table.enabled),
  nextRunAtIdx: index('backup_jobs_next_run_at_idx').on(table.nextRunAt),
}))
```

## 🔧 Core Service Implementation

### 1. Backup Service Class

```typescript
// src/lib/services/backup.service.ts
import { spawn } from 'child_process'
import { createGzip, createBrotliCompress } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { db } from '@/lib/db'
import { backups, projects } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export interface BackupOptions {
  backupType: 'full' | 'schema' | 'data'
  compressionType: 'none' | 'gzip' | 'bzip2'
  includeTables?: string[]
  excludeTables?: string[]
  includeSchema?: boolean
  includeData?: boolean
}

export interface BackupResult {
  id: string
  filePath: string
  fileSize: number
  compressedSize?: number
  duration: number
  success: boolean
  error?: string
}

export class BackupService {
  private readonly backupBasePath = './data/backups'
  private readonly tempPath = './data/temp'
  
  async createBackup(projectId: string, options: BackupOptions): Promise<BackupResult> {
    const backupId = crypto.randomUUID()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    try {
      // 1. Get project details
      const project = await this.getProject(projectId)
      if (!project) {
        throw new Error('Project not found')
      }
      
      // 2. Create backup record
      await this.createBackupRecord(backupId, projectId, options)
      
      // 3. Generate file paths
      const fileName = `${project.name}-${options.backupType}-${timestamp}.sql`
      const tempFilePath = `${this.tempPath}/${fileName}`
      const finalFilePath = `${this.backupBasePath}/${projectId}/database/${options.backupType}/${fileName}`
      
      // 4. Update status to running
      await this.updateBackupStatus(backupId, 'running', { startTime: new Date() })
      
      // 5. Execute backup
      const startTime = Date.now()
      await this.executePgDump(project, tempFilePath, options)
      
      // 6. Compress file if needed
      let finalSize = await this.getFileSize(tempFilePath)
      let compressedSize: number | undefined
      
      if (options.compressionType !== 'none') {
        const compressedPath = await this.compressFile(tempFilePath, options.compressionType)
        compressedSize = await this.getFileSize(compressedPath)
        finalSize = compressedSize
      }
      
      // 7. Move to final location
      await this.moveFile(tempFilePath, finalFilePath)
      
      // 8. Calculate checksum
      const checksum = await this.calculateChecksum(finalFilePath)
      
      // 9. Update backup record
      const duration = Date.now() - startTime
      await this.updateBackupStatus(backupId, 'completed', {
        endTime: new Date(),
        duration,
        filePath: finalFilePath,
        fileSize: finalSize,
        compressedSize,
        checksum,
      })
      
      return {
        id: backupId,
        filePath: finalFilePath,
        fileSize: finalSize,
        compressedSize,
        duration,
        success: true,
      }
      
    } catch (error) {
      // Handle errors and update backup record
      await this.updateBackupStatus(backupId, 'failed', {
        endTime: new Date(),
        errorMessage: error.message,
        errorCode: error.code,
      })
      
      throw error
    }
  }
  
  private async executePgDump(
    project: Project, 
    outputPath: string, 
    options: BackupOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = this.buildPgDumpArgs(project.databaseUrl, options)
      
      const pgDump = spawn('pg_dump', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      const writeStream = createWriteStream(outputPath)
      
      pgDump.stdout.pipe(writeStream)
      
      let errorOutput = ''
      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`))
        }
      })
      
      pgDump.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`))
      })
    })
  }
  
  private buildPgDumpArgs(databaseUrl: string, options: BackupOptions): string[] {
    const args = [databaseUrl, '--no-password', '--verbose']
    
    // Add options based on backup type
    switch (options.backupType) {
      case 'schema':
        args.push('--schema-only')
        break
      case 'data':
        args.push('--data-only')
        break
      case 'full':
      default:
        // Include both schema and data (default)
        break
    }
    
    // Add table inclusion/exclusion
    if (options.includeTables?.length) {
      options.includeTables.forEach(table => {
        args.push('--table', table)
      })
    }
    
    if (options.excludeTables?.length) {
      options.excludeTables.forEach(table => {
        args.push('--exclude-table', table)
      })
    }
    
    return args
  }
  
  private async compressFile(filePath: string, compressionType: string): Promise<string> {
    const compressedPath = `${filePath}.${compressionType === 'gzip' ? 'gz' : 'bz2'}`
    
    const readStream = createReadStream(filePath)
    const writeStream = createWriteStream(compressedPath)
    
    let compressStream
    if (compressionType === 'gzip') {
      compressStream = createGzip({ level: 6 })
    } else if (compressionType === 'bzip2') {
      compressStream = createBrotliCompress()
    } else {
      throw new Error(`Unsupported compression type: ${compressionType}`)
    }
    
    await pipeline(readStream, compressStream, writeStream)
    
    // Remove original file
    await fs.unlink(filePath)
    
    return compressedPath
  }
  
  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256')
    const stream = createReadStream(filePath)
    
    for await (const chunk of stream) {
      hash.update(chunk)
    }
    
    return hash.digest('hex')
  }
  
  async validateBackup(backupId: string): Promise<boolean> {
    const backup = await db.select().from(backups).where(eq(backups.id, backupId)).get()
    
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    // Check file exists
    const fileExists = await fs.access(backup.filePath).then(() => true).catch(() => false)
    if (!fileExists) {
      return false
    }
    
    // Verify checksum
    const currentChecksum = await this.calculateChecksum(backup.filePath)
    const isValid = currentChecksum === backup.checksum
    
    // Update validation status
    await db.update(backups)
      .set({ 
        validated: true, 
        validationErrors: isValid ? null : 'Checksum mismatch' 
      })
      .where(eq(backups.id, backupId))
    
    return isValid
  }
  
  async cleanupExpiredBackups(projectId: string, retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    const expiredBackups = await db.select()
      .from(backups)
      .where(
        and(
          eq(backups.projectId, projectId),
          lt(backups.createdAt, cutoffDate)
        )
      )
    
    for (const backup of expiredBackups) {
      try {
        // Delete file
        await fs.unlink(backup.filePath)
        
        // Delete record
        await db.delete(backups).where(eq(backups.id, backup.id))
        
      } catch (error) {
        console.error(`Failed to cleanup backup ${backup.id}:`, error)
      }
    }
  }
}
```

### 2. Progress Tracking Service

```typescript
// src/lib/services/backup-progress.service.ts
export class BackupProgressService {
  private progressCallbacks = new Map<string, (progress: BackupProgress) => void>()
  
  async trackBackupProgress(backupId: string, callback: (progress: BackupProgress) => void): Promise<void> {
    this.progressCallbacks.set(backupId, callback)
    
    // Start monitoring
    const interval = setInterval(async () => {
      const progress = await this.getBackupProgress(backupId)
      callback(progress)
      
      if (progress.status === 'completed' || progress.status === 'failed') {
        clearInterval(interval)
        this.progressCallbacks.delete(backupId)
      }
    }, 1000)
  }
  
  private async getBackupProgress(backupId: string): Promise<BackupProgress> {
    const backup = await db.select().from(backups).where(eq(backups.id, backupId)).get()
    
    if (!backup) {
      throw new Error('Backup not found')
    }
    
    let progress = 0
    if (backup.status === 'running' && backup.filePath) {
      // Estimate progress based on file size (rough estimate)
      try {
        const currentSize = await this.getFileSize(backup.filePath)
        progress = Math.min((currentSize / (backup.fileSize || 1)) * 100, 95)
      } catch {
        progress = 0
      }
    } else if (backup.status === 'completed') {
      progress = 100
    }
    
    return {
      backupId,
      status: backup.status,
      progress,
      startTime: backup.startTime,
      estimatedEndTime: this.calculateEstimatedEndTime(backup),
      currentPhase: this.getCurrentPhase(backup.status),
      errorMessage: backup.errorMessage,
    }
  }
}
```

## 🎨 UI Components Implementation

### 1. Backup Creation Form

```typescript
// src/components/backup-create-form.tsx
export function BackupCreateForm({ projectId, onSuccess }: BackupCreateFormProps) {
  const [formData, setFormData] = useState({
    backupType: 'full' as const,
    compressionType: 'gzip' as const,
    name: '',
    description: '',
    includeTables: [] as string[],
    excludeTables: [] as string[],
  })
  
  const createBackupMutation = useMutation(trpc.backups.create.mutationOptions({
    onSuccess: (data) => {
      onSuccess?.(data)
      // Start progress tracking
      trackBackupProgress(data.id)
    }
  }))
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createBackupMutation.mutate({
      projectId,
      ...formData,
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Backup</CardTitle>
        <CardDescription>
          Create a new backup of your Supabase project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Backup type selection */}
          <div className="space-y-2">
            <Label>Backup Type</Label>
            <Select 
              value={formData.backupType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, backupType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Backup (Schema + Data)</SelectItem>
                <SelectItem value="schema">Schema Only</SelectItem>
                <SelectItem value="data">Data Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Compression options */}
          <div className="space-y-2">
            <Label>Compression</Label>
            <Select 
              value={formData.compressionType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, compressionType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gzip">Gzip (Recommended)</SelectItem>
                <SelectItem value="bzip2">Bzip2 (Higher Compression)</SelectItem>
                <SelectItem value="none">No Compression</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Name and description */}
          <div className="space-y-2">
            <Label htmlFor="name">Backup Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter backup name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this backup"
              rows={2}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={createBackupMutation.isPending}
            className="w-full"
          >
            {createBackupMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Create Backup
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 2. Backup Progress Component

```typescript
// src/components/backup-progress.tsx
export function BackupProgress({ backupId }: BackupProgressProps) {
  const [progress, setProgress] = useState<BackupProgressData | null>(null)
  
  useEffect(() => {
    const progressService = new BackupProgressService()
    
    progressService.trackBackupProgress(backupId, (progressData) => {
      setProgress(progressData)
    })
  }, [backupId])
  
  if (!progress) return <Skeleton className="h-24 w-full" />
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Backup Progress</h3>
            <Badge variant={progress.status === 'completed' ? 'default' : 'secondary'}>
              {progress.status}
            </Badge>
          </div>
          
          <Progress value={progress.progress} className="w-full" />
          
          <div className="text-sm text-muted-foreground">
            <p>Phase: {progress.currentPhase}</p>
            {progress.estimatedEndTime && (
              <p>Estimated completion: {formatTime(progress.estimatedEndTime)}</p>
            )}
          </div>
          
          {progress.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{progress.errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

## 🔄 tRPC Router Implementation

```typescript
// src/lib/trpc/routers/backups.router.ts
export const backupsRouter = router({
  // List backups for a project
  list: publicProcedure
    .input(z.object({
      projectId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
    }))
    .query(async ({ input }) => {
      const { projectId, limit, offset, status } = input
      
      let query = db.select().from(backups).where(eq(backups.projectId, projectId))
      
      if (status) {
        query = query.where(eq(backups.status, status))
      }
      
      const results = await query
        .orderBy(desc(backups.createdAt))
        .limit(limit)
        .offset(offset)
      
      return results
    }),
  
  // Create a new backup
  create: publicProcedure
    .input(createBackupSchema)
    .mutation(async ({ input }) => {
      const backupService = new BackupService()
      
      try {
        const result = await backupService.createBackup(input.projectId, {
          backupType: input.backupType,
          compressionType: input.compressionType,
          includeTables: input.includeTables,
          excludeTables: input.excludeTables,
        })
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }),
  
  // Get backup progress
  getProgress: publicProcedure
    .input(z.object({ backupId: z.string() }))
    .query(async ({ input }) => {
      const progressService = new BackupProgressService()
      return await progressService.getBackupProgress(input.backupId)
    }),
  
  // Delete a backup
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Implementation for backup deletion
    }),
})
```

## 📈 Implementation Timeline

### Week 1: Foundation
- [ ] Database schema creation and migration
- [ ] Basic BackupService class structure
- [ ] File system organization setup
- [ ] Initial tRPC endpoints

### Week 2: Core Functionality
- [ ] pg_dump integration
- [ ] File compression implementation
- [ ] Progress tracking system
- [ ] Error handling and validation

### Week 3: UI Components
- [ ] Backup creation form
- [ ] Progress tracking interface
- [ ] Backup history list
- [ ] Action buttons (download, delete)

### Week 4: Testing & Polish
- [ ] Unit tests for backup service
- [ ] Integration tests
- [ ] Error scenario testing
- [ ] Performance optimization

## 🎯 Success Criteria

- [ ] Successfully create database backups using pg_dump
- [ ] Store and organize backup files properly
- [ ] Display real-time progress to users
- [ ] Handle errors gracefully with clear messages
- [ ] Compress backups to save storage space
- [ ] Validate backup integrity with checksums

This implementation plan provides the foundation for a robust backup system that can be extended with scheduling, restore functionality, and advanced features in future phases. 