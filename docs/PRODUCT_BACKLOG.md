# PRODUCT BACKLOG - BKVolunteers

> **Ngày tạo:** 2026-04-09  
> **Dự án:** BKVolunteers - Hệ thống Quản lý Hoạt động Tình nguyện  
> **Tiêu chuẩn:** INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)

---

## 1. DANH SÁCH EPIC TỔNG QUÁT

| Epic ID | Tên Epic                           | Mô tả                                                                |
| ------- | ---------------------------------- | -------------------------------------------------------------------- |
| E-01    | **Authentication & Authorization** | Xác thực đăng ký/đăng nhập cho Student và User (CLB/LCD/Đoàn trường) |
| E-02    | **Faculty Management**             | Quản lý khoa, xác định khoa từ MSSV                                  |
| E-03    | **Campaign Management**            | Quản lý vòng đời chiến dịch (DRAFT → PENDING → ACTIVE → COMPLETED)   |
| E-04    | **Money Donation System**          | Hệ thống quyên góp tiền với mã QR                                    |
| E-05    | **Item Donation System**           | Hệ thống quyên góp hiện vật                                          |
| E-06    | **Event Participation**            | Đăng ký tham gia sự kiện, check-in, gửi chứng nhận                   |
| E-07    | **Gamification System**            | Hệ thống điểm, danh hiệu, chứng nhận                                 |
| E-08    | **Club Management**                | Quản lý câu lạc bộ                                                   |
| E-09    | **Notification System**            | Hệ thống thông báo                                                   |
| E-10    | **Statistics & Reporting**         | Thống kê và báo cáo                                                  |
| E-11    | **File Management**                | Quản lý upload file (ảnh, tài liệu)                                  |

---

## 2. BẢNG PRODUCT BACKLOG

### Epic E-01: Authentication & Authorization

| ID     | User Story                                                                                                                                | Priority | Est. | API Endpoint                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- | -------------------------------- |
| US-002 | As a **Student**, I want to **đăng nhập bằng MSSV và mật khẩu**, so that **tôi có thể truy cập tài khoản của mình**.                      | HIGH     | M    | `POST /auth/student/login`       |
| US-003 | As a **User (CLB/LCD/Đoàn trường)**, I want to **đăng ký tài khoản với role cụ thể**, so that **tôi có thể thực hiện quyền hạn phù hợp**. | HIGH     | M    | `POST /auth/user/register`       |
| US-004 | As a **User**, I want to **đăng nhập bằng username và mật khẩu**, so that **tôi có thể quản lý hoạt động**.                               | HIGH     | M    | `POST /auth/user/login`          |
| US-005 | As a **User**, I want to **đăng xuất khỏi hệ thống**, so that **tài khoản được bảo vệ an toàn**.                                          | MED      | S    | `POST /auth/logout`              |
| US-006 | As a **User**, I want to **xem thông tin tài khoản hiện tại**, so that **tôi biết thông tin cá nhân của mình**.                           | MED      | S    | `GET /auth/me`                   |
| US-007 | As a **User**, I want to **khôi phục mật khẩu qua email**, so that **tôi có thể lấy lại quyền truy cập khi quên mật khẩu**.               | MED      | M    | `POST /password/forgot-password` |
| US-009 | As a **User**, I want to **refresh token khi token hết hạn**, so that **tôi không cần đăng nhập lại**.                                    | LOW      | S    | `POST /auth/refresh`             |

### Epic E-02: Faculty Management

| ID     | User Story                                                                                                    | Priority | Est. | API Endpoint                |
| ------ | ------------------------------------------------------------------------------------------------------------- | -------- | ---- | --------------------------- |
| US-010 | As a **Student**, I want to **khoa được tự động xác định từ MSSV**, so that **tôi được phân loại đúng khoa**. | HIGH     | S    | `GET /faculties/code/:code` |
| US-011 | As a **User**, I want to **xem danh sách tất cả các khoa**, so that **tôi có thể chọn khoa khi đăng ký**.     | MED      | S    | `GET /faculties`            |
| US-012 | As a **User**, I want to **xem thông tin chi tiết của một khoa**, so that **tôi hiểu rõ về khoa đó**.         | LOW      | S    | `GET /faculties/:id`        |

### Epic E-03: Campaign Management

| ID     | User Story                                                                                                                                | Priority | Est. | API Endpoint                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- | --------------------------------- |
| US-013 | As a **CLB/LCD/Đoàn trường**, I want to **tạo chiến dịch mới (Draft)**, so that **tôi có thể lên kế hoạch hoạt động**.                    | HIGH     | M    | `POST /campaigns`                 |
| US-014 | As a **Creator**, I want to **cập nhật thông tin chiến dịch**, so that **tôi có thể điều chỉnh kế hoạch**.                                | HIGH     | S    | `PUT /campaigns/:id`              |
| US-015 | As a **Creator**, I want to **xóa chiến dịch đang Draft**, so that **tôi có thể hủy bỏ kế hoạch không phù hợp**.                          | MED      | S    | `DELETE /campaigns/:id`           |
| US-016 | As a **Creator**, I want to **gửi chiến dịch để phê duyệt (DRAFT → PENDING)**, so that **chiến dịch được xem xét duyệt**.                 | HIGH     | S    | `POST /campaigns/:id/submit`      |
| US-017 | As a **Đoàn trường**, I want to **phê duyệt chiến dịch (PENDING → ACTIVE)**, so that **chiến dịch có thể bắt đầu**.                       | HIGH     | S    | `POST /campaigns/:id/approve`     |
| US-018 | As a **Đoàn trường**, I want to **từ chối chiến dịch với lý do (PENDING → REJECTED)**, so that **người tạo biết lý do bị từ chối**.       | HIGH     | S    | `POST /campaigns/:id/reject`      |
| US-019 | As a **Creator**, I want to **đánh dấu chiến dịch hoàn thành (ACTIVE → COMPLETED)**, so that **chiến dịch kết thúc và gửi chứng nhận**.   | HIGH     | M    | `POST /campaigns/:id/complete`    |
| US-020 | As a **Creator**, I want to **hủy chiến dịch (ACTIVE → CANCELLED)**, so that **chiến dịch không thể tiếp tục**.                           | MED      | S    | `POST /campaigns/:id/cancel`      |
| US-021 | As a **Creator**, I want to **upload file kế hoạch (PDF/DOC)**, so that **phương án chiến dịch được lưu trữ**.                            | HIGH     | M    | `POST /campaigns/:id/plan-file`   |
| US-022 | As a **Creator**, I want to **upload file dự trù ngân sách (PDF/XLS)**, so that **chi phí được ghi nhận**.                                | HIGH     | M    | `POST /campaigns/:id/budget-file` |
| US-023 | As a **Student**, I want to **xem danh sách chiến dịch có thể tham gia**, so that **tôi có thể chọn hoạt động phù hợp**.                  | HIGH     | M    | `GET /campaigns/available`        |
| US-024 | As a **User**, I want to **xem danh sách chiến dịch với bộ lọc (status, scope, faculty)**, so that **tôi tìm được chiến dịch mong muốn**. | MED      | M    | `GET /campaigns`                  |
| US-025 | As a **User**, I want to **xem chi tiết một chiến dịch**, so that **tôi hiểu rõ thông tin chiến dịch**.                                   | MED      | S    | `GET /campaigns/:id`              |

### Epic E-04: Money Donation System

