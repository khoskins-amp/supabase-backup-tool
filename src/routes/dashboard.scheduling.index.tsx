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
import { Switch } from '@/components/ui/switch'
import { 
  Plus,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Database,
  Settings,
  Save
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/scheduling/')({
  component: ScheduleManagerComponent,
})

function ScheduleManagerComponent() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    frequency: 'daily',
    time: '02:00',
    timezone: 'UTC',
    enabled: true,
    retention: 30,
    compression: true,
    encryption: true,
    includeStorage: false
  })

  // Mock data
  const mockProjects = [
    { id: '1', name: 'Production DB' },
    { id: '2', name: 'Staging DB' },
    { id: '3', name: 'Development DB' },
  ];

  const [schedules, setSchedules] = useState([
    {
      id: '1',
      name: 'Production Daily Backup',
      description: 'Daily backup of production database',
      project: 'Production DB',
      projectId: '1',
      frequency: 'daily',
      time: '02:00',
      timezone: 'UTC',
      enabled: true,
      lastRun: '2024-01-15T02:00:00Z',
      nextRun: '2024-01-16T02:00:00Z',
      retention: 30,
      compression: true,
      encryption: true,
      includeStorage: false,
      successCount: 28,
      failureCount: 2
    },
    {
      id: '2',
      name: 'Staging Weekly Backup',
      description: 'Weekly comprehensive backup',
      project: 'Staging DB',
      projectId: '2',
      frequency: 'weekly',
      time: '03:00',
      timezone: 'UTC',
      enabled: true,
      lastRun: '2024-01-14T03:00:00Z',
      nextRun: '2024-01-21T03:00:00Z',
      retention: 14,
      compression: true,
      encryption: false,
      includeStorage: true,
      successCount: 12,
      failureCount: 0
    }
  ]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectId: '',
      frequency: 'daily',
      time: '02:00',
      timezone: 'UTC',
      enabled: true,
      retention: 30,
      compression: true,
      encryption: true,
      includeStorage: false
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const handleEdit = (schedule: typeof schedules[0]) => {
    setEditingId(schedule.id);
    setFormData({
      name: schedule.name,
      description: schedule.description,
      projectId: schedule.projectId,
      frequency: schedule.frequency,
      time: schedule.time,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      retention: schedule.retention,
      compression: schedule.compression,
      encryption: schedule.encryption,
      includeStorage: schedule.includeStorage
    });
  };

  const handleSave = () => {
    const project = mockProjects.find(p => p.id === formData.projectId);
    if (!project) return;

    if (isCreating) {
      // Add new schedule
      const newSchedule = {
        id: Date.now().toString(),
        ...formData,
        project: project.name,
        lastRun: null,
        nextRun: calculateNextRun(formData.frequency, formData.time),
        successCount: 0,
        failureCount: 0
      };
      setSchedules(prev => [...prev, newSchedule]);
    } else if (editingId) {
      // Update existing schedule
      setSchedules(prev => prev.map(s => 
        s.id === editingId 
          ? { 
              ...s, 
              ...formData, 
              project: project.name,
              nextRun: calculateNextRun(formData.frequency, formData.time)
            }
          : s
      ));
    }

    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const duplicateSchedule = (schedule: typeof schedules[0]) => {
    const newSchedule = {
      ...schedule,
      id: Date.now().toString(),
      name: `${schedule.name} (Copy)`,
      lastRun: null,
      successCount: 0,
      failureCount: 0
    };
    setSchedules(prev => [...prev, newSchedule]);
  };

  const calculateNextRun = (frequency: string, time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'hourly':
        nextRun.setHours(now.getHours() + 1, 0, 0, 0);
        break;
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - now.getDay()));
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
        break;
    }

    return nextRun.toISOString();
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

  const isFormVisible = isCreating || editingId !== null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schedule Manager</h2>
          <p className="text-muted-foreground">
            Create and manage automated backup schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/scheduling/retention">
              Retention Policies
            </Link>
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Form */}
      {isFormVisible && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create New Schedule' : 'Edit Schedule'}
            </CardTitle>
            <CardDescription>
              Configure automated backup settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Production Daily Backup"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={formData.projectId} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}>
                    <SelectTrigger id="project" className="mt-1">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger id="frequency" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="retention">Retention (days)</Label>
                  <Input
                    id="retention"
                    type="number"
                    value={formData.retention}
                    onChange={(e) => setFormData(prev => ({ ...prev, retention: parseInt(e.target.value) }))}
                    min="1"
                    max="365"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                    />
                    <Label htmlFor="enabled">Enable schedule</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={formData.compression}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, compression: checked as boolean }))}
                    />
                    <Label htmlFor="compression">Enable compression</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="encryption"
                      checked={formData.encryption}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, encryption: checked as boolean }))}
                    />
                    <Label htmlFor="encryption">Enable encryption</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-storage"
                      checked={formData.includeStorage}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeStorage: checked as boolean }))}
                    />
                    <Label htmlFor="include-storage">Include storage files</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Schedules</CardTitle>
          <CardDescription>
            {schedules.length} schedule(s) configured
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
                  </div>
                  
                  <div>
                    <div className="font-medium">{schedule.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.project} • {schedule.frequency}
                      {schedule.time && ` at ${schedule.time} ${schedule.timezone}`}
                    </div>
                    {schedule.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {schedule.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      Next: {formatDate(schedule.nextRun)}
                    </div>
                    <div className="text-muted-foreground">
                      Success: {schedule.successCount} | Failed: {schedule.failureCount}
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
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(schedule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateSchedule(schedule)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {schedules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No schedules configured</h3>
                <p className="text-sm">Create your first backup schedule to get started.</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 