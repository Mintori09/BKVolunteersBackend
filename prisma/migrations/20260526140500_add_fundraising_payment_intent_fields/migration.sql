SET @schema_name = DATABASE();

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `money_donations` ADD COLUMN `payment_code` VARCHAR(120) NULL AFTER `amount`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'money_donations'
      AND COLUMN_NAME = 'payment_code'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `money_donations` ADD COLUMN `payment_expires_at` DATETIME NULL AFTER `payment_code`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'money_donations'
      AND COLUMN_NAME = 'payment_expires_at'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `money_donations` ADD COLUMN `matched_at` DATETIME NULL AFTER `matched_transaction_id`',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'money_donations'
      AND COLUMN_NAME = 'matched_at'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `money_donations` ADD UNIQUE INDEX `money_donations_payment_code_key` (`payment_code`)',
        'SELECT 1'
    )
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'money_donations'
      AND INDEX_NAME = 'money_donations_payment_code_key'
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