| ID     | User Story                                                                                                           | Priority | Est. | API Endpoint                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------- | -------- | ---- | ----------------------------------------------------------- |
| US-026 | As a **Creator**, I want to **tạo giai đoạn quyên góp tiền với mã QR**, so that **sinh viên có thể chuyển khoản**.   | HIGH     | M    | `POST /campaigns/:campaignId/money-phases`                  |
| US-027 | As a **Creator**, I want to **cập nhật thông tin giai đoạn quyên góp tiền**, so that **tôi điều chỉnh mục tiêu/QR**. | MED      | S    | `PUT /campaigns/:campaignId/money-phases/:phaseId`          |
| US-028 | As a **Creator**, I want to **xóa giai đoạn quyên góp tiền**, so that **tôi loại bỏ giai đoạn không cần thiết**.     | LOW      | S    | `DELETE /campaigns/:campaignId/money-phases/:phaseId`       |
| US-029 | As a **User**, I want to **xem các giai đoạn quyên góp tiền của chiến dịch**, so that **tôi biết cách đóng góp**.    | MED      | S    | `GET /campaigns/:campaignId/money-phases`                   |
| US-030 | As a **User**, I want to **xem tiến độ gây quỹ tiền**, so that **tôi biết bao nhiêu đã được quyên góp**.             | HIGH     | S    | `GET /campaigns/:campaignId/money-phases/:phaseId/progress` |
| US-031 | As a **Student**, I want to **đóng góp tiền với ảnh minh chứng**, so that **đóng góp của tôi được ghi nhận**.        | HIGH     | M    | `POST /donations/money`                                     |
| US-032 | As a **Creator**, I want to **xác thực đóng góp tiền và cộng điểm**, so that **sinh viên được ghi nhận điểm**.       | HIGH     | M    | `POST /donations/:id/verify`                                |
| US-033 | As a **Creator**, I want to **từ chối đóng góp với lý do**, so that **sinh viên biết lý do bị từ chối**.             | MED      | S    | `POST /donations/:id/reject`                                |
| US-034 | As a **Creator**, I want to **cập nhật số tiền thực tế khi xác thực**, so that **số tiền đúng với minh chứng**.      | MED      | S    | `PUT /donations/:id`                                        |
| US-035 | As a **Student**, I want to **xem lịch sử đóng góp của tôi**, so that **tôi theo dõi các hoạt động đã làm**.         | MED      | S    | `GET /donations/me`                                         |
| US-036 | As a **Creator**, I want to **xem danh sách đóng góp của một giai đoạn**, so that **tôi quản lý các đóng góp**.      | MED      | S    | `GET /money-phases/:phaseId/donations`                      |

### Epic E-05: Item Donation System

| ID     | User Story                                                                                                                                              | Priority | Est. | API Endpoint                                         |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- | ---------------------------------------------------- |
| US-037 | As a **Creator**, I want to **tạo giai đoạn quyên góp hiện vật với danh sách vật phẩm chấp nhận**, so that **sinh viên biết vật phẩm có thể đóng góp**. | HIGH     | M    | `POST /campaigns/:campaignId/item-phases`            |
| US-038 | As a **Creator**, I want to **cập nhật giai đoạn quyên góp hiện vật**, so that **tôi điều chỉnh vật phẩm/địa điểm**.                                    | MED      | S    | `PUT /campaigns/:campaignId/item-phases/:phaseId`    |
| US-039 | As a **Creator**, I want to **xóa giai đoạn quyên góp hiện vật**, so that **tôi loại bỏ giai đoạn không cần thiết**.                                    | LOW      | S    | `DELETE /campaigns/:campaignId/item-phases/:phaseId` |
| US-040 | As a **User**, I want to **xem các giai đoạn quyên góp hiện vật của chiến dịch**, so that **tôi biết cách đóng góp**.                                   | MED      | S    | `GET /campaigns/:campaignId/item-phases`             |
| US-041 | As a **Student**, I want to **đóng góp hiện vật với mô tả và ảnh minh chứng**, so that **đóng góp được ghi nhận**.                                      | HIGH     | M    | `POST /donations/items`                              |
| US-042 | As a **Creator**, I want to **xác thực đóng góp hiện vật**, so that **sinh viên được cộng điểm**.                                                       | HIGH     | S    | `POST /donations/:id/verify`                         |
| US-043 | As a **Creator**, I want to **xem danh sách đóng góp hiện vật của một giai đoạn**, so that **tôi quản lý các đóng góp**.                                | MED      | S    | `GET /item-phases/:phaseId/donations`                |

### Epic E-06: Event Participation

| ID     | User Story                                                                                                                             | Priority | Est. | API Endpoint                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- | ----------------------------------------------- |
| US-044 | As a **Creator**, I want to **tạo giai đoạn sự kiện với địa điểm, số lượng tối đa**, so that **sinh viên có thể đăng ký tham gia**.    | HIGH     | M    | `POST /campaigns/:campaignId/events`            |
| US-045 | As a **Creator**, I want to **cập nhật thông tin sự kiện**, so that **tôi điều chỉnh địa điểm/thời gian**.                             | MED      | S    | `PUT /campaigns/:campaignId/events/:eventId`    |
| US-046 | As a **Creator**, I want to **xóa giai đoạn sự kiện**, so that **tôi loại bỏ sự kiện không cần thiết**.                                | LOW      | S    | `DELETE /campaigns/:campaignId/events/:eventId` |
| US-047 | As a **User**, I want to **xem các sự kiện của chiến dịch**, so that **tôi biết lịch trình hoạt động**.                                | MED      | S    | `GET /campaigns/:campaignId/events`             |
| US-048 | As a **User**, I want to **xem chi tiết một sự kiện**, so that **tôi hiểu rõ thông tin sự kiện**.                                      | MED      | S    | `GET /events/:eventId`                          |
| US-049 | As a **Student**, I want to **đăng ký tham gia sự kiện**, so that **tôi có thể tham gia hoạt động**.                                   | HIGH     | M    | `POST /events/:eventId/register`                |
| US-050 | As a **Student**, I want to **hủy đăng ký tham gia sự kiện**, so that **tôi có thể rút lui khi không thể tham gia**.                   | MED      | S    | `DELETE /events/:eventId/register`              |
| US-051 | As a **Student**, I want to **xem danh sách đăng ký của tôi**, so that **tôi theo dõi các sự kiện đã đăng ký**.                        | MED      | S    | `GET /participants/me`                          |
| US-052 | As a **Creator**, I want to **xem danh sách người đăng ký với bộ lọc status**, so that **tôi quản lý người tham gia**.                 | HIGH     | M    | `GET /events/:eventId/participants`             |
| US-053 | As a **Creator**, I want to **phê duyệt người đăng ký (PENDING → APPROVED)**, so that **sinh viên được xác nhận tham gia**.            | HIGH     | S    | `POST /participants/:id/approve`                |
| US-054 | As a **Creator**, I want to **từ chối người đăng ký với lý do**, so that **sinh viên biết lý do bị từ chối**.                          | MED      | S    | `POST /participants/:id/reject`                 |
| US-055 | As a **Creator**, I want to **check-in người tham gia tại sự kiện**, so that **sinh viên được xác nhận có mặt**.                       | HIGH     | S    | `POST /participants/:id/check-in`               |
| US-056 | As a **Creator**, I want to **gửi chứng nhận cho một người tham gia qua email**, so that **sinh viên nhận được chứng nhận**.           | HIGH     | M    | `POST /participants/:id/certificate`            |
| US-057 | As a **Creator**, I want to **gửi chứng nhận hàng loạt cho tất cả người đã check-in**, so that **tất cả nhận chứng nhận nhanh chóng**. | HIGH     | M    | `POST /events/:eventId/certificates`            |

### Epic E-07: Gamification System

| ID     | User Story                                                                                                              | Priority | Est. | API Endpoint              |
| ------ | ----------------------------------------------------------------------------------------------------------------------- | -------- | ---- | ------------------------- |
| US-058 | As a **Student**, I want to **xem tổng điểm rèn luyện của mình**, so that **tôi biết mức độ đóng góp**.                 | HIGH     | S    | `GET /students/me`        |
| US-059 | As a **Student**, I want to **xem lịch sử tích điểm chi tiết**, so that **tôi biết điểm từ hoạt động nào**.             | MED      | S    | `GET /students/me/points` |
| US-060 | As a **Student**, I want to **xem danh hiệu đã đạt được**, so that **tôi tự hào về thành tựu**.                         | MED      | S    | `GET /students/me/titles` |
| US-061 | As a **Student**, I want to **cập nhật thông tin cá nhân**, so that **thông tin luôn chính xác**.                       | LOW      | S    | `PUT /students/me`        |
| US-062 | As a **Đoàn trường**, I want to **tạo danh hiệu mới với điểm yêu cầu**, so that **hệ thống gamification được mở rộng**. | MED      | M    | `POST /titles`            |
| US-063 | As a **Đoàn trường**, I want to **cập nhật danh hiệu**, so that **tôi điều chỉnh yêu cầu/tên**.                         | LOW      | S    | `PUT /titles/:id`         |
| US-064 | As a **Đoàn trường**, I want to **xóa danh hiệu**, so that **tôi loại bỏ danh hiệu không còn phù hợp**.                 | LOW      | S    | `DELETE /titles/:id`      |
| US-065 | As a **User**, I want to **xem danh sách tất cả danh hiệu**, so that **tôi biết các danh hiệu có thể đạt được**.        | MED      | S    | `GET /titles`             |
| US-066 | As a **Creator/Approver**, I want to **xem thông tin sinh viên**, so that **tôi hiểu về người tham gia**.               | MED      | S    | `GET /students/:id`       |

