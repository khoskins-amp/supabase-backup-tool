import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
// Import the generated route tree
import { routeTree } from './routeTree.gen'

import { Spinner } from './routes/-components/spinner'
// Import the proper tRPC setup from our lib
import { queryClient, trpc } from './lib/trpc'

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    context: {
      trpc,
      queryClient,
    },
    defaultPendingComponent: () => (
      <div className={`p-2 text-2xl`}>
        <Spinner />
      </div>
    ),
    Wrap: function WrapComponent({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    },
  })

  return router
}

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
