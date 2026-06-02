ALTER TABLE `users`
    ADD COLUMN `role` ENUM('SINHVIEN', 'LCD', 'CLB', 'DOANTRUONG') NULL AFTER `passwordHash`;

UPDATE `users` AS `u`
LEFT JOIN `manager_accounts` AS `ma`
    ON `ma`.`userId` = `u`.`id`
SET `u`.`role` = CASE
    WHEN `u`.`accountType` = 'STUDENT' THEN 'SINHVIEN'
    WHEN `ma`.`roleType` = 'CLB_MANAGER' THEN 'CLB'
    WHEN `ma`.`roleType` = 'LCD_MANAGER' THEN 'LCD'
    WHEN `ma`.`roleType` = 'DOANTRUONG_ADMIN' THEN 'DOANTRUONG'
    ELSE 'SINHVIEN'
END;

ALTER TABLE `users`
    MODIFY `role` ENUM('SINHVIEN', 'LCD', 'CLB', 'DOANTRUONG') NOT NULL;

DROP INDEX `users_accountType_idx` ON `users`;
CREATE INDEX `users_role_idx` ON `users`(`role`);

ALTER TABLE `users`
    DROP COLUMN `accountType`;

DROP INDEX `manager_accounts_roleType_idx` ON `manager_accounts`;

ALTER TABLE `manager_accounts`
    DROP COLUMN `roleType`;
