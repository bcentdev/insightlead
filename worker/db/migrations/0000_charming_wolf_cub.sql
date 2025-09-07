CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`peer_id` text NOT NULL,
	`source` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`metadata` text,
	`timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`peer_id`) REFERENCES `peers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `objective_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`objective_id` text NOT NULL,
	`name` text NOT NULL,
	`target` real NOT NULL,
	`current` real NOT NULL,
	`unit` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `objectives` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`peer_id` text NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`progress` integer NOT NULL,
	`target_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`tags` text,
	FOREIGN KEY (`peer_id`) REFERENCES `peers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `peers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`github_username` text NOT NULL,
	`jira_username` text,
	`team_id` text NOT NULL,
	`role` text NOT NULL,
	`seniority` text NOT NULL,
	`avatar` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `peers_email_unique` ON `peers` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`lead_id` text,
	`department` text,
	`jira_project_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `peers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`peer_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`peer_id`) REFERENCES `peers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);