# Backend GitNexus Review Report

## A. Executive Summary

- Ngày review: `2026-06-07`
- Reviewer scope: backend Node.js / TypeScript / Prisma / MySQL
- Files bắt buộc đã đọc:
  - `prisma/schema.prisma`
  - `docs/database-model-analysis.md`
  - `docs/database-runtime-completion-report.md`
  - `package.json`
  - toàn bộ `src/features/*`
- File `backend-api-completion-for-frontend.md`: không tồn tại trong repo tại thời điểm review.

### Kết luận nhanh

- Backend **đã bỏ phần lớn mock runtime cũ** cho `catalog`, `campaigns`, `events`, `fundraising`, `notifications`, `certificates`, `organizations`, `reports`, `students`.
- Tuy nhiên backend **chưa đạt mục tiêu “mọi API runtime đều dùng Prisma thật”** vì `locations` vẫn đọc static catalog từ `locations.data.ts`.
- Backend **chưa đạt mục tiêu “model Prisma có runtime đầy đủ”**: nhiều model có seed và relation nhưng chưa có repository/service/controller/API tương ứng, hoặc chỉ được dùng gián tiếp.
- Backend **chưa đạt mục tiêu “frontend-ready API đầy đủ”**: còn thiếu nhiều endpoint quan trọng cho users, students, memberships, item contributions, payment accounts, certificate policy/version/audit, notifications unread count, public stats.
- Build, typecheck, seed và test **pass**; nhưng `lint` **fail** do script gọi `prettier` trong khi package không được cài.
- Kiến trúc hiện tại **không bị phá hoàn toàn**, nhưng có drift rõ: gần như toàn bộ domain mới đi thẳng `controller -> service -> Prisma`, không có repository layer riêng như yêu cầu ban đầu.

### Final Verdict

- **FAIL**

Lý do chính:
- Có lỗ hổng phân quyền nghiêm trọng ở `campaigns`, `events`, `fundraising`.
- Còn API runtime dùng static data.
- Thiếu nhiều endpoint quan trọng cho frontend.
- Một số nghiệp vụ nhiều bảng chưa atomic hoặc chưa hoàn chỉnh theo schema.

## B. Mock Runtime Findings

| File | Dòng | Loại mock | Runtime hay test | Hợp lệ? | Cách sửa |
| --- | --- | --- | --- | --- | --- |
| `src/features/locations/locations.service.ts` | `1-14` | Static catalog từ `locations.data.ts` | Runtime | Không | Đưa locations vào Prisma nếu đây là API production, hoặc loại route này khỏi cam kết “mọi API dùng Prisma”. |
| `src/features/catalog/catalog.data.ts` | `1+` | Legacy mock file | Runtime tree nhưng không import | Tạm chấp nhận | Xóa hoặc chuyển sang `__test__/fixtures` để tránh hiểu nhầm. |
| `src/features/events/events.data.ts` | `1+` | Legacy mock file | Runtime tree nhưng không import | Tạm chấp nhận | Xóa hoặc chuyển sang thư mục test/docs. |
| `src/features/fundraising/fundraising.data.ts` | `1+` | Legacy mock file | Runtime tree nhưng không import | Tạm chấp nhận | Xóa hoặc chuyển sang thư mục test/docs. |
| `src/features/notifications/notifications.data.ts` | `1+` | Legacy mock file | Runtime tree nhưng không import | Tạm chấp nhận | Xóa hoặc chuyển sang thư mục test/docs. |
| `src/features/certificates/certificates.data.ts` | `1+` | Legacy mock file | Runtime tree nhưng không import | Tạm chấp nhận | Xóa hoặc chuyển sang thư mục test/docs. |
| `__test__/__mocks__/*` và các file `*.test.ts` | Nhiều | Jest mock | Test | Hợp lệ | Giữ nguyên. |
| `prisma/seed/runtime.seed.ts` | Nhiều | Demo seed data có kiểm soát | Seed | Hợp lệ | Giữ nguyên; đây không phải runtime production path. |

Ghi nhận thêm:
- Quét import runtime cho `*.data.ts` chỉ còn thấy `src/features/locations/locations.service.ts` import static data.
- Không thấy `catalog.data.ts`, `events.data.ts`, `fundraising.data.ts`, `notifications.data.ts`, `certificates.data.ts` được import bởi service/controller production hiện tại.

## C. Prisma Model Coverage

Legend:
- Repository: `Yes` nghĩa là có file repository riêng; `Service Prisma` nghĩa là query trực tiếp trong service.
- Runtime status:
  - `Live`: có seed + được dùng trong nghiệp vụ/runtime hiện tại.
  - `Indirect`: có dùng qua relation hoặc seed nhưng không có API/runtime riêng rõ ràng.
  - `Partial`: có runtime nhưng thiếu API/flow quan trọng.
  - `Static/Gap`: chưa đạt mục tiêu review.

