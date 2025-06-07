import { config } from 'dotenv'
config()
import express from 'express'
import cors from 'cors'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../src/lib/trpc/routers/index'
import { createTRPCContext } from '../src/lib/trpc/init'

const app = express()
const port = process.env.SERVER_PORT || 3001

// Enable CORS for development
app.use(cors({
  origin: 'http://localhost:3000', // Vite dev server
  credentials: true,
}))

// Handle tRPC requests
app.use('/trpc', async (req, res) => {
  console.log(`🌐 tRPC Request: ${req.method} ${req.url}`);
  console.log(`🔍 Original URL: ${req.originalUrl}`);
  
  const request = new Request(`http://localhost:${port}${req.originalUrl}`, {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== 'GET' && req.method !== 'HEAD' 
      ? JSON.stringify(req.body) 
      : undefined,
  })

  const response = await fetchRequestHandler({
    endpoint: '/trpc',
    req: request,
    router: appRouter,
    createContext: createTRPCContext,
  })

  // Copy response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  res.status(response.status)
  
  if (response.body) {
    const reader = response.body.getReader()
    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) {
        res.end()
        return
      }
      res.write(value)
      pump()
    }
    pump()
  } else {
    res.end()
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
  console.log(`🚀 tRPC server running on http://localhost:${port}`)
}) 