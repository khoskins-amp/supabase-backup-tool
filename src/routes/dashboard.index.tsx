import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Database, 
  Activity,
  Calendar,
  Download,
  Settings,
  TrendingUp,
  Users,
  Server,
  HardDrive,
  Clock
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardComponent,
})

function DashboardComponent() {
  // Fetch data using tRPC hooks
  const projectsQuery = trpc.projects.list.useQuery();
  const healthQuery = trpc.system.getHealth.useQuery();
  
  // Debug logging
  console.log('🔍 Dashboard - Projects Query State:', {
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    data: projectsQuery.data,
    status: projectsQuery.status
  });
  
  console.log('🏥 Dashboard - Health Query State:', {
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
    error: healthQuery.error,
    data: healthQuery.data,
    status: healthQuery.status
  });
  
  const projects = projectsQuery.data?.data || [];
  const systemHealth = healthQuery.data?.data;

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your Supabase backup operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Backups</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 GB</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth?.status === 'healthy' ? (
                <Badge variant="default" className="text-sm">Healthy</Badge>
              ) : (
                <Badge variant="destructive" className="text-sm">Unknown</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/dashboard/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Add New Project
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/backups/manual">
                <Download className="h-4 w-4 mr-2" />
                Create Manual Backup
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/backups/scheduled">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Backup
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest backup operations and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No recent activity</p>
              <p className="text-sm">Backup operations will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Projects Overview</CardTitle>
                <CardDescription>
                  Your configured Supabase projects
                </CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link to="/dashboard/projects">
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 3).map((project: any) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.projectRef}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status || 'Unknown'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Backup
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {projects.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Set up your first Supabase project backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No projects configured</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first Supabase project to start creating automated backups. 
                You'll need your project URL and service key.
              </p>
              <Button asChild>
                <Link to="/dashboard/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