| Model | Repository | Service | Controller/API | Seed | Runtime status | Vấn đề còn lại |
| --- | --- | --- | --- | --- | --- | --- |
| `Faculty` | No explicit repo | `users`, `catalog`, `auth` | Indirect only | Yes | Live | Không có route faculties riêng. |
| `User` | `auth.repository.ts` + direct service | `auth`, `users` | `auth`, `users` | Yes | Live | Thiếu `GET /users/:id`. |
| `Student` | No explicit repo | `catalog`, `auth` | `students` chỉ có `/me/*` | Yes | Partial | Thiếu list/detail/update/titles APIs. |
| `ManagerAccount` | No explicit repo | `auth`, `campaigns`, `fundraising`, `events` | Indirect/admin APIs | Yes | Partial | Scope theo CLB/khoa chưa enforced. |
| `Faculty` | No explicit repo | `users`, `catalog`, `auth` | Indirect | Yes | Live | Không có faculty detail API. |
| `Club` | No explicit repo | `catalog`, `users` | `organizations`, `admin/organizations` | Yes | Partial | Không có members/membership moderation APIs. |
| `Title` | No explicit repo | Indirect in seed/relations | No direct API | Yes | Indirect | Chưa có CRUD/list API hoặc service riêng. |
| `StudentTitle` | No explicit repo | Indirect in relations | No direct API | Yes | Indirect | Chưa có endpoint lấy/gán danh hiệu. |
| `ClubMembership` | No explicit repo | Indirect in relations | No direct API | Yes | Indirect | Chưa có create/list/approve/reject membership APIs. |
| `File` | No explicit repo | `storage`, `auth`, `catalog` | `storage` | Yes | Live | Ổn. |
| `UserOAuthAccount` | No | Indirect only | No | Yes | Indirect | Chỉ seed; không có runtime auth OAuth thật. |
| `UserRefreshToken` | `auth.repository.ts` | `auth` | `auth` | Yes | Live | Ổn. |
| `UserResetToken` | No | Không có flow auth đầy đủ | No | Yes | Indirect | Chưa có forgot/reset password API dùng table này. |
| `UserEmailVerificationToken` | No | Không có flow verify email thật | No | Yes | Indirect | Chưa có verify email API/runtime dùng table này. |
| `Campaign` | No explicit repo | `campaigns`, `catalog` | `campaigns`, `public`, `approvals`, `reports` | Yes | Partial | Thiếu update endpoint và ownership guard. |
| `Tag` | No explicit repo | `catalog` | Included in detail only | Yes | Partial | Thiếu CRUD tags API. |
| `CampaignDocument` | No explicit repo | `catalog` | Included in detail only | Yes | Partial | Thiếu manage documents API. |
| `CampaignReviewRequest` | No explicit repo | `campaigns` | `approvals`, `campaigns` | Yes | Live | Notification ngoài transaction. |
| `CampaignReviewComment` | No explicit repo | `campaigns` | `approvals` | Yes | Live | Chưa có scope/visibility logic đầy đủ. |
| `CampaignStatusHistory` | No explicit repo | `campaigns`, `catalog` | Indirect in detail/report | Yes | Partial | Thiếu endpoint lịch sử trạng thái riêng. |
| `CampaignModule` | No explicit repo | `campaigns`, `catalog`, `events`, `fundraising` | `campaigns`, `events`, `fundraising` | Yes | Partial | Thiếu update/delete/list-by-campaign APIs riêng. |
| `CampaignMedia` | No explicit repo | `catalog` | Included in detail only | Yes | Partial | Thiếu CRUD media API. |
| `VolunteerModuleConfig` | No explicit repo | `campaigns`, `catalog` | Indirect | Yes | Partial | Thiếu update API riêng; create flow không transaction. |
| `FundraisingModuleConfig` | No explicit repo | `campaigns`, `fundraising`, `catalog` | `fundraising` | Yes | Partial | Route mở quá rộng; thiếu payment-account APIs. |
| `ItemDonationModuleConfig` | No explicit repo | `campaigns`, `catalog` | Indirect | Yes | Partial | Không có API ghi nhận item contribution/module config đầy đủ. |
| `ItemDonationTarget` | No explicit repo | `catalog` | No direct API | Yes | Indirect | Create module không tạo targets runtime. |
| `EventModuleConfig` | No explicit repo | `campaigns`, `events`, `catalog` | `events` | Partial | Partial | Route mở quá rộng; thiếu scope guard. |
| `ModuleRegistration` | No explicit repo | `events`, `catalog`, `certificates` | `events`, `students` | Yes | Partial | Thiếu cancel/history endpoints; manager actions không guard. |
| `Checkin` | No explicit repo | `events`, `catalog` | `events` | Yes | Partial | Check-in dùng manager đầu tiên trong DB, không dùng actor thật. |
| `OrganizerPaymentAccount` | No explicit repo | `campaigns`, `fundraising`, `catalog` | Indirect only | Yes | Indirect | Không có CRUD/list API riêng. |
| `PaymentProviderConfig` | No explicit repo | `fundraising`, `catalog` | Indirect only | Yes | Indirect | Không có CRUD/list API riêng. |
| `MoneyContribution` | No explicit repo | `fundraising`, `catalog` | `fundraising`, `students` | Yes | Partial | Tạo donation chưa tạo transaction record. |
| `MoneyContributionTransaction` | No explicit repo | `fundraising`, `catalog` | `fundraising`, `reports` | Yes | Partial | `unmatch` để lại FK lệch ở donation. |
| `ItemContribution` | No explicit repo | `catalog` | Chỉ gián tiếp qua dashboard/detail | Yes | Indirect | Không có create/list/manage API. |
| `ItemContributionLine` | No explicit repo | `catalog` | Chỉ gián tiếp | Yes | Indirect | Không có API riêng. |
| `CertificateTemplate` | No explicit repo | `certificates` | `certificates/templates` | Yes | Live | Ổn ở mức cơ bản. |
| `CertificateTemplateVersion` | No explicit repo | `certificates` | Indirect only | Yes | Partial | Thiếu API version history/detail. |
| `CertificateIssuancePolicy` | No explicit repo | Seed only + partial relation | No direct API | Yes | Partial | Engine runtime chưa thật sự dùng policy types ngoài registration completion. |
| `Certificate` | No explicit repo | `certificates` | `certificates`, `public verify`, `students/me/certificates` | Yes | Partial | Issue/reissue/revoke chưa transaction đầy đủ. |
| `CertificateSnapshot` | No explicit repo | `certificates` | Indirect only | Yes | Partial | Không có API detail/audit riêng. |
| `CertificateRenderJob` | No explicit repo | `certificates` | Indirect only | Yes | Indirect | Thiếu API list/status jobs. |
| `CertificateAuditLog` | No explicit repo | `certificates` | Indirect only | Yes | Indirect | Thiếu API audit log. |
| `CertificateVerificationLog` | No explicit repo | `certificates` | Public verify side-effect only | Yes | Live | Không có admin API đọc log. |
| `CertificateSigningProfile` | No explicit repo | Seed only | No | Yes | Indirect | Chưa có API quản lý profile ký số. |
| `CertificateDigitalSignature` | No explicit repo | Indirect/seed | No | Yes | Indirect | Chưa có API metadata chữ ký số. |
| `ManagerNotification` | No explicit repo | `notifications`, business services | `notifications` | Yes | Live | Thiếu unread count endpoint. |
| `StudentNotification` | No explicit repo | `notifications`, business services | `notifications` | Yes | Live | Thiếu unread count endpoint. |

