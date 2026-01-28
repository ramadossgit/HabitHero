CREATE TABLE "avatar_shop_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"avatar_type" varchar NOT NULL,
	"cost" integer NOT NULL,
	"description" text,
	"rarity" varchar DEFAULT 'common' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "children" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"username" varchar,
	"pin" varchar,
	"avatar_type" varchar DEFAULT 'robot' NOT NULL,
	"avatar_url" varchar,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"reward_points" integer DEFAULT 0 NOT NULL,
	"unlocked_avatars" jsonb DEFAULT '["robot"]'::jsonb,
	"unlocked_gear" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "children_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"device_id" varchar NOT NULL,
	"device_name" varchar NOT NULL,
	"device_type" varchar NOT NULL,
	"last_sync_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"push_token" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gear_shop_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"gear_type" varchar NOT NULL,
	"description" text NOT NULL,
	"cost" integer DEFAULT 30 NOT NULL,
	"rarity" varchar DEFAULT 'common' NOT NULL,
	"effect" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "habit_completions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" varchar NOT NULL,
	"child_id" varchar NOT NULL,
	"date" date NOT NULL,
	"xp_earned" integer NOT NULL,
	"streak_count" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"parent_message" text,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"reward_points_earned" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"master_habit_id" varchar,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar NOT NULL,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"color" varchar DEFAULT 'mint' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"frequency" varchar DEFAULT 'daily' NOT NULL,
	"reminder_time" varchar,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"voice_reminder_enabled" boolean DEFAULT false NOT NULL,
	"custom_ringtone" varchar DEFAULT 'default',
	"reminder_duration" integer DEFAULT 5 NOT NULL,
	"voice_recording" text,
	"voice_recording_name" varchar,
	"time_range_start" varchar DEFAULT '07:00',
	"time_range_end" varchar DEFAULT '20:00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "master_habits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar DEFAULT '⚡' NOT NULL,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"color" varchar DEFAULT 'turquoise' NOT NULL,
	"frequency" varchar DEFAULT 'daily' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"reminder_time" integer DEFAULT 15,
	"reminder_enabled" boolean DEFAULT true,
	"voice_reminder_enabled" boolean DEFAULT false,
	"custom_ringtone" varchar DEFAULT 'default',
	"reminder_duration" integer DEFAULT 30,
	"voice_recording" text,
	"voice_recording_name" varchar,
	"time_range_start" varchar DEFAULT '09:00',
	"time_range_end" varchar DEFAULT '21:00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mini_games" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar NOT NULL,
	"unlock_requirement" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parental_controls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"daily_screen_time" integer DEFAULT 60 NOT NULL,
	"bonus_time_per_habit" integer DEFAULT 10 NOT NULL,
	"weekend_bonus" integer DEFAULT 30 NOT NULL,
	"game_unlock_requirement" integer DEFAULT 2 NOT NULL,
	"max_game_time_per_day" integer DEFAULT 20 NOT NULL,
	"bedtime_mode" boolean DEFAULT true NOT NULL,
	"bedtime_start" varchar DEFAULT '20:00' NOT NULL,
	"bedtime_end" varchar DEFAULT '07:00' NOT NULL,
	"enable_habits" boolean DEFAULT true NOT NULL,
	"enable_gear_shop" boolean DEFAULT true NOT NULL,
	"enable_mini_games" boolean DEFAULT true NOT NULL,
	"enable_rewards" boolean DEFAULT true NOT NULL,
	"emergency_mode" boolean DEFAULT false NOT NULL,
	"block_all_apps" boolean DEFAULT false NOT NULL,
	"limit_internet" boolean DEFAULT false NOT NULL,
	"parent_contact_enabled" boolean DEFAULT true NOT NULL,
	"emergency_activated_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reward_id" varchar NOT NULL,
	"child_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"claimed_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"used_at" timestamp,
	"is_approved" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"amount" integer NOT NULL,
	"source" varchar NOT NULL,
	"description" text,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"value" varchar,
	"cost" integer NOT NULL,
	"cost_type" varchar DEFAULT 'habits' NOT NULL,
	"category" varchar DEFAULT 'daily' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"parent_reward_id" varchar,
	"next_occurrence" timestamp,
	"last_generated" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"event_type" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"event_data" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"processed" boolean DEFAULT false,
	"device_origin" varchar
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"device_id" varchar NOT NULL,
	"sync_type" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"operation" varchar NOT NULL,
	"sync_data" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"sync_direction" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"family_code" varchar(8) NOT NULL,
	"profile_image_url" varchar,
	"phone_number" varchar,
	"voice_commands_enabled" boolean DEFAULT false,
	"reminder_settings" jsonb DEFAULT '{"enabled":true,"voiceEnabled":false,"ringtoneEnabled":true,"defaultRingtone":"default","reminderTime":15}'::jsonb,
	"email_verified" boolean DEFAULT false,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" varchar DEFAULT 'trial',
	"subscription_plan" varchar DEFAULT 'trial',
	"subscription_start_date" timestamp DEFAULT now(),
	"subscription_end_date" timestamp,
	"subscription_canceled_at" timestamp,
	"trial_ends_at" timestamp DEFAULT NOW() + INTERVAL '7 days',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_family_code_unique" UNIQUE("family_code")
);
--> statement-breakpoint
CREATE TABLE "weekend_challenges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"points_reward" integer DEFAULT 20 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_master_habit_id_master_habits_id_fk" FOREIGN KEY ("master_habit_id") REFERENCES "public"."master_habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_habits" ADD CONSTRAINT "master_habits_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parental_controls" ADD CONSTRAINT "parental_controls_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_transactions" ADD CONSTRAINT "reward_transactions_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_transactions" ADD CONSTRAINT "reward_transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekend_challenges" ADD CONSTRAINT "weekend_challenges_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");