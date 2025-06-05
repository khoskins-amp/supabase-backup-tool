import { defineEventHandler, toWebRequest } from '@tanstack/react-start/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from './src/lib/trpc/routers/index'
import { createTRPCContext } from './src/lib/trpc/init'

export type AppRouter = typeof appRouter

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event)
  if (!request) {
    return new Response('No request', { status: 400 })
  }

  return fetchRequestHandler({
    endpoint: '/trpc',
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  })
})
