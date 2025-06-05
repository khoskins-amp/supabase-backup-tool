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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  Trash2,
  Plus,
  Settings
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/settings/security')({
  component: SecuritySettingsComponent,
})

function SecuritySettingsComponent() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);

  const [encryptionKeys, setEncryptionKeys] = useState([
    {
      id: '1',
      name: 'Production Key',
      algorithm: 'AES-256',
      createdAt: '2024-01-01T00:00:00Z',
      isDefault: true,
      status: 'active'
    },
    {
      id: '2',
      name: 'Staging Key',
      algorithm: 'AES-256',
      createdAt: '2024-01-10T00:00:00Z',
      isDefault: false,
      status: 'active'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState([
    {
      id: '1',
      action: 'Login',
      user: 'admin',
      timestamp: '2024-01-15T10:30:00Z',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '2',
      action: 'Backup Created',
      user: 'admin',
      timestamp: '2024-01-15T09:15:00Z',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: '3',
      action: 'Failed Login',
      user: 'unknown',
      timestamp: '2024-01-15T08:45:00Z',
      ip: '10.0.0.50',
      status: 'failed'
    }
  ]);

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 15;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 10;
    return Math.min(strength, 100);
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateNewKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: `Key-${Date.now()}`,
      algorithm: 'AES-256',
      createdAt: new Date().toISOString(),
      isDefault: false,
      status: 'active'
    };
    setEncryptionKeys(prev => [...prev, newKey]);
  };

  const deleteKey = (id: string) => {
    setEncryptionKeys(prev => prev.filter(key => key.id !== id));
  };

  const setDefaultKey = (id: string) => {
    setEncryptionKeys(prev => prev.map(key => ({
      ...key,
      isDefault: key.id === id
    })));
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Settings</h2>
          <p className="text-muted-foreground">
            Manage security, encryption, and access control settings
          </p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">Encryption Enabled</div>
                <div className="text-sm text-muted-foreground">AES-256 encryption active</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <div className="font-medium">2FA Disabled</div>
                <div className="text-sm text-muted-foreground">Consider enabling 2FA</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">Auto-lock Active</div>
                <div className="text-sm text-muted-foreground">Session timeout: 30 min</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Master Password
          </CardTitle>
          <CardDescription>
            Change your master password for credential encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="mt-1"
              />
              {masterPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Password Strength</span>
                    <span>{getStrengthText(passwordStrength(masterPassword))}</span>
                  </div>
                  <Progress 
                    value={passwordStrength(masterPassword)} 
                    className="h-2"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
              {confirmPassword && masterPassword !== confirmPassword && (
                <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button 
              disabled={!currentPassword || !masterPassword || masterPassword !== confirmPassword}
              className="w-full"
            >
              Update Master Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Encryption Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Encryption Settings
          </CardTitle>
          <CardDescription>
            Configure encryption for backups and stored credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="encryption-enabled">Enable Encryption</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt all backups and sensitive data
                </p>
              </div>
              <Switch
                id="encryption-enabled"
                checked={encryptionEnabled}
                onCheckedChange={setEncryptionEnabled}
              />
            </div>

            {encryptionEnabled && (
              <>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Encryption Keys</h4>
                    <Button variant="outline" size="sm" onClick={generateNewKey}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Key
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {encryptionKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{key.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {key.algorithm} • Created {formatDate(key.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {key.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          <Badge 
                            className={key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {key.status}
                          </Badge>
                          
                          <div className="flex gap-1">
                            {!key.isDefault && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDefaultKey(key.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteKey(key.id)}
                              disabled={key.isDefault}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Key Management</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Key
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Keys
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rotate Keys
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Configure session management and security policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                min="5"
                max="480"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Switch
                id="auto-lock"
                checked={autoLockEnabled}
                onCheckedChange={setAutoLockEnabled}
              />
              <Label htmlFor="auto-lock">Enable auto-lock on inactivity</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="two-factor"
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
              <Label htmlFor="two-factor">Enable two-factor authentication</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="audit-logging"
                checked={true}
                onCheckedChange={() => {}}
              />
              <Label htmlFor="audit-logging">Enable audit logging</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>
            Latest security-related activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{log.action}</div>
                  <div className="text-sm text-muted-foreground">
                    User: {log.user} • IP: {log.ip}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm">{formatDate(log.timestamp)}</div>
                  <Badge 
                    className={log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            View Full Audit Log
          </Button>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium">Enable Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Strong Master Password</div>
                <div className="text-sm text-muted-foreground">
                  Your master password meets security requirements
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <div className="font-medium">Encryption Enabled</div>
                <div className="text-sm text-muted-foreground">
                  All sensitive data is properly encrypted
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 