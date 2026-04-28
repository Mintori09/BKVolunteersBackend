# API SPEC
## 1. Mục tiêu refactor

Bản V2 này được tinh gọn theo 5 nguyên tắc:

1. **Campaign là resource trung tâm**
2. **Module là resource con của campaign**
3. **Activity page là public projection của module, không phải resource tách biệt hoàn toàn**
4. **Workflow actions dùng một chuẩn thống nhất**
5. **MVP ưu tiên luồng cốt lõi, các phần nâng cao chuyển sang Phase 2**

---

# 2. Chuẩn API chung

## 2.1 Base URL

```http
/api/v2
```

## 2.2 Response format

### Success

```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "meta": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 2.3 Pagination chuẩn

```http
?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

## 2.4 Search/filter chuẩn MVP

Chỉ giữ các filter lõi:

* `q`
* `status`
* `moduleType`
* `organizerType`
* `scope`
* `registrationOpen`
* `fromDate`
* `toDate`
* `sortBy`
* `sortOrder`

Ví dụ:

```http
/public/campaigns?q=mua%20he%20xanh&moduleType=VOLUNTEER_RECRUITMENT&status=PUBLISHED&sortBy=latest
```

---

# 3. Vai trò hệ thống

* `PUBLIC`
* `STUDENT`
* `CLB_MANAGER`
* `LCD_MANAGER`
* `DOANTRUONG_ADMIN`
* `SYSTEM`

---

# 4. Refactor kiến trúc API theo domain

Bản V2 gom lại còn 8 nhóm chính:

1. **Auth & Me**
2. **Public Discovery**
3. **Campaigns**
4. **Campaign Modules**
5. **Participation & Contributions**
6. **Review & Approval**
7. **Certificates**
8. **Files / Notifications / Reports**

---

# 5. AUTH & ME APIs

## 5.1 Authentication

| Method | Endpoint        | Role          | Mục đích                         |
| ------ | --------------- | ------------- | -------------------------------- |
| POST   | `/auth/login`   | PUBLIC        | Đăng nhập chung qua bảng `users` |
| POST   | `/auth/refresh` | PUBLIC        | Làm mới token                    |
| POST   | `/auth/logout`  | AUTHENTICATED | Đăng xuất                        |
| GET    | `/auth/me`      | AUTHENTICATED | Lấy identity hiện tại            |

### Request `POST /auth/login`

```json
{
  "identifier": "email | username | mssv",
  "password": "string"
}
```

---

## 5.2 Me / Profile

| Method | Endpoint                 | Role          | Mục đích                          |
| ------ | ------------------------ | ------------- | --------------------------------- |
| PATCH  | `/users/me`              | AUTHENTICATED | Cập nhật thông tin identity chung |
| PATCH  | `/students/me/profile`   | STUDENT       | Cập nhật hồ sơ sinh viên          |
| PATCH  | `/organizers/me/profile` | MANAGER       | Cập nhật hồ sơ đơn vị             |
| PATCH  | `/users/me/password`     | AUTHENTICATED | Đổi mật khẩu                      |
| PATCH  | `/users/me/avatar`       | AUTHENTICATED | Cập nhật avatar                   |

---

# 6. PUBLIC DISCOVERY APIs

## 6.1 Trang chủ và khám phá

| Method | Endpoint                                | Role   | Mục đích                     |
| ------ | --------------------------------------- | ------ | ---------------------------- |
| GET    | `/public/home`                          | PUBLIC | Dữ liệu trang chủ            |
| GET    | `/public/campaigns`                     | PUBLIC | Danh sách campaign công khai |
| GET    | `/public/campaigns/:campaignId`         | PUBLIC | Chi tiết campaign            |
| GET    | `/public/campaigns/:campaignId/updates` | PUBLIC | Feed cập nhật campaign       |

## 6.2 Hồ sơ đơn vị công khai

