-- CreateTable
CREATE TABLE `student_refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `student_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `student_refresh_tokens_token_key`(`token`),
    INDEX `student_refresh_tokens_token_idx`(`token`),
    INDEX `student_refresh_tokens_student_id_idx`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_refresh_tokens`
    ADD CONSTRAINT `student_refresh_tokens_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
