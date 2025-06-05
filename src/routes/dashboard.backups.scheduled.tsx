import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Clock,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Database,
  Settings
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/backups/scheduled')({
  component: ScheduledBackupsComponent,
})

function ScheduledBackupsComponent() {
  const [schedules, setSchedules] = useState([
    {
      id: '1',
      name: 'Production Daily Backup',
      project: 'Production DB',
      frequency: 'daily',
      time: '02:00',
      timezone: 'UTC',
      enabled: true,
      lastRun: '2024-01-15T02:00:00Z',
      nextRun: '2024-01-16T02:00:00Z',
      retention: 30,
      compression: true,
      encryption: true
    },
    {
      id: '2',
      name: 'Staging Weekly Backup',
      project: 'Staging DB',
      frequency: 'weekly',
      time: '03:00',
      timezone: 'UTC',
      enabled: true,
      lastRun: '2024-01-14T03:00:00Z',
      nextRun: '2024-01-21T03:00:00Z',
      retention: 14,
      compression: true,
      encryption: false
    },
    {
      id: '3',
      name: 'Dev Environment Backup',
      project: 'Development DB',
      frequency: 'hourly',
      time: null,
      timezone: 'UTC',
      enabled: false,
      lastRun: '2024-01-15T14:00:00Z',
      nextRun: null,
      retention: 7,
      compression: false,
      encryption: false
    }
  ]);

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule
    ));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'hourly':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'daily':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'weekly':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'monthly':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scheduled Backups</h2>
          <p className="text-muted-foreground">
            Manage automated backup schedules for your projects
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/backups/scheduled">
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">
              {schedules.filter(s => s.enabled).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h 15m</div>
            <p className="text-xs text-muted-foreground">
              Production DB at 02:00
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.frequency === 'daily' && s.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled daily
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Backups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.frequency === 'weekly' && s.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled weekly
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedules</CardTitle>
          <CardDescription>
            View and manage your automated backup schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={() => toggleSchedule(schedule.id)}
                    />
                    <Label className="sr-only">
                      {schedule.enabled ? 'Disable' : 'Enable'} schedule
                    </Label>
                  </div>
                  
                  <div>
                    <div className="font-medium">{schedule.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.project} • {schedule.frequency}
                      {schedule.time && ` at ${schedule.time} ${schedule.timezone}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      Last: {formatDate(schedule.lastRun)}
                    </div>
                    <div className="text-muted-foreground">
                      Next: {formatDate(schedule.nextRun)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge className={getFrequencyColor(schedule.frequency)}>
                      {schedule.frequency}
                    </Badge>
                    <Badge className={getStatusColor(schedule.enabled)}>
                      {schedule.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Schedule Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Configuration</CardTitle>
            <CardDescription>
              Common settings across schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Default Timezone:</span>
                  <div className="font-medium">UTC</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Parallel:</span>
                  <div className="font-medium">3 backups</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Retry Attempts:</span>
                  <div className="font-medium">3 times</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Timeout:</span>
                  <div className="font-medium">30 minutes</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common schedule management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Play className="h-4 w-4 mr-2" />
                Run All Active Schedules Now
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Pause className="h-4 w-4 mr-2" />
                Pause All Schedules
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dashboard/scheduling/retention">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Retention Policies
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dashboard/scheduling/notifications">
                  <Calendar className="h-4 w-4 mr-2" />
                  Setup Notifications
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 