### Epic E-08: Club Management

| ID     | User Story                                                                                                         | Priority | Est. | API Endpoint        |
| ------ | ------------------------------------------------------------------------------------------------------------------ | -------- | ---- | ------------------- |
| US-067 | As a **Đoàn trường**, I want to **tạo câu lạc bộ mới với trưởng CLB**, so that **tổ chức hoạt động được mở rộng**. | MED      | M    | `POST /clubs`       |
| US-068 | As a **Đoàn trường/Trưởng CLB**, I want to **cập nhật thông tin CLB**, so that **thông tin luôn chính xác**.       | LOW      | S    | `PUT /clubs/:id`    |
| US-069 | As a **Đoàn trường**, I want to **xóa câu lạc bộ**, so that **tôi loại bỏ CLB không còn hoạt động**.               | LOW      | S    | `DELETE /clubs/:id` |
| US-070 | As a **User**, I want to **xem danh sách tất cả CLB**, so that **tôi biết các CLB trong hệ thống**.                | LOW      | S    | `GET /clubs`        |
| US-071 | As a **User**, I want to **xem chi tiết một CLB**, so that **tôi hiểu về CLB đó**.                                 | LOW      | S    | `GET /clubs/:id`    |

### Epic E-09: Notification System

| ID     | User Story                                                                                                      | Priority | Est. | API Endpoint                  |
| ------ | --------------------------------------------------------------------------------------------------------------- | -------- | ---- | ----------------------------- |
| US-072 | As a **User**, I want to **xem danh sách thông báo của tôi**, so that **tôi không bỏ lỡ thông tin quan trọng**. | MED      | M    | `GET /notifications/me`       |
| US-073 | As a **User**, I want to **đánh dấu thông báo đã đọc**, so that **tôi quản lý thông báo hiệu quả**.             | LOW      | S    | `PUT /notifications/:id/read` |
| US-074 | As a **User**, I want to **đánh dấu tất cả thông báo đã đọc**, so that **tôi xử lý nhanh nhiều thông báo**.     | LOW      | S    | `PUT /notifications/read-all` |

### Epic E-10: Statistics & Reporting

| ID     | User Story                                                                                                                     | Priority | Est. | API Endpoint                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | -------- | ---- | ------------------------------- |
| US-075 | As a **Creator/Approver**, I want to **xem thống kê chiến dịch (số tiền, người tham gia)**, so that **tôi đánh giá hiệu quả**. | MED      | M    | `GET /campaigns/:id/statistics` |
| US-076 | As a **LCD/Đoàn trường**, I want to **xem thống kê theo khoa**, so that **tôi đánh giá hoạt động khoa**.                       | LOW      | M    | `GET /faculties/:id/statistics` |
| US-077 | As a **Đoàn trường**, I want to **xem thống kê toàn hệ thống**, so that **tôi đánh giá tổng quan hệ thống**.                   | LOW      | M    | `GET /statistics/system`        |

### Epic E-11: File Management

| ID     | User Story                                                                                                        | Priority | Est. | API Endpoint            |
| ------ | ----------------------------------------------------------------------------------------------------------------- | -------- | ---- | ----------------------- |
| US-078 | As a **User**, I want to **upload ảnh minh chứng (JPG/PNG/WEBP)**, so that **tôi chứng minh hoạt động/đóng góp**. | HIGH     | M    | `POST /upload/image`    |
| US-079 | As a **User**, I want to **upload tài liệu (PDF/DOC/XLS)**, so that **tôi lưu trữ kế hoạch/báo cáo**.             | HIGH     | M    | `POST /upload/document` |

---

## 3. ACCEPTANCE CRITERIA (GHERKIN) - PRIORITY HIGH

### US-002: Đăng nhập Student

```gherkin
Feature: Student Login

Scenario: Đăng nhập thành công với MSSV và mật khẩu đúng
    Given tồn tại student với mssv "20110001" và password "Password123!"
    And email đã được xác thực
    When tôi gửi POST /auth/student/login với:
        | mssv     | "20110001"     |
        | password | "Password123!" |
    Then response status là 200
    And response chứa token JWT hợp lệ
    And response chứa thông tin student với mssv "20110001"
    And cookie "refresh_token" được set với HttpOnly

Scenario: Đăng nhập thất bại với MSSV không tồn tại
    Given không tồn tại student với mssv "99999999"
    When tôi gửi POST /auth/student/login với:
        | mssv     | "99999999"     |
        | password | "Password123!" |
    Then response status là 401
    And response error code là "UNAUTHORIZED"
    And response message là "MSSV hoặc mật khẩu không đúng"

Scenario: Đăng nhập thất bại với mật khẩu sai
    Given tồn tại student với mssv "20110001" và password "Password123!"
    When tôi gửi POST /auth/student/login với:
        | mssv     | "20110001"  |
        | password | "WrongPass" |
    Then response status là 401
    And response error code là "UNAUTHORIZED"
    And response message là "MSSV hoặc mật khẩu không đúng"

Scenario: Đăng nhập thất bại khi email chưa xác thực
    Given tồn tại student với mssv "20110001" và emailVerified là null
    When tôi gửi POST /auth/student/login với:
        | mssv     | "20110001"     |
        | password | "Password123!" |
    Then response status là 401
    And response error code là "UNAUTHORIZED"
    And response message là "Email chưa được xác thực"
```

### US-013: Tạo chiến dịch mới

```gherkin
Feature: Create Campaign

Scenario: CLB tạo chiến dịch cấp trường thành công
    Given tôi đã đăng nhập với role "CLB"
    When tôi gửi POST /campaigns với:
        | title       | "Chiến dịch Mùa Hè Xanh"    |
        | description | "Dọn rác bãi biển"          |
        | scope       | "TRUONG"                    |
    Then response status là 201
    And response chứa campaign với status "DRAFT"
    And campaign.creatorId là id của tôi

Scenario: LCD tạo chiến dịch cấp khoa thành công
    Given tôi đã đăng nhập với role "LCD" và facultyId 1
    When tôi gửi POST /campaigns với:
        | title       | "Chiến dịch Khoa CNTT"      |
        | description | "Hỗ trợ sinh viên năm nhất" |
        | scope       | "KHOA"                      |
        | facultyId   | 1                           |
    Then response status là 201
    And response chứa campaign với status "DRAFT" và facultyId 1

Scenario: Tạo chiến dịch thất bại khi scope=KHOA nhưng thiếu facultyId
    Given tôi đã đăng nhập với role "LCD"
    When tôi gửi POST /campaigns với:
        | title       | "Chiến dịch Khoa" |
        | description | "Mô tả"           |
        | scope       | "KHOA"            |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "facultyId là bắt buộc khi scope là KHOA"

Scenario: Student tạo chiến dịch thất bại
    Given tôi đã đăng nhập với role "Student"
    When tôi gửi POST /campaigns với dữ liệu hợp lệ
    Then response status là 403
    And response error code là "FORBIDDEN"
    And response message là "Bạn không có quyền tạo chiến dịch"

Scenario Outline: Tạo chiến dịch thất bại với dữ liệu không hợp lệ
    Given tôi đã đăng nhập với role "CLB"
    When tôi gửi POST /campaigns với:
        | title       | <title>       |
        | description | <description> |
        | scope       | <scope>       |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"

    Examples:
        | title | description | scope    |
        | ""    | "Mô tả"     | "TRUONG" |
        | "A"   | "Mô tả"     | "INVALID"|
```

### US-016: Gửi chiến dịch để phê duyệt

```gherkin
Feature: Submit Campaign for Approval

Scenario: Gửi phê duyệt thành công từ DRAFT → PENDING
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "DRAFT" và tôi là creator
    When tôi gửi POST /campaigns/abc123/submit
    Then response status là 200
    And campaign status được cập nhật thành "PENDING"
    And notification được gửi đến tất cả user với role "DOANTRUONG"

Scenario: Gửi phê duyệt thất bại khi chiến dịch không ở status DRAFT
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "ACTIVE"
    When tôi gửi POST /campaigns/abc123/submit
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chiến dịch không ở trạng thái DRAFT"

Scenario: Gửi phê duyệt thất bại khi không phải là creator
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại chiến dịch với id "abc123" của user khác
    When tôi gửi POST /campaigns/abc123/submit
    Then response status là 403
    And response error code là "FORBIDDEN"
    And response message là "Bạn không có quyền thực hiện hành động này"

Scenario: Gửi phê duyệt thất bại khi chiến dịch không tồn tại
    Given tôi đã đăng nhập với role "CLB"
    When tôi gửi POST /campaigns/notexist/submit
    Then response status là 404
    And response error code là "NOT_FOUND"
    And response message là "Không tìm thấy chiến dịch"
```

