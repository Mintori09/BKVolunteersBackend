# Database Runtime Completion Report

## Scope

- Mục tiêu: loại bỏ mock data runtime trong các domain đang phục vụ API và đồng bộ runtime với `prisma/schema.prisma`.
- Ngày cập nhật: `2026-06-06`
- Trạng thái xác thực:
  - `pnpm prisma generate`: pass
  - `pnpm prisma db seed`: pass
  - `pnpm build`: pass
  - `pnpm test -- --runInBand`: pass (`28/28` test suites, `161/161` tests)

## Updated Checklist

### Core + User / Master Data

| Model | Runtime Prisma | Repository | Service | Controller / API | Seed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Faculty` | Yes | Existing | Existing | Existing | Yes | Dùng trong `auth/users/catalog/organizations` |
| `User` | Yes | Existing | Existing | Existing | Yes | Seed có manager + student accounts cố định |
| `ManagerAccount` | Yes | Existing | Existing | Existing | Yes | Seed 1 `DOANTRUONG`, 14 `LCD`, 10 `CLB` |
| `Student` | Yes | Existing | Existing | Existing | Yes | Seed 12 sinh viên liên kết thật |
| `Title` | Yes | Service trực tiếp Prisma | Via seed/runtime relation | Via dashboard/profile relation | Yes | Danh hiệu theo điểm |
| `StudentTitle` | Yes | Service trực tiếp Prisma | Via seed/runtime relation | Via dashboard/profile relation | Yes | Mở khóa danh hiệu cho sinh viên |
| `Club` | Yes | Existing + catalog service | Existing | Existing | Yes | Dùng làm organization runtime thật |
| `ClubMembership` | Yes | Service trực tiếp Prisma | Via catalog/student runtime | Via related APIs | Yes | Seed trạng thái `PENDING/APPROVED/REJECTED` |
| `File` | Yes | Existing | Existing | Existing | Yes | Cover, logo, docs, media, certificate assets |

### Campaign + Review + Media

| Model | Runtime Prisma | Repository | Service | Controller / API | Seed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Campaign` | Yes | Service trực tiếp Prisma | `catalog/campaigns` | `public/campaigns/approvals/reports` | Yes | Đã bỏ mock runtime |
| `Tag` | Yes | Service trực tiếp Prisma | `catalog` | `public/campaigns` | Yes | Tag thật theo chiến dịch |
| `CampaignDocument` | Yes | Service trực tiếp Prisma | `catalog/campaigns` | `public/campaigns/approvals` | Yes | Dùng file metadata thật |
| `CampaignReviewRequest` | Yes | Service trực tiếp Prisma | `campaigns` | `approvals/campaigns` | Yes | Luồng submit/review thật |
| `CampaignReviewComment` | Yes | Service trực tiếp Prisma | `campaigns` | `approvals/campaigns` | Yes | Có comment chỉnh sửa và phê duyệt |
| `CampaignStatusHistory` | Yes | Service trực tiếp Prisma | `campaigns/catalog` | `reports/approvals` | Yes | Audit trạng thái thật |
| `CampaignMedia` | Yes | Service trực tiếp Prisma | `catalog` | `public/campaigns` | Yes | Thư viện ảnh chiến dịch |

### Campaign Modules

