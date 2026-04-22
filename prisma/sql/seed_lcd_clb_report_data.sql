-- Seed report scenario data for LCD and CLB export testing
-- Target: 2 campaigns (LCD + CLB), each has 2 ended phases:
-- 1 fundraising phase and 1 volunteer recruitment phase.
-- Data volume per campaign: 100 verified fundraising contributors, 300 completed volunteers.

START TRANSACTION;

-- 1) Ensure minimal base data exists (faculty, club, manager accounts)
INSERT INTO faculties (code, name, created_at)
SELECT '102', 'Khoa Cong nghe thong tin', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM faculties WHERE code = '102'
);

SET @default_faculty_id := (
    SELECT id FROM faculties WHERE code = '102' LIMIT 1
);

INSERT INTO clubs (id, name, faculty_id, is_school_level, status, created_at)
SELECT '90000000-0000-4000-8000-000000000001', 'CLB Bao cao du lieu', @default_faculty_id, 0, 'ACTIVE', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM clubs WHERE id = '90000000-0000-4000-8000-000000000001'
);

INSERT INTO manager_accounts (
    id,
    username,
    email,
    password_hash,
    role_type,
    faculty_id,
    club_id,
    status,
    created_at,
    updated_at
)
SELECT
    '90000000-0000-4000-8000-000000000101',
    'lcd_report_manager',
    'lcd.report.manager@dut.udn.vn',
    '$2b$10$CxgSqj0Bj1HxNR3ajDWm6.fFFLHrJB/AWW0cRb2OOyNhLvhCP7ybS',
    'LCD_MANAGER',
    @default_faculty_id,
    NULL,
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM manager_accounts WHERE role_type = 'LCD_MANAGER'
);

INSERT INTO manager_accounts (
    id,
    username,
    email,
    password_hash,
    role_type,
    faculty_id,
    club_id,
    status,
    created_at,
    updated_at
)
SELECT
    '90000000-0000-4000-8000-000000000102',
    'clb_report_manager',
    'clb.report.manager@dut.udn.vn',
    '$2b$10$CxgSqj0Bj1HxNR3ajDWm6.fFFLHrJB/AWW0cRb2OOyNhLvhCP7ybS',
    'CLB_MANAGER',
    NULL,
    '90000000-0000-4000-8000-000000000001',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM manager_accounts WHERE role_type = 'CLB_MANAGER'
);

SET @lcd_manager_id := (
    SELECT id
    FROM manager_accounts
    WHERE role_type = 'LCD_MANAGER'
    ORDER BY created_at ASC
    LIMIT 1
);

SET @clb_manager_id := (
    SELECT id
    FROM manager_accounts
    WHERE role_type = 'CLB_MANAGER'
    ORDER BY created_at ASC
    LIMIT 1
);

SET @lcd_faculty_id := (
    SELECT COALESCE(faculty_id, @default_faculty_id)
    FROM manager_accounts
    WHERE id = @lcd_manager_id
    LIMIT 1
);

SET @clb_id := (
    SELECT COALESCE(club_id, '90000000-0000-4000-8000-000000000001')
    FROM manager_accounts
    WHERE id = @clb_manager_id
    LIMIT 1
);

SET @student_faculty_id := COALESCE(@lcd_faculty_id, @default_faculty_id);

-- 2) Prepare campaigns and ended phases for both roles
SET @campaign_lcd_id := '90000000-0000-4000-8000-000000000201';
SET @campaign_clb_id := '90000000-0000-4000-8000-000000000202';

SET @phase_lcd_fund_id := '90000000-0000-4000-8000-000000000301';
SET @phase_lcd_vol_id := '90000000-0000-4000-8000-000000000302';
SET @phase_clb_fund_id := '90000000-0000-4000-8000-000000000303';
SET @phase_clb_vol_id := '90000000-0000-4000-8000-000000000304';

SET @bank_lcd_id := '90000000-0000-4000-8000-000000000401';
SET @bank_clb_id := '90000000-0000-4000-8000-000000000402';

