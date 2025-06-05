import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  HardDrive,
  Clock,
  Database,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export const Route = createFileRoute('/dashboard/analytics')({
  component: AnalyticsComponent,
})

function AnalyticsComponent() {
  // Mock analytics data
  const mockMetrics = {
    totalBackups: 247,
    successRate: 94.3,
    averageBackupTime: 180000, // 3 minutes
    totalStorageUsed: 15728640000, // ~14.6GB
    storageGrowth: 12.5,
    backupFrequency: 3.2, // per day
    projectCount: 8,
  };

  const mockChartData = {
    backupTrends: [
      { month: 'Jul', successful: 45, failed: 3 },
      { month: 'Aug', successful: 52, failed: 2 },
      { month: 'Sep', successful: 38, failed: 4 },
      { month: 'Oct', successful: 61, failed: 1 },
      { month: 'Nov', successful: 48, failed: 2 },
      { month: 'Dec', successful: 55, failed: 3 },
    ],
    storageByProject: [
      { name: 'Production DB', size: 5368709120, percentage: 34 },
      { name: 'Staging DB', size: 3221225472, percentage: 20 },
      { name: 'User Analytics', size: 2684354560, percentage: 17 },
      { name: 'E-commerce', size: 2147483648, percentage: 14 },
      { name: 'Development', size: 1610612736, percentage: 10 },
      { name: 'Others', size: 805306368, percentage: 5 },
    ]
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Backup performance insights and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalBackups}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.successRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Backup Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(mockMetrics.averageBackupTime)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              -15s from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(mockMetrics.totalStorageUsed)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-yellow-500 mr-1" />
              +{mockMetrics.storageGrowth}% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Backup Trends
            </CardTitle>
            <CardDescription>
              Monthly backup success and failure rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockChartData.backupTrends.map((month, index) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="text-muted-foreground">
                      {month.successful + month.failed} total
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div 
                      className="bg-green-500 rounded-sm"
                      style={{ 
                        width: `${(month.successful / (month.successful + month.failed)) * 100}%` 
                      }}
                    />
                    <div 
                      className="bg-red-500 rounded-sm"
                      style={{ 
                        width: `${(month.failed / (month.successful + month.failed)) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-green-600">{month.successful} successful</span>
                    <span className="text-red-600">{month.failed} failed</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Storage by Project
            </CardTitle>
            <CardDescription>
              How storage is distributed across projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockChartData.storageByProject.map((project, index) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(project.size)}
                    </span>
                  </div>
                  <Progress value={project.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {project.percentage}% of total storage
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Backup Frequency</CardTitle>
            <CardDescription>
              Average backups per day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockMetrics.backupFrequency}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Across {mockMetrics.projectCount} active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peak Hours</CardTitle>
            <CardDescription>
              Most active backup times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">2:00 AM - 4:00 AM</span>
                <Badge variant="secondary">35%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">10:00 PM - 12:00 AM</span>
                <Badge variant="secondary">28%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">6:00 AM - 8:00 AM</span>
                <Badge variant="secondary">20%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Growth</CardTitle>
            <CardDescription>
              Storage usage trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{mockMetrics.storageGrowth}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              Monthly growth rate
            </p>
            <div className="mt-4 space-y-1">
              <div className="text-xs text-muted-foreground">Projected storage in 6 months:</div>
              <div className="text-sm font-medium">
                {formatFileSize(mockMetrics.totalStorageUsed * Math.pow(1.125, 6))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Performance Good</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your backup success rate is above 90%. Consider implementing automated cleanup for old backups.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Storage Growing</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Storage usage is growing rapidly. Consider implementing retention policies to manage costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 