| Model | Runtime Prisma | Repository | Service | Controller / API | Seed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CampaignModule` | Yes | Service trực tiếp Prisma | `campaigns/catalog/events/fundraising` | Existing routes | Yes | Module con thật |
| `VolunteerModuleConfig` | Yes | Service trực tiếp Prisma | `campaigns/catalog` | Existing routes | Yes | Module tuyển TNV |
| `FundraisingModuleConfig` | Yes | Service trực tiếp Prisma | `campaigns/fundraising/catalog` | Existing routes | Yes | Module gây quỹ tiền |
| `ItemDonationModuleConfig` | Yes | Service trực tiếp Prisma | `campaigns/catalog` | Existing routes | Yes | Module quyên góp hiện vật |
| `ItemDonationTarget` | Yes | Service trực tiếp Prisma | `catalog` | Existing routes | Yes | Target hiện vật thật |
| `EventModuleConfig` | Yes | Service trực tiếp Prisma | `campaigns/events/catalog` | Existing routes | Yes | Event offline/hybrid |
| `ModuleRegistration` | Yes | Service trực tiếp Prisma | `events/catalog/certificates` | `events` + student dashboard | Yes | Đăng ký thật |
| `Checkin` | Yes | Service trực tiếp Prisma | `events/catalog` | `events` | Yes | Check-in / complete thật |

### Contribution + Payment

| Model | Runtime Prisma | Repository | Service | Controller / API | Seed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `OrganizerPaymentAccount` | Yes | Service trực tiếp Prisma | `fundraising/catalog` | `fundraising`, admin runtime | Yes | Tài khoản MB/Vietcombank/ACB/BIDV demo |
| `PaymentProviderConfig` | Yes | Service trực tiếp Prisma | `fundraising/catalog` | `fundraising` | Yes | Schema chỉ hỗ trợ `PAYOS`, không có enum `SEPAY` |
| `MoneyContribution` | Yes | Service trực tiếp Prisma | `fundraising/catalog` | `fundraising`, student dashboard | Yes | Đã bỏ mock runtime |
| `MoneyContributionTransaction` | Yes | Service trực tiếp Prisma | `fundraising/catalog` | `fundraising/reports` | Yes | Attach/unmatch/verify thật |
| `ItemContribution` | Yes | Service trực tiếp Prisma | `catalog/student dashboard` | Indirect via existing APIs | Yes | Không còn schema-only |
| `ItemContributionLine` | Yes | Service trực tiếp Prisma | `catalog/student dashboard` | Indirect via existing APIs | Yes | Có quantity thật cho dashboard |

### Certificate

| Model | Runtime Prisma | Repository | Service | Controller / API | Seed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CertificateTemplate` | Yes | Service trực tiếp Prisma | `certificates` | `certificates/templates` | Yes | Đã bỏ mock runtime |
| `CertificateTemplateVersion` | Yes | Service trực tiếp Prisma | `certificates` | `certificates/templates` | Yes | Version active thật |
| `CertificateIssuancePolicy` | Yes | Service trực tiếp Prisma | `certificates` | `certificates/campaigns` | Yes | Policy issue thật |
| `Certificate` | Yes | Service trực tiếp Prisma | `certificates` | `certificates`, `students/me/certificates`, `public/certificates/verify/:code` | Yes | Issue/render/revoke/reissue/verify thật |
| `CertificateSnapshot` | Yes | Service trực tiếp Prisma | `certificates` | Indirect via issue flow | Yes | Snapshot JSON tiếng Việt |
| `CertificateRenderJob` | Yes | Service trực tiếp Prisma | `certificates` | Indirect via render flow | Yes | `PENDING/SUCCESS/FAILED` |
| `CertificateAuditLog` | Yes | Service trực tiếp Prisma | `certificates` | Indirect via issue/revoke/render | Yes | `CREATED/SIGN_SUCCESS/REVOKED` |
| `CertificateVerificationLog` | Yes | Service trực tiếp Prisma | `certificates` | `public verify` | Yes | Log verify công khai |
| `CertificateSigningProfile` | Yes | Service trực tiếp Prisma | `certificates` | Indirect via template/sign flow | Yes | Profile ký số demo |
| `CertificateDigitalSignature` | Yes | Service trực tiếp Prisma | `certificates` | Indirect via certificate detail | Yes | Metadata ký số demo |

### Notification + Auth Support

