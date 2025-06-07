import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Database,
  AlertTriangle,
  Info,
  Plus,
  ArrowLeft
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ManualBackupForm } from '@/components/backup/manual-backup-form'
import { trpc } from '@/lib/trpc'
import type { Project } from '@/lib/db'

export const Route = createFileRoute('/dashboard/backups/manual')({
  component: ManualBackupComponent,
})

function ManualBackupComponent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  // Fetch projects
  const projectsQuery = trpc.projects.list.useQuery()
  const projects: Project[] = projectsQuery.data?.data || []

  const selectedProject = projects.find((p: Project) => p.id === selectedProjectId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const handleBackupSuccess = (result: any) => {
    console.log('Backup completed:', result)
    // Could show a success message or redirect
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manual Backup</h2>
          <p className="text-muted-foreground">
            Create an on-demand backup of your Supabase project
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/backups">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Backups
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Project Selection */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Select Project
              </CardTitle>
              <CardDescription>
                Choose the project to backup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-select">Project</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="project-select" className="mt-1">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{project.name}</span>
                            <Badge className={`ml-2 ${getStatusColor('healthy')}`}>
                              connected
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProject && (
                  <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <div className="font-medium">{selectedProject.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">URL:</span>
                        <div className="font-medium break-all">{selectedProject.databaseUrl}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <div className="font-medium">{formatDate(selectedProject.createdAt.toISOString())}</div>
                      </div>
                    </div>
                  </div>
                )}

                {projects.length === 0 && !projectsQuery.isLoading && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No projects found. Please add a project first.
                    </AlertDescription>
                  </Alert>
                )}

                {projectsQuery.isLoading && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Loading projects...
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup Form */}
        <div className="md:col-span-2">
          {selectedProjectId ? (
            <ManualBackupForm 
              projectId={selectedProjectId}
              onSuccess={handleBackupSuccess}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a project from the sidebar to create a backup
                  </p>
                  {projects.length === 0 && (
                    <Button asChild>
                      <Link to="/dashboard/projects/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Project
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 