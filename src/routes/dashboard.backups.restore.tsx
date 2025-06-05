import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload,
  Database,
  Settings,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Info,
  FileText,
  HardDrive
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/backups/restore')({
  component: RestoreComponent,
})

function RestoreComponent() {
  const [selectedBackup, setSelectedBackup] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [restoreOptions, setRestoreOptions] = useState({
    dropExisting: false,
    restoreData: true,
    restoreSchema: true,
    restoreIndexes: true,
    restoreFunctions: true,
    restoreViews: true,
    createDatabase: false
  })
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [restoreLogs, setRestoreLogs] = useState<string[]>([])

  // Mock backup data
  const mockBackups = [
    {
      id: '1',
      name: 'production-backup-2024-01-15',
      projectName: 'Production DB',
      createdAt: '2024-01-15T02:00:00Z',
      size: 524288000, // ~500MB
      version: 'PostgreSQL 15.4',
      tables: 45,
      compressed: true,
      encrypted: true
    },
    {
      id: '2',
      name: 'staging-manual-backup',
      projectName: 'Staging DB',
      createdAt: '2024-01-14T16:30:00Z',
      size: 156237824, // ~149MB
      version: 'PostgreSQL 15.4',
      tables: 32,
      compressed: true,
      encrypted: false
    },
    {
      id: '3',
      name: 'production-backup-2024-01-14',
      projectName: 'Production DB',
      createdAt: '2024-01-14T02:00:00Z',
      size: 520093696, // ~496MB
      version: 'PostgreSQL 15.4',
      tables: 44,
      compressed: true,
      encrypted: true
    }
  ];

  // Mock target projects
  const mockProjects = [
    {
      id: '1',
      name: 'Production DB',
      url: 'https://prod.supabase.co',
      database: 'production',
      status: 'healthy',
      version: 'PostgreSQL 15.4'
    },
    {
      id: '2', 
      name: 'Staging DB',
      url: 'https://staging.supabase.co',
      database: 'staging',
      status: 'healthy',
      version: 'PostgreSQL 15.4'
    },
    {
      id: '3',
      name: 'Development DB',
      url: 'https://dev.supabase.co',
      database: 'development',
      status: 'healthy',
      version: 'PostgreSQL 15.4'
    },
    {
      id: '4',
      name: 'Test Environment',
      url: 'https://test.supabase.co',
      database: 'test',
      status: 'healthy',
      version: 'PostgreSQL 15.4'
    }
  ];

  const selectedBackupData = mockBackups.find(b => b.id === selectedBackup);
  const selectedProjectData = mockProjects.find(p => p.id === selectedProject);

  const startRestore = async () => {
    if (!selectedBackup || !selectedProject) return;
    
    setRestoreStatus('running');
    setRestoreProgress(0);
    setRestoreLogs([]);

    // Simulate restore process
    const steps = [
      'Preparing restore environment...',
      'Validating backup file integrity...',
      'Connecting to target database...',
      restoreOptions.dropExisting ? 'Dropping existing tables...' : null,
      restoreOptions.createDatabase ? 'Creating database structure...' : null,
      restoreOptions.restoreSchema ? 'Restoring database schema...' : null,
      restoreOptions.restoreData ? 'Restoring table data (0%)' : null,
      restoreOptions.restoreData ? 'Restoring table data (25%)' : null,
      restoreOptions.restoreData ? 'Restoring table data (50%)' : null,
      restoreOptions.restoreData ? 'Restoring table data (75%)' : null,
      restoreOptions.restoreData ? 'Restoring table data (100%)' : null,
      restoreOptions.restoreIndexes ? 'Rebuilding indexes...' : null,
      restoreOptions.restoreViews ? 'Recreating views...' : null,
      restoreOptions.restoreFunctions ? 'Restoring functions and procedures...' : null,
      'Verifying data integrity...',
      'Restore completed successfully!'
    ].filter(Boolean) as string[];

    for (let i = 0; i < steps.length; i++) {
      setRestoreLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
      setRestoreProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setRestoreStatus('completed');
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const canStartRestore = selectedBackup && selectedProject && restoreStatus === 'idle';

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restore Backup</h2>
          <p className="text-muted-foreground">
            Restore a backup to a Supabase project
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/backups/history">
            View Backup History
          </Link>
        </Button>
      </div>

      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Caution:</strong> Restoring will modify the target database. 
          Make sure you have a recent backup of the target project before proceeding.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuration */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Backup
              </CardTitle>
              <CardDescription>
                Choose the backup you want to restore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-select">Available Backups</Label>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger id="backup-select" className="mt-1">
                      <SelectValue placeholder="Select a backup to restore" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBackups.map((backup) => (
                        <SelectItem key={backup.id} value={backup.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{backup.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {backup.projectName} • {formatDate(backup.createdAt)} • {formatFileSize(backup.size)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBackupData && (
                  <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <div className="font-medium">{selectedBackupData.projectName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <div className="font-medium">{formatFileSize(selectedBackupData.size)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tables:</span>
                        <div className="font-medium">{selectedBackupData.tables}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <div className="font-medium">{selectedBackupData.version}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {selectedBackupData.compressed && (
                        <Badge variant="secondary">Compressed</Badge>
                      )}
                      {selectedBackupData.encrypted && (
                        <Badge variant="secondary">Encrypted</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Target Project
              </CardTitle>
              <CardDescription>
                Choose where to restore the backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-select">Target Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger id="project-select" className="mt-1">
                      <SelectValue placeholder="Select target project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{project.name}</span>
                            <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProjectData && (
                  <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Database:</span>
                        <div className="font-medium">{selectedProjectData.database}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <div className="font-medium">{selectedProjectData.version}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">URL:</span>
                        <div className="font-medium text-xs">{selectedProjectData.url}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Restore Options
              </CardTitle>
              <CardDescription>
                Configure what to restore and how
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-schema"
                      checked={restoreOptions.restoreSchema}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreSchema: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-schema">Restore database schema</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-data"
                      checked={restoreOptions.restoreData}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreData: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-data">Restore table data</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-indexes"
                      checked={restoreOptions.restoreIndexes}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreIndexes: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-indexes">Restore indexes</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-views"
                      checked={restoreOptions.restoreViews}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreViews: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-views">Restore views</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="restore-functions"
                      checked={restoreOptions.restoreFunctions}
                      onCheckedChange={(checked) => 
                        setRestoreOptions(prev => ({ ...prev, restoreFunctions: checked as boolean }))
                      }
                    />
                    <Label htmlFor="restore-functions">Restore functions & procedures</Label>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="drop-existing"
                        checked={restoreOptions.dropExisting}
                        onCheckedChange={(checked) => 
                          setRestoreOptions(prev => ({ ...prev, dropExisting: checked as boolean }))
                        }
                      />
                      <Label htmlFor="drop-existing" className="text-red-600">
                        Drop existing tables before restore
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restore Action */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={startRestore}
                disabled={!canStartRestore}
                className="w-full"
                size="lg"
                variant={restoreOptions.dropExisting ? "destructive" : "default"}
              >
                {restoreStatus === 'running' ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Restore
                  </>
                )}
              </Button>
              {!selectedBackup && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Select a backup to continue
                </p>
              )}
              {!selectedProject && selectedBackup && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Select a target project to continue
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status & Progress */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Restore Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {restoreStatus === 'idle' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Configure your restore settings and click Start Restore.
                    </AlertDescription>
                  </Alert>
                )}

                {restoreStatus === 'running' && (
                  <div className="space-y-3">
                    <Alert>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Restore in progress...
                      </AlertDescription>
                    </Alert>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(restoreProgress)}%</span>
                      </div>
                      <Progress value={restoreProgress} className="h-2" />
                    </div>
                  </div>
                )}

                {restoreStatus === 'completed' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Restore completed successfully!</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {restoreStatus === 'failed' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Restore failed!</strong> Check the logs for details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {restoreLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Restore Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {restoreLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Compatibility Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {selectedBackupData && selectedProjectData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Database Version:</span>
                      <Badge variant="secondary">Compatible</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Schema Format:</span>
                      <Badge variant="secondary">Supported</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Extensions:</span>
                      <Badge variant="secondary">Available</Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">
                    Select backup and target project to check compatibility
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 