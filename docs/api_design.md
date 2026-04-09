# API Design Document

## Base URL: `/api/v1`

---

## 1. Authentication APIs

### 1.1 Student Login

- **POST** `/auth/student/login`
- **Request Body:**
  ```json
  {
    "mssv": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "string",
      "student": {
        "id": "string",
        "mssv": "string",
        "fullName": "string",
        "email": "string",
        "facultyId": "number",
        "className": "string",
        "totalPoints": "number"
      }
    }
  }
  ```

### 1.2 User Login (CLB/LCD/Đoàn trường)

- **POST** `/auth/user/login`
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "string",
      "user": {
        "id": "string",
        "username": "string",
        "fullName": "string",
        "email": "string",
        "role": "CLB | LCD | DOANTRUONG",
        "facultyId": "number"
      }
    }
  }
  ```

### 1.3 Student Register

- **POST** `/auth/student/register`
- **Request Body:**
  ```json
  {
    "mssv": "string",
    "fullName": "string",
    "email": "string",
    "password": "string",
    "facultyId": "number",
    "className": "string",
    "phone": "string"
  }
  ```

### 1.4 User Register

- **POST** `/auth/user/register`
- **Request Body:**
  ```json
  {
    "username": "string",
    "fullName": "string",
    "email": "string",
    "password": "string",
    "role": "CLB | LCD | DOANTRUONG",
    "facultyId": "number"
  }
  ```

### 1.5 Logout

- **POST** `/auth/logout`
- **Headers:** `Authorization: Bearer <token>`

### 1.6 Get Current User

- **GET** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`

---

## 2. Faculty APIs

### 2.1 Get All Faculties

- **GET** `/faculties`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "code": "string",
        "name": "string"
      }
    ]
  }
  ```

### 2.2 Get Faculty by ID

- **GET** `/faculties/:id`

### 2.3 Get Faculty by Code (từ MSSV)

- **GET** `/faculties/code/:code`

---

## 3. Campaign APIs

### 3.1 Get All Campaigns

- **GET** `/campaigns`
- **Query Params:**
  - `status`: DRAFT | PENDING | ACTIVE | REJECTED | COMPLETED | CANCELLED
  - `scope`: KHOA | TRUONG
  - `facultyId`: number
  - `creatorId`: string
  - `page`: number
  - `limit`: number
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "campaigns": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "scope": "KHOA | TRUONG",
          "status": "DRAFT | PENDING | ACTIVE | REJECTED | COMPLETED | CANCELLED",
          "planFileUrl": "string",
          "budgetFileUrl": "string",
          "adminComment": "string",
          "creatorId": "string",
          "facultyId": "number",
          "createdAt": "datetime",
          "updatedAt": "datetime",
          "creator": {
            "id": "string",
            "username": "string",
            "fullName": "string"
          }
        }
      ],
      "pagination": {
        "page": "number",
        "limit": "number",
        "total": "number"
      }
    }
  }
  ```

### 3.2 Get Campaign by ID

- **GET** `/campaigns/:id`

### 3.3 Create Campaign (Draft)

- **POST** `/campaigns`
- **Headers:** `Authorization: Bearer <token>` (Role: CLB | LCD | DOANTRUONG)
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "scope": "KHOA | TRUONG",
    "facultyId": "number (required if scope = KHOA)"
  }
  ```

### 3.4 Update Campaign

- **PUT** `/campaigns/:id`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "scope": "KHOA | TRUONG",
    "facultyId": "number"
  }
  ```

### 3.5 Delete Campaign

- **DELETE** `/campaigns/:id`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 3.6 Submit Campaign for Approval

- **POST** `/campaigns/:id/submit`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Description:** Chuyển status từ DRAFT → PENDING

### 3.7 Approve Campaign

- **POST** `/campaigns/:id/approve`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)
- **Request Body:**
  ```json
  {
    "comment": "string (optional)"
  }
  ```
- **Description:** Chuyển status từ PENDING → ACTIVE, gán approverId

### 3.8 Reject Campaign

- **POST** `/campaigns/:id/reject`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)
- **Request Body:**
  ```json
  {
    "comment": "string (required)"
  }
  ```
- **Description:** Chuyển status từ PENDING → REJECTED

### 3.9 Complete Campaign

- **POST** `/campaigns/:id/complete`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "eventPhotos": ["string (URLs)"]
  }
  ```
- **Description:** Chuyển status từ ACTIVE → COMPLETED

### 3.10 Cancel Campaign

- **POST** `/campaigns/:id/cancel`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 3.11 Upload Plan File

- **POST** `/campaigns/:id/plan-file`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request:** `multipart/form-data`
  - `file`: File (PDF, DOC, DOCX)

### 3.12 Upload Budget File

- **POST** `/campaigns/:id/budget-file`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request:** `multipart/form-data`
  - `file`: File (PDF, DOC, DOCX, XLS, XLSX)

### 3.13 Get Campaigns by Faculty (for Student)

- **GET** `/campaigns/available`
- **Headers:** `Authorization: Bearer <token>` (Student)
- **Description:** Sinh viên xem các chiến dịch có thể tham gia (cùng khoa hoặc toàn trường)

---

## 4. Money Donation Phase APIs

### 4.1 Create Money Donation Phase

- **POST** `/campaigns/:campaignId/money-phases`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "targetAmount": "number",
    "qrImageUrl": "string",
    "startDate": "datetime",
    "endDate": "datetime"
  }
  ```

