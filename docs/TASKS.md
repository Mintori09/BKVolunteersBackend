# TASKS - BKVolunteers Backend

> **Ngày tạo:** 2026-04-18
> **Cập nhật lần cuối:** 2026-04-18
> **Trạng thái dự án:** Đang phát triển

---

## 📊 TỔNG QUAN TIẾN ĐỘ

| Chỉ số                   | Giá trị           |
| ------------------------ | ----------------- |
| **Tổng User Stories**    | 79 stories        |
| **Đã hoàn thành**        | 67 stories (~85%) |
| **Còn lại**              | 12 stories (~15%) |
| **Tổng Epic**            | 11 Epic           |
| **Epic hoàn thành 100%** | 8 Epic            |

---

## ✅ EPIC ĐÃ HOÀN THÀNH (8/11)

### E-01: Authentication & Authorization ✅ 100%

| ID     | User Story                           | Status        | API Endpoint                     |
| ------ | ------------------------------------ | ------------- | -------------------------------- |
| US-002 | Đăng nhập Student (MSSV + password)  | ✅ Hoàn thành | `POST /auth/login`               |
| US-004 | Đăng nhập User (username + password) | ✅ Hoàn thành | `POST /auth/login`               |
| US-005 | Đăng xuất                            | ✅ Hoàn thành | `POST /auth/logout`              |
| US-006 | Xem thông tin tài khoản hiện tại     | ✅ Hoàn thành | `GET /auth/me`                   |
| US-007 | Khôi phục mật khẩu qua email         | ✅ Hoàn thành | `POST /password/forgot-password` |
| US-009 | Refresh token                        | ✅ Hoàn thành | `POST /auth/refresh`             |
| US-003 | Đăng ký User với role                | ✅ Hoàn thành | (Admin seed)                     |

**Files triển khai:**

- `src/features/auth/auth.route.ts`
- `src/features/auth/auth.controller.ts`
- `src/features/auth/auth.service.ts`
- `src/features/auth/auth.repository.ts`
- `src/features/auth/auth.validation.ts`
- `src/features/forgotPassword/password.route.ts`

---

### E-02: Faculty Management ✅ 100%

| ID     | User Story                    | Status        | API Endpoint                |
| ------ | ----------------------------- | ------------- | --------------------------- |
| US-010 | Khoa tự động xác định từ MSSV | ✅ Hoàn thành | `GET /faculties/code/:code` |
| US-011 | Xem danh sách tất cả các khoa | ✅ Hoàn thành | `GET /faculties`            |
| US-012 | Xem thông tin chi tiết khoa   | ✅ Hoàn thành | `GET /faculties/:id`        |

**Files triển khai:**

- `src/features/faculty/faculty.controller.ts`
- `src/features/faculty/faculty.service.ts`
- `src/features/faculty/faculty.repository.ts`
- `src/features/faculty/faculty.validation.ts`

---

### E-03: Campaign Management ✅ 100%

| ID     | User Story                                 | Status        | API Endpoint                      |
| ------ | ------------------------------------------ | ------------- | --------------------------------- |
| US-013 | Tạo chiến dịch mới (Draft)                 | ✅ Hoàn thành | `POST /campaigns`                 |
| US-014 | Cập nhật thông tin chiến dịch              | ✅ Hoàn thành | `PUT /campaigns/:id`              |
| US-015 | Xóa chiến dịch đang Draft                  | ✅ Hoàn thành | `DELETE /campaigns/:id`           |
| US-016 | Gửi chiến dịch phê duyệt (DRAFT → PENDING) | ✅ Hoàn thành | `POST /campaigns/:id/submit`      |
| US-017 | Phê duyệt chiến dịch (PENDING → ACTIVE)    | ✅ Hoàn thành | `POST /campaigns/:id/approve`     |
| US-018 | Từ chối chiến dịch (PENDING → REJECTED)    | ✅ Hoàn thành | `POST /campaigns/:id/reject`      |
| US-019 | Hoàn thành chiến dịch (ACTIVE → COMPLETED) | ✅ Hoàn thành | `POST /campaigns/:id/complete`    |
| US-020 | Hủy chiến dịch (ACTIVE → CANCELLED)        | ✅ Hoàn thành | `POST /campaigns/:id/cancel`      |
| US-021 | Upload file kế hoạch                       | ✅ Hoàn thành | `POST /campaigns/:id/plan-file`   |
| US-022 | Upload file dự trù ngân sách               | ✅ Hoàn thành | `POST /campaigns/:id/budget-file` |
| US-023 | Xem danh sách chiến dịch có thể tham gia   | ✅ Hoàn thành | `GET /campaigns/available`        |
| US-024 | Xem danh sách chiến dịch với bộ lọc        | ✅ Hoàn thành | `GET /campaigns`                  |
| US-025 | Xem chi tiết chiến dịch                    | ✅ Hoàn thành | `GET /campaigns/:id`              |

