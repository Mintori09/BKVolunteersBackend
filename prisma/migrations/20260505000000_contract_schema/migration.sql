-- CreateTable
CREATE TABLE `faculties` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `faculties_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('FACULTY_UNION', 'CLUB', 'SCHOOL_UNION') NOT NULL,
    `faculty_id` BIGINT UNSIGNED NULL,
    `logo_url` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `organizations_code_key`(`code`),
    INDEX `organizations_type_idx`(`type`),
    INDEX `organizations_faculty_id_idx`(`faculty_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operator_accounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `faculty_id` BIGINT UNSIGNED NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `role` ENUM('ORG_ADMIN', 'ORG_MEMBER', 'SCHOOL_REVIEWER', 'SCHOOL_ADMIN', 'SYSTEM') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `operator_accounts_email_key`(`email`),
    INDEX `operator_accounts_role_idx`(`role`),
    INDEX `operator_accounts_organization_id_idx`(`organization_id`),
    INDEX `operator_accounts_faculty_id_idx`(`faculty_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `titles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `min_points` INTEGER NOT NULL DEFAULT 0,
    `icon_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `faculty_id` BIGINT UNSIGNED NOT NULL,
    `current_title_id` BIGINT UNSIGNED NULL,
    `student_code` VARCHAR(30) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `class_code` VARCHAR(50) NULL,
    `major` VARCHAR(120) NULL,
    `year` SMALLINT UNSIGNED NULL,
    `phone` VARCHAR(30) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `total_points` INTEGER NOT NULL DEFAULT 0,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `students_student_code_key`(`student_code`),
    UNIQUE INDEX `students_email_key`(`email`),
    INDEX `students_faculty_id_idx`(`faculty_id`),
    INDEX `students_current_title_id_idx`(`current_title_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_type` ENUM('STUDENT', 'OPERATOR') NOT NULL,
    `operator_account_id` BIGINT UNSIGNED NULL,
    `student_id` BIGINT UNSIGNED NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_account_type_operator_account_id_idx`(`account_type`, `operator_account_id`),
    INDEX `refresh_tokens_account_type_student_id_idx`(`account_type`, `student_id`),
    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `description` LONGTEXT NULL,
    `cover_image_url` VARCHAR(500) NULL,
    `beneficiary` VARCHAR(255) NULL,
    `scope_type` ENUM('FACULTY', 'SCHOOL', 'PUBLIC') NOT NULL,
    `faculty_id` BIGINT UNSIGNED NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'PRE_APPROVED', 'APPROVED', 'REVISION_REQUIRED', 'REJECTED', 'PUBLISHED', 'ONGOING', 'ENDED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `approved_by` BIGINT UNSIGNED NULL,
    `approved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `campaigns_slug_key`(`slug`),
    INDEX `campaigns_organization_id_idx`(`organization_id`),
    INDEX `campaigns_faculty_id_idx`(`faculty_id`),
    INDEX `campaigns_status_idx`(`status`),
    INDEX `campaigns_scope_type_idx`(`scope_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_modules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('fundraising', 'item_donation', 'event') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `settings_json` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `campaign_modules_campaign_id_idx`(`campaign_id`),
    INDEX `campaign_modules_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_reviews` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NULL,
    `author_type` ENUM('STUDENT', 'OPERATOR') NOT NULL,
    `author_id` BIGINT UNSIGNED NOT NULL,
    `body` TEXT NOT NULL,
    `visibility` VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    `attachment_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `campaign_reviews_campaign_id_idx`(`campaign_id`),
    INDEX `campaign_reviews_module_id_idx`(`module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `money_donations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `donor_name` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `message` VARCHAR(500) NULL,
    `evidence_url` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'MATCHED', 'VERIFIED', 'REJECTED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `matched_transaction_id` BIGINT UNSIGNED NULL,
    `verified_by` BIGINT UNSIGNED NULL,
    `verified_at` DATETIME(3) NULL,
    `reject_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `money_donations_campaign_id_idx`(`campaign_id`),
    INDEX `money_donations_module_id_idx`(`module_id`),
    INDEX `money_donations_student_id_idx`(`student_id`),
    INDEX `money_donations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NULL,
    `module_id` BIGINT UNSIGNED NULL,
    `provider` VARCHAR(40) NOT NULL,
    `provider_transaction_id` VARCHAR(120) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `content` VARCHAR(500) NULL,
    `transaction_time` DATETIME(3) NOT NULL,
    `raw_payload` JSON NOT NULL,
    `match_status` ENUM('UNMATCHED', 'MATCHED', 'IGNORED') NOT NULL DEFAULT 'UNMATCHED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_transactions_campaign_id_idx`(`campaign_id`),
    INDEX `payment_transactions_module_id_idx`(`module_id`),
    UNIQUE INDEX `payment_transactions_provider_provider_transaction_id_key`(`provider`, `provider_transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_targets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `target_quantity` INTEGER UNSIGNED NOT NULL,
    `received_quantity` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `item_targets_campaign_id_idx`(`campaign_id`),
    INDEX `item_targets_module_id_idx`(`module_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_pledges` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `item_target_id` BIGINT UNSIGNED NOT NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `donor_name` VARCHAR(255) NOT NULL,
    `quantity` INTEGER UNSIGNED NOT NULL,
    `expected_handover_at` DATETIME(3) NULL,
    `status` ENUM('PLEDGED', 'CONFIRMED', 'RECEIVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PLEDGED',
    `note` VARCHAR(500) NULL,
    `received_quantity` INTEGER UNSIGNED NULL,
    `received_at` DATETIME(3) NULL,
    `evidence_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `item_pledges_campaign_id_idx`(`campaign_id`),
    INDEX `item_pledges_module_id_idx`(`module_id`),
    INDEX `item_pledges_item_target_id_idx`(`item_target_id`),
    INDEX `item_pledges_student_id_idx`(`student_id`),
    INDEX `item_pledges_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_handover_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `item_pledge_id` BIGINT UNSIGNED NOT NULL,
    `item_target_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INTEGER UNSIGNED NOT NULL,
    `received_by` BIGINT UNSIGNED NULL,
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `location` VARCHAR(255) NULL,
    `note` VARCHAR(500) NULL,
    `evidence_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `item_handover_records_campaign_id_idx`(`campaign_id`),
    INDEX `item_handover_records_module_id_idx`(`module_id`),
    INDEX `item_handover_records_item_pledge_id_idx`(`item_pledge_id`),
    INDEX `item_handover_records_item_target_id_idx`(`item_target_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registrations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `answers_json` JSON NULL,
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checked_in_at` DATETIME(3) NULL,
    `checked_out_at` DATETIME(3) NULL,
    `hours` DECIMAL(5, 2) NULL,
    `reviewed_by` BIGINT UNSIGNED NULL,
    `reviewed_at` DATETIME(3) NULL,
    `review_note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_registrations_campaign_id_idx`(`campaign_id`),
    INDEX `event_registrations_student_id_idx`(`student_id`),
    INDEX `event_registrations_status_idx`(`status`),
    UNIQUE INDEX `event_registrations_module_id_student_id_key`(`module_id`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificate_templates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `layout_json` JSON NOT NULL,
    `file_url` VARCHAR(500) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_by` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `certificate_no` VARCHAR(100) NOT NULL,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NULL,
    `student_id` BIGINT UNSIGNED NOT NULL,
    `template_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('PENDING', 'RENDERING', 'READY', 'SIGNED', 'REVOKED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `snapshot_json` JSON NOT NULL,
    `file_url` VARCHAR(500) NULL,
    `file_hash` VARCHAR(255) NULL,
    `issued_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `revoked_by` BIGINT UNSIGNED NULL,
    `revoke_reason` VARCHAR(500) NULL,
    `replacement_certificate_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `certificates_certificate_no_key`(`certificate_no`),
    INDEX `certificates_campaign_id_idx`(`campaign_id`),
    INDEX `certificates_module_id_idx`(`module_id`),
    INDEX `certificates_student_id_idx`(`student_id`),
    INDEX `certificates_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `account_type` ENUM('STUDENT', 'OPERATOR') NOT NULL,
    `operator_account_id` BIGINT UNSIGNED NULL,
    `student_id` BIGINT UNSIGNED NULL,
    `type` VARCHAR(80) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `data_json` JSON NULL,
    `is_email_sent` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_account_type_operator_account_id_idx`(`account_type`, `operator_account_id`),
    INDEX `notifications_account_type_student_id_idx`(`account_type`, `student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `actor_type` ENUM('STUDENT', 'OPERATOR') NOT NULL,
    `actor_id` BIGINT UNSIGNED NOT NULL,
    `action` VARCHAR(120) NOT NULL,
    `entity_type` VARCHAR(80) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `before_json` JSON NULL,
    `after_json` JSON NULL,
    `ip_address` VARCHAR(80) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `background_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(80) NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payload_json` JSON NOT NULL,
    `attempts` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `last_error` TEXT NULL,
    `run_at` DATETIME(3) NOT NULL,
    `locked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `background_jobs_status_run_at_idx`(`status`, `run_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operator_accounts` ADD CONSTRAINT `operator_accounts_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operator_accounts` ADD CONSTRAINT `operator_accounts_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_current_title_id_fkey` FOREIGN KEY (`current_title_id`) REFERENCES `titles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_operator_account_id_fkey` FOREIGN KEY (`operator_account_id`) REFERENCES `operator_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_faculty_id_fkey` FOREIGN KEY (`faculty_id`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `operator_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `operator_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_modules` ADD CONSTRAINT `campaign_modules_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_reviews` ADD CONSTRAINT `campaign_reviews_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_reviews` ADD CONSTRAINT `campaign_reviews_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `money_donations` ADD CONSTRAINT `money_donations_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `money_donations` ADD CONSTRAINT `money_donations_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `money_donations` ADD CONSTRAINT `money_donations_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `money_donations` ADD CONSTRAINT `money_donations_matched_transaction_id_fkey` FOREIGN KEY (`matched_transaction_id`) REFERENCES `payment_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `money_donations` ADD CONSTRAINT `money_donations_verified_by_fkey` FOREIGN KEY (`verified_by`) REFERENCES `operator_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_targets` ADD CONSTRAINT `item_targets_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_targets` ADD CONSTRAINT `item_targets_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_pledges` ADD CONSTRAINT `item_pledges_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_pledges` ADD CONSTRAINT `item_pledges_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_pledges` ADD CONSTRAINT `item_pledges_item_target_id_fkey` FOREIGN KEY (`item_target_id`) REFERENCES `item_targets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_pledges` ADD CONSTRAINT `item_pledges_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_handover_records` ADD CONSTRAINT `item_handover_records_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_handover_records` ADD CONSTRAINT `item_handover_records_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_handover_records` ADD CONSTRAINT `item_handover_records_item_pledge_id_fkey` FOREIGN KEY (`item_pledge_id`) REFERENCES `item_pledges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_handover_records` ADD CONSTRAINT `item_handover_records_item_target_id_fkey` FOREIGN KEY (`item_target_id`) REFERENCES `item_targets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_handover_records` ADD CONSTRAINT `item_handover_records_received_by_fkey` FOREIGN KEY (`received_by`) REFERENCES `operator_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `operator_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificate_templates` ADD CONSTRAINT `certificate_templates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `operator_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `certificate_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_revoked_by_fkey` FOREIGN KEY (`revoked_by`) REFERENCES `operator_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_replacement_certificate_id_fkey` FOREIGN KEY (`replacement_certificate_id`) REFERENCES `certificates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_operator_account_id_fkey` FOREIGN KEY (`operator_account_id`) REFERENCES `operator_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
