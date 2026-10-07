CREATE TABLE `muse_pins` (
	`owner_id` text NOT NULL,
	`idea_id` text NOT NULL,
	`payload` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`owner_id`, `idea_id`)
);
