import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../init';
import { projectsRouter } from './projects.router';
import { backupsRouter } from './backups.router';

// System utilities router
const systemRouter = createTRPCRouter({
  // System health check
  getHealth: publicProcedure.query(async () => {
    console.log('🏥 System.getHealth called');
    const result = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
    };
    console.log('✅ System.getHealth returning:', result);
    return result;
  }),
});

// Legacy posts router for testing
const postsRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
    return [
      { id: '1', title: 'Example Post 1' },
      { id: '2', title: 'Example Post 2' },
      { id: '3', title: 'Example Post 3' },
    ];
  }),
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return { 
        id: input.id, 
        title: `Example Post ${input.id}`,
        content: `This is the content for post ${input.id}`,
      };
    }),
});

// Main application router
export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  backups: backupsRouter,
  system: systemRouter,
  posts: postsRouter, // Keep for testing/examples
});

export type AppRouter = typeof appRouter;