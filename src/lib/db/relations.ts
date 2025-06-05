import { relations } from "drizzle-orm";
import { projects } from "./projects.schema";
import { backups } from "./backups.schema";
import { jobs } from "./jobs.schema";

// Projects relations
export const projectsRelations = relations(projects, ({ many }) => ({
  backups: many(backups),
  jobs: many(jobs),
}));

// Backups relations
export const backupsRelations = relations(backups, ({ one }) => ({
  project: one(projects, {
    fields: [backups.projectId],
    references: [projects.id],
  }),
}));

// Jobs relations
export const jobsRelations = relations(jobs, ({ one }) => ({
  project: one(projects, {
    fields: [jobs.projectId],
    references: [projects.id],
  }),
})); 