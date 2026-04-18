# Donation API Documentation

This document outlines the API endpoints for the Donation module.

## General Information

- **Base URL**: `/donations`
- **Authentication**: Most endpoints require a Bearer Token in the Authorization header.
- **Content-Type**: `application/json`

---

## Endpoints

### 1. Submit Money Donation

Submits a new money donation with proof. Restricted to students (`SINHVIEN`).

- **URL**: `/money`
- **Method**: `POST`
- **Auth Required**: Yes (`SINHVIEN`)

**Request Body**

| Field           | Type   | Description                         | Constraints        |
| --------------- | ------ | ----------------------------------- | ------------------ |
| `moneyPhaseId`  | number | The ID of the money donation phase. | Integer, positive. |
| `amount`        | number | The amount of money donated.        | Number, positive.  |
| `proofImageUrl` | string | URL of the proof image.             | Valid URL string.  |

**Success Response**

- **Code**: `201 CREATED`
- **Content**:
    ```json
    {
      "statusCode": 201,
      "message": "Đóng góp đã được ghi nhận, chờ xác thực",
      "data": { ...donationObject }
    }
    ```

**Error Response**

- `401 Unauthorized`: User not authenticated.
- `403 Forbidden`: User does not have permission (e.g., not a student).
- `404 Not Found`: Money phase not found.
- `400 Bad Request`: Validation error or Campaign not active.

---

### 2. Reject Donation

Rejects a pending donation. Restricted to `CLB`, `LCD`, `DOANTRUONG`.

- **URL**: `/:id/reject`
- **Method**: `POST`
- **Auth Required**: Yes (`CLB`, `LCD`, `DOANTRUONG`)

**URL Parameters**

| Field | Type   | Description      |
| ----- | ------ | ---------------- |
| `id`  | string | The donation ID. |

**Request Body**

| Field    | Type   | Description           | Constraints                    |
| -------- | ------ | --------------------- | ------------------------------ |
| `reason` | string | Reason for rejection. | Required, min 1 char, max 500. |

**Success Response**

- **Code**: `200 OK`
- **Content**:
    ```json
    {
      "statusCode": 200,
      "message": "Đã từ chối đóng góp",
      "data": { ...updatedDonationObject }
    }
    ```

**Error Response**

- `400 Bad Request`: Donation is not in `PENDING` status.
- `403 Forbidden`: User does not have permission to process this donation.
- `404 Not Found`: Donation or Campaign not found.

---

### 3. Verify Donation

Verifies a pending donation with an actual amount. Restricted to `CLB`, `LCD`, `DOANTRUONG`.

- **URL**: `/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (`CLB`, `LCD`, `DOANTRUONG`)

**URL Parameters**

| Field | Type   | Description      |
| ----- | ------ | ---------------- |
| `id`  | string | The donation ID. |

**Request Body**

| Field            | Type   | Description                           | Constraints           |
| ---------------- | ------ | ------------------------------------- | --------------------- |
| `verifiedAmount` | number | The actual verified amount.           | Optional, min 0.      |
| `points`         | number | Points to award (for item donations). | Optional, int, min 0. |

**Success Response**

- **Code**: `200 OK`
- **Content**:
    ```json
    {
      "statusCode": 200,
      "message": "Đã xác thực đóng góp",
      "data": { ...updatedDonationObject }
    }
    ```

**Logic Details**

- If the donation is a money donation, points are calculated as `verifiedAmount / 10000`.
- If the donation is an item donation, points default to 5 or use the provided `points` value.
- Updates the campaign's current amount if it's a money donation.

**Error Response**

- `400 Bad Request`: Donation is not in `PENDING` status.
- `403 Forbidden`: User does not have permission.
- `404 Not Found`: Donation or Campaign not found.

---

### 4. Get My Donations

Retrieves the donation history for the logged-in student. Restricted to `SINHVIEN`.

- **URL**: `/me`
- **Method**: `GET`
- **Auth Required**: Yes (`SINHVIEN`)

**Query Parameters**

| Field    | Type   | Description                                          |
| -------- | ------ | ---------------------------------------------------- |
| `status` | string | Filter by status: `PENDING`, `VERIFIED`, `REJECTED`. |
| `page`   | string | Page number (default: 1).                            |
| `limit`  | string | Items per page (default: 10).                        |

**Success Response**

- **Code**: `200 OK`
- **Content**:
    ```json
    {
      "statusCode": 200,
      "data": {
        "donations": [
          {
            "id": "uuid",
            "amount": "string",
            "verifiedAmount": "string | null",
            "status": "PENDING | VERIFIED | REJECTED",
            ...
          }
        ],
        "meta": {
          "total": 100,
          "page": 1,
          "limit": 10,
          "totalPages": 10
        }
      }
    }
    ```

---

### 5. Get Donations for Admin

Retrieves a list of donations for administrative view. Restricted to `CLB`, `LCD`, `DOANTRUONG`.

- **URL**: `/admin`
- **Method**: `GET`
- **Auth Required**: Yes (`CLB`, `LCD`, `DOANTRUONG`)

**Query Parameters**

| Field       | Type   | Description                                          |
| ----------- | ------ | ---------------------------------------------------- |
| `status`    | string | Filter by status: `PENDING`, `VERIFIED`, `REJECTED`. |
| `phaseType` | string | Filter by type: `money`, `item`.                     |
| `studentId` | string | Filter by specific student ID.                       |
| `page`      | string | Page number (default: 1).                            |
| `limit`     | string | Items per page (default: 20).                        |

**Success Response**

- **Code**: `200 OK`
- **Content**:
    ```json
    {
      "statusCode": 200,
      "data": {
        "donations": [
          {
            "id": "uuid",
            "student": { "id": "...", "mssv": "...", "fullName": "..." },
            "moneyPhase": { ... },
            "itemPhase": { ... },
            ...
          }
        ],
        "meta": { ... }
      }
    }
    ```
