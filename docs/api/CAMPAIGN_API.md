# Campaign API Documentation

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Standard Query Parameters](#standard-query-parameters)
4. [Data Models](#data-models)
5. [Endpoints](#endpoints)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)

---

## Base Configuration

| Property | Value               |
| :------- | :------------------ |
| Base URL | `/api/v1/campaigns` |
| Version  | v1                  |
| Protocol | HTTPS               |

---

## Authentication

All campaign endpoints require authentication. Include the Bearer token in the request headers:

```
Authorization: Bearer <access_token>
```

---

## Standard Query Parameters

For endpoints that support listing multiple items:

| Parameter   | Type     | Description                 | Default |
| :---------- | :------- | :-------------------------- | :------ |
| `page`      | `number` | The page number to retrieve | `1`     |
| `limit`     | `number` | Number of items per page    | `10`    |
| `status`    | `string` | Filter by campaign status   | -       |
| `scope`     | `string` | Filter by campaign scope    | -       |
| `facultyId` | `string` | Filter by faculty ID        | -       |
| `creatorId` | `string` | Filter by creator ID        | -       |

---

## Data Models

### Campaign

| Field           | Type      | Description                                                    |
| :-------------- | :-------- | :------------------------------------------------------------- |
| `id`            | string    | Unique identifier for the campaign                             |
| `title`         | string    | Campaign title                                                 |
| `description`   | string    | Campaign description                                           |
| `scope`         | string    | Campaign scope (`KHOA` or `TRUONG`)                            |
| `status`        | string    | Campaign status (see [Status Values](#campaign-status-values)) |
| `planFileUrl`   | string    | URL to the plan file                                           |
| `budgetFileUrl` | string    | URL to the budget file                                         |
| `adminComment`  | string    | Admin comment for approval/rejection                           |
| `approverId`    | string    | ID of the user who approved/rejected                           |
| `creatorId`     | string    | ID of the campaign creator                                     |
| `createdAt`     | date-time | Timestamp when the record was created                          |
| `updatedAt`     | date-time | Timestamp when the record was last updated                     |
| `deletedAt`     | date-time | Timestamp when the record was soft deleted                     |

### Campaign Status Values

| Status      | Description                                    |
| :---------- | :--------------------------------------------- |
| `DRAFT`     | Campaign is in draft mode, editable by creator |
| `PENDING`   | Campaign is submitted and waiting for approval |
| `ACTIVE`    | Campaign is approved and currently active      |
| `REJECTED`  | Campaign was rejected by admin                 |
| `COMPLETED` | Campaign has been completed                    |
| `CANCELLED` | Campaign was cancelled                         |

### Campaign Scope Values

| Scope    | Description               |
| :------- | :------------------------ |
| `KHOA`   | Faculty-level campaign    |
| `TRUONG` | University-level campaign |

### User Roles

| Role         | Description                                           |
| :----------- | :---------------------------------------------------- |
| `SINHVIEN`   | Student - cannot create campaigns                     |
| `CLB`        | Club - can create TRUONG scope campaigns              |
| `LCD`        | Faculty Youth Union - can create KHOA scope campaigns |
| `DOANTRUONG` | University Youth Union - full permissions             |

---

## Endpoints

### 1. Create Campaign

Create a new campaign. Only users with CLB, LCD, or DOANTRUONG roles can create campaigns.

| Property      | Value  |
| :------------ | :----- |
| URL           | `/`    |
| Method        | `POST` |
| Auth required | Yes    |

**Request Body:**

| Field         | Type   | Required    | Description                         |
| :------------ | :----- | :---------- | :---------------------------------- |
| `title`       | string | Yes         | Campaign title (1-255 characters)   |
| `description` | string | No          | Campaign description                |
| `scope`       | string | Yes         | Campaign scope (`KHOA` or `TRUONG`) |
| `facultyId`   | string | Conditional | Required when scope is `KHOA`       |

**Success Response (201 Created):**

```json
{
    "success": true,
    "message": "Tạo chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "title": "Chiến dịch tình nguyện mùa hè",
        "description": "Chiến dịch tình nguyện giúp đỡ trẻ em vùng cao",
        "scope": "TRUONG",
        "status": "DRAFT",
        "creatorId": "user-1",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Error Response (403 Forbidden):**

```json
{
    "success": false,
    "message": "Bạn không có quyền tạo chiến dịch"
}
```

---

### 2. Get All Campaigns

Retrieve a list of campaigns with optional filters.

| Property      | Value |
| :------------ | :---- |
| URL           | `/`   |
| Method        | `GET` |
| Auth required | Yes   |

**Query Parameters:** Supports [Standard Query Parameters](#standard-query-parameters)

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "campaigns": [
            {
                "id": "campaign-1",
                "title": "Chiến dịch tình nguyện mùa hè",
                "description": "Chiến dịch tình nguyện giúp đỡ trẻ em vùng cao",
                "scope": "TRUONG",
                "status": "ACTIVE",
                "creator": {
                    "id": "user-1",
                    "username": "clb-tinh-nguyen",
                    "email": "clb@example.com",
                    "role": "CLB"
                },
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z"
            }
        ],
        "meta": {
            "total": 1,
            "page": 1,
            "limit": 10,
            "totalPages": 1
        }
    }
}
```

---

### 3. Get Available Campaigns

Retrieve active campaigns available for students to register.

| Property      | Value        |
| :------------ | :----------- |
| URL           | `/available` |
| Method        | `GET`        |
| Auth required | Yes          |

**Query Parameters:**

| Parameter | Type   | Description                 | Default |
| :-------- | :----- | :-------------------------- | :------ |
| `page`    | number | The page number to retrieve | `1`     |
| `limit`   | number | Number of items per page    | `10`    |

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "campaigns": [
            {
                "id": "campaign-1",
                "title": "Chiến dịch tình nguyện mùa hè",
                "scope": "TRUONG",
                "status": "ACTIVE",
                "moneyPhase": [],
                "itemPhase": [],
                "eventPhase": [],
                "creator": {
                    "id": "user-1",
                    "username": "clb-tinh-nguyen",
                    "email": "clb@example.com",
                    "role": "CLB"
                }
            }
        ],
        "meta": {
            "total": 1,
            "page": 1,
            "limit": 10,
            "totalPages": 1
        }
    }
}
```

---

### 4. Get Campaign by ID

Retrieve detailed information about a specific campaign.

| Property      | Value   |
| :------------ | :------ |
| URL           | `/{id}` |
| Method        | `GET`   |
| Auth required | Yes     |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "campaign-1",
        "title": "Chiến dịch tình nguyện mùa hè",
        "description": "Chiến dịch tình nguyện giúp đỡ trẻ em vùng cao",
        "scope": "TRUONG",
        "status": "ACTIVE",
        "planFileUrl": "https://example.com/plan.pdf",
        "budgetFileUrl": "https://example.com/budget.xlsx",
        "adminComment": null,
        "approverId": "admin-1",
        "creatorId": "user-1",
        "creator": {
            "id": "user-1",
            "username": "clb-tinh-nguyen",
            "email": "clb@example.com",
            "role": "CLB",
            "facultyId": null
        },
        "approver": {
            "id": "admin-1",
            "username": "doan-truong",
            "email": "admin@example.com"
        },
        "moneyPhase": [],
        "itemPhase": [],
        "eventPhase": [],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
    }
}
```

**Error Response (404 Not Found):**

```json
{
    "success": false,
    "message": "Không tìm thấy chiến dịch"
}
```

---

### 5. Update Campaign

Update campaign information. Only the creator can update, and only when status is `DRAFT`. DOANTRUONG can update any campaign.

| Property      | Value   |
| :------------ | :------ |
| URL           | `/{id}` |
| Method        | `PUT`   |
| Auth required | Yes     |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Request Body:**

| Field         | Type   | Required | Description                       |
| :------------ | :----- | :------- | :-------------------------------- |
| `title`       | string | No       | Campaign title (1-255 characters) |
| `description` | string | No       | Campaign description              |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Cập nhật chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "title": "Updated Title",
        "description": "Updated Description"
    }
}
```

**Error Response (403 Forbidden):**

```json
{
    "success": false,
    "message": "Chỉ có thể chỉnh sửa chiến dịch ở trạng thái DRAFT"
}
```

---

### 6. Delete Campaign

Soft delete a campaign. Only the creator can delete, and only when status is `DRAFT`. DOANTRUONG can delete any campaign.

| Property      | Value    |
| :------------ | :------- |
| URL           | `/{id}`  |
| Method        | `DELETE` |
| Auth required | Yes      |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Xóa chiến dịch thành công",
    "data": null
}
```

---

### 7. Submit Campaign

Submit a campaign for approval. Changes status from `DRAFT` to `PENDING`.

| Property      | Value          |
| :------------ | :------------- |
| URL           | `/{id}/submit` |
| Method        | `POST`         |
| Auth required | Yes            |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Gửi phê duyệt chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "status": "PENDING"
    }
}
```

**Error Response (400 Bad Request):**

```json
{
    "success": false,
    "message": "Chiến dịch không ở trạng thái DRAFT"
}
```

---

### 8. Approve Campaign

Approve a pending campaign. Only DOANTRUONG can approve. Changes status from `PENDING` to `ACTIVE`.

| Property      | Value           |
| :------------ | :-------------- |
| URL           | `/{id}/approve` |
| Method        | `POST`          |
| Auth required | Yes             |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Request Body:**

| Field     | Type   | Required | Description                                |
| :-------- | :----- | :------- | :----------------------------------------- |
| `comment` | string | No       | Optional approval comment (max 1000 chars) |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Phê duyệt chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "status": "ACTIVE",
        "approverId": "admin-1",
        "adminComment": "Chiến dịch phù hợp"
    }
}
```

