# API Documentation

Base URL: `/api/v1`

## Standardized Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
    "success": true,
    "message": "Success message",
    "data": { ... }
}
```

### Paginated Success Response

```json
{
    "success": true,
    "message": "Success message",
    "data": [...],
    "meta": {
        "total": 100,
        "page": 1,
        "limit": 10,
        "totalPages": 10
    }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error message",
    "stack": "..." // Only in development mode
}
```

## Standard Query Parameters

For endpoints that support listing multiple items, the following query parameters are supported:

| Parameter   | Type     | Description                      | Default     |
| :---------- | :------- | :------------------------------- | :---------- |
| `page`      | `number` | The page number to retrieve      | `1`         |
| `limit`     | `number` | Number of items per page         | `10`        |
| `sortBy`    | `string` | Field name to sort by            | `createdAt` |
| `sortOrder` | `string` | Sort direction (`asc` or `desc`) | `desc`      |
| `search`    | `string` | Search query string              | -           |

**Example:**
`GET /api/v1/users?page=2&limit=5&sortBy=firstName&sortOrder=asc&search=john`

## 1. Auth Feature

### Login

Authenticates a user and returns an access token.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "username": "201xxxxxx",
        "password": "password123"
    }
    ```
    > Note: `username` can be either MSSV (9 digits starting with 1) or email address.
- **Responses:**
    - `200 OK`: Returns `accessToken` in `data` and sets `refresh_token` cookie.
    - `401 Unauthorized`: Invalid credentials.

### Get Me

Returns the currently authenticated user's information.

- **URL:** `/auth/me`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <access_token>`
- **Responses:**
    - `200 OK`: Returns user object in `data`.
    - `401 Unauthorized`: Not authenticated.

### Logout

Invalidates the user session.

- **URL:** `/auth/logout`
- **Method:** `POST`
- **Cookies:** `refresh_token` (Required)
- **Responses:**
    - `204 No Content`: Logged out successfully.

### Refresh Token

Generates a new access token using a refresh token.

- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Cookies:** `refresh_token` (Required)
- **Responses:**
    - `200 OK`: Returns new `accessToken` and sets a new `refresh_token` cookie.
    - `401 Unauthorized`: No refresh token provided.
    - `403 Forbidden`: Invalid or expired refresh token.

### Change Password

Changes the authenticated user's password.

- **URL:** `/auth/change-password`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body:**
    ```json
    {
        "oldPassword": "current_password",
        "newPassword": "new_secure_password",
        "newPasswordConfirm": "new_secure_password"
    }
    ```
- **Responses:**
    - `200 OK`: Password changed successfully.
    - `400 Bad Request`: Passwords don't match or validation failed.
    - `401 Unauthorized`: Not authenticated or incorrect old password.

---

## 2. Forgot Password Feature

### Forgot Password

Sends a password reset email.

- **URL:** `/password/forgot-password`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "email": "user@example.com"
    }
    ```
- **Responses:**
    - `200 OK`: Reset email sent.
    - `400 Bad Request`: Email missing.
    - `401 Unauthorized`: Email not verified.

### Reset Password

Resets the user's password using a valid token.

- **URL:** `/password/reset-password/:token`
- **Method:** `POST`
- **URL Parameters:** `token` (Required)
- **Request Body:**
    ```json
    {
        "newPassword": "new_secure_password"
    }
    ```
- **Responses:**
    - `200 OK`: Password reset successful.
    - `400 Bad Request`: New password missing.
    - `404 Not Found`: Token missing, invalid, or expired.

---