**Files triển khai:**

- `src/features/campaign/campaign.route.ts`
- `src/features/campaign/campaign.controller.ts`
- `src/features/campaign/campaign.service.ts`
- `src/features/campaign/campaign.repository.ts`
- `src/features/campaign/campaign.validation.ts`
- `src/features/campaign/campaign.permission.ts`
- `src/features/campaign/campaign.status.ts`

---

### E-06: Event Participation ✅ 100%

| ID     | User Story                     | Status        | API Endpoint                                    |
| ------ | ------------------------------ | ------------- | ----------------------------------------------- |
| US-044 | Tạo giai đoạn sự kiện          | ✅ Hoàn thành | `POST /campaigns/:campaignId/events`            |
| US-045 | Cập nhật thông tin sự kiện     | ✅ Hoàn thành | `PUT /campaigns/:campaignId/events/:eventId`    |
| US-046 | Xóa giai đoạn sự kiện          | ✅ Hoàn thành | `DELETE /campaigns/:campaignId/events/:eventId` |
| US-047 | Xem các sự kiện của chiến dịch | ✅ Hoàn thành | `GET /campaigns/:campaignId/events`             |
| US-048 | Xem chi tiết sự kiện           | ✅ Hoàn thành | `GET /events/:eventId`                          |
| US-049 | Đăng ký tham gia sự kiện       | ✅ Hoàn thành | `POST /events/:eventId/register`                |
| US-050 | Hủy đăng ký tham gia sự kiện   | ✅ Hoàn thành | `DELETE /events/:eventId/register`              |
| US-051 | Xem danh sách đăng ký của tôi  | ✅ Hoàn thành | `GET /participants/me`                          |
| US-052 | Xem danh sách người đăng ký    | ✅ Hoàn thành | `GET /events/:eventId/participants`             |
| US-053 | Phê duyệt người đăng ký        | ✅ Hoàn thành | `POST /participants/:id/approve`                |
| US-054 | Từ chối người đăng ký          | ✅ Hoàn thành | `POST /participants/:id/reject`                 |
| US-055 | Check-in người tham gia        | ✅ Hoàn thành | `POST /participants/:id/check-in`               |
| US-056 | Gửi chứng nhận cá nhân         | ✅ Hoàn thành | `POST /participants/:id/certificate`            |
| US-057 | Gửi chứng nhận hàng loạt       | ✅ Hoàn thành | `POST /events/:eventId/certificates`            |

**Files triển khai:**

- `src/features/event/event.route.ts`
- `src/features/event/event.controller.ts`
- `src/features/event/event.service.ts`
- `src/features/event/event.repository.ts`
- `src/features/event/event.validation.ts`

---

### E-07: Gamification System ✅ 100%

| ID     | User Story                 | Status        | API Endpoint              |
| ------ | -------------------------- | ------------- | ------------------------- |
| US-058 | Xem tổng điểm rèn luyện    | ✅ Hoàn thành | `GET /students/me`        |
| US-059 | Xem lịch sử tích điểm      | ✅ Hoàn thành | `GET /students/me/points` |
| US-060 | Xem danh hiệu đã đạt       | ✅ Hoàn thành | `GET /students/me/titles` |
| US-061 | Cập nhật thông tin cá nhân | ✅ Hoàn thành | `PUT /students/me`        |
| US-062 | Tạo danh hiệu mới          | ✅ Hoàn thành | `POST /titles`            |
| US-063 | Cập nhật danh hiệu         | ✅ Hoàn thành | `PUT /titles/:id`         |
| US-064 | Xóa danh hiệu              | ✅ Hoàn thành | `DELETE /titles/:id`      |
| US-065 | Xem danh sách danh hiệu    | ✅ Hoàn thành | `GET /titles`             |
| US-066 | Xem thông tin sinh viên    | ✅ Hoàn thành | `GET /students/:id`       |

