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
import { 
  Settings,
  Save,
  RotateCcw,
  HardDrive,
  Database,
  Shield,
  Bell,
  Palette,
  Globe,
  Info
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/settings/')({
  component: GeneralSettingsComponent,
})

function GeneralSettingsComponent() {
  const [settings, setSettings] = useState({
    // Application Settings
    appName: 'Supabase Backup Tool',
    defaultBackupPath: '/data/backups',
    maxConcurrentBackups: 3,
    backupTimeout: 30,
    autoStart: true,
    minimizeToTray: false,

    // Default Backup Settings
    defaultCompression: true,
    defaultEncryption: false,
    defaultRetentionDays: 30,
    includeStorageByDefault: false,
    
    // UI Preferences
    theme: 'system',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    language: 'en',
    
    // Notifications
    enableDesktopNotifications: true,
    enableSounds: false,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    
    // Performance
    enableLogging: true,
    logLevel: 'info',
    maxLogSize: 100, // MB
    enableMetrics: true
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings);
    setHasChanges(false);
  };

  const resetSettings = () => {
    // Reset to defaults
    setHasChanges(false);
  };

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ];

  const logLevels = [
    { value: 'error', label: 'Error Only' },
    { value: 'warn', label: 'Warning' },
    { value: 'info', label: 'Info' },
    { value: 'debug', label: 'Debug' }
  ];

  const dateFormats = [
    { value: 'YYYY-MM-DD', label: '2024-01-15' },
    { value: 'MM/DD/YYYY', label: '01/15/2024' },
    { value: 'DD/MM/YYYY', label: '15/01/2024' },
    { value: 'DD MMM YYYY', label: '15 Jan 2024' }
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
          <p className="text-muted-foreground">
            Configure application preferences and default backup settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Basic application configuration and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                value={settings.appName}
                onChange={(e) => updateSetting('appName', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="backup-path">Default Backup Path</Label>
              <Input
                id="backup-path"
                value={settings.defaultBackupPath}
                onChange={(e) => updateSetting('defaultBackupPath', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="concurrent">Max Concurrent Backups</Label>
              <Input
                id="concurrent"
                type="number"
                min="1"
                max="10"
                value={settings.maxConcurrentBackups}
                onChange={(e) => updateSetting('maxConcurrentBackups', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="timeout">Backup Timeout (minutes)</Label>
              <Input
                id="timeout"
                type="number"
                min="5"
                max="120"
                value={settings.backupTimeout}
                onChange={(e) => updateSetting('backupTimeout', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-start"
                checked={settings.autoStart}
                onCheckedChange={(checked) => updateSetting('autoStart', checked)}
              />
              <Label htmlFor="auto-start">Start application on system boot</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="minimize-tray"
                checked={settings.minimizeToTray}
                onCheckedChange={(checked) => updateSetting('minimizeToTray', checked)}
              />
              <Label htmlFor="minimize-tray">Minimize to system tray</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Default Backup Settings
          </CardTitle>
          <CardDescription>
            Default options for new backup configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="retention">Default Retention (days)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="365"
                value={settings.defaultRetentionDays}
                onChange={(e) => updateSetting('defaultRetentionDays', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="default-compression"
                  checked={settings.defaultCompression}
                  onCheckedChange={(checked) => updateSetting('defaultCompression', checked)}
                />
                <Label htmlFor="default-compression">Enable compression by default</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="default-encryption"
                  checked={settings.defaultEncryption}
                  onCheckedChange={(checked) => updateSetting('defaultEncryption', checked)}
                />
                <Label htmlFor="default-encryption">Enable encryption by default</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-storage"
                  checked={settings.includeStorageByDefault}
                  onCheckedChange={(checked) => updateSetting('includeStorageByDefault', checked)}
                />
                <Label htmlFor="include-storage">Include storage files by default</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            User Interface
          </CardTitle>
          <CardDescription>
            Customize the application appearance and formatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger id="theme" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger id="language" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-format">Date Format</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => updateSetting('dateFormat', value)}>
                <SelectTrigger id="date-format" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time-format">Time Format</Label>
              <Select value={settings.timeFormat} onValueChange={(value) => updateSetting('timeFormat', value)}>
                <SelectTrigger id="time-format" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (3:00 PM)</SelectItem>
                  <SelectItem value="24h">24 Hour (15:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure desktop notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="desktop-notifications"
                checked={settings.enableDesktopNotifications}
                onCheckedChange={(checked) => updateSetting('enableDesktopNotifications', checked)}
              />
              <Label htmlFor="desktop-notifications">Enable desktop notifications</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sounds"
                checked={settings.enableSounds}
                onCheckedChange={(checked) => updateSetting('enableSounds', checked)}
              />
              <Label htmlFor="sounds">Enable notification sounds</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notify-success"
                checked={settings.notifyOnSuccess}
                onCheckedChange={(checked) => updateSetting('notifyOnSuccess', checked)}
              />
              <Label htmlFor="notify-success">Notify on successful backups</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notify-failure"
                checked={settings.notifyOnFailure}
                onCheckedChange={(checked) => updateSetting('notifyOnFailure', checked)}
              />
              <Label htmlFor="notify-failure">Notify on backup failures</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance & Logging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Performance & Logging
          </CardTitle>
          <CardDescription>
            System performance and diagnostic settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="log-level">Log Level</Label>
              <Select value={settings.logLevel} onValueChange={(value) => updateSetting('logLevel', value)}>
                <SelectTrigger id="log-level" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="log-size">Max Log Size (MB)</Label>
              <Input
                id="log-size"
                type="number"
                min="10"
                max="1000"
                value={settings.maxLogSize}
                onChange={(e) => updateSetting('maxLogSize', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-logging"
                checked={settings.enableLogging}
                onCheckedChange={(checked) => updateSetting('enableLogging', checked)}
              />
              <Label htmlFor="enable-logging">Enable application logging</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enable-metrics"
                checked={settings.enableMetrics}
                onCheckedChange={(checked) => updateSetting('enableMetrics', checked)}
              />
              <Label htmlFor="enable-metrics">Enable performance metrics</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 