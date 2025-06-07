# Backup Storage Architecture

Comprehensive storage strategy for the Supabase Backup Tool addressing multiple storage destinations and backup flow requirements.

## 🎯 **Storage Requirements Analysis**

### **Core Problems to Solve**:
1. **No server storage**: Avoid storing backups on the application server
2. **Multiple storage options**: Support cloud storage, local mapped storage, and direct downloads
3. **User configurability**: Allow users to choose and configure backup destinations
4. **Docker compatibility**: Support containerized deployments with volume mounts
5. **Manual vs Scheduled**: Different workflows for manual and automated backups

## 🏗️ **Storage Destination Architecture**

### **1. Storage Provider Interface**

```typescript
// src/lib/storage/storage-provider.interface.ts
export interface StorageProvider {
  readonly type: StorageType
  readonly name: string
  
  // Core operations
  upload(file: BackupFile, destination: string): Promise<StorageResult>
  download(filePath: string): Promise<Buffer>
  delete(filePath: string): Promise<void>
  list(prefix?: string): Promise<StorageItem[]>
  
  // Health checks
  validateConnection(): Promise<boolean>
  getAvailableSpace(): Promise<number>
  
  // Configuration
  configure(config: StorageConfig): Promise<void>
}

export enum StorageType {
  S3_COMPATIBLE = 's3',
  GOOGLE_DRIVE = 'google_drive', 
  NEXTCLOUD = 'nextcloud',
  LOCAL_MAPPED = 'local_mapped',
  BROWSER_DOWNLOAD = 'browser_download'
}

export interface BackupFile {
  id: string
  fileName: string
  filePath: string
  size: number
  checksum: string
  contentType: string
  metadata: Record<string, any>
}
```

### **2. Storage Configuration Schema**

```typescript
// src/lib/db/storage-destinations.schema.ts
export const storageDestinations = sqliteTable('storage_destinations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['s3', 'google_drive', 'nextcloud', 'local_mapped'] }).notNull(),
  
  // Configuration (encrypted JSON)
  config: text('config').notNull(), // Encrypted storage config
  
  // Status and validation
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  lastValidated: integer('last_validated', { mode: 'timestamp' }),
  validationStatus: text('validation_status', { enum: ['valid', 'invalid', 'pending'] }),
  validationError: text('validation_error'),
  
  // Usage tracking
  totalBackups: integer('total_backups').default(0),
  totalSize: integer('total_size').default(0),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  nameIdx: index('storage_destinations_name_idx').on(table.name),
  typeIdx: index('storage_destinations_type_idx').on(table.type),
}))

// Updated backups schema to include storage destination
export const backups = sqliteTable('backups', {
  // ... existing fields ...
  
  // Storage information
  storageDestinationId: text('storage_destination_id').references(() => storageDestinations.id),
  storageFilePath: text('storage_file_path'), // Path in the storage system
  localFilePath: text('local_file_path'), // Temporary local path (for processing)
  downloadUrl: text('download_url'), // For browser downloads
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // For temporary downloads
  
  // ... rest of existing fields ...
})
```

### **3. Storage Provider Implementations**

#### **S3-Compatible Storage (R2, AWS S3, MinIO)**

```typescript
// src/lib/storage/providers/s3-provider.ts
export class S3StorageProvider implements StorageProvider {
  readonly type = StorageType.S3_COMPATIBLE
  readonly name = 'S3 Compatible Storage'
  
  private s3Client: S3Client
  private config: S3Config
  
  constructor(config: S3Config) {
    this.config = config
    this.s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint, // For R2/MinIO
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle, // Required for MinIO
    })
  }
  
  async upload(file: BackupFile, destination: string): Promise<StorageResult> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: destination,
      Body: await fs.readFile(file.filePath),
      ContentType: file.contentType,
      Metadata: {
        'backup-id': file.id,
        'checksum': file.checksum,
        'original-filename': file.fileName,
      },
    })
    
    const result = await this.s3Client.send(command)
    
    return {
      success: true,
      storagePath: destination,
      url: `https://${this.config.bucket}.${this.config.endpoint}/${destination}`,
      etag: result.ETag,
    }
  }
  
  async validateConnection(): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.config.bucket }))
      return true
    } catch {
      return false
    }
  }
}