### US-017: Phê duyệt chiến dịch

```gherkin
Feature: Approve Campaign

Scenario: Đoàn trường phê duyệt chiến dịch thành công
    Given tôi đã đăng nhập với role "DOANTRUONG"
    And tồn tại chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/approve với:
        | comment | "Chiến dịch phù hợp, được phê duyệt" |
    Then response status là 200
    And campaign status được cập nhật thành "ACTIVE"
    And campaign.approverId là id của tôi
    And campaign.adminComment là "Chiến dịch phù hợp, được phê duyệt"
    And notification được gửi đến creator của chiến dịch

Scenario: Đoàn trường phê duyệt không có comment
    Given tôi đã đăng nhập với role "DOANTRUONG"
    And tồn tại chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/approve với body rỗng
    Then response status là 200
    And campaign status được cập nhật thành "ACTIVE"
    And campaign.adminComment là null

Scenario: Phê duyệt thất bại khi không phải Đoàn trường
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/approve
    Then response status là 403
    And response error code là "FORBIDDEN"
    And response message là "Chỉ Đoàn trường có quyền phê duyệt chiến dịch"

Scenario: Phê duyệt thất bại khi chiến dịch không ở status PENDING
    Given tôi đã đăng nhập với role "DOANTRUONG"
    And tồn tại chiến dịch với id "abc123" và status "DRAFT"
    When tôi gửi POST /campaigns/abc123/approve
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chiến dịch không ở trạng thái chờ phê duyệt"
```

### US-018: Từ chối chiến dịch

```gherkin
Feature: Reject Campaign

Scenario: Đoàn trường từ chối chiến dịch với lý do
    Given tôi đã đăng nhập với role "DOANTRUONG"
    And tồn tại chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/reject với:
        | comment | "Kế hoạch chưa chi tiết, cần bổ sung" |
    Then response status là 200
    And campaign status được cập nhật thành "REJECTED"
    And campaign.adminComment là "Kế hoạch chưa chi tiết, cần bổ sung"
    And notification được gửi đến creator

Scenario: Từ chối thất bại khi thiếu lý do (comment)
    Given tôi đã đăng nhập với role "DOANTRUONG"
    And tồn tại chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/reject với body rỗng
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Lý do từ chối là bắt buộc"

Scenario: Từ chối thất bại khi không phải Đoàn trường
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/reject với:
        | comment | "Lý do" |
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-019: Hoàn thành chiến dịch

```gherkin
Feature: Complete Campaign

Scenario: Creator đánh dấu chiến dịch hoàn thành với ảnh sự kiện
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "ACTIVE" và tôi là creator
    When tôi gửi POST /campaigns/abc123/complete với:
        | eventPhotos | ["https://storage/img1.jpg", "https://storage/img2.jpg"] |
    Then response status là 200
    And campaign status được cập nhật thành "COMPLETED"
    And eventPhotos được lưu vào database

Scenario: Hoàn thành chiến dịch thất bại khi chiến dịch không ở status ACTIVE
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "PENDING"
    When tôi gửi POST /campaigns/abc123/complete
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chiến dịch không ở trạng thái hoạt động"

Scenario: Hoàn thành chiến dịch thất bại khi không phải creator
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại chiến dịch với id "abc123" của user khác và status "ACTIVE"
    When tôi gửi POST /campaigns/abc123/complete
    Then response status là 403
    And response error code là "FORBIDDEN"
    And response message là "Chỉ người tạo mới có thể hoàn thành chiến dịch"
```

### US-021: Upload file kế hoạch

```gherkin
Feature: Upload Plan File

Scenario: Upload file kế hoạch thành công (PDF)
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "DRAFT"
    When tôi gửi POST /campaigns/abc123/plan-file với multipart/form-data:
        | file | "plan.pdf" (Content-Type: application/pdf) |
    Then response status là 200
    And campaign.planFileUrl được cập nhật với URL của file
    And file được lưu trữ trong hệ thống

Scenario: Upload file kế hoạch thành công (DOCX)
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "DRAFT"
    When tôi gửi POST /campaigns/abc123/plan-file với multipart/form-data:
        | file | "plan.docx" (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document) |
    Then response status là 200
    And campaign.planFileUrl được cập nhật

Scenario: Upload thất bại khi file không đúng định dạng
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/plan-file với multipart/form-data:
        | file | "image.jpg" (Content-Type: image/jpeg) |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chỉ chấp nhận file PDF, DOC, DOCX"

Scenario: Upload thất bại khi file quá lớn
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/plan-file với file kích thước 15MB
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Kích thước file không được vượt quá 10MB"

Scenario: Upload thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại chiến dịch với id "abc123" của user khác
    When tôi gửi POST /campaigns/abc123/plan-file với file hợp lệ
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-026: Tạo giai đoạn quyên góp tiền

```gherkin
Feature: Create Money Donation Phase

Scenario: Tạo giai đoạn quyên góp tiền thành công
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "DRAFT"
    When tôi gửi POST /campaigns/abc123/money-phases với:
        | targetAmount | 5000000                                      |
        | qrImageUrl   | "https://storage/qr.png"                     |
        | startDate    | "2025-06-01T00:00:00Z"                       |
        | endDate      | "2025-06-30T23:59:59Z"                       |
    Then response status là 201
    And moneyPhase được tạo với:
        | targetAmount  | 5000000                |
        | currentAmount | 0                      |
        | qrImageUrl    | "https://storage/qr.png" |

Scenario: Tạo giai đoạn thất bại khi endDate trước startDate
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/money-phases với:
        | targetAmount | 5000000                    |
        | startDate    | "2025-06-30T00:00:00Z"     |
        | endDate      | "2025-06-01T00:00:00Z"      |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Ngày kết thúc phải sau ngày bắt đầu"

Scenario: Tạo giai đoạn thất bại với targetAmount âm
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/money-phases với:
        | targetAmount | -1000000                    |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Số tiền mục tiêu phải lớn hơn 0"

Scenario: Tạo giai đoạn thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại chiến dịch với id "abc123" của user khác
    When tôi gửi POST /campaigns/abc123/money-phases với dữ liệu hợp lệ
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-030: Xem tiến độ gây quỹ tiền

```gherkin
Feature: Get Money Donation Progress

Scenario: Xem tiến độ gây quỹ thành công
    Given tồn tại moneyPhase với id 1:
        | targetAmount  | 5000000 |
        | currentAmount | 2500000 |
    And có 10 donation đã verified
    When tôi gửi GET /campaigns/abc123/money-phases/1/progress
    Then response status là 200
    And response data chứa:
        | targetAmount   | 5000000   |
        | currentAmount  | 2500000   |
        | percentage     | 50        |
        | donationsCount | 10        |

Scenario: Xem tiến độ với currentAmount = 0
    Given tồn tại moneyPhase với id 1:
        | targetAmount  | 5000000 |
        | currentAmount | 0       |
    When tôi gửi GET /campaigns/abc123/money-phases/1/progress
    Then response status là 200
    And response data.percentage là 0
    And response data.donationsCount là 0

Scenario: Xem tiến độ thất bại khi moneyPhase không tồn tại
    When tôi gửi GET /campaigns/abc123/money-phases/999/progress
    Then response status là 404
    And response error code là "NOT_FOUND"
```

### US-031: Đóng góp tiền

```gherkin
Feature: Create Money Donation

Scenario: Đóng góp tiền thành công với ảnh minh chứng
    Given tôi đã đăng nhập với role "Student"
    And tồn tại moneyPhase với id 1 thuộc chiến dịch status "ACTIVE"
    When tôi gửi POST /donations/money với:
        | moneyPhaseId   | 1                                    |
        | amount         | 100000                               |
        | proofImageUrl  | "https://storage/proof.jpg"          |
    Then response status là 201
    And donation được tạo với:
        | studentId      | <my id>    |
        | amount         | 100000     |
        | status         | PENDING    |
    And notification được gửi đến creator của chiến dịch

Scenario: Đóng góp tiền thành công không có ảnh minh chứng
    Given tôi đã đăng nhập với role "Student"
    And tồn tại moneyPhase với id 1 thuộc chiến dịch status "ACTIVE"
    When tôi gửi POST /donations/money với:
        | moneyPhaseId | 1      |
        | amount       | 50000  |
    Then response status là 201
    And donation.proofImageUrl là null