| Method | Endpoint                                    | Role   | Mục đích            |
| ------ | ------------------------------------------- | ------ | ------------------- |
| GET    | `/public/organizers/:organizerId`           | PUBLIC | Hồ sơ đơn vị        |
| GET    | `/public/organizers/:organizerId/campaigns` | PUBLIC | Campaign của đơn vị |

## 6.3 Activity Hub (3 tab)

Thay vì coi `activities` là resource độc lập hoàn toàn, coi đây là **public projection của modules**.

| Method | Endpoint                           | Role   | Mục đích                   |
| ------ | ---------------------------------- | ------ | -------------------------- |
| GET    | `/public/activities`               | PUBLIC | Trang hoạt động chung      |
| GET    | `/public/activities/fundraising`   | PUBLIC | Danh sách module gây quỹ   |
| GET    | `/public/activities/item-donation` | PUBLIC | Danh sách module hiện vật  |
| GET    | `/public/activities/volunteer`     | PUBLIC | Danh sách module tuyển TNV |
| GET    | `/public/modules/:moduleId`        | PUBLIC | Chi tiết public của module |

### Ghi chú refactor

Bỏ tách:

* `/public/activities/fundraising/:moduleId`
* `/public/activities/item-donation/:moduleId`
* `/public/activities/volunteer/:moduleId`

Thay bằng một endpoint chung:

* `GET /public/modules/:moduleId`

Frontend tự render theo `moduleType`.

---

# 7. CAMPAIGNS APIs

## 7.1 CRUD campaign container

| Method | Endpoint                         | Role           | Mục đích                      |
| ------ | -------------------------------- | -------------- | ----------------------------- |
| POST   | `/campaigns`                     | MANAGER        | Tạo campaign container        |
| GET    | `/campaigns`                     | MANAGER        | Danh sách campaign theo quyền |
| GET    | `/campaigns/:campaignId`         | MANAGER        | Chi tiết campaign             |
| PATCH  | `/campaigns/:campaignId`         | Owner/Admin    | Sửa campaign                  |
| DELETE | `/campaigns/:campaignId`         | Owner/Admin    | Xóa mềm draft campaign        |
| GET    | `/campaigns/:campaignId/preview` | Owner/Reviewer | Preview campaign page         |

---

## 7.2 Workflow actions của campaign

Refactor toàn bộ endpoint trạng thái sang một chuẩn duy nhất:

```http
POST /campaigns/:campaignId/actions/:action
```

### Các action hỗ trợ

* `ready-for-review`
* `submit-review`
* `publish`
* `start`
* `pause`
* `resume`
* `end`
* `archive`
* `cancel`

### Endpoint

| Method | Endpoint                                 | Role           | Mục đích                |
| ------ | ---------------------------------------- | -------------- | ----------------------- |
| POST   | `/campaigns/:campaignId/actions/:action` | Owner/Admin    | Đổi trạng thái campaign |
| GET    | `/campaigns/:campaignId/status-history`  | Owner/Reviewer | Lịch sử trạng thái      |

### Ví dụ

```http
POST /campaigns/123/actions/submit-review
POST /campaigns/123/actions/publish
POST /campaigns/123/actions/end
```

### Lợi ích

* thống nhất naming
* backend dễ viết state machine hơn
* frontend dễ bind action hơn

---

# 8. CAMPAIGN MODULES APIs

## 8.1 CRUD modules

| Method | Endpoint                                   | Role           | Mục đích         |
| ------ | ------------------------------------------ | -------------- | ---------------- |
| POST   | `/campaigns/:campaignId/modules`           | Owner          | Thêm module      |
| GET    | `/campaigns/:campaignId/modules`           | Owner/Reviewer | Danh sách module |
| GET    | `/campaigns/:campaignId/modules/:moduleId` | Owner/Reviewer | Chi tiết module  |
| PATCH  | `/campaigns/:campaignId/modules/:moduleId` | Owner          | Sửa module       |
| DELETE | `/campaigns/:campaignId/modules/:moduleId` | Owner          | Xóa module       |

## 8.2 Workflow actions của module