INSERT INTO campaigns (
    id,
    title,
    slogan,
    description,
    creator_manager_id,
    organizer_type,
    template_type,
    faculty_id,
    club_id,
    approval_status,
    publication_status,
    public_from,
    public_until,
    created_at,
    updated_at
)
VALUES
(
    @campaign_lcd_id,
    'Bao cao LCD - Gay quy va Tinh nguyen 2026',
    'Thong nhat du lieu bao cao',
    'Campaign for report export test with fundraising and volunteer phases.',
    @lcd_manager_id,
    'LCD',
    'FUNDRAISING_AND_VOLUNTEER',
    @lcd_faculty_id,
    NULL,
    'APPROVED',
    'ENDED',
    '2026-01-01 08:00:00',
    '2026-03-31 23:59:59',
    NOW(),
    NOW()
),
(
    @campaign_clb_id,
    'Bao cao CLB - Gay quy va Tinh nguyen 2026',
    'Thong nhat du lieu bao cao',
    'Campaign for report export test with fundraising and volunteer phases.',
    @clb_manager_id,
    'CLB',
    'FUNDRAISING_AND_VOLUNTEER',
    NULL,
    @clb_id,
    'APPROVED',
    'ENDED',
    '2026-01-01 08:00:00',
    '2026-03-31 23:59:59',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    slogan = VALUES(slogan),
    description = VALUES(description),
    approval_status = VALUES(approval_status),
    publication_status = VALUES(publication_status),
    public_from = VALUES(public_from),
    public_until = VALUES(public_until),
    updated_at = NOW();

INSERT INTO campaign_phases (
    id,
    campaign_id,
    phase_order,
    phase_name,
    phase_type,
    start_at,
    end_at,
    registration_start_at,
    registration_end_at,
    location_text,
    status,
    created_at,
    updated_at
)
VALUES
(
    @phase_lcd_fund_id,
    @campaign_lcd_id,
    1,
    'Giai doan gay quy online',
    'FUNDRAISING',
    '2026-01-01 08:00:00',
    '2026-01-31 23:59:59',
    NULL,
    NULL,
    'Online',
    'ENDED',
    NOW(),
    NOW()
),
(
    @phase_lcd_vol_id,
    @campaign_lcd_id,
    2,
    'Giai doan tuyen tinh nguyen vien',
    'VOLUNTEER_RECRUITMENT',
    '2026-02-01 08:00:00',
    '2026-03-15 23:59:59',
    '2026-02-01 08:00:00',
    '2026-02-20 23:59:59',
    'Da Nang',
    'ENDED',
    NOW(),
    NOW()
),
(
    @phase_clb_fund_id,
    @campaign_clb_id,
    1,
    'Giai doan gay quy online',
    'FUNDRAISING',
    '2026-01-01 08:00:00',
    '2026-01-31 23:59:59',
    NULL,
    NULL,
    'Online',
    'ENDED',
    NOW(),
    NOW()
),
(
    @phase_clb_vol_id,
    @campaign_clb_id,
    2,
    'Giai doan tuyen tinh nguyen vien',
    'VOLUNTEER_RECRUITMENT',
    '2026-02-01 08:00:00',
    '2026-03-15 23:59:59',
    '2026-02-01 08:00:00',
    '2026-02-20 23:59:59',
    'Da Nang',
    'ENDED',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    phase_name = VALUES(phase_name),
    start_at = VALUES(start_at),
    end_at = VALUES(end_at),
    registration_start_at = VALUES(registration_start_at),
    registration_end_at = VALUES(registration_end_at),
    location_text = VALUES(location_text),
    status = VALUES(status),
    updated_at = NOW();

INSERT INTO bank_accounts (
    id,
    bank_name,
    account_name,
    account_number,
    owner_name,
    managed_by_manager_id,
    is_active,
    created_at
)
VALUES
(
    @bank_lcd_id,
    'BIDV',
    'LCD Report Account',
    '102000000001',
    'LCD Report Account',
    @lcd_manager_id,
    1,
    NOW()
),
(
    @bank_clb_id,
    'Vietcombank',
    'CLB Report Account',
    '102000000002',
    'CLB Report Account',
    @clb_manager_id,
    1,
    NOW()
)
ON DUPLICATE KEY UPDATE
    bank_name = VALUES(bank_name),
    account_name = VALUES(account_name),
    account_number = VALUES(account_number),
    owner_name = VALUES(owner_name),
    is_active = 1;

INSERT INTO phase_fundraising_configs (
    phase_id,
    target_amount,
    bank_account_id,
    qr_file_id,
    transfer_note_prefix,
    usage_description,
    verification_mode
)
VALUES
(
    @phase_lcd_fund_id,
    50000000,
    @bank_lcd_id,
    NULL,
    'LCD2026',
    'Fundraising for report export test',
    'MANUAL'
),
(
    @phase_clb_fund_id,
    50000000,
    @bank_clb_id,
    NULL,
    'CLB2026',
    'Fundraising for report export test',
    'MANUAL'
)
ON DUPLICATE KEY UPDATE
    target_amount = VALUES(target_amount),
    bank_account_id = VALUES(bank_account_id),
    transfer_note_prefix = VALUES(transfer_note_prefix),
    usage_description = VALUES(usage_description),
    verification_mode = VALUES(verification_mode);

INSERT INTO phase_volunteer_configs (
    phase_id,
    max_participants,
    participant_scope,
    requires_checkin,
    task_description,
    certificate_template_file_id,
    certificate_name_pos_x_percent,
    certificate_name_pos_y_percent,
    certificate_name_font_size,
    certificate_name_color_hex
)
VALUES
(
    @phase_lcd_vol_id,
    500,
    'ALL_STUDENTS',
    0,
    'Volunteer work for report export test',
    NULL,
    50,
    50,
    36,
    '#1E293B'
),
(
    @phase_clb_vol_id,
    500,
    'ALL_STUDENTS',
    0,
    'Volunteer work for report export test',
    NULL,
    50,
    50,
    36,
    '#1E293B'
)
ON DUPLICATE KEY UPDATE
    max_participants = VALUES(max_participants),
    participant_scope = VALUES(participant_scope),
    requires_checkin = VALUES(requires_checkin),
    task_description = VALUES(task_description);

-- 3) Select students directly from the existing students table.
-- We capture up to 300 students and use that same set for all seeded report rows.
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_report_students (
    seq INT PRIMARY KEY,
    student_id CHAR(36) NOT NULL,
    UNIQUE KEY uq_tmp_report_students_student_id (student_id)
);

DELETE FROM tmp_report_students;

SET @student_seq := 0;

INSERT INTO tmp_report_students (seq, student_id)
SELECT
    @student_seq := @student_seq + 1 AS seq,
    source_students.id
FROM (
    SELECT id
    FROM students
    ORDER BY created_at ASC, id ASC
    LIMIT 300
) source_students;

SET @selected_student_count := (SELECT COUNT(*) FROM tmp_report_students);

-- 4) Rebuild 100 verified fundraising contributions for LCD campaign from selected students.
DELETE FROM contributions WHERE BINARY phase_id = BINARY @phase_lcd_fund_id;

