CREATE TABLE "backups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'manual' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"include_auth" boolean DEFAULT true NOT NULL,
	"include_storage" boolean DEFAULT true NOT NULL,
	"include_database" boolean DEFAULT true NOT NULL,
	"include_edge_functions" boolean DEFAULT false NOT NULL,
	"file_path" text,
	"file_name" text,
	"file_size" integer DEFAULT 0,
	"checksum" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"duration" integer DEFAULT 0,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"schedule_type" text DEFAULT 'manual' NOT NULL,
	"cron_expression" text,
	"interval_minutes" integer,
	"backup_name" text,
	"include_auth" boolean DEFAULT true NOT NULL,
	"include_storage" boolean DEFAULT true NOT NULL,
	"include_database" boolean DEFAULT true NOT NULL,
	"include_edge_functions" boolean DEFAULT false NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"last_status" text,
	"last_error_message" text,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"successful_runs" integer DEFAULT 0 NOT NULL,
	"failed_runs" integer DEFAULT 0 NOT NULL,
	"retention_days" integer DEFAULT 30 NOT NULL,
	"max_backups_to_keep" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"timeout_minutes" integer DEFAULT 60 NOT NULL,
	"retry_attempts" integer DEFAULT 3 NOT NULL,
	"retry_delay_minutes" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"environment" text DEFAULT 'production',
	"database_url" text NOT NULL,
	"supabase_service_key" text,
	"supabase_anon_key" text,
	"project_ref" text NOT NULL,
	"region" text NOT NULL,
	"organization_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"backup_retention_days" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_backup_at" timestamp,
	"total_backups" integer DEFAULT 0 NOT NULL,
	"total_size" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "projects_project_ref_unique" UNIQUE("project_ref")
);
--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backups_project_id_idx" ON "backups" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "backups_status_idx" ON "backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "backups_type_idx" ON "backups" USING btree ("type");--> statement-breakpoint
CREATE INDEX "backups_created_at_idx" ON "backups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "backups_expires_at_idx" ON "backups" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "backups_is_archived_idx" ON "backups" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "backups_project_status_idx" ON "backups" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "backups_project_created_idx" ON "backups" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "backups_status_created_idx" ON "backups" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "backups_project_type_status_idx" ON "backups" USING btree ("project_id","type","status");--> statement-breakpoint
CREATE INDEX "backups_archived_expires_idx" ON "backups" USING btree ("is_archived","expires_at");--> statement-breakpoint
CREATE INDEX "jobs_project_id_idx" ON "jobs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "jobs_is_active_idx" ON "jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "jobs_schedule_type_idx" ON "jobs" USING btree ("schedule_type");--> statement-breakpoint
CREATE INDEX "jobs_next_run_at_idx" ON "jobs" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "jobs_last_run_at_idx" ON "jobs" USING btree ("last_run_at");--> statement-breakpoint
CREATE INDEX "jobs_last_status_idx" ON "jobs" USING btree ("last_status");--> statement-breakpoint
CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "jobs_project_active_idx" ON "jobs" USING btree ("project_id","is_active");--> statement-breakpoint
CREATE INDEX "jobs_active_schedule_idx" ON "jobs" USING btree ("is_active","schedule_type");--> statement-breakpoint
CREATE INDEX "jobs_project_schedule_idx" ON "jobs" USING btree ("project_id","schedule_type");--> statement-breakpoint
CREATE INDEX "jobs_active_next_run_idx" ON "jobs" USING btree ("is_active","next_run_at");--> statement-breakpoint
CREATE INDEX "jobs_project_status_idx" ON "jobs" USING btree ("project_id","last_status");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_project_ref_idx" ON "projects" USING btree ("project_ref");--> statement-breakpoint
CREATE INDEX "projects_organization_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "projects_environment_idx" ON "projects" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "projects_is_active_idx" ON "projects" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "projects_last_backup_at_idx" ON "projects" USING btree ("last_backup_at");--> statement-breakpoint
CREATE INDEX "projects_org_environment_idx" ON "projects" USING btree ("organization_id","environment");--> statement-breakpoint
CREATE INDEX "projects_active_created_idx" ON "projects" USING btree ("is_active","created_at");