interface S3Config {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle?: boolean
  prefix?: string // Optional path prefix
}
```

#### **Google Drive Provider**

```typescript
// src/lib/storage/providers/google-drive-provider.ts
export class GoogleDriveProvider implements StorageProvider {
  readonly type = StorageType.GOOGLE_DRIVE
  readonly name = 'Google Drive'
  
  private drive: drive_v3.Drive
  private config: GoogleDriveConfig
  
  constructor(config: GoogleDriveConfig) {
    this.config = config
    const auth = new google.auth.GoogleAuth({
      credentials: config.serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
    
    this.drive = google.drive({ version: 'v3', auth })
  }
  
  async upload(file: BackupFile, destination: string): Promise<StorageResult> {
    const media = {
      mimeType: file.contentType,
      body: fs.createReadStream(file.filePath),
    }
    
    const response = await this.drive.files.create({
      requestBody: {
        name: destination,
        parents: [this.config.folderId],
        description: `Backup: ${file.id}`,
      },
      media,
    })
    
    return {
      success: true,
      storagePath: response.data.id!,
      url: `https://drive.google.com/file/d/${response.data.id}/view`,
      metadata: response.data,
    }
  }
}

interface GoogleDriveConfig {
  serviceAccountKey: any // Service account JSON
  folderId: string // Google Drive folder ID
}
```

#### **Nextcloud Provider**

```typescript
// src/lib/storage/providers/nextcloud-provider.ts
export class NextcloudProvider implements StorageProvider {
  readonly type = StorageType.NEXTCLOUD
  readonly name = 'Nextcloud'
  
  private client: NextcloudClient
  private config: NextcloudConfig
  
  constructor(config: NextcloudConfig) {
    this.config = config
    this.client = new NextcloudClient({
      url: config.serverUrl,
      username: config.username,
      password: config.password,
    })
  }
  
  async upload(file: BackupFile, destination: string): Promise<StorageResult> {
    const remotePath = `${this.config.basePath}/${destination}`
    const fileStream = fs.createReadStream(file.filePath)
    
    await this.client.putFileContents(remotePath, fileStream)
    
    return {
      success: true,
      storagePath: remotePath,
      url: `${this.config.serverUrl}/f/${remotePath}`,
    }
  }
  
  async validateConnection(): Promise<boolean> {
    try {
      await this.client.getQuota()
      return true
    } catch {
      return false
    }
  }
}

interface NextcloudConfig {
  serverUrl: string
  username: string
  password: string
  basePath: string // Base directory path
}
```

#### **Local Mapped Storage Provider**

```typescript
// src/lib/storage/providers/local-mapped-provider.ts
export class LocalMappedProvider implements StorageProvider {
  readonly type = StorageType.LOCAL_MAPPED
  readonly name = 'Local Mapped Storage'
  
  private config: LocalMappedConfig
  
  constructor(config: LocalMappedConfig) {
    this.config = config
  }
  
  async upload(file: BackupFile, destination: string): Promise<StorageResult> {
    const targetPath = path.join(this.config.basePath, destination)
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(targetPath))
    
    // Copy file to mapped location
    await fs.copy(file.filePath, targetPath)
    
    return {
      success: true,
      storagePath: targetPath,
      url: `file://${targetPath}`,
    }
  }
  
  async validateConnection(): Promise<boolean> {
    try {
      await fs.access(this.config.basePath, fs.constants.W_OK)
      return true
    } catch {
      return false
    }
  }
  
  async getAvailableSpace(): Promise<number> {
    const stats = await fs.statvfs(this.config.basePath)
    return stats.bavail * stats.bsize
  }
}

interface LocalMappedConfig {
  basePath: string // Mapped volume or directory path
  maxSize?: number // Optional size limit
}
```

#### **Browser Download Provider**

```typescript
// src/lib/storage/providers/browser-download-provider.ts
export class BrowserDownloadProvider implements StorageProvider {
  readonly type = StorageType.BROWSER_DOWNLOAD
  readonly name = 'Browser Download'
  
