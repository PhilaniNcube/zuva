CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`scholar_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	`source` text DEFAULT 'join_click' NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `programme_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `attendance_session_scholar_idx` ON `attendance` (`session_id`,`scholar_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `attendance_scholar_idx` ON `attendance` (`scholar_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `availability_slot` (
	`id` text PRIMARY KEY NOT NULL,
	`coach_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`coach_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `availability_slot_coach_idx` ON `availability_slot` (`coach_id`,`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `booking` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`scholar_id` text NOT NULL,
	`session_id` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`booked_at` integer NOT NULL,
	`cancelled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`slot_id`) REFERENCES `availability_slot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `programme_session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `booking_slot_confirmed_idx` ON `booking` (`slot_id`) WHERE status = 'confirmed';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `booking_scholar_idx` ON `booking` (`scholar_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `certificate` (
	`id` text PRIMARY KEY NOT NULL,
	`scholar_id` text NOT NULL,
	`cohort_id` text NOT NULL,
	`status` text DEFAULT 'eligible' NOT NULL,
	`mtp_text` text,
	`admin_note` text,
	`approved_by` text,
	`approved_at` integer,
	`issued_at` integer,
	`pdf_file_key` text,
	`email_sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohort`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `certificate_scholar_idx` ON `certificate` (`scholar_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `certificate_status_idx` ON `certificate` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `coach_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`specialty` text NOT NULL,
	`whatsapp_number` text NOT NULL,
	`bio` text,
	`ical_url` text,
	`working_hours` text,
	`last_synced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `coach_profile_user_id_idx` ON `coach_profile` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cohort` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `email_log_user_idx` ON `email_log` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `feedback_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`scholar_id` text NOT NULL,
	`is_anonymous` integer DEFAULT false NOT NULL,
	`responses` text NOT NULL,
	`submitted_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `programme_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `feedback_session_scholar_idx` ON `feedback_submission` (`session_id`,`scholar_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `feedback_scholar_idx` ON `feedback_submission` (`scholar_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pathway_step` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`kind` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohort`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `pathway_step_cohort_idx` ON `pathway_step` (`cohort_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `programme_session` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`session_type_id` text NOT NULL,
	`coach_id` text,
	`scholar_id` text,
	`title` text NOT NULL,
	`description` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`google_event_id` text,
	`meet_link` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohort`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_type_id`) REFERENCES `session_type`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`coach_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `programme_session_cohort_idx` ON `programme_session` (`cohort_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `programme_session_coach_idx` ON `programme_session` (`coach_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `programme_session_type_idx` ON `programme_session` (`session_type_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `programme_session_scholar_idx` ON `programme_session` (`scholar_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `resource` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text,
	`session_id` text,
	`title` text NOT NULL,
	`description` text,
	`file_key` text NOT NULL,
	`uploaded_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohort`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `programme_session`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `resource_cohort_idx` ON `resource` (`cohort_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `scholar_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cohort_id` text,
	`country` text,
	`whatsapp_number` text,
	`bio` text,
	`mtp_text` text,
	`onboarding_completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohort`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `scholar_profile_user_id_idx` ON `scholar_profile` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `scholar_step_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`step_id` text NOT NULL,
	`scholar_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	`completed_via` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`step_id`) REFERENCES `pathway_step`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `step_progress_step_scholar_idx` ON `scholar_step_progress` (`step_id`,`scholar_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `step_progress_scholar_idx` ON `scholar_step_progress` (`scholar_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session_type` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`format` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_type_name_unique` ON `session_type` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `submission` (
	`id` text PRIMARY KEY NOT NULL,
	`scholar_id` text NOT NULL,
	`title` text NOT NULL,
	`file_key` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`reviewer_id` text,
	`editor_id` text,
	`due_at` integer,
	`returned_file_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`scholar_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`editor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `submission_scholar_idx` ON `submission` (`scholar_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `submission_status_idx` ON `submission` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `submission_event` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`note` text,
	`changed_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `submission_event_submission_idx` ON `submission_event` (`submission_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'scholar' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
