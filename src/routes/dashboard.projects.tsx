import * as React from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/projects')({
  component: ProjectsComponent,
})

function ProjectsComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
        <p className="text-muted-foreground">
          Manage your Supabase projects and configurations
        </p>
      </div>
      <Outlet />
    </div>
  )
} 