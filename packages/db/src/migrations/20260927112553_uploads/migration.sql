CREATE TABLE `uploads` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`ip` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_uploads_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `uploads_userId_createdAt_idx` ON `uploads` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `uploads_ip_createdAt_idx` ON `uploads` (`ip`,`created_at`);