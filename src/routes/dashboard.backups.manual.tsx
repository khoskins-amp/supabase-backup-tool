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
  Download,
  Database,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  HardDrive,
  Shield
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/backups/manual')({
  component: ManualBackupComponent,
})

function ManualBackupComponent() {
  const [selectedProject, setSelectedProject] = useState('')
  const [backupName, setBackupName] = useState('')
  const [description, setDescription] = useState('')
  const [compressionEnabled, setCompressionEnabled] = useState(true)
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [includeStorage, setIncludeStorage] = useState(false)
  const [backupStatus, setBackupStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle')
  const [backupProgress, setBackupProgress] = useState(0)
  const [backupLogs, setBackupLogs] = useState<string[]>([])

  // Mock project data
  const mockProjects = [
    {
      id: '1',
      name: 'Production DB',
      url: 'https://prod.supabase.co',
      database: 'production',
      size: '2.4 GB',
      lastBackup: '2024-01-15T10:30:00Z',
      status: 'healthy'
    },
    {
      id: '2', 
      name: 'Staging DB',
      url: 'https://staging.supabase.co',
      database: 'staging',
      size: '850 MB',
      lastBackup: '2024-01-15T09:00:00Z',
      status: 'healthy'
    },
    {
      id: '3',
      name: 'Development DB',
      url: 'https://dev.supabase.co',
      database: 'development',
      size: '320 MB',
      lastBackup: '2024-01-14T15:30:00Z',
      status: 'warning'
    }
  ];

  const selectedProjectData = mockProjects.find(p => p.id === selectedProject);

  const startBackup = async () => {
    if (!selectedProject || !backupName) return;
    
    setBackupStatus('running');
    setBackupProgress(0);
    setBackupLogs([]);

    // Simulate backup process
    const steps = [
      'Connecting to Supabase project...',
      'Authenticating with database...',
      'Analyzing database structure...',
      'Starting data export...',
      'Exporting table data (25%)',
      'Exporting table data (50%)',
      'Exporting table data (75%)',
      'Exporting table data (100%)',
      includeStorage ? 'Backing up storage files...' : null,
      compressionEnabled ? 'Compressing backup archive...' : null,
      encryptionEnabled ? 'Encrypting backup data...' : null,
      'Finalizing backup...',
      'Backup completed successfully!'
    ].filter(Boolean) as string[];

    for (let i = 0; i < steps.length; i++) {
      setBackupLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
      setBackupProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setBackupStatus('completed');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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

  const canStartBackup = selectedProject && backupName && backupStatus === 'idle';

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manual Backup</h2>
          <p className="text-muted-foreground">
            Create an on-demand backup of your Supabase project
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/backups">
            View All Backups
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuration */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Project Selection
              </CardTitle>
              <CardDescription>
                Choose the project you want to backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-select">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger id="project-select" className="mt-1">
                      <SelectValue placeholder="Select a project to backup" />
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
                        <span className="text-muted-foreground">Size:</span>
                        <div className="font-medium">{selectedProjectData.size}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Backup:</span>
                        <div className="font-medium">{formatDate(selectedProjectData.lastBackup)}</div>
                      </div>
                      <div>
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
                Backup Configuration
              </CardTitle>
              <CardDescription>
                Configure backup settings and options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-name">Backup Name</Label>
                  <Input
                    id="backup-name"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="e.g., production-backup-2024-01-15"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this backup..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={compressionEnabled}
                      onCheckedChange={setCompressionEnabled}
                    />
                    <Label htmlFor="compression" className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Enable compression
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="encryption"
                      checked={encryptionEnabled}
                      onCheckedChange={setEncryptionEnabled}
                    />
                    <Label htmlFor="encryption" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Enable encryption
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="storage"
                      checked={includeStorage}
                      onCheckedChange={setIncludeStorage}
                    />
                    <Label htmlFor="storage" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Include storage files
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Action */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={startBackup}
                disabled={!canStartBackup}
                className="w-full"
                size="lg"
              >
                {backupStatus === 'running' ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Backup in Progress...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Backup
                  </>
                )}
              </Button>
              {!selectedProject && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Select a project to continue
                </p>
              )}
              {!backupName && selectedProject && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Enter a backup name to continue
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
                Backup Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupStatus === 'idle' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Ready to start backup when you're configured.
                    </AlertDescription>
                  </Alert>
                )}

                {backupStatus === 'running' && (
                  <div className="space-y-3">
                    <Alert>
                      <Settings className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Backup in progress...
                      </AlertDescription>
                    </Alert>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(backupProgress)}%</span>
                      </div>
                      <Progress value={backupProgress} className="h-2" />
                    </div>
                  </div>
                )}

                {backupStatus === 'completed' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Backup completed successfully!</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {backupStatus === 'failed' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Backup failed!</strong> Check the logs for details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {backupLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Backup Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {backupLogs.map((log, index) => (
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
              <CardTitle className="text-sm">Estimated Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {selectedProjectData ? (
                  <>
                    <div>Based on project size: <strong>{selectedProjectData.size}</strong></div>
                    <div className="mt-2">
                      Estimated duration: <strong>2-5 minutes</strong>
                    </div>
                  </>
                ) : (
                  'Select a project to see estimates'
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 