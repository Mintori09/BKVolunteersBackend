CREATE TABLE `sepay_organization_scopes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sepay_bank_account_id` BIGINT UNSIGNED NOT NULL,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `source` VARCHAR(40) NOT NULL DEFAULT 'MODULE_CONFIG',
    `metadata_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `sos_account_org_uq`(`sepay_bank_account_id`, `organization_id`),
    INDEX `sos_org_idx`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sepay_operation_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `requester_id` BIGINT UNSIGNED NOT NULL,
    `requester_role` VARCHAR(40) NOT NULL,
    `request_type` VARCHAR(60) NOT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    `sepay_bank_account_id` BIGINT UNSIGNED NULL,
    `campaign_id` BIGINT UNSIGNED NULL,
    `module_id` BIGINT UNSIGNED NULL,
    `donation_id` BIGINT UNSIGNED NULL,
    `note` TEXT NULL,
    `decision_note` TEXT NULL,
    `decided_by` BIGINT UNSIGNED NULL,
    `decided_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `sor_org_status_idx`(`organization_id`, `status`),
    INDEX `sor_type_status_idx`(`request_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sepay_organization_scopes`
ADD CONSTRAINT `sos_account_fk`
FOREIGN KEY (`sepay_bank_account_id`) REFERENCES `sepay_bank_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sepay_organization_scopes`
ADD CONSTRAINT `sos_org_fk`
FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_org_fk`
FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_requester_fk`
FOREIGN KEY (`requester_id`) REFERENCES `operator_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_decider_fk`
FOREIGN KEY (`decided_by`) REFERENCES `operator_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_account_fk`
FOREIGN KEY (`sepay_bank_account_id`) REFERENCES `sepay_bank_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_campaign_fk`
FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_module_fk`
FOREIGN KEY (`module_id`) REFERENCES `campaign_modules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sepay_operation_requests`
ADD CONSTRAINT `sor_donation_fk`
FOREIGN KEY (`donation_id`) REFERENCES `money_donations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
