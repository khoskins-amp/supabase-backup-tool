import { config } from 'dotenv';
config(); // Load environment variables first

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
console.log('🔍 Database Environment Variables:', {
  DATABASE_URL: !!process.env.DATABASE_URL,
  PGHOST: process.env.PGHOST,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: !!process.env.PGPASSWORD,
  PGDATABASE: process.env.PGDATABASE
});

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;

console.log('🔗 Final connection string:', connectionString.replace(/:[^:@]*@/, ':***@'));

// Create PostgreSQL connection
const queryClient = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
});

// Create the Drizzle ORM instance with explicit typing
export const db = drizzle(queryClient, { schema });

export type Database = typeof db; 