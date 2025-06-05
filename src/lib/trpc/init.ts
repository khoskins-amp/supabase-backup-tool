import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { ZodError } from 'zod';
// Create tRPC context for each request
export const createTRPCContext = cache(async () => {
  /**
   * Context available to all tRPC procedures
   * Add user authentication, database connections, etc. here
   */
  return {
    // For now, we'll keep it simple - can add user auth later
    timestamp: Date.now(),
    userId: null, // Add authentication later
  };
});

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// Initialize tRPC with superjson transformer for handling Date objects, etc.
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? (error.cause as ZodError).flatten()
            : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// Middleware for logging (optional)
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  
  const meta = { path, type, durationMs };
  
  result.ok
    ? console.log('OK request timing:', meta)
    : console.error('Non-OK request timing', meta);
    
  return result;
});

// Public procedure (no authentication required)
export const publicProcedure = baseProcedure.use(loggerMiddleware);

// Protected procedure (authentication required - implement later)
export const protectedProcedure = baseProcedure
  .use(loggerMiddleware)
  .use(async ({ ctx, next }) => {
    // TODO: Add authentication check here
    // For now, we'll allow all requests
    // if (!ctx.userId) {
    //   throw new TRPCError({ code: 'UNAUTHORIZED' });
    // }
    return next({
      ctx: {
        ...ctx,
        // Ensure userId is available in protected procedures
        userId: ctx.userId,
      },
    });
  });