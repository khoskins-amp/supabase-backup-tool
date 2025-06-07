import { QueryClient } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import superjson from 'superjson';
import type { AppRouter } from './routers';

// Create the tRPC React client
export const trpc = createTRPCReact<AppRouter>();

// Create singleton QueryClient for TanStack Start
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set some default staleTime for better UX
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create tRPC client with proper configuration
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      transformer: superjson,
      // You can pass any HTTP headers here
      async headers() {
        return {
          // Add any auth headers here if needed
        };
      },
    }),
  ],
});

// Export router input and output types
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>; 