| Model | Runtime Prisma | Repository | Service | Controller / API | Seed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `ManagerNotification` | Yes | Service trực tiếp Prisma | `notifications/campaigns` | `notifications` | Yes | Tạo và đọc thật |
| `StudentNotification` | Yes | Service trực tiếp Prisma | `notifications/events/fundraising` | `notifications` | Yes | Đã bỏ mock runtime |
| `UserOAuthAccount` | Yes | Service trực tiếp Prisma | Via auth/runtime relation | Indirect | Yes | Seed demo Google/Microsoft |
| `UserRefreshToken` | Yes | Existing | Existing | Existing | Yes | Seed token demo |
| `UserResetToken` | Yes | Service trực tiếp Prisma | Via auth/runtime relation | Indirect | Yes | Seed token demo |
| `UserEmailVerificationToken` | Yes | Service trực tiếp Prisma | Via auth/runtime relation | Indirect | Yes | Seed token demo |

## APIs / Domains No Longer Using Runtime Mock

- `public/campaigns`
- `campaigns`
- `approvals/campaigns`
- `reports`
- `organizations`
- `admin/organizations`
- `students/me/dashboard`
- `students/me/activities`
- `students/me/donations`
- `students/me/certificates`
- `events`
- `fundraising`
- `notifications`
- `certificates`

## Mock Stores Removed / Replaced In Runtime

Runtime production code không còn đọc dữ liệu từ các file mock sau:

- `src/features/catalog/catalog.data.ts`
- `src/features/events/events.data.ts`
- `src/features/fundraising/fundraising.data.ts`
- `src/features/notifications/notifications.data.ts`
- `src/features/certificates/certificates.data.ts`

Các file trên vẫn còn trong repo làm dữ liệu tham chiếu cũ cho test/documentation, nhưng service/controller runtime hiện đã đọc/ghi bằng Prisma thật.

## Seed Coverage

Seed hiện tạo dữ liệu liên kết thật cho:

- 14 `Faculty`
- 25 manager accounts:
  - 1 `DOANTRUONG`
  - 14 `LCD`
  - 10 `CLB`
- 12 sinh viên
- 10 CLB
- 4 danh hiệu và quan hệ `StudentTitle`
- 4 `ClubMembership`
- file metadata cho avatar, cover, logo, docs, media, QR, certificate assets
- 6 campaigns với các trạng thái:
  - `DRAFT`
  - `SUBMITTED`
  - `APPROVED`
  - `PUBLISHED`
  - `ONGOING`
  - `ENDED`
- review requests, comments, status history
- volunteer / fundraising / item donation / event modules
- 15 module registrations
- check-in records
- 10 money contributions
- transaction records đối soát
- 6 item contributions và line items
- 3 certificate templates + versions + policies
- 3 certificates + snapshot + render jobs + audit logs + verification logs
- signing profile + digital signature demo
- manager/student notifications
- OAuth / refresh / reset / email verification tokens

## Structural Notes

- Runtime đã bỏ mock trong các domain chính đang phục vụ API.
- Kiến trúc hiện tại vẫn có một số domain dùng `service -> Prisma` trực tiếp thay vì tách class `repository` riêng cho từng model con. Đây là debt kiến trúc còn lại, không còn là gap dữ liệu/runtime.
- `locations` vẫn là static catalog và không thuộc scope chuyển đổi database của đợt này.
- Để tránh kẹt process test/Jest giữ connection MariaDB, cấu hình test hiện có:
  - `setupFilesAfterEnv` trong `jest.config.ts`
  - `forceExit: true` trong `jest.config.ts`

## Commands Run

```bash
pnpm prisma generate
pnpm prisma db seed
pnpm build
pnpm test -- --runInBand
```

## Command Results

| Command | Result |
| --- | --- |
| `pnpm prisma generate` | Pass |
| `pnpm prisma db seed` | Pass |
| `pnpm build` | Pass |
| `pnpm test -- --runInBand` | Pass, `28/28` suites and `161/161` tests |

## Remaining Non-Silent Notes

- Coverage tổng sau test hiện là khoảng `66.23%`, chưa đạt target `80%` được nêu trong `AGENTS.md`.
- Một số model đã có runtime Prisma và seed thật nhưng chưa tách riêng thành repository class độc lập; hiện chúng đang được xử lý trong domain service hiện có.