## D. Backend API Matrix

Status legend:
- `OK`: có route chạy bằng Prisma thật.
- `Missing`: chưa có endpoint.
- `Partial`: có endpoint nhưng thiếu capability quan trọng.
- `Broken`: có endpoint nhưng design/security/consistency chưa đạt.
- `Static`: endpoint runtime không đi Prisma.

| Feature | Endpoint | Method | Controller | Service | Prisma model | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Auth login | `/api/v1/auth/login` | `POST` | `auth.controller` | `auth.service` | `User`, `Student`, `ManagerAccount` | OK |
| Auth logout | `/api/v1/auth/logout` | `POST` | `auth.controller` | `auth.service` | `UserRefreshToken` | OK |
| Auth refresh | `/api/v1/auth/refresh` | `POST` | `auth.controller` | `auth.service` | `UserRefreshToken`, `User` | OK |
| Auth get me | `/api/v1/auth/me` | `GET` | `auth.controller` | `auth.service` | `User`, `Student`, `ManagerAccount` | OK |
| Auth update profile | `/api/v1/auth/me` | `PATCH` | `auth.controller` | `auth.service` | `User`, `Student` | OK |
| Auth change password | `/api/v1/auth/change-password` | `PATCH` | `auth.controller` | `auth.service` | `User` | OK |
| Users list | `/api/v1/users` | `GET` | `users.controller` | `users.service` | `User`, `Student`, `ManagerAccount` | OK |
| Users options | `/api/v1/users/options` | `GET` | `users.controller` | `users.service` | `Faculty`, `Club` | OK |
| Users create | `/api/v1/users` | `POST` | `users.controller` | `users.service` | `User`, `Student`, `ManagerAccount` | OK |
| Users update | `/api/v1/users/:userId` | `PATCH` | `users.controller` | `users.service` | `User`, `Student`, `ManagerAccount` | OK |
| Users status | `/api/v1/users/:userId/status` | `PATCH` | `users.controller` | `users.service` | `User`, `UserRefreshToken` | OK |
| Users delete | `/api/v1/users/:userId` | `DELETE` | `users.controller` | `users.service` | `User`, `Student`, `ManagerAccount` | OK |
| User detail | `/api/v1/users/:userId` | `GET` | - | - | `User` | Missing |
| Students dashboard | `/api/v1/students/me/dashboard` | `GET` | `students.controller` | `catalog.service` | `Student` + related | OK |
| Students activities | `/api/v1/students/me/activities` | `GET` | `students.controller` | `catalog.service` | `ModuleRegistration`, `MoneyContribution`, `ItemContribution`, `Certificate` | OK |
| Students donations | `/api/v1/students/me/donations` | `GET` | `students.controller` | `catalog.service` | `MoneyContribution`, `ItemContribution` | OK |
| Students certificates | `/api/v1/students/me/certificates` | `GET` | `students.controller` | `certificates.service` | `Certificate` | OK |
| Students list/detail/profile/titles | various | - | - | - | `Student`, `Title`, `StudentTitle` | Missing |
| Faculties list/detail | various | - | - | - | `Faculty` | Missing |
| Public organizations list | `/api/v1/organizations` | `GET` | `organizations.controller` | `catalog.service` | `Club`, `Faculty` | OK |
| Public organization detail | `/api/v1/organizations/:slug` | `GET` | `organizations.controller` | `catalog.service` | `Club`, `Faculty` | OK |
| Admin organizations list/create/update/delete | `/api/v1/admin/organizations...` | `GET/POST/PATCH/DELETE` | `organizations.admin.controller` | `catalog.service` | `Club` | Partial |
| Club members / membership moderation | various | - | - | - | `ClubMembership` | Missing |
| Public campaign list | `/api/v1/public/campaigns` | `GET` | `public.controller` | `catalog.service` | `Campaign` + relations | OK |
| Public campaign detail | `/api/v1/public/campaigns/:slug` | `GET` | `public.controller` | `catalog.service` | `Campaign` + relations | OK |
| Managed campaign list | `/api/v1/campaigns` | `GET` | `campaigns.controller` | `campaigns.service` | `Campaign` | OK |
| Managed campaign detail | `/api/v1/campaigns/:id` | `GET` | `campaigns.controller` | `campaigns.service` | `Campaign` + relations | OK |
| Create campaign | `/api/v1/campaigns` | `POST` | `campaigns.controller` | `campaigns.service` | `Campaign` | Partial |
| Update campaign | `/api/v1/campaigns/:id` | `PATCH` | - | - | `Campaign` | Missing |
| Submit review | `/api/v1/campaigns/:id/submit-review` | `POST` | `campaigns.controller` | `campaigns.service` | `CampaignReviewRequest`, `CampaignStatusHistory` | OK |
| Publish campaign | `/api/v1/campaigns/:id/publish` | `POST` | `campaigns.controller` | `campaigns.service` | `Campaign` | Broken |
| Delete campaign | `/api/v1/campaigns/:id` | `DELETE` | `campaigns.controller` | `campaigns.service` | `Campaign` | Broken |
| Create module | `/api/v1/campaigns/:id/modules` | `POST` | `campaigns.controller` | `campaigns.service` | `CampaignModule` + configs | Partial |
| Update/delete module | various | - | - | - | `CampaignModule` | Missing |
| Campaign tags/media/documents/history APIs | various | - | - | - | `Tag`, `CampaignMedia`, `CampaignDocument`, `CampaignStatusHistory` | Missing |
| Approval queue | `/api/v1/approvals/campaigns` | `GET` | `approvals.controller` | `catalog.service` | `CampaignReviewRequest` | OK |
| Approval detail | `/api/v1/approvals/campaigns/:id` | `GET` | `approvals.controller` | `catalog.service` | `Campaign` + review | OK |
| Approval comment | `/api/v1/approvals/campaigns/:id/comments` | `POST` | `approvals.controller` | `campaigns.service` | `CampaignReviewComment` | OK |
| Approval transition | `/api/v1/approvals/campaigns/:id/:action` | `POST` | `approvals.controller` | `campaigns.service` | `CampaignReviewRequest`, `CampaignStatusHistory` | Partial |
| Event module detail | `/api/v1/events/modules/:moduleId` | `GET` | `events.controller` | `events.service` | `CampaignModule`, `EventModuleConfig` | OK |
| Update event config | `/api/v1/events/modules/:moduleId/config` | `PATCH` | `events.controller` | `events.service` | `EventModuleConfig` | Broken |
| Register event | `/api/v1/events/modules/:moduleId/registrations` | `POST` | `events.controller` | `events.service` | `ModuleRegistration` | Partial |
| List registrations | `/api/v1/events/modules/:moduleId/registrations` | `GET` | `events.controller` | `events.service` | `ModuleRegistration` | Broken |
| Approve registration | `/api/v1/events/registrations/:registrationId/approve` | `PATCH` | `events.controller` | `events.service` | `ModuleRegistration`, `StudentNotification` | Broken |
| Reject registration | `/api/v1/events/registrations/:registrationId/reject` | `PATCH` | `events.controller` | `events.service` | `ModuleRegistration`, `StudentNotification` | Broken |
| Check-in | `/api/v1/events/registrations/:registrationId/check-in` | `POST` | `events.controller` | `events.service` | `Checkin` | Broken |
| Complete participation | `/api/v1/events/registrations/:registrationId/complete` | `POST` | `events.controller` | `events.service` | `Checkin`, `ModuleRegistration`, `StudentNotification` | Broken |
| Cancel registration / participation history | various | - | - | - | `ModuleRegistration` | Missing |
| Fundraising module detail | `/api/v1/fundraising/modules/:moduleId` | `GET` | `fundraising.controller` | `fundraising.service` | `CampaignModule`, `FundraisingModuleConfig` | OK |
| Update fundraising config | `/api/v1/fundraising/modules/:moduleId/config` | `PATCH` | `fundraising.controller` | `fundraising.service` | `FundraisingModuleConfig`, `OrganizerPaymentAccount`, `PaymentProviderConfig` | Broken |
| Create money contribution | `/api/v1/fundraising/modules/:moduleId/donations` | `POST` | `fundraising.controller` | `fundraising.service` | `MoneyContribution` | Partial |
| List money contributions | `/api/v1/fundraising/modules/:moduleId/donations` | `GET` | `fundraising.controller` | `fundraising.service` | `MoneyContribution` | OK |
| Donation detail | `/api/v1/fundraising/donations/:donationId` | `GET` | `fundraising.controller` | `fundraising.service` | `MoneyContribution` | OK |
| Verify contribution | `/api/v1/fundraising/donations/:donationId/verify` | `PATCH` | `fundraising.controller` | `fundraising.service` | `MoneyContribution`, `MoneyContributionTransaction` | Broken |
| Reject contribution | `/api/v1/fundraising/donations/:donationId/reject` | `PATCH` | `fundraising.controller` | `fundraising.service` | `MoneyContribution` | Broken |
| List transactions | `/api/v1/fundraising/transactions` | `GET` | `fundraising.controller` | `fundraising.service` | `MoneyContributionTransaction` | Broken |
| Attach transaction | `/api/v1/fundraising/transactions/:transactionId/attach-donation` | `PATCH` | `fundraising.controller` | `fundraising.service` | `MoneyContributionTransaction` | Broken |
| Unmatch transaction | `/api/v1/fundraising/transactions/:transactionId/unmatch` | `PATCH` | `fundraising.controller` | `fundraising.service` | `MoneyContributionTransaction` | Broken |
| Item contribution APIs | various | - | - | - | `ItemContribution`, `ItemContributionLine` | Missing |
| Organizer payment account APIs | various | - | - | - | `OrganizerPaymentAccount`, `PaymentProviderConfig` | Missing |
| Certificate templates list/create/update/deactivate | `/api/v1/certificates/templates...` | `GET/POST/PATCH/DELETE` | `certificates.controller` | `certificates.service` | `CertificateTemplate`, `CertificateTemplateVersion` | OK |
| Template versions / policy APIs | various | - | - | - | `CertificateTemplateVersion`, `CertificateIssuancePolicy` | Missing |
| Campaign certificate list | `/api/v1/certificates/campaigns/:campaignId` | `GET` | `certificates.controller` | `certificates.service` | `Certificate` | OK |
| Generate campaign certificates | `/api/v1/certificates/campaigns/:campaignId/generate` | `POST` | `certificates.controller` | `certificates.service` | `Certificate`, `CertificateSnapshot`, `CertificateAuditLog` | Partial |
| Render certificate | `/api/v1/certificates/:id/render` | `POST` | `certificates.controller` | `certificates.service` | `CertificateRenderJob` | OK |
| Download certificate | `/api/v1/certificates/:id/download` | `GET` | `certificates.controller` | `certificates.service` | `Certificate` | Partial |
| Revoke certificate | `/api/v1/certificates/:id/revoke` | `POST` | `certificates.controller` | `certificates.service` | `Certificate`, `CertificateAuditLog` | Partial |
| Reissue certificate | `/api/v1/certificates/:id/reissue` | `POST` | `certificates.controller` | `certificates.service` | `Certificate`, `CertificateSnapshot`, `CertificateAuditLog` | Partial |
| Public verify certificate | `/api/v1/public/certificates/verify/:code` | `GET` | `certificates.controller` | `certificates.service` | `CertificateVerificationLog` | OK |
| Render jobs / audit logs / digital signature metadata APIs | various | - | - | - | `CertificateRenderJob`, `CertificateAuditLog`, `CertificateDigitalSignature` | Missing |
| Notifications list | `/api/v1/notifications` | `GET` | `notifications.controller` | `notifications.service` | `ManagerNotification`, `StudentNotification` | OK |
| Mark one as read | `/api/v1/notifications/:id/read` | `PATCH` | `notifications.controller` | `notifications.service` | `ManagerNotification`, `StudentNotification` | OK |
| Mark all as read | `/api/v1/notifications/read-all` | `PATCH` | `notifications.controller` | `notifications.service` | `ManagerNotification`, `StudentNotification` | OK |
| Notifications unread count | `/api/v1/notifications/unread-count` | `GET` | - | - | `ManagerNotification`, `StudentNotification` | Missing |
| Public homepage stats | `/api/v1/public/...` | `GET` | - | - | aggregated | Missing |
| School overview report | `/api/v1/reports/school/overview` | `GET` | `reports.controller` | `catalog.service` | aggregated Prisma queries | OK |
| Campaign report | `/api/v1/reports/campaigns/:id` | `GET` | `reports.controller` | `catalog.service` | aggregated Prisma queries | OK |
| Campaign reconciliation | `/api/v1/reports/campaigns/:id/reconciliation` | `GET` | `reports.controller` | `catalog.service` | aggregated Prisma queries | OK |
| Locations | `/api/v1/locations` | `GET` | `locations.controller` | `locations.service` | none | Static |

