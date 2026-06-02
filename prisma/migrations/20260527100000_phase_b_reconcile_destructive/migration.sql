SET @schema_name = DATABASE();

-- 0) Data safety pre-step for stricter nullability
UPDATE `audit_logs`
SET `entity_id` = 0
WHERE `entity_id` IS NULL;

-- 1) Drop legacy/extra indexes that are no longer in schema.prisma
SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `certificates_status_idx` ON `certificates`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'certificates'
      AND INDEX_NAME = 'certificates_status_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `event_registrations_status_idx` ON `event_registrations`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'event_registrations'
      AND INDEX_NAME = 'event_registrations_status_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `item_pledges_status_idx` ON `item_pledges`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'item_pledges'
      AND INDEX_NAME = 'item_pledges_status_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `money_donations_status_idx` ON `money_donations`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'money_donations'
      AND INDEX_NAME = 'money_donations_status_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `notifications_account_type_operator_account_id_idx` ON `notifications`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'notifications'
      AND INDEX_NAME = 'notifications_account_type_operator_account_id_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `notifications_account_type_student_id_idx` ON `notifications`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'notifications'
      AND INDEX_NAME = 'notifications_account_type_student_id_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `refresh_tokens_account_type_operator_account_id_idx` ON `refresh_tokens`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'refresh_tokens'
      AND INDEX_NAME = 'refresh_tokens_account_type_operator_account_id_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `refresh_tokens_account_type_student_id_idx` ON `refresh_tokens`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'refresh_tokens'
      AND INDEX_NAME = 'refresh_tokens_account_type_student_id_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Drop FK/index in event_registrations for reviewed_by (schema no longer defines relation/index)
SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'ALTER TABLE `event_registrations` DROP FOREIGN KEY `event_registrations_reviewed_by_fkey`',
        'SELECT 1'
    )
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'event_registrations'
      AND CONSTRAINT_NAME = 'event_registrations_reviewed_by_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP INDEX `event_registrations_reviewed_by_fkey` ON `event_registrations`',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'event_registrations'
      AND INDEX_NAME = 'event_registrations_reviewed_by_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Column type/default/nullable reconciliation
ALTER TABLE `audit_logs`
    MODIFY `actor_type` VARCHAR(20) NOT NULL,
    MODIFY `action` VARCHAR(100) NOT NULL,
    MODIFY `entity_type` VARCHAR(50) NOT NULL,
    MODIFY `entity_id` BIGINT UNSIGNED NOT NULL,
    MODIFY `ip_address` VARCHAR(64) NULL;

ALTER TABLE `campaign_reviews`
    MODIFY `author_type` VARCHAR(20) NOT NULL;

ALTER TABLE `certificate_templates`
    MODIFY `layout_json` JSON NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE `certificates`
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING';

ALTER TABLE `event_registrations`
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING';

ALTER TABLE `item_pledges`
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'PLEDGED';

ALTER TABLE `item_targets`
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE `notifications`
    MODIFY `account_type` VARCHAR(20) NOT NULL,
    MODIFY `type` VARCHAR(50) NOT NULL;

ALTER TABLE `operator_accounts`
    MODIFY `role` VARCHAR(40) NOT NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE `organizations`
    MODIFY `type` VARCHAR(40) NOT NULL,
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE `refresh_tokens`
    MODIFY `account_type` VARCHAR(20) NOT NULL;

ALTER TABLE `students`
    MODIFY `status` VARCHAR(40) NOT NULL DEFAULT 'ACTIVE';

-- 4) Legacy table retirement with backup snapshot
SET @stmt = (
    SELECT IF(
        COUNT(*) > 0
        AND (
            SELECT COUNT(*)
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = @schema_name
              AND TABLE_NAME = 'item_handover_records_legacy_20260527'
        ) = 0,
        'CREATE TABLE `item_handover_records_legacy_20260527` LIKE `item_handover_records`',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'item_handover_records'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0
        AND (
            SELECT COUNT(*)
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = @schema_name
              AND TABLE_NAME = 'item_handover_records_legacy_20260527'
        ) > 0,
        'INSERT INTO `item_handover_records_legacy_20260527` SELECT * FROM `item_handover_records`',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'item_handover_records'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) > 0,
        'DROP TABLE `item_handover_records`',
        'SELECT 1'
    )
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'item_handover_records'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
