import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload,
  Download,
  FileJson,
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  Settings,
  Import,
  FolderOutput
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/projects/import')({
  component: ImportExportComponent,
})

function ImportExportComponent() {
  const [importData, setImportData] = useState('')
  const [exportData, setExportData] = useState('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Mock project data
  const mockProjects = [
    {
      id: '1',
      name: 'Production DB',
      url: 'https://prod.supabase.co',
      database: 'production',
      lastBackup: '2024-01-15T10:30:00Z',
    },
    {
      id: '2', 
      name: 'Staging DB',
      url: 'https://staging.supabase.co',
      database: 'staging',
      lastBackup: '2024-01-15T09:00:00Z',
    },
    {
      id: '3',
      name: 'Development DB',
      url: 'https://dev.supabase.co',
      database: 'development',
      lastBackup: '2024-01-14T15:30:00Z',
    }
  ];

  const handleExport = () => {
    const selectedData = mockProjects.filter(p => selectedProjects.includes(p.id));
    const exportConfig = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      projects: selectedData.map(project => ({
        name: project.name,
        url: project.url,
        database: project.database,
        settings: {
          retentionDays: 30,
          compressionEnabled: true,
          encryptionEnabled: true,
          scheduleEnabled: false,
        }
      }))
    };
    
    setExportData(JSON.stringify(exportConfig, null, 2));
  };

  const handleImport = async () => {
    setImportStatus('loading');
    try {
      const config = JSON.parse(importData);
      
      // Validate the configuration
      if (!config.projects || !Array.isArray(config.projects)) {
        throw new Error('Invalid configuration format');
      }

      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setImportStatus('success');
    } catch (error) {
      setImportStatus('error');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const downloadConfig = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-backup-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportData);
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import/Export</h2>
          <p className="text-muted-foreground">
            Manage project configurations and backup settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FolderOutput className="h-4 w-4" />
            Export Configuration
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Import className="h-4 w-4" />
            Import Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          {/* Export Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Select Projects
                </CardTitle>
                <CardDescription>
                  Choose which projects to include in the export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProjects.includes(project.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => toggleProject(project.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {project.database}
                          </div>
                        </div>
                        {selectedProjects.includes(project.id) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button 
                    onClick={handleExport}
                    disabled={selectedProjects.length === 0}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Export
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    {selectedProjects.length} project(s) selected
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Configuration data for selected projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={exportData}
                    readOnly
                    placeholder="Export data will appear here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  
                  {exportData && (
                    <div className="flex gap-2">
                      <Button onClick={downloadConfig} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                      <Button variant="outline" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          {/* Import Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Configuration
                </CardTitle>
                <CardDescription>
                  Upload or paste your configuration data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Upload JSON File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="text-center text-muted-foreground">
                    — or —
                  </div>
                  
                  <div>
                    <Label htmlFor="import-data">Paste Configuration</Label>
                    <Textarea
                      id="import-data"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste your JSON configuration here..."
                      className="min-h-[200px] font-mono text-sm mt-1"
                    />
                  </div>

                  <Button 
                    onClick={handleImport}
                    disabled={!importData.trim() || importStatus === 'loading'}
                    className="w-full"
                  >
                    {importStatus === 'loading' ? (
                      <>
                        <Settings className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Configuration
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Status</CardTitle>
                <CardDescription>
                  Status and validation of your import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importStatus === 'idle' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Upload or paste a configuration file to begin import.
                      </AlertDescription>
                    </Alert>
                  )}

                  {importStatus === 'loading' && (
                    <Alert>
                      <Settings className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Validating and importing configuration...
                      </AlertDescription>
                    </Alert>
                  )}

                  {importStatus === 'success' && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Import successful!</strong> Your projects have been imported and configured.
                      </AlertDescription>
                    </Alert>
                  )}

                  {importStatus === 'error' && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Import failed!</strong> Please check your configuration format and try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <h4 className="font-medium mb-2">Expected Format:</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "version": "1.0",
  "projects": [
    {
      "name": "Project Name",
      "url": "https://xxx.supabase.co",
      "database": "postgres"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 