## E. Transaction Review

| Nghiệp vụ | Có transaction chưa | Rủi ro | Đề xuất sửa |
| --- | --- | --- | --- |
| Tạo campaign + status history | No (`campaigns.service.ts:196-226`) | Tạo campaign xong nhưng fail khi ghi history | Gói `campaign.create` + `campaignStatusHistory.create` vào một `prisma.$transaction`. |
| Tạo campaign + tags + media + documents + modules | Missing feature | Không đủ nghiệp vụ create đầy đủ theo schema | Thiết kế DTO tổng và transaction nhiều bảng. |
| Tạo module + config | No (`campaigns.service.ts:246-362`) | Tạo `CampaignModule` xong nhưng fail ở config gây orphan module | Dùng transaction cho `CampaignModule` + config + targets. |
| Submit campaign + review request + status history | Yes (`campaigns.service.ts:383-409`) | Thấp | Giữ nguyên. |
| Transition approval + comment + status history | Partial (`campaigns.service.ts:522-559`) | Notification gửi ngoài transaction | Thêm outbox hoặc transaction-safe event. |
| Create event registration + notification | No (`events.service.ts:316-339`) | Có registration nhưng thiếu notification, hoặc ngược lại nếu retry sai | Bọc trong transaction. |
| Approve/reject registration + notification | No (`events.service.ts:359-380`, `405-425`) | Trạng thái và notification dễ lệch | Bọc trong transaction. |
| Check-in + cập nhật trạng thái tham gia | No (`events.service.ts:437-467`) | Check-in không gắn actor thật, không update registration state | Truyền actor từ request, transaction với `Checkin` + state. |
| Complete participation + checkout + notification | No (`events.service.ts:511-541`) | Checkout/update/notification có thể lệch nhau | Bọc transaction. |
| Create money contribution + transaction | No, transaction record chưa được tạo (`fundraising.service.ts:326-350`) | Flow payment không đầy đủ, không reconcile được từ lúc tạo donation | Tạo `MoneyContribution` + `MoneyContributionTransaction` trong cùng transaction nếu đã có intent/order. |
| Verify money contribution + transaction | Partial (`fundraising.service.ts:461-484`) | Notification ngoài transaction | Transaction cho DB là đúng; cân nhắc outbox cho notification. |
| Attach transaction -> donation | Yes (`fundraising.service.ts:597-616`) | Thấp | Giữ nguyên. |
| Unmatch transaction | No (`fundraising.service.ts:638-645`) | Transaction bị unmatch nhưng `MoneyContribution.paymentProviderTransactionId` vẫn giữ FK cũ | Cập nhật cả hai bảng trong transaction. |
| Reject money contribution | No (`fundraising.service.ts:667-675`) | Không có audit/notification, trạng thái payment link bị cắt rời | Bọc transaction và thêm notification/audit. |
| Generate certificate + snapshot + audit log | No (`certificates.service.ts:507-574`) | Partial writes từng bản ghi; fail giữa chừng tạo dữ liệu nửa vời | Transaction theo từng certificate hoặc batch transaction nhỏ. |
| Render certificate + render job + audit log | Yes (`certificates.service.ts:595-624`) | Thấp | Giữ nguyên. |
| Revoke certificate + audit log | No (`certificates.service.ts:665-686`) | Revoked nhưng thiếu audit hoặc ngược lại | Bọc transaction. |
| Reissue certificate + snapshot + audit log | No (`certificates.service.ts:706-746`) | Cấp lại nhưng fail audit/snapshot | Bọc transaction. |
| Verify certificate + verification log | Single write side-effect | Thấp | Có thể giữ nguyên. |