Scenario: Đóng góp thất bại khi chiến dịch không ACTIVE
    Given tôi đã đăng nhập với role "Student"
    And tồn tại moneyPhase với id 1 thuộc chiến dịch status "DRAFT"
    When tôi gửi POST /donations/money với:
        | moneyPhaseId | 1      |
        | amount       | 100000 |
    Then response status là 400
    And response error code là "CAMPAIGN_NOT_ACTIVE"
    And response message là "Chiến dịch không ở trạng thái hoạt động"

Scenario: Đóng góp thất bại khi moneyPhase không tồn tại
    Given tôi đã đăng nhập với role "Student"
    When tôi gửi POST /donations/money với:
        | moneyPhaseId | 999    |
        | amount       | 100000 |
    Then response status là 404
    And response error code là "NOT_FOUND"
    And response message là "Không tìm thấy giai đoạn quyên góp"

Scenario: Đóng góp thất bại với số tiền âm
    Given tôi đã đăng nhập với role "Student"
    And tồn tại moneyPhase với id 1
    When tôi gửi POST /donations/money với:
        | moneyPhaseId | 1       |
        | amount       | -50000  |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Số tiền phải lớn hơn 0"

Scenario: Đóng góp thất bại khi Student không thuộc khoa (scope KHOA)
    Given tôi đã đăng nhập với role "Student" và facultyId 2
    And tồn tại moneyPhase với id 1 thuộc chiến dịch scope "KHOA" facultyId 1
    When tôi gửi POST /donations/money với:
        | moneyPhaseId | 1      |
        | amount       | 100000 |
    Then response status là 403
    And response error code là "FACULTY_MISMATCH"
    And response message là "Sinh viên không thuộc khoa được chỉ định"
```

### US-032: Xác thực đóng góp tiền

```gherkin
Feature: Verify Money Donation

Scenario: Xác thực đóng góp tiền thành công và cộng điểm
    Given tôi đã đăng nhập với role "CLB" và là creator của chiến dịch
    And tồn tại donation với id "don123":
        | status        | PENDING |
        | amount        | 100000  |
        | studentId     | "stu1"  |
    And student "stu1" có totalPoints = 50
    And điểm cho đóng góp tiền = 10 điểm mỗi 100000 VND
    When tôi gửi POST /donations/don123/verify
    Then response status là 200
    And donation.status được cập nhật thành "VERIFIED"
    And student "stu1" totalPoints = 60
    And notification được gửi đến student "stu1"
    And moneyPhase.currentAmount được cộng thêm 100000

Scenario: Xác thực thất bại khi donation không ở status PENDING
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại donation với id "don123" và status "VERIFIED"
    When tôi gửi POST /donations/don123/verify
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Đóng góp đã được xử lý"

Scenario: Xác thực thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại donation với id "don123" thuộc chiến dịch của user khác
    When tôi gửi POST /donations/don123/verify
    Then response status là 403
    And response error code là "FORBIDDEN"
    And response message là "Chỉ người tạo chiến dịch mới có thể xác thực"

Scenario: Xác thực thất bại khi donation không tồn tại
    Given tôi đã đăng nhập với role "CLB"
    When tôi gửi POST /donations/notexist/verify
    Then response status là 404
    And response error code là "NOT_FOUND"
```

### US-044: Tạo giai đoạn sự kiện

```gherkin
Feature: Create Event Phase

Scenario: Tạo sự kiện thành công với đầy đủ thông tin
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123" và status "DRAFT"
    When tôi gửi POST /campaigns/abc123/events với:
        | location          | "Hội trường A, trường ĐH"     |
        | maxParticipants   | 100                           |
        | registrationStart | "2025-05-01T00:00:00Z"        |
        | registrationEnd   | "2025-05-15T23:59:59Z"        |
        | eventStart        | "2025-06-01T08:00:00Z"        |
        | eventEnd          | "2025-06-01T17:00:00Z"        |
    Then response status là 201
    And event được tạo với:
        | location        | "Hội trường A, trường ĐH" |
        | maxParticipants | 100                        |

Scenario: Tạo sự kiện thất bại khi registrationEnd sau eventStart
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/events với:
        | registrationStart | "2025-05-01T00:00:00Z" |
        | registrationEnd   | "2025-06-02T00:00:00Z"  |
        | eventStart        | "2025-06-01T08:00:00Z"  |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Hạn đăng ký phải trước ngày diễn ra sự kiện"

Scenario: Tạo sự kiện thất bại khi eventEnd trước eventStart
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/events với:
        | eventStart | "2025-06-01T17:00:00Z" |
        | eventEnd   | "2025-06-01T08:00:00Z"  |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Thời gian kết thúc phải sau thời gian bắt đầu"

Scenario: Tạo sự kiện thất bại với maxParticipants = 0
    Given tôi đã đăng nhập với role "CLB"
    And tôi có chiến dịch với id "abc123"
    When tôi gửi POST /campaigns/abc123/events với:
        | maxParticipants | 0 |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Số lượng tối đa phải lớn hơn 0"

Scenario: Tạo sự kiện thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại chiến dịch với id "abc123" của user khác
    When tôi gửi POST /campaigns/abc123/events với dữ liệu hợp lệ
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-049: Đăng ký tham gia sự kiện

```gherkin
Feature: Register for Event

Scenario: Đăng ký tham gia sự kiện thành công
    Given tôi đã đăng nhập với role "Student"
    And tồn tại event với id 1:
        | maxParticipants   | 100                     |
        | registrationStart | "2025-05-01T00:00:00Z"  |
        | registrationEnd   | "2025-05-30T23:59:59Z"  |
        | campaign.status   | ACTIVE                  |
    Và hiện tại là "2025-05-15T10:00:00Z"
    And số người đã đăng ký APPROVED là 50
    When tôi gửi POST /events/1/register
    Then response status là 201
    And participant được tạo với:
        | studentId   | <my id>   |
        | eventId     | 1         |
        | status      | PENDING   |
        | isCheckedIn | false     |
    And notification được gửi đến creator

Scenario: Đăng ký thất bại khi đã hết hạn đăng ký
    Given tôi đã đăng nhập với role "Student"
    And tồn tại event với id 1:
        | registrationEnd | "2025-05-01T23:59:59Z" |
    Và hiện tại là "2025-05-15T10:00:00Z"
    When tôi gửi POST /events/1/register
    Then response status là 400
    And response error code là "REGISTRATION_CLOSED"
    And response message là "Đã hết hạn đăng ký"

Scenario: Đăng ký thất bại khi đã đủ số lượng tham gia
    Given tôi đã đăng nhập với role "Student"
    And tồn tại event với id 1:
        | maxParticipants | 100 |
    And số người đã APPROVED + PENDING là 100
    When tôi gửi POST /events/1/register
    Then response status là 400
    And response error code là "MAX_PARTICIPANTS_REACHED"
    And response message là "Đã đủ số lượng tham gia"

Scenario: Đăng ký thất bại khi đã đăng ký sự kiện này rồi
    Given tôi đã đăng nhập với role "Student"
    And tôi đã đăng ký event với id 1
    When tôi gửi POST /events/1/register
    Then response status là 400
    And response error code là "ALREADY_REGISTERED"
    And response message là "Bạn đã đăng ký sự kiện này"

Scenario: Đăng ký thất bại khi Student không thuộc khoa (scope KHOA)
    Given tôi đã đăng nhập với role "Student" và facultyId 2
    And tồn tại event với id 1 thuộc chiến dịch scope "KHOA" facultyId 1
    When tôi gửi POST /events/1/register
    Then response status là 403
    And response error code là "FACULTY_MISMATCH"
    And response message là "Sinh viên không thuộc khoa được chỉ định"

Scenario: Đăng ký thất bại khi chiến dịch không ACTIVE
    Given tôi đã đăng nhập với role "Student"
    And tồn tại event với id 1 thuộc chiến dịch status "PENDING"
    When tôi gửi POST /events/1/register
    Then response status là 400
    And response error code là "CAMPAIGN_NOT_ACTIVE"
    And response message là "Chiến dịch không ở trạng thái hoạt động"

Scenario: Đăng ký thất bại khi event không tồn tại
    Given tôi đã đăng nhập với role "Student"
    When tôi gửi POST /events/999/register
    Then response status là 404
    And response error code là "NOT_FOUND"
    And response message là "Không tìm thấy sự kiện"
```