INSERT INTO contributions (
    id,
    phase_id,
    student_id,
    contribution_type,
    amount,
    item_description,
    proof_file_id,
    status,
    verified_by,
    verified_at,
    rejection_reason,
    created_at
)
SELECT
    CONCAT('92000000-0000-4000-8000-', LPAD(selected_students.seq, 12, '0')),
    @phase_lcd_fund_id,
    selected_students.student_id,
    'MONEY',
    CASE
        WHEN selected_students.seq <= 25 THEN 20000 + (selected_students.seq * 125)
        WHEN selected_students.seq <= 50 THEN 30000 + ((selected_students.seq - 25) * 275)
        WHEN selected_students.seq <= 75 THEN 50000 + ((selected_students.seq - 50) * 625)
        ELSE 100000 + ((selected_students.seq - 75) * 1500)
    END,
    NULL,
    NULL,
    'VERIFIED',
    @lcd_manager_id,
    NOW(),
    NULL,
    NOW()
FROM tmp_report_students selected_students
WHERE selected_students.seq <= 100
ON DUPLICATE KEY UPDATE
    phase_id = VALUES(phase_id),
    student_id = VALUES(student_id),
    contribution_type = VALUES(contribution_type),
    amount = VALUES(amount),
    item_description = VALUES(item_description),
    proof_file_id = VALUES(proof_file_id),
    status = VALUES(status),
    verified_by = VALUES(verified_by),
    verified_at = VALUES(verified_at),
    rejection_reason = VALUES(rejection_reason),
    created_at = VALUES(created_at);

-- 5) Rebuild 100 verified fundraising contributions for CLB campaign from selected students.
DELETE FROM contributions WHERE BINARY phase_id = BINARY @phase_clb_fund_id;

INSERT INTO contributions (
    id,
    phase_id,
    student_id,
    contribution_type,
    amount,
    item_description,
    proof_file_id,
    status,
    verified_by,
    verified_at,
    rejection_reason,
    created_at
)
SELECT
    CONCAT('93000000-0000-4000-8000-', LPAD(selected_students.seq, 12, '0')),
    @phase_clb_fund_id,
    selected_students.student_id,
    'MONEY',
    CASE
        WHEN selected_students.seq <= 25 THEN 20000 + (selected_students.seq * 125)
        WHEN selected_students.seq <= 50 THEN 30000 + ((selected_students.seq - 25) * 275)
        WHEN selected_students.seq <= 75 THEN 50000 + ((selected_students.seq - 50) * 625)
        ELSE 100000 + ((selected_students.seq - 75) * 1500)
    END,
    NULL,
    NULL,
    'VERIFIED',
    @clb_manager_id,
    NOW(),
    NULL,
    NOW()