## F. Seed Review

### Đánh giá chung

- Seed chạy được bằng `pnpm prisma db seed`: **Đúng**
- Idempotent khi chạy lại: **Đúng ở mức chấp nhận được**
  - Cách làm hiện tại là `deleteMany` có kiểm soát + `createMany`/`create`/`upsert`.
  - Tôi đã chạy lại `pnpm prisma db seed` thành công sau khi DB đã có dữ liệu.
- Dùng tiếng Việt có dấu: **Đúng**
- Có dữ liệu liên kết thật giữa các bảng: **Đúng**
- Có đủ nhiều trạng thái nghiệp vụ để frontend test: **Đúng ở mức khá**
- Có dữ liệu nhạy cảm thật: **Không thấy**
  - Số tài khoản, `privateKeyRef`, token seed đều là demo.

### Dữ liệu đã có

- Faculties: 14 khoa.
- Users / ManagerAccounts:
  - 1 tài khoản `DOANTRUONG`
  - 14 tài khoản `LCD`
  - 10 tài khoản `CLB`
- Students: 12 sinh viên.
- Clubs: 10 CLB.
- Titles / StudentTitles: có seed.
- ClubMemberships: có seed trạng thái khác nhau.
- Files: avatar, cover, logo, docs, media, QR, certificate assets.
- Campaigns: có nhiều trạng thái `DRAFT`, `SUBMITTED`, `APPROVED`, `PUBLISHED`, `ONGOING`, `ENDED`.
- Review requests / comments / status histories: có seed.
- Modules / configs / item targets / payment accounts / provider configs: có seed.
- Registrations / checkins: có seed.
- Money contributions / transactions: có seed.
- Item contributions / item lines: có seed.
- Certificates / snapshots / render jobs / audit logs / verify logs / signing profile / digital signature: có seed.
- Manager notifications / student notifications: có seed.
- OAuth / refresh / reset / verify email tokens: có seed.