### US-052: Xem danh sách người đăng ký

```gherkin
Feature: Get Participants by Event

Scenario: Xem danh sách participant với filter status
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại event với id 1 thuộc chiến dịch của tôi
    And event có:
        | 5 participants với status PENDING   |
        | 10 participants với status APPROVED  |
        | 2 participants với status REJECTED  |
    When tôi gửi GET /events/1/participants?status=PENDING
    Then response status là 200
    And response data chứa 5 participants
    And mỗi participant có status PENDING

Scenario: Xem danh sách tất cả participant không filter
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại event với id 1 thuộc chiến dịch của tôi
    And event có tổng 17 participants
    When tôi gửi GET /events/1/participants
    Then response status là 200
    And response data chứa 17 participants

Scenario: Xem danh sách với phân trang
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại event với 50 participants
    When tôi gửi GET /events/1/participants?page=2&limit=10
    Then response status là 200
    And response data chứa 10 participants
    And response meta chứa:
        | total      | 50 |
        | page       | 2  |
        | limit      | 10 |
        | totalPages | 5  |

Scenario: Xem danh sách thất bại khi không phải creator/approver
    Given tôi đã đăng nhập với role "Student"
    And tồn tại event với id 1
    When tôi gửi GET /events/1/participants
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-055: Check-in participant

```gherkin
Feature: Check-in Participant

Scenario: Check-in thành công cho participant APPROVED
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại participant với id "part123":
        | status      | APPROVED   |
        | isCheckedIn | false      |
    When tôi gửi POST /participants/part123/check-in
    Then response status là 200
    And participant.isCheckedIn được cập nhật thành true
    And notification được gửi đến student

Scenario: Check-in thất bại khi participant không ở status APPROVED
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại participant với id "part123" và status "PENDING"
    When tôi gửi POST /participants/part123/check-in
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chỉ có thể check-in cho người đã được phê duyệt"

Scenario: Check-in thất bại khi đã check-in rồi
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại participant với id "part123":
        | status      | APPROVED |
        | isCheckedIn | true     |
    When tôi gửi POST /participants/part123/check-in
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Người này đã được check-in"

Scenario: Check-in thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại participant thuộc chiến dịch của user khác
    When tôi gửi POST /participants/part123/check-in
    Then response status là 403
    And response error code là "FORBIDDEN"

Scenario: Check-in thất bại khi participant không tồn tại
    Given tôi đã đăng nhập với role "CLB"
    When tôi gửi POST /participants/notexist/check-in
    Then response status là 404
    And response error code là "NOT_FOUND"
```

### US-056: Gửi chứng nhận cho participant

```gherkin
Feature: Send Certificate to Participant

Scenario: Gửi chứng nhận thành công qua email
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại participant với id "part123":
        | status      | APPROVED   |
        | isCheckedIn | true       |
        | studentId   | "stu1"     |
    And student "stu1" có email "student@email.com"
    When tôi gửi POST /participants/part123/certificate với:
        | certificateUrl | "https://storage/cert.pdf" |
    Then response status là 200
    And participant.certificateUrl được cập nhật
    And email chứng nhận được gửi đến "student@email.com"
    And student "stu1" được cộng điểm rèn luyện
    And notification được gửi đến student

Scenario: Gửi chứng nhận thất bại khi participant chưa check-in
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại participant với id "part123":
        | status      | APPROVED |
        | isCheckedIn | false    |
    When tôi gửi POST /participants/part123/certificate
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Người tham gia chưa được check-in"

Scenario: Gửi chứng nhận thất bại khi thiếu certificateUrl
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại participant với id "part123" đã check-in
    When tôi gửi POST /participants/part123/certificate với body rỗng
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "URL chứng nhận là bắt buộc"

Scenario: Gửi chứng nhận thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại participant thuộc chiến dịch của user khác
    When tôi gửi POST /participants/part123/certificate
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-057: Gửi chứng nhận hàng loạt

```gherkin
Feature: Bulk Send Certificates

Scenario: Gửi chứng nhận hàng loạt thành công
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại event với id 1 thuộc chiến dịch của tôi
    And event có 20 participants đã check-in
    And mỗi participant có email hợp lệ
    When tôi gửi POST /events/1/certificates
    Then response status là 200
    And response message là "Đã gửi 20 chứng nhận thành công"
    And 20 emails được gửi đi
    And tất cả participant được cộng điểm rèn luyện

Scenario: Gửi chứng nhận hàng loạt với một số thất bại
    Given tôi đã đăng nhập với role "CLB" và là creator
    And tồn tại event với id 1 có 20 participants đã check-in
    Và 2 trong số đó có email không hợp lệ
    When tôi gửi POST /events/1/certificates
    Then response status là 200
    And response message là "Đã gửi 18 chứng nhận thành công, 2 thất bại"
    And response data chứa danh sách 2 participant thất bại

Scenario: Gửi chứng nhận thất bại khi không có participant nào check-in
    Given tôi đã đăng nhập với role "CLB"
    And tồn tại event với id 1 không có participant nào check-in
    When tôi gửi POST /events/1/certificates
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Không có người tham gia nào đã check-in"

Scenario: Gửi chứng nhận thất bại khi không phải creator
    Given tôi đã đăng nhập với role "LCD"
    And tồn tại event với id 1 của user khác
    When tôi gửi POST /events/1/certificates
    Then response status là 403
    And response error code là "FORBIDDEN"
```

### US-058: Xem tổng điểm rèn luyện

```gherkin
Feature: Get Student Total Points

Scenario: Xem tổng điểm thành công
    Given tôi đã đăng nhập với role "Student"
    And tôi có totalPoints = 150
    When tôi gửi GET /students/me
    Then response status là 200
    And response data chứa:
        | id          | <my id>    |
        | mssv        | "20110001" |
        | fullName    | "Nguyễn Văn A" |
        | totalPoints | 150        |
        | facultyId   | 1          |

Scenario: Xem thông tin student chưa có điểm
    Given tôi đã đăng nhập với role "Student"
    And tôi chưa tham gia hoạt động nào
    When tôi gửi GET /students/me
    Then response status là 200
    And response data.totalPoints là 0

Scenario: Xem thông tin thất bại khi chưa đăng nhập
    When tôi gửi GET /students/me không có token
    Then response status là 401
    And response error code là "UNAUTHORIZED"
    And response message là "Token không hợp lệ hoặc hết hạn"
```

### US-078: Upload ảnh minh chứng

```gherkin
Feature: Upload Image

Scenario: Upload ảnh JPG thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "proof.jpg" (Content-Type: image/jpeg, size: 2MB) |
    Then response status là 200
    And response data chứa:
        | url | "https://storage/uploads/images/<uuid>.jpg" |
    And file được lưu trữ

Scenario: Upload ảnh PNG thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "proof.png" (Content-Type: image/png) |
    Then response status là 200
    And response data chứa URL hợp lệ

Scenario: Upload ảnh WEBP thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "proof.webp" (Content-Type: image/webp) |
    Then response status là 200

Scenario: Upload thất bại khi file không phải ảnh
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với multipart/form-data:
        | file | "document.pdf" (Content-Type: application/pdf) |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chỉ chấp nhận file ảnh JPG, PNG, WEBP"

Scenario: Upload thất bại khi file quá lớn
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với file size 6MB
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Kích thước file không được vượt quá 5MB"

Scenario: Upload thất bại khi không có file
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/image với body rỗng
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "File là bắt buộc"

Scenario: Upload thất bại khi chưa đăng nhập
    When tôi gửi POST /upload/image không có token
    Then response status là 401
    And response error code là "UNAUTHORIZED"
```

### US-079: Upload tài liệu

```gherkin
Feature: Upload Document

Scenario: Upload PDF thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "plan.pdf" (Content-Type: application/pdf, size: 3MB) |
    Then response status là 200
    And response data chứa URL hợp lệ

Scenario: Upload DOCX thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "plan.docx" |
    Then response status là 200

Scenario: Upload XLSX thành công
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "budget.xlsx" |
    Then response status là 200

Scenario: Upload thất bại khi file không đúng định dạng
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với multipart/form-data:
        | file | "image.jpg" (Content-Type: image/jpeg) |
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Chỉ chấp nhận file PDF, DOC, DOCX, XLS, XLSX"

Scenario: Upload thất bại khi file quá lớn
    Given tôi đã đăng nhập
    When tôi gửi POST /upload/document với file size 15MB
    Then response status là 400
    And response error code là "VALIDATION_ERROR"
    And response message là "Kích thước file không được vượt quá 10MB"
```

