-- ============================================
-- BKVOLUNTEERS DATABASE SCHEMA
-- Improved version with audit fields, indexes, and constraints
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `student_titles`,
`titles`,
`participants`,
`donations`,
`money_donation_campaigns`,
`item_donation_campaigns`,
`event_campaigns`,
`campaigns`,
`clubs`,
`students`,
`users`,
`accounts`,
`refresh_tokens`,
`reset_tokens`,
`email_verification_tokens`,
`faculties`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. DANH MỤC KHOA
-- ============================================
CREATE TABLE `faculties` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `code` VARCHAR(20) UNIQUE NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_faculties_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TÀI KHOẢN QUẢN LÝ (Admin, Đoàn trường, Liên chi đoàn, Trưởng CLB)
-- ============================================
CREATE TABLE `users` (
    `id` VARCHAR(36) PRIMARY KEY,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM ('CLB', 'LCD', 'DOANTRUONG') NOT NULL DEFAULT 'LCD',
    `faculty_id` INT NULL COMMENT 'Chỉ có giá trị nếu thuộc Khoa cụ thể',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL COMMENT 'Soft delete',
    FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE SET NULL,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_faculty_id` (`faculty_id`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. BẢNG SINH VIÊN (Dành cho người dùng tham gia hoạt động)
-- ============================================
CREATE TABLE `students` (
    `id` VARCHAR(36) PRIMARY KEY,
    `mssv` VARCHAR(20) UNIQUE NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `faculty_id` INT NOT NULL,
    `class_name` VARCHAR(50),
    `phone` VARCHAR(15),
    `total_points` INT DEFAULT 0 COMMENT 'Điểm tích lũy để xét danh hiệu',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL COMMENT 'Soft delete',
    FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`),
    INDEX `idx_students_mssv` (`mssv`),
    INDEX `idx_students_email` (`email`),
    INDEX `idx_students_faculty_id` (`faculty_id`),
    INDEX `idx_students_total_points` (`total_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. HỆ THỐNG DANH HIỆU (Gamification)
-- ============================================
CREATE TABLE `titles` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL COMMENT 'Ví dụ: Tân binh, Tân binh thiện chiến...',
    `description` TEXT,
    `min_points` INT DEFAULT 0,
    `icon_url` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_titles_min_points` (`min_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. BẢNG THEO DÕI DANH HIỆU SINH VIÊN
-- ============================================
CREATE TABLE `student_titles` (
    `student_id` VARCHAR(36) NOT NULL,
    `title_id` INT NOT NULL,
    `unlocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`student_id`, `title_id`),
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`title_id`) REFERENCES `titles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. CÂU LẠC BỘ
-- ============================================
CREATE TABLE `clubs` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `faculty_id` INT NULL COMMENT 'NULL nếu là CLB cấp Trường',
    `leader_id` VARCHAR(36) COMMENT 'Trưởng CLB (Nối tới USERS)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL COMMENT 'Soft delete',
    FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_clubs_faculty_id` (`faculty_id`),
    INDEX `idx_clubs_leader_id` (`leader_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. CHIẾN DỊCH TỔNG (Quản lý trạng thái và phê duyệt hồ sơ)
-- ============================================
CREATE TABLE `campaigns` (
    `id` VARCHAR(36) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `scope` ENUM ('KHOA', 'TRUONG') NOT NULL COMMENT 'KHOA = cấp khoa, TRUONG = cấp trường',
    `status` ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    `plan_file_url` VARCHAR(255),
    `budget_file_url` VARCHAR(255),
    `admin_comment` TEXT COMMENT 'Nhận xét từ người duyệt',
    `approver_id` VARCHAR(36) COMMENT 'Người duyệt (Role ADMIN/DOANTRUONG)',
    `creator_id` VARCHAR(36) NOT NULL COMMENT 'Người tạo (Role CLB/LCD/ADMIN)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL COMMENT 'Soft delete',
    FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    INDEX `idx_campaigns_creator_id` (`creator_id`),
    INDEX `idx_campaigns_approver_id` (`approver_id`),
    INDEX `idx_campaigns_status` (`status`),
    INDEX `idx_campaigns_scope` (`scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. CÁC PHÂN LOẠI CHIẾN DỊCH (Phases - STI Pattern)
-- ============================================

-- 8a. CHIẾN DỊCH QUYÊN GÓP TIỀN
CREATE TABLE `money_donation_campaigns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` VARCHAR(36) UNIQUE NOT NULL,
    `target_amount` DECIMAL(15, 0) DEFAULT 0,
    `current_amount` DECIMAL(15, 0) DEFAULT 0,
    `qr_image_url` VARCHAR(255),
    `start_date` DATETIME COMMENT 'Ngày bắt đầu nhận quyên góp',
    `end_date` DATETIME COMMENT 'Ngày kết thúc nhận quyên góp',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
    INDEX `idx_money_donation_campaigns_campaign_id` (`campaign_id`),
    INDEX `idx_money_donation_campaigns_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8b. CHIẾN DỊCH QUYÊN GÓP VẬT PHẨM
CREATE TABLE `item_donation_campaigns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` VARCHAR(36) UNIQUE NOT NULL,
    `accepted_items` TEXT NOT NULL COMMENT 'Danh sách đồ nhận (ví dụ: Sách, Quần áo) - JSON array',
    `collection_address` VARCHAR(255) COMMENT 'Địa điểm thu gom',
    `start_date` DATETIME,
    `end_date` DATETIME,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
    INDEX `idx_item_donation_campaigns_campaign_id` (`campaign_id`),
    INDEX `idx_item_donation_campaigns_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8c. CHIẾN DỊCH SỰ KIỆN / TÌNH NGUYỆN
CREATE TABLE `event_campaigns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `campaign_id` VARCHAR(36) UNIQUE NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `max_participants` INT DEFAULT 0,
    -- Phân biệt thời gian tuyển và thời gian diễn ra
    `registration_start` DATETIME NOT NULL COMMENT 'Bắt đầu mở link đăng ký',
    `registration_end` DATETIME NOT NULL COMMENT 'Hạn chót đăng ký',
    `event_start` DATETIME NOT NULL COMMENT 'Thời gian bắt đầu sự kiện',
    `event_end` DATETIME NOT NULL COMMENT 'Thời gian kết thúc sự kiện',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
    INDEX `idx_event_campaigns_campaign_id` (`campaign_id`),
    INDEX `idx_event_campaigns_registration` (`registration_start`, `registration_end`),
    INDEX `idx_event_campaigns_event` (`event_start`, `event_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. CHI TIẾT QUYÊN GÓP (Lịch sử đóng góp của Sinh viên)
-- ============================================
CREATE TABLE `donations` (
    `id` VARCHAR(36) PRIMARY KEY,
    `student_id` VARCHAR(36) NOT NULL,
    `money_phase_id` INT DEFAULT NULL,
    `item_phase_id` INT DEFAULT NULL,
    `amount` DECIMAL(15, 0) DEFAULT 0,
    `item_description` TEXT,
    `proof_image_url` VARCHAR(255) COMMENT 'Ảnh minh chứng chuyển khoản/giao đồ',
    `status` ENUM ('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`money_phase_id`) REFERENCES `money_donation_campaigns` (`id`) ON DELETE SET NULL,
    FOREIGN KEY (`item_phase_id`) REFERENCES `item_donation_campaigns` (`id`) ON DELETE SET NULL,
    INDEX `idx_donations_student_id` (`student_id`),
    INDEX `idx_donations_money_phase_id` (`money_phase_id`),
    INDEX `idx_donations_item_phase_id` (`item_phase_id`),
    INDEX `idx_donations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. ĐĂNG KÝ THAM GIA SỰ KIỆN & CHỨNG NHẬN
-- ============================================
CREATE TABLE `participants` (
    `id` VARCHAR(36) PRIMARY KEY,
    `event_id` INT NOT NULL,
    `student_id` VARCHAR(36) NOT NULL,
    `status` ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED') DEFAULT 'PENDING',
    `is_checked_in` BOOLEAN DEFAULT FALSE COMMENT 'Điểm danh tại sự kiện',
    `certificate_url` VARCHAR(255) COMMENT 'Link file chứng nhận (nếu có)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_event_reg` (`event_id`, `student_id`),
    FOREIGN KEY (`event_id`) REFERENCES `event_campaigns` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
    INDEX `idx_participants_student_id` (`student_id`),
    INDEX `idx_participants_event_id` (`event_id`),
    INDEX `idx_participants_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. AUTH MODELS
-- ============================================

-- OAuth Accounts (for social login)
CREATE TABLE `accounts` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `provider_account_id` VARCHAR(255) NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_provider_account` (`provider`, `provider_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh Tokens
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) PRIMARY KEY,
    `token` VARCHAR(255) UNIQUE NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_refresh_tokens_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reset Tokens
CREATE TABLE `reset_tokens` (
    `id` VARCHAR(36) PRIMARY KEY,
    `token` VARCHAR(255) UNIQUE NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_reset_tokens_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Verification Tokens
CREATE TABLE `email_verification_tokens` (
    `id` VARCHAR(36) PRIMARY KEY,
    `token` VARCHAR(255) UNIQUE NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_email_verification_tokens_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. SEED DATA - HỆ THỐNG DANH HIỆU
-- ============================================
INSERT INTO `titles` (`name`, `description`, `min_points`)
VALUES
    ('Tân binh', 'Dành cho sinh viên mới tham gia hoạt động lần đầu', 0),
    ('Tân binh thiện chiến', 'Đã tích lũy đủ 100 điểm đóng góp (Mạnh hơn xíu)', 100),
    ('Chiến thần tình nguyện', 'Sinh viên ưu tú có nhiều đóng góp tích cực cho cộng đồng', 500);
