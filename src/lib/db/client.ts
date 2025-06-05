import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Import schemas directly to avoid circular dependencies
import * as projectsSchema from "./projects.schema";
import * as backupsSchema from "./backups.schema";
import * as jobsSchema from "./jobs.schema";

// Combine all schemas
const schema = {
  ...projectsSchema,
  ...backupsSchema,
  ...jobsSchema,
};

// Neon PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;

// Create PostgreSQL connection
const queryClient = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

// Create the Drizzle ORM instance with explicit typing
export const db = drizzle(queryClient, { schema });

export type Database = typeof db; 