**Files triển khai:**

- `src/features/student/student.route.ts`
- `src/features/student/student.controller.ts`
- `src/features/student/student.service.ts`
- `src/features/student/student.repository.ts`
- `src/features/student/student.validation.ts`
- `src/features/title/title.route.ts`
- `src/features/title/title.controller.ts`
- `src/features/title/title.service.ts`
- `src/features/title/title.repository.ts`
- `src/features/gamification/gamification.service.ts`
- `src/features/gamification/pointTransaction.repository.ts`

---

### E-08: Club Management ✅ 100%

| ID     | User Story               | Status        | API Endpoint        |
| ------ | ------------------------ | ------------- | ------------------- |
| US-067 | Tạo câu lạc bộ mới       | ✅ Hoàn thành | `POST /clubs`       |
| US-068 | Cập nhật thông tin CLB   | ✅ Hoàn thành | `PUT /clubs/:id`    |
| US-069 | Xóa câu lạc bộ           | ✅ Hoàn thành | `DELETE /clubs/:id` |
| US-070 | Xem danh sách tất cả CLB | ✅ Hoàn thành | `GET /clubs`        |
| US-071 | Xem chi tiết CLB         | ✅ Hoàn thành | `GET /clubs/:id`    |

**Files triển khai:**

- `src/features/club/club.route.ts`
- `src/features/club/club.controller.ts`
- `src/features/club/club.service.ts`
- `src/features/club/club.repository.ts`
- `src/features/club/club.validation.ts`
- `src/features/club/tests/` (unit tests)

---

### E-11: File Management ✅ 100%

| ID     | User Story            | Status        | API Endpoint            |
| ------ | --------------------- | ------------- | ----------------------- |
| US-078 | Upload ảnh minh chứng | ✅ Hoàn thành | `POST /upload/image`    |
| US-079 | Upload tài liệu       | ✅ Hoàn thành | `POST /upload/document` |

**Files triển khai:**

- `src/features/upload/upload.route.ts`
- `src/features/upload/upload.controller.ts`
- `src/features/upload/upload.service.ts`
- `src/features/upload/upload.validation.ts`
- `src/features/upload/tests/upload.controller.test.ts`

---

## 🟡 EPIC ĐANG TRIỂN KHAI (2/11)

### E-04: Money Donation System 🟡 82%

| ID     | User Story                           | Status          | API Endpoint                                                |
| ------ | ------------------------------------ | --------------- | ----------------------------------------------------------- |
| US-026 | Tạo giai đoạn quyên góp tiền         | ✅ Hoàn thành   | `POST /campaigns/:campaignId/money-phases`                  |
| US-027 | Cập nhật giai đoạn quyên góp         | ✅ Hoàn thành   | `PUT /campaigns/:campaignId/money-phases/:phaseId`          |
| US-028 | Xóa giai đoạn quyên góp              | ✅ Hoàn thành   | `DELETE /campaigns/:campaignId/money-phases/:phaseId`       |
| US-030 | Xem tiến độ gây quỹ                  | ✅ Hoàn thành   | `GET /campaigns/:campaignId/money-phases/:phaseId/progress` |
| US-031 | Đóng góp tiền với ảnh minh chứng     | ✅ Hoàn thành   | `POST /donations/money`                                     |
| US-033 | Từ chối đóng góp với lý do           | ✅ Hoàn thành   | `POST /donations/:id/reject`                                |
| US-034 | Cập nhật số tiền thực tế             | ✅ Hoàn thành   | `PUT /donations/:id`                                        |
| US-035 | Xem lịch sử đóng góp                 | ✅ Hoàn thành   | `GET /donations/me`                                         |
| US-036 | Xem danh sách đóng góp của giai đoạn | ✅ Hoàn thành   | `GET /money-phases/:phaseId/donations`                      |
| US-032 | Xác thực đóng góp tiền và cộng điểm  | ⚠️ Cần kiểm tra | `POST /donations/:id/verify`                                |

**Files triển khai:**

