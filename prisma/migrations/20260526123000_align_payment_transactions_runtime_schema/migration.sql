SET @schema_name = DATABASE();

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `payment_transactions` ADD COLUMN `account_no` VARCHAR(100) NULL AFTER `content`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'payment_transactions'
      AND COLUMN_NAME = 'account_no'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `payment_transactions` ADD COLUMN `matched_donation_id` BIGINT UNSIGNED NULL AFTER `match_status`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'payment_transactions'
      AND COLUMN_NAME = 'matched_donation_id'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `payment_transactions` ADD INDEX `payment_transactions_matched_donation_id_idx` (`matched_donation_id`)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'payment_transactions'
      AND INDEX_NAME = 'payment_transactions_matched_donation_id_idx'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_matched_donation_id_fkey` FOREIGN KEY (`matched_donation_id`) REFERENCES `money_donations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
        'SELECT 1'
    )
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'payment_transactions'
      AND CONSTRAINT_NAME = 'payment_transactions_matched_donation_id_fkey'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `payment_transactions`
    MODIFY COLUMN `provider_transaction_id` VARCHAR(255) NOT NULL,
    MODIFY COLUMN `raw_payload` JSON NULL;
