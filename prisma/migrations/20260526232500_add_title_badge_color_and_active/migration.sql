ALTER TABLE `titles`
    ADD COLUMN `badge_color` VARCHAR(7) NULL AFTER `icon_url`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true AFTER `badge_color`;

UPDATE `titles`
SET `is_active` = true
WHERE `is_active` IS NULL;