| Method | Endpoint                                                   | Role  | Mục đích              |
| ------ | ---------------------------------------------------------- | ----- | --------------------- |
| POST   | `/campaigns/:campaignId/modules/:moduleId/actions/:action` | Owner | Đổi trạng thái module |

### Action hỗ trợ

* `activate`
* `pause`
* `end`
* `cancel`

---

## 8.3 Module configuration

Thay vì tách quá nhiều route kiểu `volunteer-config`, `event-config`, giữ một chuẩn:

| Method | Endpoint                    | Role           | Mục đích                         |
| ------ | --------------------------- | -------------- | -------------------------------- |
| GET    | `/modules/:moduleId/config` | Owner/Reviewer | Lấy config theo loại module      |
| PUT    | `/modules/:moduleId/config` | Owner          | Cập nhật config theo loại module |

Backend tự xử lý theo `moduleType`.

### Riêng item targets vẫn nên tách

| Method | Endpoint                                    | Role        | Mục đích             |
| ------ | ------------------------------------------- | ----------- | -------------------- |
| POST   | `/modules/:moduleId/item-targets`           | Owner       | Thêm target hiện vật |
| GET    | `/modules/:moduleId/item-targets`           | PUBLIC/AUTH | Danh sách target     |
| PATCH  | `/modules/:moduleId/item-targets/:targetId` | Owner       | Sửa target           |
| DELETE | `/modules/:moduleId/item-targets/:targetId` | Owner       | Xóa target           |

---

# 9. PARTICIPATION & CONTRIBUTIONS APIs

Bản V2 gom toàn bộ “hành động của sinh viên” vào 3 resource lớn:

1. `registrations`
2. `money-contributions`
3. `item-contributions`

---

## 9.1 Registrations

| Method | Endpoint                                         | Role                        | Mục đích                 |
| ------ | ------------------------------------------------ | --------------------------- | ------------------------ |
| POST   | `/modules/:moduleId/registrations`               | STUDENT                     | Đăng ký tham gia         |
| GET    | `/modules/:moduleId/registrations`               | Owner/Reviewer              | Danh sách đăng ký        |
| GET    | `/registrations/:registrationId`                 | Owner/Reviewer/StudentOwner | Chi tiết đăng ký         |
| POST   | `/registrations/:registrationId/actions/:action` | Owner/StudentOwner          | Xử lý trạng thái đăng ký |

### Action hỗ trợ

* `approve`
* `waitlist`
* `reject`
* `cancel`
* `checkin`
* `mark-no-show`

### Bulk action

| Method | Endpoint                      | Role  | Mục đích        |
| ------ | ----------------------------- | ----- | --------------- |
| POST   | `/registrations/bulk-actions` | Owner | Xử lý hàng loạt |

---

## 9.2 Money contributions

### Realtime checkout

| Method | Endpoint                                          | Role                        | Mục đích               |
| ------ | ------------------------------------------------- | --------------------------- | ---------------------- |
| POST   | `/modules/:moduleId/money-contributions/checkout` | STUDENT                     | Tạo payment order/link |
| GET    | `/modules/:moduleId/money-contributions`          | Owner/Reviewer              | Danh sách đóng góp     |
| GET    | `/money-contributions/:contributionId`            | Owner/Reviewer/StudentOwner | Chi tiết               |

### Manual fallback

| Method | Endpoint                                               | Role           | Mục đích                       |
| ------ | ------------------------------------------------------ | -------------- | ------------------------------ |
| POST   | `/modules/:moduleId/money-contributions/manual`        | STUDENT        | Khai báo chuyển khoản thủ công |
| POST   | `/money-contributions/:contributionId/actions/:action` | Owner/Reviewer | Xử lý đóng góp thủ công        |

### Action hỗ trợ

* `verify`
* `reject`

### Realtime webhook

| Method | Endpoint                         | Role   | Mục đích             |
| ------ | -------------------------------- | ------ | -------------------- |
| POST   | `/integrations/payments/webhook` | SYSTEM | Nhận webhook payment |

### Refactor quan trọng

Bỏ:

