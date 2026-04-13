-- Expand stored JWT refresh token columns so they can hold longer payloads.
ALTER TABLE `RefreshToken`
    MODIFY `token` VARCHAR(512) NOT NULL;

ALTER TABLE `student_refresh_tokens`
    MODIFY `token` VARCHAR(512) NOT NULL;
