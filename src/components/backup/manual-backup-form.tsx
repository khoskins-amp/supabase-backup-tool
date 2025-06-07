import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  Database,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  FileArchive,
  Shield,
  Server
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import type { ManualBackupFormData, BackupProgress } from '@/lib/db/backups.types';

interface ManualBackupFormProps {
  projectId: string;
  onSuccess?: (result: any) => void;
}

export function ManualBackupForm({ projectId, onSuccess }: ManualBackupFormProps) {
  const [formData, setFormData] = useState<ManualBackupFormData>({
    name: `Manual Backup ${new Date().toLocaleDateString()}`,
    description: '',
    projectId,
    backupType: 'full',
    compressionType: 'gzip',
    storageType: 'browser_download',
    includeAuth: true,
    includeStorage: true,
    includeDatabase: true,
    includeEdgeFunctions: false,
    includeMigrationHistory: true,
    includeTables: [],
    excludeTables: [],
  });

  const [currentBackupId, setCurrentBackupId] = useState<string | null>(null);
  const [progress, setProgress] = useState<BackupProgress | null>(null);

  // tRPC mutations and queries
  const createBackupMutation = trpc.backups.createManual.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        setCurrentBackupId(result.data.id);
        toast.success('Backup started successfully');
        
        // If it's a browser download, trigger download
        if (formData.storageType === 'browser_download' && result.data.downloadUrl) {
          setTimeout(() => {
            window.open(result.data.downloadUrl, '_blank');
            onSuccess?.(result.data);
          }, 1000);
        }
      }
    },
    onError: (error) => {
      toast.error(`Backup failed: ${error.message}`);
      setCurrentBackupId(null);
      setProgress(null);
    },
  });

  // Progress tracking query (polls when backup is running)
  const progressQuery = trpc.backups.getProgress.useQuery(
    { backupId: currentBackupId! },
    {
      enabled: !!currentBackupId,
      refetchInterval: (data) => {
        return data?.status === 'in-progress' || data?.status === 'pending' ? 2000 : false;
      },
      onSuccess: (progressData) => {
        setProgress(progressData);
        
        if (progressData.status === 'completed') {
          setCurrentBackupId(null);
          setProgress(null);
          toast.success('Backup completed successfully!');
        } else if (progressData.status === 'failed') {
          setCurrentBackupId(null);
          setProgress(null);
        }
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a backup name');
      return;
    }

    createBackupMutation.mutate(formData);
  };

  const updateFormField = <K extends keyof ManualBackupFormData>(
    key: K,
    value: ManualBackupFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isBackupRunning = progress?.status === 'in-progress' || progress?.status === 'pending';
  const canSubmit = !isBackupRunning && !createBackupMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Create Manual Backup
          </CardTitle>
          <CardDescription>
            Create an on-demand backup of your Supabase project. Choose what to include and how to store it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Backup Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  placeholder="Enter backup name"
                  disabled={isBackupRunning}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  placeholder="Describe this backup"
                  rows={2}
                  disabled={isBackupRunning}
                />
              </div>
            </div>

            {/* Backup Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Backup Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Backup Type</Label>
                  <Select 
                    value={formData.backupType}
                    onValueChange={(value: any) => updateFormField('backupType', value)}
                    disabled={isBackupRunning}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Full Backup (Schema + Data)
                        </div>
                      </SelectItem>
                      <SelectItem value="schema">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Schema Only
                        </div>
                      </SelectItem>
                      <SelectItem value="data">
                        <div className="flex items-center gap-2">
                          <FileArchive className="h-4 w-4" />
                          Data Only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Compression</Label>
                  <Select 
                    value={formData.compressionType}
                    onValueChange={(value: any) => updateFormField('compressionType', value)}
                    disabled={isBackupRunning}
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
              </div>
            </div>

            {/* Storage Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Storage Destination</h3>
              
              <div className="space-y-2">
                <Label>Download Method</Label>
                <Select 
                  value={formData.storageType}
                  onValueChange={(value: any) => updateFormField('storageType', value)}
                  disabled={isBackupRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser_download">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Direct Browser Download
                      </div>
                    </SelectItem>
                    {/* Future storage options will be added here */}
                  </SelectContent>
                </Select>
              </div>
              
              {formData.storageType === 'browser_download' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The backup will be prepared and automatically downloaded to your computer when ready.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* What to Include */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">What to Include</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeDatabase"
                      checked={formData.includeDatabase}
                      onCheckedChange={(checked) => updateFormField('includeDatabase', checked as boolean)}
                      disabled={isBackupRunning}
                    />
                    <Label htmlFor="includeDatabase" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Database Tables & Data
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeAuth"
                      checked={formData.includeAuth}
                      onCheckedChange={(checked) => updateFormField('includeAuth', checked as boolean)}
                      disabled={isBackupRunning}
                    />
                    <Label htmlFor="includeAuth" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Authentication Settings
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeStorage"
                      checked={formData.includeStorage}
                      onCheckedChange={(checked) => updateFormField('includeStorage', checked as boolean)}
                      disabled={isBackupRunning}
                    />
                    <Label htmlFor="includeStorage" className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4" />
                      Storage Files
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeMigrationHistory"
                      checked={formData.includeMigrationHistory}
                      onCheckedChange={(checked) => updateFormField('includeMigrationHistory', checked as boolean)}
                      disabled={isBackupRunning}
                    />
                    <Label htmlFor="includeMigrationHistory" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Migration History
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={!canSubmit}
              className="w-full"
              size="lg"
            >
              {createBackupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Backup...
                </>
              ) : isBackupRunning ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Backup in Progress...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {progress && (
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
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Current Phase: {progress.currentPhase}</p>
                {progress.startTime && (
                  <p>Started: {new Date(progress.startTime).toLocaleTimeString()}</p>
                )}
              </div>
              
              {progress.errorMessage && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{progress.errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {progress.status === 'completed' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Backup completed successfully! Your download should start automatically.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 