---

## 4. TECHNICAL TASKS - BACKEND

### Feature: Auth (`src/features/auth`)

| Task ID | Task Name                            | Mô tả                                           | Priority |
| ------- | ------------------------------------ | ----------------------------------------------- | -------- |
| T-001   | Tạo `auth.validation.ts`             | Zod schema cho register/login Student & User    | HIGH     |
| T-002   | Tạo `auth.repository.ts`             | CRUD operations cho User, Student, RefreshToken | HIGH     |
| T-003   | Tạo `auth.service.ts`                | Logic đăng ký, đăng nhập, logout, refresh token | HIGH     |
| T-004   | Tạo `auth.controller.ts`             | HTTP handlers với catchAsync wrapper            | HIGH     |
| T-005   | Tạo `auth.route.ts`                  | Định nghĩa routes với validate middleware       | HIGH     |
| T-006   | Implement JWT token generation       | Access token (15min) + Refresh token (7d)       | HIGH     |
| T-007   | Implement Argon2 password hashing    | Hash khi đăng ký, verify khi đăng nhập          | HIGH     |
| T-008   | Implement cookie-based refresh token | HttpOnly, Secure, SameSite cookies              | MED      |
| T-009   | Implement email verification         | Tạo token, gửi email, verify token              | MED      |
| T-010   | Unit tests cho auth.service          | Test các business logic                         | MED      |

### Feature: Faculty (`src/features/faculty`)

| Task ID | Task Name                   | Mô tả                          | Priority |
| ------- | --------------------------- | ------------------------------ | -------- |
| T-011   | Tạo `faculty.repository.ts` | Query faculties, tìm theo code | HIGH     |
| T-012   | Tạo `faculty.service.ts`    | Logic xác định khoa từ MSSV    | HIGH     |
| T-013   | Tạo `faculty.controller.ts` | HTTP handlers                  | MED      |
| T-014   | Tạo `faculty.route.ts`      | Routes GET /faculties          | MED      |
| T-015   | Seed faculties data         | Tạo data mẫu cho các khoa      | LOW      |

### Feature: Campaign (`src/features/campaign`)

| Task ID | Task Name                         | Mô tả                                               | Priority |
| ------- | --------------------------------- | --------------------------------------------------- | -------- |
| T-016   | Tạo `campaign.validation.ts`      | Zod schema cho create/update/submit/approve         | HIGH     |
| T-017   | Tạo `campaign.repository.ts`      | CRUD Campaign, query với filter/pagination          | HIGH     |
| T-018   | Tạo `campaign.service.ts`         | Logic trạng thái, permission check, file upload     | HIGH     |
| T-019   | Tạo `campaign.controller.ts`      | HTTP handlers cho 13 endpoints                      | HIGH     |
| T-020   | Tạo `campaign.route.ts`           | Routes với auth middleware                          | HIGH     |
| T-021   | Implement status state machine    | Validate transitions DRAFT→PENDING→ACTIVE→COMPLETED | HIGH     |
| T-022   | Implement permission check        | Chỉ creator có thể edit/submit                      | HIGH     |
| T-023   | Implement file upload integration | Tích hợp với upload feature                         | HIGH     |
| T-024   | Implement notification trigger    | Gửi notification khi approve/reject                 | MED      |
| T-025   | Unit tests cho campaign.service   | Test state machine, permissions                     | MED      |

### Feature: Money Donation (`src/features/moneyDonation`)

| Task ID | Task Name                            | Mô tả                                      | Priority |
| ------- | ------------------------------------ | ------------------------------------------ | -------- |
| T-026   | Tạo `moneyDonation.validation.ts`    | Zod schema cho phase & donation            | HIGH     |
| T-027   | Tạo `moneyDonation.repository.ts`    | CRUD MoneyDonationCampaign, Donation       | HIGH     |
| T-028   | Tạo `moneyDonation.service.ts`       | Logic tạo phase, progress, verify donation | HIGH     |
| T-029   | Tạo `moneyDonation.controller.ts`    | HTTP handlers                              | HIGH     |
| T-030   | Tạo `moneyDonation.route.ts`         | Routes                                     | HIGH     |
| T-031   | Implement progress calculation       | Tính currentAmount, percentage             | MED      |
| T-032   | Implement point calculation          | Cộng điểm khi verify donation              | HIGH     |
| T-033   | Unit tests cho moneyDonation.service | Test progress, verify logic                | MED      |

### Feature: Item Donation (`src/features/itemDonation`)

| Task ID | Task Name                        | Mô tả                               | Priority |
| ------- | -------------------------------- | ----------------------------------- | -------- |
| T-034   | Tạo `itemDonation.validation.ts` | Zod schema                          | HIGH     |
| T-035   | Tạo `itemDonation.repository.ts` | CRUD ItemDonationCampaign, Donation | HIGH     |
| T-036   | Tạo `itemDonation.service.ts`    | Logic tạo phase, verify donation    | HIGH     |
| T-037   | Tạo `itemDonation.controller.ts` | HTTP handlers                       | HIGH     |
| T-038   | Tạo `itemDonation.route.ts`      | Routes                              | HIGH     |
| T-039   | Unit tests                       |                                     | MED      |

### Feature: Event (`src/features/event`)

| Task ID | Task Name                         | Mô tả                                                | Priority |
| ------- | --------------------------------- | ---------------------------------------------------- | -------- |
| T-040   | Tạo `event.validation.ts`         | Zod schema cho event & participant                   | HIGH     |
| T-041   | Tạo `event.repository.ts`         | CRUD EventCampaign, Participant                      | HIGH     |
| T-042   | Tạo `event.service.ts`            | Logic tạo event, registration, check-in, certificate | HIGH     |
| T-043   | Tạo `event.controller.ts`         | HTTP handlers cho 9 endpoints                        | HIGH     |
| T-044   | Tạo `event.route.ts`              | Routes                                               | HIGH     |
| T-045   | Implement registration validation | Check max participants, deadline, duplicate          | HIGH     |
| T-046   | Implement check-in logic          | Validate status APPROVED, update isCheckedIn         | HIGH     |
| T-047   | Implement certificate email       | Gửi email với attachment qua nodemailer              | HIGH     |
| T-048   | Implement bulk certificate        | Gửi hàng loạt email với error handling               | HIGH     |
| T-049   | Unit tests cho event.service      | Test registration, check-in logic                    | MED      |

### Feature: Student (`src/features/student`)

| Task ID | Task Name                      | Mô tả                                     | Priority |
| ------- | ------------------------------ | ----------------------------------------- | -------- |
| T-050   | Tạo `student.validation.ts`    | Zod schema cho update profile             | MED      |
| T-051   | Tạo `student.repository.ts`    | Query Student, titles, donations          | HIGH     |
| T-052   | Tạo `student.service.ts`       | Logic get profile, update, points history | HIGH     |
| T-053   | Tạo `student.controller.ts`    | HTTP handlers                             | HIGH     |
| T-054   | Tạo `student.route.ts`         | Routes với auth middleware (Student role) | HIGH     |
| T-055   | Implement points history query | Query donations & participants với points | MED      |
| T-056   | Unit tests                     |                                           | LOW      |

### Feature: Title (Gamification) (`src/features/title`)

| Task ID | Task Name                   | Mô tả                                          | Priority |
| ------- | --------------------------- | ---------------------------------------------- | -------- |
| T-057   | Tạo `title.validation.ts`   | Zod schema cho CRUD title                      | MED      |
| T-058   | Tạo `title.repository.ts`   | CRUD Title, StudentTitle                       | MED      |
| T-059   | Tạo `title.service.ts`      | Logic CRUD, tự động unlock title khi đủ điểm   | MED      |
| T-060   | Tạo `title.controller.ts`   | HTTP handlers                                  | MED      |
| T-061   | Tạo `title.route.ts`        | Routes (admin: DOANTRUONG)                     | MED      |
| T-062   | Implement auto-title unlock | Kiểm tra & gán title khi student đạt minPoints | MED      |
| T-063   | Unit tests                  |                                                | LOW      |

### Feature: Club (`src/features/club`)