  async upload(file: BackupFile, destination: string): Promise<StorageResult> {
    // For browser downloads, we create a temporary signed URL
    const downloadToken = crypto.randomUUID()
    const downloadUrl = `/api/backup/download/${downloadToken}`
    
    // Store mapping in temporary cache (Redis or in-memory with TTL)
    await this.storeDownloadMapping(downloadToken, file.filePath, 3600) // 1 hour TTL
    
    return {
      success: true,
      storagePath: file.filePath,
      url: downloadUrl,
      downloadToken,
    }
  }
  
  private async storeDownloadMapping(token: string, filePath: string, ttl: number): Promise<void> {
    // Implementation depends on your caching strategy
    // Could use Redis, or simple in-memory cache with cleanup
  }
}
```

## 🔄 **Backup Process Flow**

### **1. Manual Backup Process**

```typescript
// src/lib/services/backup-orchestrator.service.ts
export class BackupOrchestrator {
  async createManualBackup(
    projectId: string, 
    options: ManualBackupOptions
  ): Promise<BackupResult> {
    const backupId = crypto.randomUUID()
    
    try {
      // 1. Create backup record
      await this.createBackupRecord(backupId, projectId, options)
      
      // 2. Get project connection details
      const project = await this.getProject(projectId)
      
      // 3. Create temporary working directory
      const tempDir = await this.createTempDirectory(backupId)
      
      // 4. Execute Supabase CLI dumps
      await this.executeSupabaseDumps(project, tempDir, options)
      
      // 5. Compress backup files
      const compressedFile = await this.compressBackupFiles(tempDir, backupId)
      
      // 6. Determine storage destination
      const destination = await this.resolveStorageDestination(options)
      
      // 7. Upload to storage or prepare for download
      const storageResult = await this.uploadToStorage(compressedFile, destination, options)
      
      // 8. Update backup record with results
      await this.updateBackupRecord(backupId, storageResult)
      
      // 9. Cleanup temporary files
      await this.cleanupTempFiles(tempDir)
      
      return {
        backupId,
        success: true,
        downloadUrl: storageResult.url,
        size: compressedFile.size,
      }
      
    } catch (error) {
      await this.handleBackupError(backupId, error)
      throw error
    }
  }
  
  private async executeSupabaseDumps(
    project: Project, 
    tempDir: string, 
    options: BackupOptions
  ): Promise<void> {
    const dbUrl = project.databaseUrl
    
    // Execute the three main backup commands
    const commands = [
      `supabase db dump --db-url "${dbUrl}" -f "${tempDir}/roles.sql" --role-only`,
      `supabase db dump --db-url "${dbUrl}" -f "${tempDir}/schema.sql"`,
      `supabase db dump --db-url "${dbUrl}" -f "${tempDir}/data.sql" --use-copy --data-only`
    ]
    
    // Add migration history if requested
    if (options.includeMigrationHistory) {
      commands.push(
        `supabase db dump --db-url "${dbUrl}" -f "${tempDir}/history_schema.sql" --schema supabase_migrations`,
        `supabase db dump --db-url "${dbUrl}" -f "${tempDir}/history_data.sql" --use-copy --data-only --schema supabase_migrations`
      )
    }
    
    // Execute commands in parallel where possible
    await Promise.all(commands.map(cmd => this.executeCommand(cmd)))
  }
  