### 4.2 Update Money Donation Phase

- **PUT** `/campaigns/:campaignId/money-phases/:phaseId`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 4.3 Delete Money Donation Phase

- **DELETE** `/campaigns/:campaignId/money-phases/:phaseId`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 4.4 Get Money Donation Phases by Campaign

- **GET** `/campaigns/:campaignId/money-phases`

### 4.5 Get Money Donation Progress

- **GET** `/campaigns/:campaignId/money-phases/:phaseId/progress`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "targetAmount": "number",
      "currentAmount": "number",
      "percentage": "number",
      "donationsCount": "number"
    }
  }
  ```

---

## 5. Item Donation Phase APIs

### 5.1 Create Item Donation Phase

- **POST** `/campaigns/:campaignId/item-phases`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "acceptedItems": "string (danh sách hiện vật chấp nhận)",
    "collectionAddress": "string",
    "startDate": "datetime",
    "endDate": "datetime"
  }
  ```

### 5.2 Update Item Donation Phase

- **PUT** `/campaigns/:campaignId/item-phases/:phaseId`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 5.3 Delete Item Donation Phase

- **DELETE** `/campaigns/:campaignId/item-phases/:phaseId`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 5.4 Get Item Donation Phases by Campaign

- **GET** `/campaigns/:campaignId/item-phases`

---

## 6. Event Phase APIs

### 6.1 Create Event Phase

- **POST** `/campaigns/:campaignId/events`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "location": "string",
    "maxParticipants": "number",
    "registrationStart": "datetime",
    "registrationEnd": "datetime",
    "eventStart": "datetime",
    "eventEnd": "datetime"
  }
  ```

### 6.2 Update Event Phase

- **PUT** `/campaigns/:campaignId/events/:eventId`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 6.3 Delete Event Phase

- **DELETE** `/campaigns/:campaignId/events/:eventId`
- **Headers:** `Authorization: Bearer <token>` (Creator only)

### 6.4 Get Events by Campaign

- **GET** `/campaigns/:campaignId/events`

### 6.5 Get Event Details

- **GET** `/events/:eventId`

---

## 7. Donation APIs

### 7.1 Create Money Donation

- **POST** `/donations/money`
- **Headers:** `Authorization: Bearer <token>` (Student)
- **Request Body:**
  ```json
  {
    "moneyPhaseId": "number",
    "amount": "number",
    "proofImageUrl": "string (optional)"
  }
  ```

### 7.2 Create Item Donation

- **POST** `/donations/items`
- **Headers:** `Authorization: Bearer <token>` (Student)
- **Request Body:**
  ```json
  {
    "itemPhaseId": "number",
    "itemDescription": "string",
    "proofImageUrl": "string (optional)"
  }
  ```

### 7.3 Get My Donations

- **GET** `/donations/me`
- **Headers:** `Authorization: Bearer <token>` (Student)

### 7.4 Get Donations by Phase (Admin)

- **GET** `/money-phases/:phaseId/donations`
- **GET** `/item-phases/:phaseId/donations`
- **Headers:** `Authorization: Bearer <token>` (Creator/Approver)

### 7.5 Verify Donation

- **POST** `/donations/:id/verify`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Description:** Chuyển status từ PENDING → VERIFIED, cộng điểm cho sinh viên

### 7.6 Reject Donation

- **POST** `/donations/:id/reject`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "reason": "string"
  }
  ```

### 7.7 Update Donation Amount (for money verification)

- **PUT** `/donations/:id`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "amount": "number",
    "status": "VERIFIED"
  }
  ```

---

## 8. Participant APIs

### 8.1 Register for Event

- **POST** `/events/:eventId/register`
- **Headers:** `Authorization: Bearer <token>` (Student)
- **Description:** Tạo participant với status = PENDING

### 8.2 Cancel Registration

- **DELETE** `/events/:eventId/register`
- **Headers:** `Authorization: Bearer <token>` (Student)

### 8.3 Get My Registrations

- **GET** `/participants/me`
- **Headers:** `Authorization: Bearer <token>` (Student)

### 8.4 Get Participants by Event

- **GET** `/events/:eventId/participants`
- **Headers:** `Authorization: Bearer <token>` (Creator/Approver)
- **Query Params:**
  - `status`: PENDING | APPROVED | REJECTED | WAITLISTED

### 8.5 Approve Participant

- **POST** `/participants/:id/approve`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Description:** Chuyển status từ PENDING → APPROVED

### 8.6 Reject Participant

- **POST** `/participants/:id/reject`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "reason": "string"
  }
  ```
- **Description:** Gửi thông báo cho sinh viên

