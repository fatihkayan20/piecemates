CREATE TABLE `sample_sources` (
	`category` text PRIMARY KEY,
	`page` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `samples` (
	`id` text PRIMARY KEY,
	`category` text NOT NULL,
	`url` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`color` text NOT NULL,
	`author` text NOT NULL,
	`author_url` text NOT NULL,
	`download_url` text NOT NULL,
	`featured_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `samples_category_createdAt_idx` ON `samples` (`category`,`created_at`);--> statement-breakpoint
CREATE INDEX `samples_featuredAt_idx` ON `samples` (`featured_at`);