| Task ID | Task Name                | Mô tả                      | Priority |
| ------- | ------------------------ | -------------------------- | -------- |
| T-064   | Tạo `club.validation.ts` | Zod schema                 | LOW      |
| T-065   | Tạo `club.repository.ts` | CRUD Club                  | LOW      |
| T-066   | Tạo `club.service.ts`    | Logic CRUD với permission  | LOW      |
| T-067   | Tạo `club.controller.ts` | HTTP handlers              | LOW      |
| T-068   | Tạo `club.route.ts`      | Routes (admin: DOANTRUONG) | LOW      |
| T-069   | Unit tests               |                            | LOW      |

### Feature: Notification (`src/features/notification`)

| Task ID | Task Name                           | Mô tả                                                | Priority |
| ------- | ----------------------------------- | ---------------------------------------------------- | -------- |
| T-070   | Tạo Notification model trong Prisma | Bảng notifications                                   | MED      |
| T-071   | Tạo `notification.repository.ts`    | CRUD Notification                                    | MED      |
| T-072   | Tạo `notification.service.ts`       | Logic tạo notification, mark read                    | MED      |
| T-073   | Tạo `notification.controller.ts`    | HTTP handlers                                        | MED      |
| T-074   | Tạo `notification.route.ts`         | Routes                                               | MED      |
| T-075   | Implement notification helper       | Hàm tiện ích để tạo notification từ các feature khác | MED      |
| T-076   | Unit tests                          |                                                      | LOW      |

### Feature: Statistics (`src/features/statistics`)

| Task ID | Task Name                      | Mô tả                                    | Priority |
| ------- | ------------------------------ | ---------------------------------------- | -------- |
| T-077   | Tạo `statistics.service.ts`    | Aggregation queries                      | LOW      |
| T-078   | Tạo `statistics.controller.ts` | HTTP handlers                            | LOW      |
| T-079   | Tạo `statistics.route.ts`      | Routes với permission check              | LOW      |
| T-080   | Implement campaign statistics  | Total donations, participants, check-ins | LOW      |
| T-081   | Implement faculty statistics   | Thống kê theo khoa                       | LOW      |
| T-082   | Implement system statistics    | Tổng quan toàn hệ thống                  | LOW      |

### Feature: Upload (`src/features/upload`)

| Task ID | Task Name                  | Mô tả                                        | Priority |
| ------- | -------------------------- | -------------------------------------------- | -------- |
| T-083   | Tạo `upload.validation.ts` | Validate file type, size                     | HIGH     |
| T-084   | Cấu hình storage           | Local storage hoặc cloud (S3, Cloudinary)    | HIGH     |
| T-085   | Tạo `upload.controller.ts` | HTTP handlers cho image & document           | HIGH     |
| T-086   | Tạo `upload.route.ts`      | Routes với multer middleware                 | HIGH     |
| T-087   | Implement file naming      | UUID + extension, organized folder structure | HIGH     |
| T-088   | Implement file validation  | Magic number check, MIME type validation     | MED      |

### Common & Infrastructure

| Task ID | Task Name                                | Mô tả                                      | Priority |
| ------- | ---------------------------------------- | ------------------------------------------ | -------- |
| T-089   | Tạo `src/common/middleware/auth.ts`      | Middleware verify JWT, extract user info   | HIGH     |
| T-090   | Tạo `src/common/middleware/authorize.ts` | Middleware kiểm tra role (RBAC)            | HIGH     |
| T-091   | Tạo `src/common/middleware/validate.ts`  | Middleware validate Zod schema             | HIGH     |
| T-092   | Cấu hình Swagger documentation           | Tích hợp swagger-jsdoc, swagger-ui-express | LOW      |
| T-093   | Cấu hình rate limiting                   | Giới hạn request cho auth endpoints        | MED      |
| T-094   | Cấu hình logging                         | Winston logger cho error & info            | MED      |
| T-095   | Tạo seed data script                     | Students, Users, Clubs, Titles mẫu         | LOW      |
| T-096   | Tạo Docker configuration                 | Dockerfile, docker-compose.yml             | LOW      |
| T-097   | Cấu hình CI/CD                           | GitHub Actions cho test & deploy           | LOW      |

### Prisma Schema Tasks

| Task ID | Task Name                             | Mô tả                                    | Priority |
| ------- | ------------------------------------- | ---------------------------------------- | -------- |
| T-098   | Tạo migration cho Notification model  | Prisma migrate                           | MED      |
| T-099   | Tạo migration cho PointsHistory model | Nếu cần bảng riêng cho lịch sử điểm      | LOW      |
| T-100   | Seed data cho Titles                  | Danh hiệu mẫu (TNX, TNN, TNA, TNV, TNTH) | LOW      |

---

## 5. TỔNG KẾT

### Thống kê Product Backlog

| Epic                  | Số User Stories | High Priority | Med Priority | Low Priority |
| --------------------- | --------------- | ------------- | ------------ | ------------ |
| E-01: Auth & Auth     | 9               | 4             | 4            | 1            |
| E-02: Faculty         | 3               | 1             | 1            | 1            |
| E-03: Campaign        | 13              | 9             | 4            | 0            |
| E-04: Money Donation  | 11              | 5             | 5            | 1            |
| E-05: Item Donation   | 7               | 2             | 4            | 1            |
| E-06: Event           | 14              | 7             | 6            | 1            |
| E-07: Gamification    | 9               | 1             | 4            | 4            |
| E-08: Club            | 5               | 0             | 1            | 4            |
| E-09: Notification    | 3               | 0             | 1            | 2            |
| E-10: Statistics      | 3               | 0             | 1            | 2            |
| E-11: File Management | 2               | 2             | 0            | 0            |
| **TỔNG**              | **79**          | **31**        | **31**       | **17**       |

### Thống kê Technical Tasks

| Feature                 | Số Tasks | High Priority | Med Priority | Low Priority |
| ----------------------- | -------- | ------------- | ------------ | ------------ |
| Auth                    | 10       | 5             | 4            | 1            |
| Faculty                 | 5        | 2             | 2            | 1            |
| Campaign                | 10       | 7             | 2            | 1            |
| Money Donation          | 8        | 5             | 2            | 1            |
| Item Donation           | 6        | 4             | 1            | 1            |
| Event                   | 10       | 6             | 3            | 1            |
| Student                 | 7        | 3             | 3            | 1            |
| Title                   | 7        | 0             | 5            | 2            |
| Club                    | 6        | 0             | 2            | 4            |
| Notification            | 7        | 0             | 5            | 2            |
| Statistics              | 6        | 0             | 1            | 5            |
| Upload                  | 6        | 4             | 1            | 1            |
| Common & Infrastructure | 9        | 3             | 3            | 3            |
| Prisma Schema           | 3        | 0             | 1            | 2            |
| **TỔNG**                | **100**  | **39**        | **35**       | **26**       |

---

## PHỤ LỤC: ERROR CODES REFERENCE

| Code                     | Mô tả                                    |
| ------------------------ | ---------------------------------------- |
| UNAUTHORIZED             | Token không hợp lệ hoặc hết hạn          |
| FORBIDDEN                | Không có quyền thực hiện hành động       |
| NOT_FOUND                | Resource không tồn tại                   |
| VALIDATION_ERROR         | Dữ liệu không hợp lệ                     |
| CAMPAIGN_NOT_ACTIVE      | Chiến dịch không ở trạng thái hoạt động  |
| REGISTRATION_CLOSED      | Đã hết hạn đăng ký                       |
| MAX_PARTICIPANTS_REACHED | Đã đủ số lượng tham gia                  |
| ALREADY_REGISTERED       | Đã đăng ký sự kiện này                   |
| FACULTY_MISMATCH         | Sinh viên không thuộc khoa được chỉ định |
| CONFLICT                 | Resource đã tồn tại                      |

---

## PHỤ LỤC: PERMISSION MATRIX

| Action                                 | Student | CLB             | LCD         | DOANTRUONG      |
| -------------------------------------- | ------- | --------------- | ----------- | --------------- |
| Xem chiến dịch (cùng khoa/toàn trường) | ✓       | ✓               | ✓           | ✓               |
| Tạo chiến dịch                         | ✗       | ✓ (toàn trường) | ✓ (khoa)    | ✓ (toàn trường) |
| Duyệt chiến dịch                       | ✗       | ✗               | ✗           | ✓               |
| Đăng ký tham gia event                 | ✓       | ✓               | ✓           | ✓               |
| Quyên góp tiền/vật                     | ✓       | ✓               | ✓           | ✓               |
| Duyệt donation/participant             | ✗       | ✓ (creator)     | ✓ (creator) | ✓ (all)         |
| Quản lý CLB                            | ✗       | ✗               | ✗           | ✓               |

---

_Document generated for BKVolunteers Backend Project_