### 8.7 Check-in Participant

- **POST** `/participants/:id/check-in`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Description:** Đánh dấu isCheckedIn = true

### 8.8 Send Certificate

- **POST** `/participants/:id/certificate`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Request Body:**
  ```json
  {
    "certificateUrl": "string"
  }
  ```
- **Description:** Gửi chứng nhận qua email, cộng điểm rèn luyện

### 8.9 Bulk Send Certificates

- **POST** `/events/:eventId/certificates`
- **Headers:** `Authorization: Bearer <token>` (Creator only)
- **Description:** Gửi chứng nhận cho tất cả participant đã check-in

---

## 9. Student APIs

### 9.1 Get Student Profile

- **GET** `/students/me`
- **Headers:** `Authorization: Bearer <token>` (Student)

### 9.2 Update Student Profile

- **PUT** `/students/me`
- **Headers:** `Authorization: Bearer <token>` (Student)
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "phone": "string",
    "className": "string"
  }
  ```

### 9.3 Get Student Points History

- **GET** `/students/me/points`
- **Headers:** `Authorization: Bearer <token>` (Student)

### 9.4 Get Student Titles

- **GET** `/students/me/titles`
- **Headers:** `Authorization: Bearer <token>` (Student)

### 9.5 Get Student by ID (Admin)

- **GET** `/students/:id`
- **Headers:** `Authorization: Bearer <token>` (Creator/Approver)

---

## 10. Title APIs

### 10.1 Get All Titles

- **GET** `/titles`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "minPoints": "number",
        "iconUrl": "string"
      }
    ]
  }
  ```

### 10.2 Create Title

- **POST** `/titles`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)

### 10.3 Update Title

- **PUT** `/titles/:id`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)

### 10.4 Delete Title

- **DELETE** `/titles/:id`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)

---

## 11. Club APIs

### 11.1 Get All Clubs

- **GET** `/clubs`

### 11.2 Get Club by ID

- **GET** `/clubs/:id`

### 11.3 Create Club

- **POST** `/clubs`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)
- **Request Body:**
  ```json
  {
    "name": "string",
    "facultyId": "number",
    "leaderId": "string"
  }
  ```

### 11.4 Update Club

- **PUT** `/clubs/:id`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG | Club Leader)

### 11.5 Delete Club

- **DELETE** `/clubs/:id`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)

---

## 12. File Upload APIs

### 12.1 Upload Image

- **POST** `/upload/image`
- **Headers:** `Authorization: Bearer <token>`
- **Request:** `multipart/form-data`
  - `file`: Image file (JPG, PNG, WEBP)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "url": "string"
    }
  }
  ```

### 12.2 Upload Document

- **POST** `/upload/document`
- **Headers:** `Authorization: Bearer <token>`
- **Request:** `multipart/form-data`
  - `file`: Document file (PDF, DOC, DOCX, XLS, XLSX)

---

## 13. Notification APIs

### 13.1 Get My Notifications

- **GET** `/notifications/me`
- **Headers:** `Authorization: Bearer <token>`

### 13.2 Mark Notification as Read

- **PUT** `/notifications/:id/read`
- **Headers:** `Authorization: Bearer <token>`

### 13.3 Mark All Notifications as Read

- **PUT** `/notifications/read-all`
- **Headers:** `Authorization: Bearer <token>`

---

## 14. Statistics APIs

### 14.1 Get Campaign Statistics

- **GET** `/campaigns/:id/statistics`
- **Headers:** `Authorization: Bearer <token>` (Creator/Approver)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalDonations": "number",
      "totalAmount": "number",
      "totalParticipants": "number",
      "approvedParticipants": "number",
      "checkedInParticipants": "number"
    }
  }
  ```

### 14.2 Get Faculty Statistics

- **GET** `/faculties/:id/statistics`
- **Headers:** `Authorization: Bearer <token>` (Role: LCD | DOANTRUONG)

### 14.3 Get System Statistics

- **GET** `/statistics/system`
- **Headers:** `Authorization: Bearer <token>` (Role: DOANTRUONG)

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

## Common Error Codes

| Code                     | Description                              |
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

## Permission Matrix

| Action                                 | Student | CLB             | LCD         | DOANTRUONG      |
| -------------------------------------- | ------- | --------------- | ----------- | --------------- |
| Xem chiến dịch (cùng khoa/toàn trường) | ✓       | ✓               | ✓           | ✓               |
| Tạo chiến dịch                         | ✗       | ✓ (toàn trường) | ✓ (khoa)    | ✓ (toàn trường) |
| Duyệt chiến dịch                       | ✗       | ✗               | ✗           | ✓               |
| Đăng ký tham gia event                 | ✓       | ✓               | ✓           | ✓               |
| Quyên góp tiền/vật                     | ✓       | ✓               | ✓           | ✓               |
| Duyệt donation/participant             | ✗       | ✓ (creator)     | ✓ (creator) | ✓ (all)         |
| Quản lý CLB                            | ✗       | ✗               | ✗           | ✓               |
