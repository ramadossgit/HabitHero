CREATE TABLE "game_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"game_id" varchar NOT NULL,
	"unlocked_levels" integer DEFAULT 1 NOT NULL,
	"high_score" integer DEFAULT 0 NOT NULL,
	"times_played" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_game_progress_child_game" UNIQUE("child_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "game_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"game_id" varchar NOT NULL,
	"game_title" varchar NOT NULL,
	"points_cost" integer NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"parent_message" text,
	"requested_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" varchar
);
--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "game_progress" ADD CONSTRAINT "game_progress_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_purchases" ADD CONSTRAINT "game_purchases_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_purchases" ADD CONSTRAINT "game_purchases_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;