- `src/features/money-donation/money-donation.route.ts`
- `src/features/money-donation/money-donation.controller.ts`
- `src/features/money-donation/money-donation.service.ts`
- `src/features/money-donation/money-donation.repository.ts`
- `src/features/money-donation/money-donation.validation.ts`
- `src/features/donation/donation.route.ts`
- `src/features/donation/donation.controller.ts`
- `src/features/donation/donation.service.ts`
- `src/features/donation/donation.repository.ts`

---

### E-05: Item Donation System 🟡 83%

| ID     | User Story                            | Status        | API Endpoint                                         |
| ------ | ------------------------------------- | ------------- | ---------------------------------------------------- |
| US-037 | Tạo giai đoạn quyên góp hiện vật      | ✅ Hoàn thành | `POST /campaigns/:campaignId/item-phases`            |
| US-038 | Cập nhật giai đoạn quyên góp hiện vật | ✅ Hoàn thành | `PUT /campaigns/:campaignId/item-phases/:phaseId`    |
| US-039 | Xóa giai đoạn quyên góp hiện vật      | ✅ Hoàn thành | `DELETE /campaigns/:campaignId/item-phases/:phaseId` |
| US-040 | Xem các giai đoạn quyên góp hiện vật  | ✅ Hoàn thành | `GET /campaigns/:campaignId/item-phases`             |
| US-041 | Đóng góp hiện vật                     | ✅ Hoàn thành | `POST /donations/items`                              |
| US-042 | Xác thực đóng góp hiện vật            | ✅ Hoàn thành | `POST /donations/:id/verify`                         |
| US-043 | Xem danh sách đóng góp hiện vật       | ✅ Hoàn thành | `GET /item-phases/:phaseId/donations`                |

**Files triển khai:**

- `src/features/item-phase/item-phase.route.ts`
- `src/features/item-phase/item-phase.controller.ts`
- `src/features/item-phase/item-phase.service.ts`
- `src/features/item-phase/item-phase.repository.ts`
- `src/features/item-phase/item-phase.validation.ts`
- `src/features/item-donation/item-donation.route.ts`
- `src/features/item-donation/item-donation.controller.ts`
- `src/features/item-donation/item-donation.service.ts`
- `src/features/item-donation/item-donation.repository.ts`

---

## 🔴 EPIC CHƯA TRIỂN KHAI (1/11)

### E-09: Notification System 🔴 0%

| ID     | User Story                       | Status             | API Endpoint                  |
| ------ | -------------------------------- | ------------------ | ----------------------------- |
| US-072 | Xem danh sách thông báo          | ❌ Chưa triển khai | `GET /notifications/me`       |
| US-073 | Đánh dấu thông báo đã đọc        | ❌ Chưa triển khai | `PUT /notifications/:id/read` |
| US-074 | Đánh dấu tất cả thông báo đã đọc | ❌ Chưa triển khai | `PUT /notifications/read-all` |

**Cần triển khai:**

- [ ] Tạo Prisma schema cho Notification
- [ ] Tạo notification.module
- [ ] Implement notification.service.ts
- [ ] Implement notification.controller.ts
- [ ] Implement notification.repository.ts
- [ ] Tích hợp gửi notification vào các service khác

---

### E-10: Statistics & Reporting 🔴 33%

| ID     | User Story                 | Status             | API Endpoint                    |
| ------ | -------------------------- | ------------------ | ------------------------------- |
| US-075 | Xem thống kê chiến dịch    | ✅ Hoàn thành      | `GET /campaigns/:id/statistics` |
| US-076 | Xem thống kê theo khoa     | ❌ Chưa triển khai | `GET /faculties/:id/statistics` |
| US-077 | Xem thống kê toàn hệ thống | ❌ Chưa triển khai | `GET /statistics/system`        |

**Cần triển khai:**

- [ ] US-076: Thống kê theo khoa
- [ ] US-077: Dashboard thống kê toàn hệ thống

---

## 📋 SPRINT BACKLOG - CÔNG VIỆC TIẾP THEO

### 🔴 Priority 1: KHẨN CẤP - Notification System

#### Task 1.1: Thiết kế Database Schema

```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  message     String
  type        String   // CAMPAIGN_APPROVED, CAMPAIGN_REJECTED, DONATION_VERIFIED, etc.
  referenceId String?  // ID của entity liên quan
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}
```

#### Task 1.2: Tạo Notification Module