### Dữ liệu thiếu hoặc chỉ seed nhưng runtime yếu

- `ItemContribution` / `ItemContributionLine`: có seed nhưng không có API runtime quản lý.
- `Title` / `StudentTitle`: có seed nhưng không có API lấy/gán danh hiệu.
- `ClubMembership`: có seed nhưng không có API duyệt/đọc membership.
- `CertificateSigningProfile` / `CertificateDigitalSignature`: có seed nhưng không có API quản trị/tra cứu.

## G. Security / Permission Review

### Route cần auth và guard tốt

- `users`: `isAuth + restrictTo('DOANTRUONG')`
- `approvals`: `isAuth + restrictTo('DOANTRUONG')`
- `reports`: `isAuth + restrictTo('DOANTRUONG')`
- `certificates`: `isAuth + restrictTo('DOANTRUONG')`
- `admin/organizations`: `isAuth + restrictTo('DOANTRUONG')`

### Route public hợp lệ

- `public/campaigns`
- `public/campaigns/:slug`
- `public/certificates/verify/:code`

### Lỗi phân quyền còn tồn tại

1. `campaigns` chỉ dùng `isAuth`, không có role guard hay ownership guard ở route.
   - Evidence: `src/features/campaigns/campaigns.route.ts:7-16`
   - Hệ quả:
     - manager CLB này có thể publish/delete/chèn module vào campaign của đơn vị khác nếu đoán được `campaignId`;
     - student đăng nhập có thể gọi route rồi rơi vào lỗi logic không rõ ràng.