**Error Response (403 Forbidden):**

```json
{
    "success": false,
    "message": "Chỉ Đoàn trường có quyền phê duyệt chiến dịch"
}
```

---

### 9. Reject Campaign

Reject a pending campaign. Only DOANTRUONG can reject. Changes status from `PENDING` to `REJECTED`.

| Property      | Value          |
| :------------ | :------------- |
| URL           | `/{id}/reject` |
| Method        | `POST`         |
| Auth required | Yes            |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Request Body:**

| Field     | Type   | Required | Description                          |
| :-------- | :----- | :------- | :----------------------------------- |
| `comment` | string | Yes      | Rejection reason (1-1000 characters) |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Từ chối chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "status": "REJECTED",
        "approverId": "admin-1",
        "adminComment": "Kế hoạch chưa chi tiết"
    }
}
```

---

### 10. Complete Campaign

Mark an active campaign as completed. Changes status from `ACTIVE` to `COMPLETED`.

| Property      | Value            |
| :------------ | :--------------- |
| URL           | `/{id}/complete` |
| Method        | `POST`           |
| Auth required | Yes              |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Request Body:**

| Field         | Type     | Required | Description                   |
| :------------ | :------- | :------- | :---------------------------- |
| `eventPhotos` | string[] | No       | Array of URLs to event photos |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Đánh dấu hoàn thành chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "status": "COMPLETED"
    }
}
```