  private async resolveStorageDestination(options: ManualBackupOptions): Promise<StorageProvider> {
    if (options.storageType === 'browser_download') {
      return new BrowserDownloadProvider()
    }
    
    // Get configured storage destination
    const destination = await this.getStorageDestination(options.storageDestinationId)
    return this.createStorageProvider(destination)
  }
}
```

### **2. Storage Destination Management**

```typescript
// src/lib/services/storage-destination.service.ts
export class StorageDestinationService {
  async createDestination(config: CreateStorageDestinationRequest): Promise<StorageDestination> {
    // Validate configuration
    const provider = this.createProvider(config)
    const isValid = await provider.validateConnection()
    
    if (!isValid) {
      throw new Error('Unable to connect to storage destination')
    }
    
    // Encrypt sensitive configuration data
    const encryptedConfig = await this.encryptConfig(config.config)
    
    // Save to database
    const destination = await db.insert(storageDestinations).values({
      id: crypto.randomUUID(),
      name: config.name,
      type: config.type,
      config: encryptedConfig,
      validationStatus: 'valid',
      lastValidated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()
    
    return destination[0]
  }
  
  async testConnection(destinationId: string): Promise<ValidationResult> {
    const destination = await this.getDestination(destinationId)
    const provider = await this.createProviderFromDestination(destination)
    
    try {
      const isValid = await provider.validateConnection()
      const availableSpace = await provider.getAvailableSpace()
      
      // Update validation status
      await db.update(storageDestinations)
        .set({
          validationStatus: isValid ? 'valid' : 'invalid',
          lastValidated: new Date(),
          validationError: null,
        })
        .where(eq(storageDestinations.id, destinationId))
      
      return {
        valid: isValid,
        availableSpace,
        lastTested: new Date(),
      }
    } catch (error) {
      await db.update(storageDestinations)
        .set({
          validationStatus: 'invalid',
          validationError: error.message,
          lastValidated: new Date(),
        })
        .where(eq(storageDestinations.id, destinationId))
      
      return {
        valid: false,
        error: error.message,
        lastTested: new Date(),
      }
    }
  }
}
```

## 🎨 **UI Components for Storage Management**

### **1. Storage Destination Configuration**

```typescript
// src/components/storage/storage-destination-form.tsx
export function StorageDestinationForm({ onSuccess }: StorageDestinationFormProps) {
  const [storageType, setStorageType] = useState<StorageType>()
  const [config, setConfig] = useState<Record<string, any>>({})
  
  const createDestinationMutation = useMutation(trpc.storage.createDestination.mutationOptions({
    onSuccess: (data) => {
      toast.success('Storage destination created successfully')
      onSuccess?.(data)
    }
  }))
  
  const renderConfigForm = () => {
    switch (storageType) {
      case StorageType.S3_COMPATIBLE:
        return <S3ConfigForm config={config} onChange={setConfig} />
      case StorageType.GOOGLE_DRIVE:
        return <GoogleDriveConfigForm config={config} onChange={setConfig} />
      case StorageType.NEXTCLOUD:
        return <NextcloudConfigForm config={config} onChange={setConfig} />
      case StorageType.LOCAL_MAPPED:
        return <LocalMappedConfigForm config={config} onChange={setConfig} />
      default:
        return null
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Storage Destination</CardTitle>
        <CardDescription>
          Configure where your backups will be stored
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Storage type selection */}
          <div className="space-y-2">
            <Label>Storage Type</Label>
            <Select value={storageType} onValueChange={setStorageType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose storage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s3">S3 Compatible (AWS, R2, MinIO)</SelectItem>
                <SelectItem value="google_drive">Google Drive</SelectItem>
                <SelectItem value="nextcloud">Nextcloud</SelectItem>
                <SelectItem value="local_mapped">Local Mapped Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Dynamic configuration form */}
          {renderConfigForm()}
          
          <Button type="submit" disabled={createDestinationMutation.isPending}>
            {createDestinationMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Storage Destination
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### **2. Manual Backup Form with Storage Selection**

```typescript
// src/components/backup/manual-backup-form.tsx
export function ManualBackupForm({ projectId }: ManualBackupFormProps) {
  const [formData, setFormData] = useState({
    backupType: 'full' as const,
    storageType: 'browser_download' as const,
    storageDestinationId: '',
    compressionType: 'gzip' as const,
    includeMigrationHistory: true,
  })
  
  const { data: storageDestinations } = trpc.storage.listDestinations.useQuery()
  
  const createBackupMutation = useMutation(trpc.backups.createManual.mutationOptions({
    onSuccess: (data) => {
      if (data.downloadUrl) {
        // For browser downloads, trigger download
        if (formData.storageType === 'browser_download') {
          window.open(data.downloadUrl, '_blank')
        }
        toast.success('Backup created successfully')
      }
    }
  }))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Manual Backup</CardTitle>
        <CardDescription>
          Create a one-time backup of your Supabase project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Backup type */}
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
                <SelectItem value="full">Full Backup (Roles + Schema + Data)</SelectItem>
                <SelectItem value="schema">Schema Only</SelectItem>
                <SelectItem value="data">Data Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Storage destination */}
          <div className="space-y-2">
            <Label>Storage Destination</Label>
            <Select 
              value={formData.storageType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, storageType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browser_download">
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Direct Browser Download
                  </div>
                </SelectItem>
                {storageDestinations?.map(dest => (
                  <SelectItem key={dest.id} value={dest.id}>
                    <div className="flex items-center">
                      <Cloud className="h-4 w-4 mr-2" />
                      {dest.name} ({dest.type})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional options */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeMigrationHistory"
              checked={formData.includeMigrationHistory}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, includeMigrationHistory: checked }))
              }
            />
            <Label htmlFor="includeMigrationHistory">
              Include migration history
            </Label>
          </div>
          
          <Button type="submit" disabled={createBackupMutation.isPending}>
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

## 🐳 **Docker & Environment Configuration**

### **1. Docker Compose with Volume Mounts**

```yaml
# docker-compose.yml
version: '3.8'
services:
  supabase-backup-tool:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/app.db
      # Storage configuration via environment
      - DEFAULT_STORAGE_TYPE=local_mapped
      - LOCAL_STORAGE_PATH=/app/backup-storage
    volumes:
      # Application data
      - ./data:/app/data
      # Backup storage mount
      - /host/backup-storage:/app/backup-storage
      # Optional: Mount Docker socket for CLI access
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - supabase-cli
  
  # Separate container with Supabase CLI
  supabase-cli:
    image: supabase/cli:latest
    volumes:
      - backup-temp:/tmp/backups
    command: ["tail", "-f", "/dev/null"] # Keep container running

volumes:
  backup-temp:
```

### **2. Environment Variable Configuration**

```typescript
// src/lib/config/storage.config.ts
export interface StorageEnvironmentConfig {
  defaultStorageType: StorageType
  localStoragePath?: string
  s3Config?: {
    endpoint: string
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
  }
  googleDriveConfig?: {
    serviceAccountKey: string
    folderId: string
  }
  nextcloudConfig?: {
    serverUrl: string
    username: string
    password: string
    basePath: string
  }
}

export function getStorageConfigFromEnv(): StorageEnvironmentConfig {
  return {
    defaultStorageType: (process.env.DEFAULT_STORAGE_TYPE as StorageType) || StorageType.LOCAL_MAPPED,
    localStoragePath: process.env.LOCAL_STORAGE_PATH || '/app/backup-storage',
    s3Config: process.env.S3_ENDPOINT ? {
      endpoint: process.env.S3_ENDPOINT!,
      bucket: process.env.S3_BUCKET!,
      region: process.env.S3_REGION || 'auto',
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    } : undefined,
    // ... other configs
  }
}
```

## 📊 **Updated Roadmap Integration**

### **Modified Phase 2A: Storage-Aware Backup Infrastructure**

**Week 1: Storage Foundation**
1. ✅ Implement storage provider interface and base classes
2. ✅ Create storage destination schema and migrations  
3. ✅ Build S3-compatible and local mapped providers
4. ✅ Add storage destination management UI

**Week 2: Backup Integration**
1. ✅ Update backup service to use storage providers
2. ✅ Implement manual backup flow with storage selection
3. ✅ Add browser download functionality
4. ✅ Create backup progress tracking with storage uploads

**Week 3: Advanced Providers & UI**
1. ✅ Implement Google Drive and Nextcloud providers
2. ✅ Build comprehensive backup management UI
3. ✅ Add storage destination testing and validation
4. ✅ Create Docker deployment configurations

**Week 4: Testing & Polish**
1. ✅ End-to-end testing of all storage providers
2. ✅ Performance optimization for large backups
3. ✅ Error handling and retry logic
4. ✅ Documentation and deployment guides

This architecture provides:
- ✅ **No server storage**: All backups go to external destinations
- ✅ **Multiple storage options**: Cloud, local mapped, direct download
- ✅ **User configurability**: Full UI for storage management
- ✅ **Docker compatibility**: Environment-based configuration
- ✅ **Flexible workflows**: Manual vs scheduled backup support

Ready to start implementing this storage architecture? 