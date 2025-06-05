import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import superjson from 'superjson';
import type { AppRouter } from './routers';

// Create singleton QueryClient for CSR (TanStack Start + Vite)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set some default staleTime for better UX
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

// Create tRPC client with proper configuration for TanStack Start
const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      // TanStack Start with Vite - server runs on same origin
      url: '/trpc',
      transformer: superjson,
      // Add any headers if needed
      async headers() {
        return {
          // Add auth headers here if needed later
        };
      },
    }),
  ],
});

// Create the tRPC proxy for use throughout the app
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

// Export type for the tRPC client
export type TRPCClient = typeof trpc; 