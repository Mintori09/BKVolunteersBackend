# Club API Documentation

This document outlines the API endpoints for managing Clubs (Câu lạc bộ).

## Endpoints

### 1. Create Club

Creates a new club.

- **URL**: `/`
- **Method**: `POST`
- **Auth Required**: Yes (Bearer Token)
- **Permissions Required**: `DOANTRUONG`

**Request Body**

| Field       | Type   | Required | Constraints       | Description             |
| ----------- | ------ | -------- | ----------------- | ----------------------- |
| `name`      | string | Yes      | min: 1, max: 255  | Name of the club        |
| `facultyId` | number | No       | integer, positive | ID of the faculty       |
| `leaderId`  | string | No       | min: 1            | ID of the user (leader) |

**Success Response**

- **Code**: `201 CREATED`
- **Content**: The created club object.

**Error Responses**

- **Code**: `404 NOT FOUND` - Leader user not found.
- **Code**: `400 BAD REQUEST` - Validation error.

---

### 2. Update Club

Updates an existing club by ID.

- **URL**: `/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Bearer Token)
- **Permissions Required**: `DOANTRUONG`

**URL Parameters**

| Field | Type   | Description        |
| ----- | ------ | ------------------ |
| `id`  | string | The ID of the club |

**Request Body**

| Field       | Type   | Required | Constraints                 | Description             |
| ----------- | ------ | -------- | --------------------------- | ----------------------- |
| `name`      | string | No       | min: 1, max: 255            | Name of the club        |
| `facultyId` | number | No       | integer, positive, nullable | ID of the faculty       |
| `leaderId`  | string | No       | min: 1, nullable            | ID of the user (leader) |

**Success Response**

- **Code**: `200 OK`
- **Content**: The updated club object.

**Error Responses**

- **Code**: `404 NOT FOUND` - Club not found.

---

### 3. Delete Club

Soft deletes a club by ID.

- **URL**: `/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Bearer Token)
- **Permissions Required**: `DOANTRUONG`

**URL Parameters**

| Field | Type   | Description        |
| ----- | ------ | ------------------ |
| `id`  | string | The ID of the club |

**Success Response**

- **Code**: `200 OK`
- **Content**: `null`
- **Message**: "Xóa CLB thành công"

**Error Responses**

- **Code**: `404 NOT FOUND` - Club not found.

---

### 4. Get All Clubs

Retrieves a paginated list of clubs.

- **URL**: `/`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)

**Query Parameters**

| Field       | Type   | Default | Constraints              | Description          |
| ----------- | ------ | ------- | ------------------------ | -------------------- |
| `page`      | number | 1       | integer, min: 1          | Page number          |
| `limit`     | number | 20      | integer, min: 1, max: 50 | Items per page       |
| `facultyId` | number | -       | integer, positive        | Filter by faculty ID |
| `search`    | string | -       | max: 100                 | Search by club name  |

**Success Response**

- **Code**: `200 OK`
- **Content**: Paginated list of clubs.

---

### 5. Get Club By ID

Retrieves a specific club by ID.

- **URL**: `/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Bearer Token)

**URL Parameters**

| Field | Type   | Description        |
| ----- | ------ | ------------------ |
| `id`  | string | The ID of the club |

**Success Response**

- **Code**: `200 OK`
- **Content**: The club object including faculty and leader details.

**Error Responses**

- **Code**: `404 NOT FOUND` - Club not found.
