CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dedup_clusters` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_listing_id` text NOT NULL,
	`signals_json` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fetch_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`finished_at` integer,
	`pages_fetched` integer DEFAULT 0 NOT NULL,
	`listings_new` integer DEFAULT 0 NOT NULL,
	`listings_updated` integer DEFAULT 0 NOT NULL,
	`errors_json` text
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`price_eur` real,
	`price_raw` text,
	`currency_raw` text,
	`year` integer,
	`mileage_km` integer,
	`transmission` text,
	`body_color` text,
	`region` text,
	`vin` text,
	`phone_norm` text,
	`description` text,
	`raw_json` text,
	`first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`dedup_cluster_id` text,
	FOREIGN KEY (`dedup_cluster_id`) REFERENCES `dedup_clusters`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_source_source_id_uq` ON `listings` (`source`,`source_id`);--> statement-breakpoint
CREATE INDEX `listings_cluster_idx` ON `listings` (`dedup_cluster_id`);--> statement-breakpoint
CREATE INDEX `listings_vin_idx` ON `listings` (`vin`);--> statement-breakpoint
CREATE INDEX `listings_phone_idx` ON `listings` (`phone_norm`);--> statement-breakpoint
CREATE INDEX `listings_status_idx` ON `listings` (`status`);--> statement-breakpoint
CREATE TABLE `notifications_log` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`tg_chat_id` text NOT NULL,
	`sent_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`message_id` integer,
	`reaction` text,
	`reaction_at` integer,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notif_chat_sent_idx` ON `notifications_log` (`tg_chat_id`,`sent_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `notif_listing_chat_uq` ON `notifications_log` (`listing_id`,`tg_chat_id`);--> statement-breakpoint
CREATE TABLE `phash_cache` (
	`phash` text PRIMARY KEY NOT NULL,
	`vision_findings_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`url` text NOT NULL,
	`r2_key` text,
	`phash` text,
	`width` integer,
	`height` integer,
	`order_idx` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photos_phash_idx` ON `photos` (`phash`);--> statement-breakpoint
CREATE INDEX `photos_listing_idx` ON `photos` (`listing_id`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`year_min` integer DEFAULT 2000 NOT NULL,
	`year_max` integer DEFAULT 2003 NOT NULL,
	`price_min_eur` real,
	`price_max_eur` real,
	`mileage_max_km` integer,
	`transmission_pref` text,
	`regions_json` text,
	`must_have_vin` integer DEFAULT false NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reaction_features` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` text NOT NULL,
	`reaction` text NOT NULL,
	`snapshot_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scoring` (
	`listing_id` text PRIMARY KEY NOT NULL,
	`overall_score` integer NOT NULL,
	`vision_score` integer,
	`text_score` integer,
	`vision_findings_json` text,
	`seller_type` text,
	`red_flags_json` text,
	`model_version` text,
	`scored_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`tokens_used` integer,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `sources` (
	`name` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`rate_limit_rpm` integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telegram_users` (
	`tg_chat_id` text PRIMARY KEY NOT NULL,
	`tg_username` text,
	`paused` integer DEFAULT false NOT NULL,
	`threshold` integer DEFAULT 70 NOT NULL,
	`language` text DEFAULT 'ru' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`name` text,
	`image` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