* `/integrations/sepay/webhook`

Đổi thành trung tính hơn:

* `/integrations/payments/webhook`

để sau này đổi provider không phải phá route.

---

## 9.3 Item contributions

| Method | Endpoint                                              | Role                        | Mục đích                   |
| ------ | ----------------------------------------------------- | --------------------------- | -------------------------- |
| POST   | `/modules/:moduleId/item-contributions`               | STUDENT                     | Đăng ký quyên góp hiện vật |
| GET    | `/modules/:moduleId/item-contributions`               | Owner/Reviewer              | Danh sách hiện vật         |
| GET    | `/item-contributions/:contributionId`                 | Owner/Reviewer/StudentOwner | Chi tiết                   |
| POST   | `/item-contributions/:contributionId/actions/:action` | Owner                       | Xử lý hiện vật             |

### Action hỗ trợ

* `confirm-handover`
* `reject`

---

# 10. REVIEW & APPROVAL APIs

Refactor phần review thành 2 lớp:

1. review request
2. review actions/comments

## 10.1 Review request

| Method | Endpoint                                 | Role           | Mục đích                |
| ------ | ---------------------------------------- | -------------- | ----------------------- |
| POST   | `/campaigns/:campaignId/review-requests` | Owner          | Tạo request duyệt       |
| GET    | `/review-requests`                       | Reviewer/Admin | Hàng chờ duyệt          |
| GET    | `/review-requests/:reviewRequestId`      | Owner/Reviewer | Chi tiết review request |

## 10.2 Review comments

| Method | Endpoint                                     | Role            | Mục đích     |
| ------ | -------------------------------------------- | --------------- | ------------ |
| POST   | `/review-requests/:reviewRequestId/comments` | Owner/Reviewer  | Thêm comment |
| PATCH  | `/review-comments/:commentId`                | Author          | Sửa comment  |
| DELETE | `/review-comments/:commentId`                | Author/Reviewer | Xóa comment  |

## 10.3 Review actions

| Method | Endpoint                                            | Role             | Mục đích    |
| ------ | --------------------------------------------------- | ---------------- | ----------- |
| POST   | `/review-requests/:reviewRequestId/actions/:action` | DOANTRUONG_ADMIN | Xử lý duyệt |

### Action hỗ trợ

* `pre-approve`
* `final-approve`
* `request-revision`
* `reject`

---

# 11. CERTIFICATES APIs

Bản V2 giữ subsystem certificate nhưng gọn route hơn.

## 11.1 Templates & policies

| Method | Endpoint                                      | Role        | Mục đích           |
| ------ | --------------------------------------------- | ----------- | ------------------ |
| POST   | `/certificate-templates`                      | Owner/Admin | Tạo template       |
| GET    | `/certificate-templates`                      | Owner/Admin | Danh sách template |
| POST   | `/certificate-templates/:templateId/versions` | Owner/Admin | Tạo version        |
| GET    | `/certificate-templates/:templateId/versions` | Owner/Admin | Danh sách version  |
| POST   | `/certificate-policies`                       | Owner/Admin | Tạo policy         |
| GET    | `/certificate-policies`                       | Owner/Admin | Danh sách policy   |
| PATCH  | `/certificate-policies/:policyId`             | Owner/Admin | Sửa policy         |

## 11.2 Certificate lifecycle

| Method | Endpoint                                       | Role                  | Mục đích            |
| ------ | ---------------------------------------------- | --------------------- | ------------------- |
| POST   | `/certificates/issue`                          | Owner/System          | Tạo certificate     |
| GET    | `/certificates/:certificateId`                 | Owner/Recipient/Admin | Chi tiết            |
| GET    | `/certificates/:certificateId/download`        | Owner/Recipient       | Tải file            |
| GET    | `/certificates/:certificateId/audits`          | Owner/Admin           | Audit log           |
| POST   | `/certificates/:certificateId/actions/:action` | Owner/System/Admin    | Workflow chứng nhận |

### Action hỗ trợ