2. `events` chỉ dùng `isAuth`; các action quản trị như approve/reject/check-in/complete không nhận actor hay kiểm quyền.
   - Evidence:
     - route: `src/features/events/events.route.ts:7-33`
     - service: `src/features/events/events.service.ts:342-545`
   - Hệ quả:
     - bất kỳ user đã auth nào cũng có thể duyệt hoặc từ chối đăng ký, check-in, complete.

3. `fundraising` chỉ dùng `isAuth`; verify/reject/attach/unmatch/config update không có role/scope guard.
   - Evidence:
     - route: `src/features/fundraising/fundraising.route.ts:7-41`
     - service: `src/features/fundraising/fundraising.service.ts:444-680`
   - Hệ quả:
     - student có thể xác minh, từ chối hoặc rematch giao dịch của campaign.

4. Check-in event dùng manager đầu tiên trong DB thay vì actor đang gọi API.
   - Evidence: `src/features/events/events.service.ts:447-465`
   - Hệ quả:
     - audit trail sai;
     - dữ liệu check-in có thể bị giả mạo bởi bất kỳ user đã auth.

5. Scope theo khoa/CLB chưa được enforce.
   - Không thấy kiểm tra `managedClubId`, `facultyId`, `campaign.organizerManagerId` trước các action mutate chính.

### Đánh giá public certificate verify

