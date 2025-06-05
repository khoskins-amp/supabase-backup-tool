import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  HardDrive,
  Eye,
  MoreHorizontal
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/backups/history')({
  component: BackupHistoryComponent,
})

function BackupHistoryComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Mock backup history data
  const mockBackups = [
    {
      id: '1',
      name: 'production-backup-2024-01-15',
      projectName: 'Production DB',
      type: 'scheduled',
      status: 'completed',
      createdAt: '2024-01-15T02:00:00Z',
      completedAt: '2024-01-15T02:03:24Z',
      size: 524288000, // ~500MB
      duration: 204000, // 3m 24s
      compression: true,
      encryption: true,
      downloadUrl: 'https://storage.example.com/backup-1.sql.gz',
      description: 'Daily scheduled backup'
    },
    {
      id: '2',
      name: 'staging-manual-backup',
      projectName: 'Staging DB',
      type: 'manual',
      status: 'completed',
      createdAt: '2024-01-14T16:30:00Z',
      completedAt: '2024-01-14T16:31:45Z',
      size: 156237824, // ~149MB
      duration: 105000, // 1m 45s
      compression: true,
      encryption: false,
      downloadUrl: 'https://storage.example.com/backup-2.sql.gz',
      description: 'Pre-deployment backup'
    },
    {
      id: '3',
      name: 'dev-test-backup',
      projectName: 'Development DB',
      type: 'manual',
      status: 'failed',
      createdAt: '2024-01-14T14:15:00Z',
      completedAt: null,
      size: null,
      duration: 30000, // 30s
      compression: false,
      encryption: false,
      downloadUrl: null,
      description: 'Test backup attempt',
      error: 'Connection timeout to database'
    },
    {
      id: '4',
      name: 'production-backup-2024-01-14',
      projectName: 'Production DB',
      type: 'scheduled',
      status: 'completed',
      createdAt: '2024-01-14T02:00:00Z',
      completedAt: '2024-01-14T02:02:58Z',
      size: 520093696, // ~496MB
      duration: 178000, // 2m 58s
      compression: true,
      encryption: true,
      downloadUrl: 'https://storage.example.com/backup-4.sql.gz',
      description: 'Daily scheduled backup'
    },
    {
      id: '5',
      name: 'emergency-backup-analytics',
      projectName: 'Analytics DB',
      type: 'manual',
      status: 'running',
      createdAt: '2024-01-15T10:45:00Z',
      completedAt: null,
      size: null,
      duration: null,
      compression: true,
      encryption: true,
      downloadUrl: null,
      description: 'Emergency backup before data migration'
    }
  ];

  const filteredBackups = mockBackups.filter(backup => {
    const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;
    const matchesProject = projectFilter === 'all' || backup.projectName === projectFilter;
    const matchesType = typeFilter === 'all' || backup.type === typeFilter;

    return matchesSearch && matchesStatus && matchesProject && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manual':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (ms?: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
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

  const projects = [...new Set(mockBackups.map(b => b.projectName))];

  const totalSize = mockBackups
    .filter(b => b.size)
    .reduce((acc, b) => acc + (b.size || 0), 0);

  const completedCount = mockBackups.filter(b => b.status === 'completed').length;
  const failedCount = mockBackups.filter(b => b.status === 'failed').length;
  const runningCount = mockBackups.filter(b => b.status === 'running').length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Backup History</h2>
          <p className="text-muted-foreground">
            Complete history of all backup operations
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockBackups.length}</div>
            <p className="text-xs text-muted-foreground">
              All time history
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((completedCount / mockBackups.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {mockBackups.length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Across all backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Backups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search backups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Records</CardTitle>
          <CardDescription>
            {filteredBackups.length} of {mockBackups.length} backups shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(backup.status)}
                  <div>
                    <div className="font-medium">{backup.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {backup.projectName} • {formatDate(backup.createdAt)}
                      {backup.error && (
                        <span className="text-red-500 ml-2">• {backup.error}</span>
                      )}
                    </div>
                    {backup.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {backup.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium">{formatFileSize(backup.size)}</div>
                    <div className="text-muted-foreground">{formatDuration(backup.duration)}</div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Badge className={getStatusColor(backup.status)}>
                      {backup.status}
                    </Badge>
                    <Badge className={getTypeColor(backup.type)}>
                      {backup.type}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {backup.downloadUrl && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 