**Error Response (400 Bad Request):**

```json
{
    "success": false,
    "message": "Chiến dịch không ở trạng thái hoạt động"
}
```

---

### 11. Cancel Campaign

Cancel an active campaign. Changes status from `ACTIVE` to `CANCELLED`.

| Property      | Value          |
| :------------ | :------------- |
| URL           | `/{id}/cancel` |
| Method        | `POST`         |
| Auth required | Yes            |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Hủy chiến dịch thành công",
    "data": {
        "id": "campaign-1",
        "status": "CANCELLED"
    }
}
```

---

### 12. Upload Plan File

Upload a plan file URL for a campaign. Only allowed when status is `DRAFT` or `PENDING`.

| Property      | Value             |
| :------------ | :---------------- |
| URL           | `/{id}/plan-file` |
| Method        | `POST`            |
| Auth required | Yes               |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Request Body:**

| Field         | Type   | Required | Description                |
| :------------ | :----- | :------- | :------------------------- |
| `planFileUrl` | string | Yes      | Valid URL to the plan file |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Upload file kế hoạch thành công",
    "data": {
        "id": "campaign-1",
        "planFileUrl": "https://example.com/plan.pdf"
    }
}
```

---

### 13. Upload Budget File

Upload a budget file URL for a campaign. Only allowed when status is `DRAFT` or `PENDING`.

