# Database Model Analysis

## Overview

- ORM: Prisma (`@prisma/client`)
- Datasource: MySQL
- Runtime DB access today: `auth`, `users`, `storage`
- Runtime mock stores today: `catalog`, `campaigns`, `events`, `fundraising`, `certificates`, `notifications`, `organizations`, `students`, `reports`, `public`, `approvals`

## Current Runtime Status

| Class / Model | Table | Used for | Runtime status |
| --- | --- | --- | --- |
| `Faculty` | `faculties` | Master data khoa/phong khoa | Live Prisma in `users`, `auth` |
| `User` | `users` | Tai khoan goc, role, auth status | Live Prisma in `auth`, `users` |
| `ManagerAccount` | `manager_accounts` | Ho so quan ly cho `LCD`, `CLB`, `DOANTRUONG` | Live Prisma in `auth`, `users`, `storage` |
| `Student` | `students` | Ho so sinh vien, MSSV, diem, khoa | Live Prisma in `auth`, `users`, `storage` |
| `Title` | `titles` | Danh hieu theo diem sinh vien | Schema only |
| `StudentTitle` | `student_titles` | Lich su mo khoa danh hieu | Schema only |
| `Club` | `clubs` | Don vi CLB va quan ly CLB | Live Prisma in `users` |
| `ClubMembership` | `club_memberships` | Thanh vien CLB va phe duyet tham gia | Schema only |
| `File` | `files` | Metadata file tren Supabase Storage | Live Prisma in `storage`, `auth` qua `avatarFileId` |
| `Campaign` | `campaigns` | Chien dich tong | Mock-backed in `catalog` / `campaigns` |
| `Tag` | `tags` | Gan nhan cho chien dich | Schema only |
| `CampaignDocument` | `campaign_documents` | Ho so dinh kem chien dich | Schema only |
| `CampaignReviewRequest` | `campaign_review_requests` | Dot gui duyet chien dich | Schema only |
| `CampaignReviewComment` | `campaign_review_comments` | Nhan xet duyet | Schema only |
| `CampaignStatusHistory` | `campaign_status_histories` | Audit lich su trang thai | Schema only |
| `CampaignModule` | `campaign_modules` | Module con cua chien dich | Schema only |
| `VolunteerModuleConfig` | `volunteer_module_configs` | Cau hinh module tuyen TNV | Schema only |
| `FundraisingModuleConfig` | `fundraising_module_configs` | Cau hinh quy goi quyen gop tien | Schema only |
| `ItemDonationModuleConfig` | `item_donation_module_configs` | Cau hinh quy goi quyen gop hien vat | Schema only |
| `ItemDonationTarget` | `item_donation_targets` | Danh muc chi tieu hien vat | Schema only |
| `EventModuleConfig` | `event_module_configs` | Cau hinh su kien/module event | Schema only |
| `OrganizerPaymentAccount` | `organizer_payment_accounts` | Tai khoan nhan tien quyen gop | Schema only |
| `PaymentProviderConfig` | `payment_provider_configs` | Cau hinh nha cung cap thanh toan | Schema only |
| `ModuleRegistration` | `module_registrations` | Dang ky tham gia module | Schema only |
| `Checkin` | `checkins` | Check-in QR/manual | Schema only |
| `MoneyContribution` | `money_contributions` | Dong gop tien | Schema only |
| `MoneyContributionTransaction` | `money_contribution_transactions` | Giao dich doi soat nha cung cap | Schema only |
| `ItemContribution` | `item_contributions` | Dong gop hien vat | Schema only |
| `ItemContributionLine` | `item_contribution_lines` | Chi tiet hien vat nhan | Schema only |
| `CertificateTemplate` | `certificate_templates` | Mau chung nhan | Mock-backed in `certificates` |
| `CertificateTemplateVersion` | `certificate_template_versions` | Version hoa mau chung nhan | Schema only |
| `CertificateIssuancePolicy` | `certificate_issuance_policies` | Rule cap chung nhan | Schema only |
| `Certificate` | `certificates` | Chung nhan phat hanh | Mock-backed in `certificates` |
| `CertificateSnapshot` | `certificate_snapshots` | Snapshot payload chung nhan | Schema only |
| `CertificateRenderJob` | `certificate_render_jobs` | Queue render/sign | Schema only |
| `CertificateAuditLog` | `certificate_audit_logs` | Audit trail chung nhan | Schema only |
| `CertificateVerificationLog` | `certificate_verification_logs` | Log verify chung nhan cong khai | Schema only |
| `CertificateSigningProfile` | `certificate_signing_profiles` | Ho so ky so | Schema only |
| `CertificateDigitalSignature` | `certificate_digital_signatures` | Metadata chu ky so | Schema only |
| `CampaignMedia` | `campaign_media` | Thu vien media chien dich | Schema only |
| `ManagerNotification` | `manager_notifications` | Notification cho quan ly | Schema only |
| `StudentNotification` | `student_notifications` | Notification cho sinh vien | Mock-backed in `notifications` |
| `UserOAuthAccount` | `user_oauth_accounts` | OAuth lien ket user | Schema only |
| `UserRefreshToken` | `user_refresh_tokens` | Session refresh token | Live Prisma in `auth`, `users` |
| `UserResetToken` | `user_reset_tokens` | Reset password | Schema only |
| `UserEmailVerificationToken` | `user_email_verification_tokens` | Verify email | Schema only |

## Runtime Classes / DTOs Updated

| Class / Type | File | Purpose | Completed properties |
| --- | --- | --- | --- |
| `AuthUser` | `src/features/auth/types.ts` | Model runtime noi bo cho auth/session | `avatarFileId`, `studentProfileId`, `managerAccountId`, `managedClubId`, `deletedAt` |
| `UserMeOutput` | `src/features/auth/types.ts` | DTO tra ve cho user quan ly | `avatarFileId`, `managerAccountId`, `managedClubId` |
| `StudentMeOutput` | `src/features/auth/types.ts` | DTO tra ve cho sinh vien | `avatarFileId`, `studentProfileId` |
| `UserManagementItem` | `src/features/users/types.ts` | DTO quan tri user | `avatarFileId`, `studentProfileId`, `managerAccountId`, `deletedAt`, `totalPoints` |

## Methods Completed

| Method | File | Improvement |
| --- | --- | --- |
| `createUser()` | `src/features/users/users.service.ts` | Khong con tra raw Prisma rows; nay tra DTO quan tri day du sau khi tao |
| `updateUser()` | `src/features/users/users.service.ts` | Chuan hoa output thanh `UserManagementItem` cho ca student va manager |
| `updateUserStatus()` | `src/features/users/users.service.ts` | Sau khi khoa/mo khoa, tra ve snapshot model day du thay vi chi status |
| `mapManagerUser()` | `src/features/auth/auth.repository.ts` | Bo sung id/avatar/club relation metadata |
| `mapStudentUser()` | `src/features/auth/auth.repository.ts` | Bo sung student profile id va avatar metadata |

## Gaps Still Present

- Tầng `campaign/catalog/events/fundraising/certificates/notifications` chua doc/ghi bang Prisma, hien dang dua tren mock stores trong memory.
- `Title`, `StudentTitle`, `ClubMembership`, `Campaign*`, `Contribution*`, `Certificate*`, `Notification*`, `UserResetToken`, `UserEmailVerificationToken` da co schema nhung chua co repository/service Prisma tuong ung.
- Neu muon dong bo hoan toan backend voi schema, can uu tien migration runtime cho `Campaign`, `CampaignModule`, `ModuleRegistration`, `MoneyContribution`, `ItemContribution`, `Certificate`.
