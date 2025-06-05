import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  HardDrive,
  Cloud,
  Folder,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  Trash2,
  Settings,
  FolderOpen,
  Info,
  ExternalLink,
  Plus
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/settings/storage')({
  component: StorageSettingsComponent,
})

function StorageSettingsComponent() {
  const [storageSettings, setStorageSettings] = useState({
    // Local Storage
    localPath: '/data/backups',
    maxLocalStorage: 100, // GB
    enableCompression: true,
    compressionLevel: 6,
    enableDeduplication: false,
    
    // Cloud Storage
    enableCloudSync: false,
    cloudProvider: 's3',
    s3Bucket: '',
    s3Region: 'us-east-1',
    s3AccessKey: '',
    s3SecretKey: '',
    
    // Retention & Cleanup
    autoCleanup: true,
    cleanupInterval: 24, // hours
    keepMinBackups: 5,
    
    // Organization
    fileNaming: '{project}-{date}-{type}',
    folderStructure: 'project-date',
    includeMetadata: true
  });

  const [cloudConnections, setCloudConnections] = useState([
    {
      id: '1',
      name: 'Production S3',
      provider: 'AWS S3',
      bucket: 'prod-backups',
      region: 'us-east-1',
      status: 'connected',
      lastSync: '2024-01-15T10:30:00Z'
    },
    {
      id: '2', 
      name: 'Archive Storage',
      provider: 'Google Cloud',
      bucket: 'archive-backups',
      region: 'us-central1',
      status: 'error',
      lastSync: '2024-01-14T15:20:00Z'
    }
  ]);

  // Mock storage usage data
  const storageUsage = {
    total: 100 * 1024 * 1024 * 1024, // 100GB
    used: 45 * 1024 * 1024 * 1024,   // 45GB
    backups: 40 * 1024 * 1024 * 1024, // 40GB
    metadata: 2 * 1024 * 1024 * 1024,  // 2GB
    temp: 3 * 1024 * 1024 * 1024,     // 3GB
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const updateSetting = (key: string, value: any) => {
    setStorageSettings(prev => ({ ...prev, [key]: value }));
  };

  const testConnection = (id: string) => {
    // Simulate connection test
    console.log(`Testing connection for ${id}`);
  };

  const syncNow = (id: string) => {
    // Simulate sync
    console.log(`Starting sync for ${id}`);
  };

  const cloudProviders = [
    { value: 's3', label: 'Amazon S3' },
    { value: 'gcs', label: 'Google Cloud Storage' },
    { value: 'azure', label: 'Azure Blob Storage' },
    { value: 'wasabi', label: 'Wasabi' },
    { value: 'backblaze', label: 'Backblaze B2' }
  ];

  const folderStructures = [
    { value: 'project-date', label: 'project/YYYY-MM-DD/' },
    { value: 'date-project', label: 'YYYY-MM-DD/project/' },
    { value: 'flat', label: 'backups/' },
    { value: 'project-only', label: 'project/' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'syncing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Storage Settings</h2>
          <p className="text-muted-foreground">
            Configure local and cloud storage for your backups
          </p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Local Storage Usage</span>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
                </span>
              </div>
              <Progress value={(storageUsage.used / storageUsage.total) * 100} className="h-3" />
              
              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Backups</div>
                  <div className="font-medium">{formatBytes(storageUsage.backups)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Metadata</div>
                  <div className="font-medium">{formatBytes(storageUsage.metadata)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Temporary</div>
                  <div className="font-medium">{formatBytes(storageUsage.temp)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <FolderOpen className="h-4 w-4 mr-2" />
                Open Backup Folder
              </Button>
              <Button variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Up Temporary Files
              </Button>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Storage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Local Storage Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Local Storage
          </CardTitle>
          <CardDescription>
            Configure local storage location and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="local-path">Backup Directory</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="local-path"
                  value={storageSettings.localPath}
                  onChange={(e) => updateSetting('localPath', e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="max-storage">Max Storage (GB)</Label>
              <Input
                id="max-storage"
                type="number"
                min="1"
                max="10000"
                value={storageSettings.maxLocalStorage}
                onChange={(e) => updateSetting('maxLocalStorage', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="compression-level">Compression Level (1-9)</Label>
              <Input
                id="compression-level"
                type="number"
                min="1"
                max="9"
                value={storageSettings.compressionLevel}
                onChange={(e) => updateSetting('compressionLevel', parseInt(e.target.value))}
                className="mt-1"
                disabled={!storageSettings.enableCompression}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="compression"
                  checked={storageSettings.enableCompression}
                  onCheckedChange={(checked) => updateSetting('enableCompression', checked)}
                />
                <Label htmlFor="compression">Enable compression</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="deduplication"
                  checked={storageSettings.enableDeduplication}
                  onCheckedChange={(checked) => updateSetting('enableDeduplication', checked)}
                />
                <Label htmlFor="deduplication">Enable deduplication</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloud Storage
          </CardTitle>
          <CardDescription>
            Configure cloud storage providers for backup sync
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cloud-sync">Enable Cloud Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync backups to cloud storage
                </p>
              </div>
              <Switch
                id="cloud-sync"
                checked={storageSettings.enableCloudSync}
                onCheckedChange={(checked) => updateSetting('enableCloudSync', checked)}
              />
            </div>

            {storageSettings.enableCloudSync && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Cloud Connections</h4>
                  <div className="space-y-3">
                    {cloudConnections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{connection.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {connection.provider} • {connection.bucket} • {connection.region}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last sync: {formatDate(connection.lastSync)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(connection.status)}>
                            {connection.status}
                          </Badge>
                          
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => testConnection(connection.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => syncNow(connection.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Add New Connection</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="cloud-provider">Provider</Label>
                      <Select value={storageSettings.cloudProvider} onValueChange={(value) => updateSetting('cloudProvider', value)}>
                        <SelectTrigger id="cloud-provider" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cloudProviders.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bucket">Bucket/Container Name</Label>
                      <Input
                        id="bucket"
                        value={storageSettings.s3Bucket}
                        onChange={(e) => updateSetting('s3Bucket', e.target.value)}
                        placeholder="my-backup-bucket"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="access-key">Access Key</Label>
                      <Input
                        id="access-key"
                        value={storageSettings.s3AccessKey}
                        onChange={(e) => updateSetting('s3AccessKey', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="secret-key">Secret Key</Label>
                      <Input
                        id="secret-key"
                        type="password"
                        value={storageSettings.s3SecretKey}
                        onChange={(e) => updateSetting('s3SecretKey', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Organization</CardTitle>
          <CardDescription>
            Configure how backups are organized and named
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="folder-structure">Folder Structure</Label>
              <Select value={storageSettings.folderStructure} onValueChange={(value) => updateSetting('folderStructure', value)}>
                <SelectTrigger id="folder-structure" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folderStructures.map((structure) => (
                    <SelectItem key={structure.value} value={structure.value}>
                      {structure.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file-naming">File Naming Pattern</Label>
              <Input
                id="file-naming"
                value={storageSettings.fileNaming}
                onChange={(e) => updateSetting('fileNaming', e.target.value)}
                placeholder="{project}-{date}-{type}"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="metadata"
                checked={storageSettings.includeMetadata}
                onCheckedChange={(checked) => updateSetting('includeMetadata', checked)}
              />
              <Label htmlFor="metadata">Include metadata files</Label>
            </div>
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Available variables:</strong> {'{project}'}, {'{date}'}, {'{time}'}, {'{type}'}, {'{uuid}'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cleanup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Cleanup</CardTitle>
          <CardDescription>
            Configure automatic cleanup of old backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="cleanup-interval">Cleanup Interval (hours)</Label>
              <Input
                id="cleanup-interval"
                type="number"
                min="1"
                max="168"
                value={storageSettings.cleanupInterval}
                onChange={(e) => updateSetting('cleanupInterval', parseInt(e.target.value))}
                className="mt-1"
                disabled={!storageSettings.autoCleanup}
              />
            </div>

            <div>
              <Label htmlFor="min-backups">Minimum Backups to Keep</Label>
              <Input
                id="min-backups"
                type="number"
                min="1"
                max="100"
                value={storageSettings.keepMinBackups}
                onChange={(e) => updateSetting('keepMinBackups', parseInt(e.target.value))}
                className="mt-1"
                disabled={!storageSettings.autoCleanup}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-cleanup"
                checked={storageSettings.autoCleanup}
                onCheckedChange={(checked) => updateSetting('autoCleanup', checked)}
              />
              <Label htmlFor="auto-cleanup">Enable automatic cleanup</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Local Storage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use high compression for infrequent backups</li>
                <li>• Enable deduplication to save space</li>
                <li>• Monitor disk usage regularly</li>
                <li>• Use SSD for better performance</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Cloud Storage</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use standard storage for active backups</li>
                <li>• Archive old backups to save costs</li>
                <li>• Configure lifecycle policies</li>
                <li>• Monitor transfer costs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 