- [ ] `src/features/notification/notification.route.ts`
- [ ] `src/features/notification/notification.controller.ts`
- [ ] `src/features/notification/notification.service.ts`
- [ ] `src/features/notification/notification.repository.ts`
- [ ] `src/features/notification/notification.validation.ts`
- [ ] `src/features/notification/types.ts`

#### Task 1.3: Implement US-072 - GET /notifications/me

```typescript
// GET /notifications/me
// Query params: page, limit, isRead
// Response: { data: Notification[], pagination }
```

#### Task 1.4: Implement US-073 - PUT /notifications/:id/read

```typescript
// PUT /notifications/:id/read
// Response: { success: true }
```

#### Task 1.5: Implement US-074 - PUT /notifications/read-all

```typescript
// PUT /notifications/read-all
// Response: { count: number }
```

#### Task 1.6: Tích hợp Notification Service

Cần tích hợp vào các service sau:

- [ ] Campaign Service: Gửi notification khi approve/reject campaign
- [ ] Donation Service: Gửi notification khi verify donation
- [ ] Event Service: Gửi notification khi approve/reject/check-in participant
- [ ] Gamification Service: Gửi notification khi đạt danh hiệu mới

---

### 🟡 Priority 2: CAO - Statistics Module

#### Task 2.1: US-076 - GET /faculties/:id/statistics

```typescript
// GET /faculties/:id/statistics
// Response: {
//   totalStudents: number,
//   totalCampaigns: number,
//   totalEvents: number,
//   totalDonations: number,
//   totalPoints: number
// }
```

#### Task 2.2: US-077 - GET /statistics/system

```typescript
// GET /statistics/system
// Response: {
//   totalStudents: number,
//   totalCampaigns: number,
//   activeCampaigns: number,
//   totalEvents: number,
//   totalDonations: { money: number, items: number },
//   topFaculties: FacultyStats[],
//   topClubs: ClubStats[]
// }
```

---

### 🟢 Priority 3: TRUNG BÌNH - Hoàn thiện & Testing

#### Task 3.1: Viết Unit Tests

- [ ] Auth module tests
- [ ] Campaign module tests
- [ ] Event module tests
- [ ] Donation module tests
- [ ] Student module tests

#### Task 3.2: Viết Integration Tests

- [ ] Auth flow integration test
- [ ] Campaign lifecycle integration test
- [ ] Event participation integration test
- [ ] Donation flow integration test

#### Task 3.3: API Documentation

- [ ] Cập nhật OpenAPI/Swagger documentation
- [ ] Thêm examples cho mỗi endpoint
- [ ] Tạo Postman collection

---

### 🟢 Priority 4: TỐI ƯU HÓA

#### Task 4.1: Performance Optimization

- [ ] Thêm caching cho các endpoint frequently accessed
- [ ] Optimize database queries với indexes
- [ ] Implement pagination cho tất cả list endpoints

#### Task 4.2: Security Enhancement

- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Audit logging

---

## 📈 METRICS & KPIs

### Velocity Tracking

| Sprint   | Planned | Completed | Velocity |
| -------- | ------- | --------- | -------- |
| Sprint 1 | -       | -         | -        |
| Sprint 2 | -       | -         | -        |

### Bug Tracking

| Severity | Open | In Progress | Resolved |
| -------- | ---- | ----------- | -------- |
| Critical | 0    | 0           | 0        |
| High     | 0    | 0           | 0        |
| Medium   | 0    | 0           | 0        |
| Low      | 0    | 0           | 0        |

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-deployment

- [ ] Tất cả tests pass
- [ ] Lint check pass
- [ ] Type check pass
- [ ] Environment variables configured
- [ ] Database migrations applied

### Deployment

- [ ] Build successful
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Monitoring configured

### Post-deployment

- [ ] Smoke tests pass
- [ ] Performance metrics within threshold
- [ ] Error rate within threshold

---

## 📞 CONTACTS

| Role              | Name | Responsibility             |
| ----------------- | ---- | -------------------------- |
| Tech Lead         | -    | Architecture & Code Review |
| Backend Developer | -    | API Development            |
| QA                | -    | Testing                    |

---

## 📝 CHANGELOG

### 2026-04-18

- Tạo TASKS.md
- Phân tích tiến độ dự án
- Xác định các task còn thiếu
- Lập kế hoạch sprint tiếp theo

---

**Last Updated:** 2026-04-18
**Next Review:** Weekly Sprint Review

