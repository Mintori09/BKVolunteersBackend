CREATE TABLE `sepay_bank_accounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sepay_account_id` VARCHAR(120) NOT NULL,
    `account_holder_name` VARCHAR(255) NOT NULL,
    `account_number` VARCHAR(100) NOT NULL,
    `accumulated` DECIMAL(15, 2) NULL,
    `last_transaction` DATETIME(3) NULL,
    `label` VARCHAR(255) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `bank_short_name` VARCHAR(40) NULL,
    `bank_full_name` VARCHAR(255) NULL,
    `bank_code` VARCHAR(40) NULL,
    `api_mode` VARCHAR(20) NOT NULL DEFAULT 'sandbox',
    `metadata_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sepay_bank_accounts_sepay_account_id_key`(`sepay_account_id`),
    INDEX `sepay_bank_accounts_account_number_idx`(`account_number`),
    INDEX `sepay_bank_accounts_bank_short_name_idx`(`bank_short_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sepay_sync_cursors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(60) NOT NULL,
    `sepay_bank_account_id` BIGINT UNSIGNED NULL,
    `cursor_value` VARCHAR(255) NULL,
    `last_synced_at` DATETIME(3) NULL,
    `last_error` TEXT NULL,
    `metadata_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sepay_sync_cursors_type_sepay_bank_account_id_key`(`type`, `sepay_bank_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sepay_virtual_accounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sepay_va_id` VARCHAR(120) NOT NULL,
    `sepay_bank_account_id` BIGINT UNSIGNED NOT NULL,
    `va_number` VARCHAR(120) NOT NULL,
    `sub_holder_name` VARCHAR(255) NULL,
    `label` VARCHAR(255) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `official` BOOLEAN NOT NULL DEFAULT false,
    `is_static` BOOLEAN NOT NULL DEFAULT false,
    `source_type` VARCHAR(40) NOT NULL DEFAULT 'DIRECT',
    `metadata_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sepay_virtual_accounts_sepay_va_id_key`(`sepay_va_id`),
    INDEX `sepay_virtual_accounts_va_number_idx`(`va_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sepay_order_payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `money_donation_id` BIGINT UNSIGNED NOT NULL,
    `sepay_bank_account_id` BIGINT UNSIGNED NOT NULL,
    `sepay_virtual_account_id` BIGINT UNSIGNED NULL,
    `sepay_order_id` VARCHAR(120) NOT NULL,
    `order_code` VARCHAR(120) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    `va_prefix` VARCHAR(120) NULL,
    `provider_qr_url` VARCHAR(500) NULL,
    `expires_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `payload_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sepay_order_payments_money_donation_id_key`(`money_donation_id`),
    UNIQUE INDEX `sepay_order_payments_sepay_order_id_key`(`sepay_order_id`),
    UNIQUE INDEX `sepay_order_payments_order_code_key`(`order_code`),
    INDEX `sepay_order_payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `money_donations`
    ADD COLUMN `payment_mode` VARCHAR(40) NOT NULL DEFAULT 'TRANSFER_CODE' AFTER `payment_code`,
    ADD COLUMN `sepay_bank_account_ref_id` BIGINT UNSIGNED NULL AFTER `matched_at`;

ALTER TABLE `payment_transactions`
    ADD COLUMN `ingest_source` VARCHAR(40) NOT NULL DEFAULT 'WEBHOOK' AFTER `raw_payload`,
    ADD COLUMN `sepay_account_id` VARCHAR(120) NULL AFTER `ingest_source`,
    ADD COLUMN `sepay_va_id` VARCHAR(120) NULL AFTER `sepay_account_id`,
    ADD COLUMN `sepay_order_code` VARCHAR(120) NULL AFTER `sepay_va_id`,
    ADD COLUMN `reference_number` VARCHAR(255) NULL AFTER `sepay_order_code`,
    ADD COLUMN `webhook_success` BOOLEAN NULL AFTER `reference_number`,
    ADD COLUMN `sepay_bank_account_ref_id` BIGINT UNSIGNED NULL AFTER `webhook_success`,
    ADD COLUMN `sepay_virtual_account_ref_id` BIGINT UNSIGNED NULL AFTER `sepay_bank_account_ref_id`;

ALTER TABLE `sepay_sync_cursors`
    ADD CONSTRAINT `sepay_sync_cursors_sepay_bank_account_id_fkey`
        FOREIGN KEY (`sepay_bank_account_id`) REFERENCES `sepay_bank_accounts`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sepay_virtual_accounts`
    ADD CONSTRAINT `sepay_virtual_accounts_sepay_bank_account_id_fkey`
        FOREIGN KEY (`sepay_bank_account_id`) REFERENCES `sepay_bank_accounts`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sepay_order_payments`
    ADD CONSTRAINT `sepay_order_payments_money_donation_id_fkey`
        FOREIGN KEY (`money_donation_id`) REFERENCES `money_donations`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `sepay_order_payments_sepay_bank_account_id_fkey`
        FOREIGN KEY (`sepay_bank_account_id`) REFERENCES `sepay_bank_accounts`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `sepay_order_payments_sepay_virtual_account_id_fkey`
        FOREIGN KEY (`sepay_virtual_account_id`) REFERENCES `sepay_virtual_accounts`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `money_donations`
    ADD CONSTRAINT `money_donations_sepay_bank_account_ref_id_fkey`
        FOREIGN KEY (`sepay_bank_account_ref_id`) REFERENCES `sepay_bank_accounts`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `payment_transactions`
    ADD CONSTRAINT `payment_transactions_sepay_bank_account_ref_id_fkey`
        FOREIGN KEY (`sepay_bank_account_ref_id`) REFERENCES `sepay_bank_accounts`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `payment_transactions_sepay_virtual_account_ref_id_fkey`
        FOREIGN KEY (`sepay_virtual_account_ref_id`) REFERENCES `sepay_virtual_accounts`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;
