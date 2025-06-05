import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/*.schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST || "ep-empty-thunder-aa7gxurv-pooler.westus3.azure.neon.tech",
    database: process.env.PGDATABASE || "db-tool",
    user: process.env.PGUSER || "db-tool_owner",
    password: process.env.PGPASSWORD || "npg_2hcW3MHLgoBI",
    ssl: true,
  },
  verbose: true,
  strict: true,
}); 