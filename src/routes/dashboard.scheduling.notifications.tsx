import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail,
  MessageSquare,
  Webhook,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TicketCheck,
  Save,
  Edit,
  Trash2,
  Plus,
  Settings
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/scheduling/notifications')({
  component: NotificationsComponent,
})

function NotificationsComponent() {
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    username: 'backup@company.com',
    password: '',
    fromEmail: 'backup@company.com',
    fromName: 'Supabase Backup Tool'
  });

  const [slackSettings, setSlackSettings] = useState({
    enabled: false,
    webhookUrl: '',
    channel: '#backups',
    username: 'Backup Bot'
  });

  const [webhookSettings, setWebhookSettings] = useState({
    enabled: false,
    url: '',
    secret: '',
    timeout: 30
  });

  const [rules, setRules] = useState([
    {
      id: '1',
      name: 'Backup Success',
      description: 'Notify when backup completes successfully',
      event: 'backup_success',
      enabled: true,
      channels: ['email'],
      projects: ['all'],
      template: 'success'
    },
    {
      id: '2',
      name: 'Backup Failure',
      description: 'Alert when backup fails',
      event: 'backup_failure',
      enabled: true,
      channels: ['email', 'slack'],
      projects: ['Production DB'],
      template: 'failure'
    },
    {
      id: '3',
      name: 'Storage Alert',
      description: 'Warn when storage usage is high',
      event: 'storage_high',
      enabled: true,
      channels: ['email'],
      projects: ['all'],
      template: 'warning'
    }
  ]);

  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    event: 'backup_success',
    enabled: true,
    channels: [] as string[],
    projects: ['all'],
    template: 'success'
  });

  const eventTypes = [
    { value: 'backup_success', label: 'Backup Success' },
    { value: 'backup_failure', label: 'Backup Failure' },
    { value: 'backup_start', label: 'Backup Started' },
    { value: 'storage_high', label: 'High Storage Usage' },
    { value: 'schedule_missed', label: 'Missed Schedule' },
    { value: 'retention_cleanup', label: 'Retention Cleanup' }
  ];

  const templates = [
    { value: 'success', label: 'Success Template' },
    { value: 'failure', label: 'Failure Template' },
    { value: 'warning', label: 'Warning Template' },
    { value: 'info', label: 'Info Template' }
  ];

  const channels = [
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'slack', label: 'Slack', icon: MessageSquare },
    { value: 'webhook', label: 'Webhook', icon: Webhook }
  ];

  const testConnection = (type: string) => {
    // Simulate test
    console.log(`Testing ${type} connection...`);
  };

  const toggleChannel = (channel: string) => {
    setRuleForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleCreateRule = () => {
    setIsCreatingRule(true);
    setRuleForm({
      name: '',
      description: '',
      event: 'backup_success',
      enabled: true,
      channels: [],
      projects: ['all'],
      template: 'success'
    });
  };

  const handleEditRule = (rule: typeof rules[0]) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      event: rule.event,
      enabled: rule.enabled,
      channels: [...rule.channels],
      projects: [...rule.projects],
      template: rule.template
    });
  };

  const saveRule = () => {
    if (isCreatingRule) {
      const newRule = {
        id: Date.now().toString(),
        ...ruleForm
      };
      setRules(prev => [...prev, newRule]);
    } else if (editingRuleId) {
      setRules(prev => prev.map(r => 
        r.id === editingRuleId ? { ...r, ...ruleForm } : r
      ));
    }
    
    setIsCreatingRule(false);
    setEditingRuleId(null);
  };

  const cancelRule = () => {
    setIsCreatingRule(false);
    setEditingRuleId(null);
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'backup_success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'backup_failure':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'backup_start':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'storage_high':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const isFormVisible = isCreatingRule || editingRuleId !== null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Configure alerts for backup events and system status
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="rules">Notification Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle>Email Settings</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={emailSettings.enabled}
                    onCheckedChange={(checked) => 
                      setEmailSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => testConnection('email')}>
                    <TicketCheck className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>
              <CardDescription>
                Configure SMTP settings for email notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={emailSettings.username}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>

          {/* Slack Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <CardTitle>Slack Settings</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={slackSettings.enabled}
                    onCheckedChange={(checked) => 
                      setSlackSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => testConnection('slack')}>
                    <TicketCheck className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>
              <CardDescription>
                Configure Slack webhook for channel notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={slackSettings.webhookUrl}
                    onChange={(e) => setSlackSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://hooks.slack.com/services/..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="channel">Channel</Label>
                  <Input
                    id="channel"
                    value={slackSettings.channel}
                    onChange={(e) => setSlackSettings(prev => ({ ...prev, channel: e.target.value }))}
                    placeholder="#backups"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="slack-username">Bot Username</Label>
                  <Input
                    id="slack-username"
                    value={slackSettings.username}
                    onChange={(e) => setSlackSettings(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Slack Settings
              </Button>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  <CardTitle>Webhook Settings</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhookSettings.enabled}
                    onCheckedChange={(checked) => 
                      setWebhookSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => testConnection('webhook')}>
                    <TicketCheck className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </div>
              <CardDescription>
                Configure custom webhook for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="webhook-endpoint">Webhook URL</Label>
                  <Input
                    id="webhook-endpoint"
                    value={webhookSettings.url}
                    onChange={(e) => setWebhookSettings(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-app.com/webhook"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-secret">Secret Key</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    value={webhookSettings.secret}
                    onChange={(e) => setWebhookSettings(prev => ({ ...prev, secret: e.target.value }))}
                    placeholder="Optional signing secret"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={webhookSettings.timeout}
                    onChange={(e) => setWebhookSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    min="5"
                    max="300"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button className="mt-4">
                <Save className="h-4 w-4 mr-2" />
                Save Webhook Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {/* Form */}
          {isFormVisible && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreatingRule ? 'Create Notification Rule' : 'Edit Notification Rule'}
                </CardTitle>
                <CardDescription>
                  Configure when and how to send notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        value={ruleForm.name}
                        onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Production Backup Alerts"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="event-type">Event Type</Label>
                      <Select value={ruleForm.event} onValueChange={(value) => setRuleForm(prev => ({ ...prev, event: value }))}>
                        <SelectTrigger id="event-type" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventTypes.map((event) => (
                            <SelectItem key={event.value} value={event.value}>
                              {event.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={ruleForm.description}
                      onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe when this rule should trigger..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Notification Channels</Label>
                    <div className="flex gap-4 mt-2">
                      {channels.map((channel) => (
                        <div
                          key={channel.value}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            ruleForm.channels.includes(channel.value)
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-gray-300'
                          }`}
                          onClick={() => toggleChannel(channel.value)}
                        >
                          <channel.icon className="h-4 w-4" />
                          <span className="text-sm">{channel.label}</span>
                          {ruleForm.channels.includes(channel.value) && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="template">Message Template</Label>
                      <Select value={ruleForm.template} onValueChange={(value) => setRuleForm(prev => ({ ...prev, template: value }))}>
                        <SelectTrigger id="template" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        id="rule-enabled"
                        checked={ruleForm.enabled}
                        onCheckedChange={(checked) => setRuleForm(prev => ({ ...prev, enabled: checked }))}
                      />
                      <Label htmlFor="rule-enabled">Enable rule</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelRule}>
                      Cancel
                    </Button>
                    <Button onClick={saveRule}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Rule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rules List */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Rules</CardTitle>
              <CardDescription>
                {rules.length} rule(s) configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                      
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rule.description}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {rule.channels.map((channel) => {
                            const channelData = channels.find(c => c.value === channel);
                            const IconComponent = channelData?.icon;
                            return (
                              <Badge key={channel} variant="secondary" className="text-xs">
                                {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                                {channelData?.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <Badge className={getEventColor(rule.event)}>
                          {eventTypes.find(e => e.value === rule.event)?.label}
                        </Badge>
                        <Badge className={getStatusColor(rule.enabled)}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {rules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No notification rules</h3>
                    <p className="text-sm">Create your first notification rule to get started.</p>
                    <Button onClick={handleCreateRule} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Rule
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 