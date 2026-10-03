ALTER TABLE `rooms` ADD `sample_id` text REFERENCES samples(id) ON DELETE SET NULL;--> statement-breakpoint
-- Rooms made before this cut a sample photo by its URL.
UPDATE `rooms` SET `sample_id` = (SELECT `id` FROM `samples` WHERE `samples`.`url` = `rooms`.`image_url`);