FROM tmp_report_students selected_students
WHERE selected_students.seq <= 100
ON DUPLICATE KEY UPDATE
    phase_id = VALUES(phase_id),
    student_id = VALUES(student_id),
    contribution_type = VALUES(contribution_type),
    amount = VALUES(amount),
    item_description = VALUES(item_description),
    proof_file_id = VALUES(proof_file_id),
    status = VALUES(status),
    verified_by = VALUES(verified_by),
    verified_at = VALUES(verified_at),
    rejection_reason = VALUES(rejection_reason),
    created_at = VALUES(created_at);

-- 6) Rebuild 300 completed volunteer registrations for LCD campaign from selected students.
DELETE FROM registrations WHERE BINARY phase_id = BINARY @phase_lcd_vol_id;

INSERT INTO registrations (
    id,
    phase_id,
    student_id,
    status,
    applied_at,
    reviewed_by,
    reviewed_at,
    rejection_reason
)
SELECT
    CONCAT('94000000-0000-4000-8000-', LPAD(selected_students.seq, 12, '0')),
    @phase_lcd_vol_id,
    selected_students.student_id,
    'COMPLETED',
    '2026-02-05 08:00:00',
    @lcd_manager_id,
    NOW(),
    NULL
FROM tmp_report_students selected_students
ON DUPLICATE KEY UPDATE
    phase_id = VALUES(phase_id),
    student_id = VALUES(student_id),
    status = VALUES(status),
    applied_at = VALUES(applied_at),
    reviewed_by = VALUES(reviewed_by),
    reviewed_at = VALUES(reviewed_at),
    rejection_reason = VALUES(rejection_reason);

-- 7) Rebuild 300 completed volunteer registrations for CLB campaign from selected students.
DELETE FROM registrations WHERE BINARY phase_id = BINARY @phase_clb_vol_id;

INSERT INTO registrations (
    id,
    phase_id,
    student_id,
    status,
    applied_at,
    reviewed_by,
    reviewed_at,
    rejection_reason
)
SELECT
    CONCAT('95000000-0000-4000-8000-', LPAD(selected_students.seq, 12, '0')),
    @phase_clb_vol_id,
    selected_students.student_id,
    'COMPLETED',
    '2026-02-05 08:00:00',
    @clb_manager_id,
    NOW(),
    NULL
FROM tmp_report_students selected_students
ON DUPLICATE KEY UPDATE
    phase_id = VALUES(phase_id),
    student_id = VALUES(student_id),
    status = VALUES(status),
    applied_at = VALUES(applied_at),
    reviewed_by = VALUES(reviewed_by),
    reviewed_at = VALUES(reviewed_at),
    rejection_reason = VALUES(rejection_reason);

DROP TEMPORARY TABLE IF EXISTS tmp_report_students;

COMMIT;

-- Quick verification
SELECT @selected_student_count AS selected_students_from_students_table;

SELECT c.id, c.title, c.organizer_type, COUNT(DISTINCT p.id) AS phase_count
FROM campaigns c
JOIN campaign_phases p ON p.campaign_id = c.id
WHERE BINARY c.id = BINARY @campaign_lcd_id
   OR BINARY c.id = BINARY @campaign_clb_id
GROUP BY c.id, c.title, c.organizer_type;

SELECT phase_id, COUNT(*) AS total_contributions
FROM contributions
WHERE BINARY phase_id = BINARY @phase_lcd_fund_id
   OR BINARY phase_id = BINARY @phase_clb_fund_id
GROUP BY phase_id;

SELECT phase_id, COUNT(*) AS total_registrations
FROM registrations
WHERE BINARY phase_id = BINARY @phase_lcd_vol_id
   OR BINARY phase_id = BINARY @phase_clb_vol_id
GROUP BY phase_id;

-- Volunteer list sourced from students table
SELECT
    r.phase_id,
    s.mssv,
    s.full_name,
    s.class_name,
    s.email,
    s.phone,
    r.status
FROM registrations r
JOIN students s ON s.id = r.student_id
WHERE (BINARY r.phase_id = BINARY @phase_lcd_vol_id
    OR BINARY r.phase_id = BINARY @phase_clb_vol_id)
    AND r.status = 'COMPLETED'
ORDER BY r.phase_id, s.full_name;
