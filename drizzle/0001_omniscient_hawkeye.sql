ALTER TABLE "backups" RENAME COLUMN "type" TO "trigger_type";--> statement-breakpoint
DROP INDEX "backups_type_idx";--> statement-breakpoint
DROP INDEX "backups_project_type_status_idx";--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "backup_type" text DEFAULT 'full' NOT NULL;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "compression_type" text DEFAULT 'gzip';--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "include_migration_history" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "include_tables" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "exclude_tables" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "compressed_size" integer;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "storage_type" text DEFAULT 'browser_download';--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "storage_destination_id" uuid;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "storage_file_path" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "local_file_path" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "download_url" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "download_token" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "validated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "backups" ADD COLUMN "validation_errors" text;--> statement-breakpoint
CREATE INDEX "backups_trigger_type_idx" ON "backups" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "backups_backup_type_idx" ON "backups" USING btree ("backup_type");--> statement-breakpoint
CREATE INDEX "backups_storage_type_idx" ON "backups" USING btree ("storage_type");--> statement-breakpoint
CREATE INDEX "backups_download_token_idx" ON "backups" USING btree ("download_token");--> statement-breakpoint
CREATE INDEX "backups_project_trigger_type_status_idx" ON "backups" USING btree ("project_id","trigger_type","status");--> statement-breakpoint
CREATE INDEX "backups_storage_destination_idx" ON "backups" USING btree ("storage_destination_id");