* `lock-snapshot`
* `render`
* `sign`
* `send-email`
* `revoke`
* `reissue`

## 11.3 Verify công khai

| Method | Endpoint                                | Role   | Mục đích         |
| ------ | --------------------------------------- | ------ | ---------------- |
| GET    | `/public/certificates/verify/:publicId` | PUBLIC | Verify công khai |

---

# 12. FILES APIs

## 12.1 Upload

| Method | Endpoint           | Role          | Mục đích        |
| ------ | ------------------ | ------------- | --------------- |
| POST   | `/files/images`    | AUTHENTICATED | Upload ảnh      |
| POST   | `/files/documents` | AUTHENTICATED | Upload tài liệu |
| POST   | `/files/templates` | AUTHENTICATED | Upload template |

## 12.2 Metadata & preview

| Method | Endpoint                 | Role       | Mục đích     |
| ------ | ------------------------ | ---------- | ------------ |
| GET    | `/files/:fileId`         | AUTHORIZED | Lấy metadata |
| GET    | `/files/:fileId/preview` | AUTHORIZED | Preview file |

### Refactor

Bỏ route trùng:

* `/campaigns/:campaignId/documents/:documentId/preview`

Frontend lấy:

1. document metadata
2. `fileId`
3. gọi `/files/:fileId/preview`

Như vậy preview được chuẩn hóa tại một chỗ.

---

# 13. NOTIFICATIONS APIs

| Method | Endpoint                              | Role          | Mục đích            |
| ------ | ------------------------------------- | ------------- | ------------------- |
| GET    | `/notifications`                      | AUTHENTICATED | Danh sách thông báo |
| GET    | `/notifications/unread-count`         | AUTHENTICATED | Số chưa đọc         |
| POST   | `/notifications/:notificationId/read` | AUTHENTICATED | Đánh dấu đã đọc     |
| POST   | `/notifications/read-all`             | AUTHENTICATED | Đọc tất cả          |

---

# 14. REPORTS APIs

Bản V2 refactor export nặng theo kiểu job.

## 14.1 Dashboard

| Method | Endpoint                             | Role             | Mục đích           |
| ------ | ------------------------------------ | ---------------- | ------------------ |
| GET    | `/admin/dashboard/overview`          | DOANTRUONG_ADMIN | Dashboard tổng     |
| GET    | `/admin/dashboard/campaigns/pending` | DOANTRUONG_ADMIN | Campaign chờ duyệt |
| GET    | `/admin/dashboard/campaigns/ongoing` | DOANTRUONG_ADMIN | Campaign đang chạy |
| GET    | `/admin/dashboard/top-organizers`    | DOANTRUONG_ADMIN | Đơn vị nổi bật     |

## 14.2 Reports

| Method | Endpoint                                 | Role             | Mục đích            |
| ------ | ---------------------------------------- | ---------------- | ------------------- |
| GET    | `/campaigns/:campaignId/reports/summary` | Owner/Reviewer   | Tổng kết campaign   |
| GET    | `/admin/reports/school`                  | DOANTRUONG_ADMIN | Báo cáo toàn trường |
| GET    | `/admin/reports/by-organizer`            | DOANTRUONG_ADMIN | Báo cáo theo đơn vị |
| GET    | `/admin/reports/by-campaign-type`        | DOANTRUONG_ADMIN | Báo cáo theo loại   |

## 14.3 Export jobs

| Method | Endpoint                         | Role                 | Mục đích              |
| ------ | -------------------------------- | -------------------- | --------------------- |
| POST   | `/exports`                       | Owner/Reviewer/Admin | Tạo job export        |
| GET    | `/exports/:exportJobId`          | Owner/Reviewer/Admin | Xem trạng thái export |
| GET    | `/exports/:exportJobId/download` | Owner/Reviewer/Admin | Tải file export       |

---

# 15. STUDENT PERSONAL APIs

## 15.1 Dashboard & history

