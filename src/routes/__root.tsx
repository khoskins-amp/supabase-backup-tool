import '../styles.css'
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/components/theme-provider'

import { Spinner } from './-components/spinner'
import type { QueryClient } from '@tanstack/react-query'

export interface RouterAppContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
})

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading })

  return (
    <ThemeProvider defaultTheme="system" storageKey="supabase-backup-theme">
      <div className="min-h-screen">
        {/* Global loading indicator */}
        {isFetching && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
              <Spinner />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <Outlet />
      </div>
      
      {/* Dev tools */}
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </ThemeProvider>
  )
}