- Chỉ trả tối thiểu `certificate_no`, `student_name`, `campaign_title`, `issued_at`, `status`.
- Không thấy lộ payload snapshot hay file private.
- Phần này **ổn**.

## H. Commands Result

| Command | Pass/fail | Lỗi chính | Cách sửa |
| --- | --- | --- | --- |
| `pnpm install` | Pass | Có warning về ignored build scripts | Nếu cần, chạy `pnpm approve-builds`; không chặn review hiện tại. |
| `pnpm prisma generate` | Pass | Không | - |
| `pnpm prisma db seed` | Pass | Không | - |
| `pnpm lint` | Fail | `prettier` không được cài nhưng script gọi `prettier --check .` | Thêm `prettier` vào `devDependencies` hoặc đổi script sang tool hiện có. |
| `pnpm tsc --noEmit` | Pass | Không | Nên thêm script `typecheck` chính thức vào `package.json`. |
| `pnpm build` | Pass | Không | - |
| `pnpm test -- --runInBand` | Pass | Jest phải `Force exiting` do open handles | Kiểm tra kết nối DB/SMTP/Supabase cleanup trong test, dù suite vẫn pass. |

## I. Required Fixes

### Critical

- Chặn ngay lỗ hổng phân quyền ở `campaigns`, `events`, `fundraising`.
  - Thêm role guard ở route.
  - Thêm ownership/scope check trong service theo `organizerManagerId`, `managedClubId`, `facultyId`.
- Sửa `checkInEventRegistration()` để dùng actor thực từ request thay vì manager đầu tiên trong DB.

### High

- Bọc transaction cho các flow nhiều bảng còn thiếu:
  - create campaign + history
  - create module + config + targets
  - create/approve/reject/complete registration + notification
  - revoke/reissue/generate certificate
- Hoàn thiện money contribution flow:
  - tạo `MoneyContributionTransaction` ngay khi tạo donation nếu business flow yêu cầu payment intent;
  - sửa `unmatch` để clear FK ở `MoneyContribution`.
- Bổ sung API còn thiếu cho frontend:
  - `GET /users/:userId`
  - students list/detail/update/titles
  - faculties list/detail
  - club memberships list/approve/reject
  - campaign update, module update/delete, tags/media/documents/history
  - item contributions create/list/detail
  - organizer payment accounts CRUD/list
  - notifications unread count
  - public homepage statistics
  - certificate versions/policies/audit/render jobs/signature metadata
- Hoàn thiện certificate policy engine:
  - hiện `generateCertificates()` chỉ lấy `ModuleRegistration.status = COMPLETED`, chưa dùng đúng `CertificateIssuancePolicy.ruleEngineType` cho `CONTRIBUTION_VERIFIED`, `ITEM_RECEIVED`, `MANUAL_APPROVAL`, `CUSTOM`.

### Medium

- Đưa `locations` sang Prisma hoặc tuyên bố rõ đây là static system catalog ngoài scope DB.
- Dọn legacy `*.data.ts` khỏi production tree hoặc chuyển sang `__test__/fixtures`.
- Chuẩn hóa repository layer nếu mục tiêu là giữ kiến trúc `controller -> service -> repository`.
- Thêm script `typecheck` và sửa `lint`.

### Low

- Làm rõ trong docs rằng review report cũ đã overstate mức độ “hoàn tất runtime”.
- Cân nhắc đổi tên `facultys.seed.ts` thành `faculties.seed.ts`.

## J. Suggested Patch Plan

1. Xóa mock runtime còn sót.
   - Quyết định dứt điểm `locations`: Prisma table hoặc loại khỏi cam kết “all runtime from DB”.
   - Dọn legacy `*.data.ts` khỏi production tree.

2. Hoàn thiện API còn thiếu.
   - `users/:id`
   - `students` admin APIs
   - `faculties`
   - `club memberships`
   - `campaign update / tags / media / documents / history / modules CRUD`
   - `item contributions`
   - `payment accounts`
   - `notifications/unread-count`
   - `public stats`
   - `certificate versions / policies / audit / jobs / signature metadata`

3. Sửa Prisma query / relation / transaction.
   - Guard theo role + scope.
   - Dùng transaction cho mọi flow nhiều bảng.
   - Sửa `fundraising.unmatch`.
   - Sửa event check-in actor.
   - Áp dụng policy engine thật cho certificate issuance.

4. Sửa seed.
   - Không cần đại tu lớn; chỉ cần giữ đồng bộ với API mới nếu thêm tables/flows.

5. Sửa test/build/typecheck.
   - Thêm `prettier` hoặc sửa `lint`.
   - Thêm script `typecheck`.
   - Giảm `Force exiting Jest` bằng cleanup handle.

6. Cập nhật report.
   - Sau khi vá các mục trên, cập nhật lại `database-runtime-completion-report.md` vì trạng thái hiện tại chưa đúng mức “complete”.