| Method | Endpoint                     | Role    | Mục đích           |
| ------ | ---------------------------- | ------- | ------------------ |
| GET    | `/students/me/dashboard`     | STUDENT | Dashboard cá nhân  |
| GET    | `/students/me/registrations` | STUDENT | Lịch sử tham gia   |
| GET    | `/students/me/contributions` | STUDENT | Lịch sử đóng góp   |
| GET    | `/students/me/certificates`  | STUDENT | Chứng nhận của tôi |

## 15.2 Watchlist

| Method | Endpoint                             | Role    | Mục đích                    |
| ------ | ------------------------------------ | ------- | --------------------------- |
| GET    | `/students/me/watchlist`             | STUDENT | Danh sách campaign theo dõi |
| POST   | `/students/me/watchlist/:campaignId` | STUDENT | Theo dõi                    |
| DELETE | `/students/me/watchlist/:campaignId` | STUDENT | Bỏ theo dõi                 |

---

# 16. ORGANIZER SUPPORT APIs

## 16.1 Membership CLB

| Method | Endpoint                                          | Role        | Mục đích                 |
| ------ | ------------------------------------------------- | ----------- | ------------------------ |
| POST   | `/clubs/:clubId/memberships`                      | STUDENT     | Gửi yêu cầu tham gia CLB |
| GET    | `/clubs/:clubId/memberships`                      | CLB_MANAGER | Danh sách membership     |
| POST   | `/club-memberships/:membershipId/actions/:action` | CLB_MANAGER | Xử lý membership         |

### Action hỗ trợ

* `approve`
* `reject`
* `remove`

---

## 16.2 Organizer payment accounts

| Method | Endpoint                                                 | Role        | Mục đích                |
| ------ | -------------------------------------------------------- | ----------- | ----------------------- |
| POST   | `/organizer-payment-accounts`                            | MANAGER     | Tạo tài khoản nhận tiền |
| GET    | `/organizer-payment-accounts`                            | MANAGER     | Danh sách               |
| PATCH  | `/organizer-payment-accounts/:accountId`                 | Owner/Admin | Sửa                     |
| POST   | `/organizer-payment-accounts/:accountId/actions/:action` | Admin       | Xử lý trạng thái        |

### Action hỗ trợ

* `verify`
* `disable`

---

# 17. SETTINGS APIs – BẢN V2 GỌN HƠN

Phần settings trong bản cũ rất chi tiết. Trong V2, tôi khuyên gom lại 4 nhóm lớn.

## 17.1 Organizer settings

| Method | Endpoint                  | Role    | Mục đích                |
| ------ | ------------------------- | ------- | ----------------------- |
| GET    | `/organizers/me/settings` | MANAGER | Lấy cài đặt đơn vị      |
| PUT    | `/organizers/me/settings` | MANAGER | Cập nhật cài đặt đơn vị |

## 17.2 Student settings

| Method | Endpoint                | Role    | Mục đích                 |
| ------ | ----------------------- | ------- | ------------------------ |
| GET    | `/students/me/settings` | STUDENT | Lấy cài đặt cá nhân      |
| PUT    | `/students/me/settings` | STUDENT | Cập nhật cài đặt cá nhân |

## 17.3 Admin settings

| Method | Endpoint          | Role             | Mục đích                      |
| ------ | ----------------- | ---------------- | ----------------------------- |
| GET    | `/admin/settings` | DOANTRUONG_ADMIN | Lấy cấu hình toàn trường      |
| PUT    | `/admin/settings` | DOANTRUONG_ADMIN | Cập nhật cấu hình toàn trường |

## 17.4 Module settings

| Method | Endpoint                      | Role           | Mục đích                |
| ------ | ----------------------------- | -------------- | ----------------------- |
| GET    | `/modules/:moduleId/settings` | Owner/Reviewer | Lấy cài đặt module      |
| PUT    | `/modules/:moduleId/settings` | Owner          | Cập nhật cài đặt module |

### Lợi ích

* API gọn hơn
* giữ flexibility bằng payload theo `moduleType`
* không nổ quá nhiều endpoint settings ngay từ MVP