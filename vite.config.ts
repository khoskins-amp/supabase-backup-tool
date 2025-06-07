import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    // Path resolution must come first
    viteTsConfigPaths({
      projects: ['./tsconfig.json']
    }),
    // TanStack Router plugin
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    // React plugin
    react(),
    // Tailwind CSS
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Fix for path resolution
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 