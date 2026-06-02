SET @schema_name = DATABASE();

-- 1) Missing tables (non-destructive create)
SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE TABLE `oauth_accounts` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `account_type` VARCHAR(20) NOT NULL,
            `operator_account_id` BIGINT UNSIGNED NULL,
            `student_id` BIGINT UNSIGNED NULL,
            `provider` VARCHAR(50) NOT NULL,
            `provider_account_id` VARCHAR(255) NOT NULL,
            `email` VARCHAR(255) NULL,
            `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            UNIQUE INDEX `oauth_accounts_provider_provider_account_id_key`(`provider`, `provider_account_id`),
            PRIMARY KEY (`id`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'oauth_accounts'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE TABLE `campaign_activities` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `campaign_id` BIGINT UNSIGNED NOT NULL,
            `module_id` BIGINT UNSIGNED NULL,
            `actor_type` VARCHAR(20) NOT NULL,
            `actor_id` BIGINT UNSIGNED NOT NULL,
            `activity_type` VARCHAR(50) NOT NULL,
            `message` VARCHAR(500) NULL,
            `data_json` JSON NULL,
            `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            INDEX `campaign_activities_campaign_id_idx`(`campaign_id`),
            INDEX `campaign_activities_activity_type_idx`(`activity_type`),
            PRIMARY KEY (`id`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'campaign_activities'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE TABLE `password_reset_tokens` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `email` VARCHAR(255) NOT NULL,
            `code_hash` VARCHAR(255) NOT NULL,
            `expires_at` DATETIME(3) NOT NULL,
            `used_at` DATETIME(3) NULL,
            `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            `updated_at` DATETIME(3) NOT NULL,
            INDEX `password_reset_tokens_email_used_at_expires_at_idx`(`email`, `used_at`, `expires_at`),
            PRIMARY KEY (`id`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'password_reset_tokens'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Missing columns and indexes
SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `item_pledges` ADD COLUMN `handover_note` VARCHAR(500) NULL AFTER `evidence_url`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'item_pledges'
      AND COLUMN_NAME = 'handover_note'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `item_pledges` ADD COLUMN `received_by` BIGINT UNSIGNED NULL AFTER `received_at`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'item_pledges'
      AND COLUMN_NAME = 'received_by'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE UNIQUE INDEX `money_donations_matched_transaction_id_key` ON `money_donations`(`matched_transaction_id`)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'money_donations'
      AND INDEX_NAME = 'money_donations_matched_transaction_id_key'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX `refresh_tokens_account_type_idx` ON `refresh_tokens`(`account_type`)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'refresh_tokens'
      AND INDEX_NAME = 'refresh_tokens_account_type_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Foreign keys for newly present tables/columns (non-destructive add)
SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `oauth_accounts`
         ADD CONSTRAINT `oauth_accounts_operator_account_id_fkey`
         FOREIGN KEY (`operator_account_id`) REFERENCES `operator_accounts`(`id`)
         ON DELETE CASCADE ON UPDATE CASCADE',
        'SELECT 1'
    )
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'oauth_accounts'
      AND CONSTRAINT_NAME = 'oauth_accounts_operator_account_id_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `oauth_accounts`
         ADD CONSTRAINT `oauth_accounts_student_id_fkey`
         FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
         ON DELETE CASCADE ON UPDATE CASCADE',
        'SELECT 1'
    )
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'oauth_accounts'
      AND CONSTRAINT_NAME = 'oauth_accounts_student_id_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `campaign_activities`
         ADD CONSTRAINT `campaign_activities_campaign_id_fkey`
         FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`)
         ON DELETE CASCADE ON UPDATE CASCADE',
        'SELECT 1'
    )
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'campaign_activities'
      AND CONSTRAINT_NAME = 'campaign_activities_campaign_id_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `campaign_activities`
         ADD CONSTRAINT `campaign_activities_module_id_fkey`
         FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`)
         ON DELETE SET NULL ON UPDATE CASCADE',
        'SELECT 1'
    )
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'campaign_activities'
      AND CONSTRAINT_NAME = 'campaign_activities_module_id_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Non-destructive normalization for VARCHAR sizes/defaults used by code
ALTER TABLE `background_jobs`
    MODIFY `type` VARCHAR(60) NOT NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING';

ALTER TABLE `campaign_modules`
    MODIFY `type` VARCHAR(40) NOT NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE `campaigns`
    MODIFY `scope_type` VARCHAR(20) NOT NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE `money_donations`
    MODIFY `payment_expires_at` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    MODIFY `matched_at` DATETIME(3) NULL;

ALTER TABLE `payment_transactions`
    MODIFY `match_status` VARCHAR(40) NOT NULL DEFAULT 'UNMATCHED';
