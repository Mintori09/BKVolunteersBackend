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

### Signup

Creates a new user account.

- **URL:** `/auth/signup`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "firstName": "Example",
        "lastName": "User",
        "username": "example_user",
        "email": "user@example.com",
        "password": "password123",
        "passwordConfirmed": "password123"
    }
    ```
- **Responses:**
    - `201 Created`: User created successfully.
    - `400 Bad Request`: Missing fields or passwords do not match.
    - `409 Conflict`: User already exists.

### Login

Authenticates a user and returns an access token.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "password123"
    }
    ```
- **Responses:**
    - `200 OK`: Returns `accessToken` in `data` and sets `refresh_token` cookie.
    - `401 Unauthorized`: Invalid credentials or email not verified.

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

## 3. Verify Email Feature

### Send Verification Email

Sends a new verification email to the user.

- **URL:** `/verify-email/send-verification-email`
- **Method:** `POST`
- **Request Body:**
    ```json
    {
        "email": "user@example.com"
    }
    ```
- **Responses:**
    - `200 OK`: Verification email sent.
    - `400 Bad Request`: Email missing or token already sent.
    - `404 Not Found`: Email not found.
    - `409 Conflict`: Email already verified.

### Verify Email

Verifies a user's email using a token.

- **URL:** `/verify-email/:token`
- **Method:** `GET`
- **URL Parameters:** `token` (Required)
- **Responses:**
    - `200 OK`: Returns an HTML success page.
    - `400 Bad Request`: Returns an HTML error page (Invalid link).
    - `410 Gone`: Returns an HTML error page (Token expired).
