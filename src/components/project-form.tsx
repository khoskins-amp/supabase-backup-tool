import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Database, 
  Save,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Info,
  Shield,
  Loader2,
  Key,
  HelpCircle,
  Globe,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc/client'
import { parseSupabaseDatabaseUrl } from '@/lib/utils'

type ConnectionResult = {
  success: boolean
  message: string
  capabilities?: string[]
}

type ProjectFormData = {
  name: string
  description: string
  environment: 'production' | 'staging' | 'development'
  databaseUrl: string
  supabaseServiceKey: string
  supabaseAnonKey: string
}

interface ProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  showActions?: boolean
  title?: string
  description?: string
}

interface PasswordInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
  label: string
  helpText?: string
}

function PasswordInput({ id, value, onChange, placeholder, disabled, label, helpText }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}

export function ProjectForm({ 
  onSuccess, 
  onCancel, 
  showActions = true,
  title = "Project Details",
  description = "Enter your Supabase project information. Only the database URL is required for basic backup functionality."
}: ProjectFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    environment: 'production',
    databaseUrl: '',
    supabaseServiceKey: '',
    supabaseAnonKey: '',
  })

  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null)
  const [serviceKeyHelpOpen, setServiceKeyHelpOpen] = useState(false)
  const [anonKeyHelpOpen, setAnonKeyHelpOpen] = useState(false)
  const [urlParseResult, setUrlParseResult] = useState<ReturnType<typeof parseSupabaseDatabaseUrl> | null>(null)

  // Parse URL whenever databaseUrl changes
  useEffect(() => {
    if (formData.databaseUrl) {
      const result = parseSupabaseDatabaseUrl(formData.databaseUrl)
      setUrlParseResult(result)
    } else {
      setUrlParseResult(null)
    }
  }, [formData.databaseUrl])

  // tRPC mutations using the correct pattern
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate projects list query
        queryClient.invalidateQueries({ queryKey: [['projects', 'list']] })
        // Call custom success handler or navigate
        if (onSuccess) {
          onSuccess()
        } else {
          navigate({ to: '/dashboard/projects' })
        }
      }
    }
  })

  const testConnectionMutation = trpc.projects.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success && data.data) {
        const capabilities: string[] = []
        if (data.data.features.database) capabilities.push('Complete database backup/restore')
        if (data.data.features.auth) capabilities.push('Auth backup/restore')
        if (data.data.features.storage) capabilities.push('Storage backup/restore')
        if (data.data.features.functions) capabilities.push('Edge functions backup/restore')
        if (data.data.features.api) capabilities.push('API connection testing')

        setConnectionResult({
          success: true,
          message: data.data.message,
          capabilities
        })
      } else {
        setConnectionResult({
          success: false,
          message: data.error || 'Connection test failed'
        })
      }
    },
    onError: (error: any) => {
      setConnectionResult({
        success: false,
        message: error.message || 'Connection test failed'
      })
    }
  })

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear connection result when form changes
    if (connectionResult) {
      setConnectionResult(null)
    }
  }

  const testConnection = async () => {
    if (!formData.databaseUrl) {
      setConnectionResult({
        success: false,
        message: 'Please enter a database URL first'
      })
      return
    }

    testConnectionMutation.mutate({
      databaseUrl: formData.databaseUrl,
      supabaseServiceKey: formData.supabaseServiceKey || undefined,
      supabaseAnonKey: formData.supabaseAnonKey || undefined,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) return

    createProjectMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      environment: formData.environment,
      databaseUrl: formData.databaseUrl,
      supabaseServiceKey: formData.supabaseServiceKey || undefined,
      supabaseAnonKey: formData.supabaseAnonKey || undefined,
    })
  }

  // Only database URL and name are required
  const isFormValid = formData.name.trim() && formData.databaseUrl.trim()
  const isSubmitting = createProjectMutation.isPending
  const isTestingConnection = testConnectionMutation.isPending

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        {createProjectMutation.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {createProjectMutation.error.message || 'Failed to create project'}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Supabase Project"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select 
                  value={formData.environment} 
                  onValueChange={(value: 'production' | 'staging' | 'development') => handleInputChange('environment', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description for this project"
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <PasswordInput
              id="databaseUrl"
              label="Database URL *"
              value={formData.databaseUrl}
              onChange={(value) => handleInputChange('databaseUrl', value)}
              placeholder="postgresql://postgres.xyz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
              disabled={isSubmitting}
              helpText="Find this in your Supabase project Settings → Database → Connection string"
            />
            
            {/* URL Parsing Results */}
            {urlParseResult && (
              <div className="mt-2">
                {urlParseResult.isValid ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Valid Supabase URL detected</span>
                    </div>
                    <div className="grid gap-1 text-xs text-green-700 dark:text-green-300">
                      <div className="flex items-center gap-2">
                        <Database className="h-3 w-3" />
                        <span>Project: {urlParseResult.projectRef}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Region: {urlParseResult.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        <span>API URL: {urlParseResult.supabaseUrl}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">Invalid URL format</span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">{urlParseResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Test */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={!formData.databaseUrl || isTestingConnection || isSubmitting}
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            
            {connectionResult && (
              <div className="flex items-center gap-2">
                {connectionResult.success ? (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Failed</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Result */}
          {connectionResult && (
            <Alert variant={connectionResult.success ? "default" : "destructive"}>
              {connectionResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div>
                  <p>{connectionResult.message}</p>
                  {connectionResult.capabilities && connectionResult.capabilities.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Available capabilities:</p>
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {connectionResult.capabilities.map((capability, index) => (
                          <li key={index}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Optional Fields - Enhanced Features */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-amber-600" />
              <h3 className="font-medium">Optional Keys (Enhanced Features)</h3>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These keys are optional but enable additional backup features like Auth, Storage, and Edge Functions.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Anonymous Key - Now First */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="supabaseAnonKey">Anonymous Key</Label>
                  <Collapsible open={anonKeyHelpOpen} onOpenChange={setAnonKeyHelpOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">With Anonymous Key you can:</p>
                            <ul className="space-y-0.5 text-blue-700 dark:text-blue-300">
                              <li>• Test public API connections</li>
                              <li>• Validate client-side configurations</li>
                              <li>• Perform read-only feature testing</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <PasswordInput
                  id="supabaseAnonKey"
                  label=""
                  value={formData.supabaseAnonKey}
                  onChange={(value) => handleInputChange('supabaseAnonKey', value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={isSubmitting}
                  helpText="Find this in Project Settings → API → anon public key. Enables API connection testing."
                />
              </div>

              {/* Service Role Key - Now Second */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="supabaseServiceKey">Service Role Key</Label>
                  <Collapsible open={serviceKeyHelpOpen} onOpenChange={setServiceKeyHelpOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <Key className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-medium mb-1">With Service Key you can backup:</p>
                            <ul className="space-y-0.5 text-amber-700 dark:text-amber-300">
                              <li>• Auth users and settings</li>
                              <li>• Storage buckets and files</li>
                              <li>• Edge functions</li>
                              <li>• Advanced project configurations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                <PasswordInput
                  id="supabaseServiceKey"
                  label=""
                  value={formData.supabaseServiceKey}
                  onChange={(value) => handleInputChange('supabaseServiceKey', value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={isSubmitting}
                  helpText="Find this in Project Settings → API → service_role key. Enables Auth & Storage backup."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {showActions && (
            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSubmitting}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Project
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
} 