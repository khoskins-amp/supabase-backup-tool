import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ProjectForm } from '@/components/project-form'

export const Route = createFileRoute('/dashboard/projects/new')({
  component: NewProjectComponent,
})

function NewProjectComponent() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    navigate({ to: '/dashboard/projects' })
  }

  const handleCancel = () => {
    navigate({ to: '/dashboard/projects' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add New Project</h2>
          <p className="text-muted-foreground">
            Connect your Supabase project to start creating backups
          </p>
        </div>
      </div>

      <ProjectForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showActions={true}
      />
    </div>
  )
} 