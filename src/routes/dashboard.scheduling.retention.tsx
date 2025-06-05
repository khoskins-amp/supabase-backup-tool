import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trash2,
  Calendar,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Save,
  Info
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/scheduling/retention')({
  component: RetentionPoliciesComponent,
})

function RetentionPoliciesComponent() {
  const [policies, setPolicies] = useState([
    {
      id: '1',
      name: 'Production Retention',
      description: 'Long-term retention for production backups',
      enabled: true,
      rules: [
        { type: 'daily', keep: 7, unit: 'days' },
        { type: 'weekly', keep: 4, unit: 'weeks' },
        { type: 'monthly', keep: 12, unit: 'months' },
        { type: 'yearly', keep: 3, unit: 'years' }
      ],
      projects: ['Production DB'],
      totalSavings: '2.4 GB',
      lastCleanup: '2024-01-15T02:30:00Z'
    },
    {
      id: '2',
      name: 'Development Cleanup',
      description: 'Short retention for development environments',
      enabled: true,
      rules: [
        { type: 'daily', keep: 3, unit: 'days' },
        { type: 'weekly', keep: 2, unit: 'weeks' }
      ],
      projects: ['Development DB', 'Staging DB'],
      totalSavings: '890 MB',
      lastCleanup: '2024-01-14T23:00:00Z'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    rules: [
      { type: 'daily', keep: 7, unit: 'days' }
    ]
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, { type: 'daily', keep: 7, unit: 'days' }]
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateRule = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      enabled: true,
      rules: [{ type: 'daily', keep: 7, unit: 'days' }]
    });
  };

  const handleEdit = (policy: typeof policies[0]) => {
    setEditingId(policy.id);
    setFormData({
      name: policy.name,
      description: policy.description,
      enabled: policy.enabled,
      rules: [...policy.rules]
    });
  };

  const handleSave = () => {
    if (isCreating) {
      const newPolicy = {
        id: Date.now().toString(),
        ...formData,
        projects: [],
        totalSavings: '0 MB',
        lastCleanup: new Date().toISOString()
      };
      setPolicies(prev => [...prev, newPolicy]);
    } else if (editingId) {
      setPolicies(prev => prev.map(p => 
        p.id === editingId 
          ? { ...p, ...formData }
          : p
      ));
    }

    setIsCreating(false);
    setEditingId(null);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const isFormVisible = isCreating || editingId !== null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Retention Policies</h2>
          <p className="text-muted-foreground">
            Manage automatic cleanup rules for backup storage
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Retention policies automatically clean up old backups to save storage costs while keeping important snapshots longer.
        </AlertDescription>
      </Alert>

      {/* Form */}
      {isFormVisible && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create Retention Policy' : 'Edit Retention Policy'}
            </CardTitle>
            <CardDescription>
              Define rules for automatic backup cleanup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input
                    id="policy-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Production Retention"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable policy</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Retention Rules</Label>
                  <Button variant="outline" size="sm" onClick={addRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>

                <div className="space-y-3">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <Select 
                          value={rule.type} 
                          onValueChange={(value) => updateRule(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Keep</span>
                          <Input
                            type="number"
                            value={rule.keep}
                            onChange={(e) => updateRule(index, 'keep', parseInt(e.target.value))}
                            min="1"
                            className="w-20"
                          />
                        </div>

                        <Select 
                          value={rule.unit} 
                          onValueChange={(value) => updateRule(index, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeRule(index)}
                        disabled={formData.rules.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground mt-2">
                  Rules are applied in order. Later rules override earlier ones for the same time period.
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Policy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.filter(p => p.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {policies.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Saved</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.3 GB</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleanups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Automatic cleanups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Cleanup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6h</div>
            <p className="text-xs text-muted-foreground">
              Scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Policies</CardTitle>
          <CardDescription>
            Configured cleanup rules for your backup storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={() => togglePolicy(policy.id)}
                    />
                  </div>
                  
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {policy.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Projects: {policy.projects.join(', ') || 'None assigned'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      Saved: {policy.totalSavings}
                    </div>
                    <div className="text-muted-foreground">
                      Last: {formatDate(policy.lastCleanup)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge className={getStatusColor(policy.enabled)}>
                      {policy.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
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

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Recommended Rules</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep daily backups for 7-30 days</li>
                <li>• Keep weekly backups for 3-6 months</li>
                <li>• Keep monthly backups for 1-2 years</li>
                <li>• Keep yearly backups for long-term compliance</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Cost Optimization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enable compression to reduce storage</li>
                <li>• Use shorter retention for development</li>
                <li>• Archive old backups to cheaper storage</li>
                <li>• Monitor storage usage regularly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 