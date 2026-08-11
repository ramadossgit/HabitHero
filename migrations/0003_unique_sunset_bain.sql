ALTER TABLE "habits" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "occurrence_limit" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "schedule" jsonb;--> statement-breakpoint
ALTER TABLE "master_habits" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "master_habits" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "master_habits" ADD COLUMN "occurrence_limit" integer;--> statement-breakpoint
ALTER TABLE "master_habits" ADD COLUMN "schedule" jsonb;