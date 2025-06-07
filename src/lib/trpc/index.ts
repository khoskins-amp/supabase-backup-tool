// Export everything tRPC-related from a single place
export { queryClient, trpc, trpcClient } from './client';
export type { AppRouter } from './routers';
export type { RouterInputs, RouterOutputs } from './client';

// Re-export commonly used tRPC types
export type { TRPCContext } from './init'; 