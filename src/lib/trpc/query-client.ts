import {
    defaultShouldDehydrateQuery,
    QueryClient,
  } from '@tanstack/react-query';
  import superjson from 'superjson';
  
  export function makeQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid refetching immediately on the client
          staleTime: 30 * 1000, // 30 seconds
          // Retry failed requests
          retry: (failureCount, error) => {
            // Don't retry 4xx errors (client errors)
            if (error instanceof Error && 'status' in error) {
              const status = (error as any).status;
              if (status >= 400 && status < 500) {
                return false;
              }
            }
            return failureCount < 3;
          },
        },
        mutations: {
          // Retry mutations once on failure
          retry: 1,
        },
        dehydrate: {
          // Include successful queries in the dehydrated state by default
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) ||
            query.state.status === 'pending',
          // Use superjson for serialization
          serializeData: superjson.serialize,
        },
        hydrate: {
          // Use superjson for deserialization
          deserializeData: superjson.deserialize,
        },
      },
    });
  }