// Export everything tRPC-related from a single place
export { queryClient, trpc } from './client';
export type { AppRouter } from './routers';
export type { TRPCClient } from './client';

// Re-export commonly used tRPC types
export type { TRPCContext } from './init'; 