| Property      | Value               |
| :------------ | :------------------ |
| URL           | `/{id}/budget-file` |
| Method        | `POST`              |
| Auth required | Yes                 |

**URL Parameters:**

| Parameter | Type   | Required | Description            |
| :-------- | :----- | :------- | :--------------------- |
| `id`      | string | Yes      | The ID of the campaign |

**Request Body:**

| Field           | Type   | Required | Description                  |
| :-------------- | :----- | :------- | :--------------------------- |
| `budgetFileUrl` | string | Yes      | Valid URL to the budget file |

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Upload file dự trù ngân sách thành công",
    "data": {
        "id": "campaign-1",
        "budgetFileUrl": "https://example.com/budget.xlsx"
    }
}
```

---

## Error Handling

All error responses follow the standardized response format.

### Common Error Responses

| Status | Description                                      | Example Response                                                       |
| :----- | :----------------------------------------------- | :--------------------------------------------------------------------- |
| 400    | Bad Request - Invalid input or status transition | `{"success": false, "message": "Chiến dịch không ở trạng thái DRAFT"}` |
| 401    | Unauthorized - Missing or invalid token          | `{"success": false, "message": "Chưa xác thực người dùng"}`            |
| 403    | Forbidden - Insufficient permissions             | `{"success": false, "message": "Bạn không có quyền tạo chiến dịch"}`   |
| 404    | Resource not found                               | `{"success": false, "message": "Không tìm thấy chiến dịch"}`           |
| 500    | Internal server error                            | `{"success": false, "message": "Internal server error"}`               |

---

## Usage Examples

### Create a university-level campaign

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Chiến dịch tình nguyện mùa hè",
    "description": "Chiến dịch tình nguyện giúp đỡ trẻ em vùng cao",
    "scope": "TRUONG"
  }'
```

### Create a faculty-level campaign

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Chiến dịch khoa CNTT",
    "description": "Chiến dịch tình nguyện của khoa CNTT",
    "scope": "KHOA",
    "facultyId": "102"
  }'
```

### Get all campaigns with filters

```bash
curl -X GET \
  'https://api.example.com/api/v1/campaigns?status=ACTIVE&scope=TRUONG&page=1&limit=5' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Submit campaign for approval

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns/campaign-1/submit \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Approve campaign (DOANTRUONG only)

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns/campaign-1/approve \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "comment": "Chiến dịch phù hợp, đồng ý phê duyệt"
  }'
```

### Reject campaign (DOANTRUONG only)

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns/campaign-1/reject \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "comment": "Kế hoạch chưa chi tiết, cần bổ sung thêm"
  }'
```

### Upload plan file

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns/campaign-1/plan-file \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "planFileUrl": "https://storage.example.com/plans/campaign-plan.pdf"
  }'
```

### Complete campaign with event photos

```bash
curl -X POST \
  https://api.example.com/api/v1/campaigns/campaign-1/complete \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventPhotos": [
      "https://storage.example.com/photos/photo1.jpg",
      "https://storage.example.com/photos/photo2.jpg"
    ]
  }'
```

---

## HTTP Status Codes

| Code | Description           |
| :--- | :-------------------- |
| 200  | OK - Success          |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 500  | Internal Server Error |
