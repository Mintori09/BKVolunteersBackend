# Auth API

> Base URL: `/api/v1/auth`

## Overview

Authentication is shared by student and staff accounts. Login and refresh return an access token in the response body and keep the refresh token in a cookie.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/login` | No | Login with `username` and `password` |
| `POST` | `/logout` | Yes | Invalidate the current session |
| `POST` | `/refresh` | No | Refresh access token |
| `GET` | `/me` | Yes | Get the current principal |
| `PATCH` | `/change-password` | Yes | Change the password for the current account |

## Common Errors

- `400 Bad Request` when required input is missing or invalid.
- `401 Unauthorized` when credentials or the access token are missing or invalid.
- `403 Forbidden` when a refresh token is invalid or belongs to a different user.
- `404 Not Found` when the current account cannot be loaded.

## Login

`POST /api/v1/auth/login`

Input

```json
{
  "username": "string",
  "password": "string"
}
```

Notes:
- `username` can be an email or a student ID depending on account type.
- The route is shared by student and user accounts.

Output

```json
{
  "accessToken": "string"
}
```

Errors

- `400` if `username` or `password` is missing.
- `401` if the credentials do not match.

## Logout

`POST /api/v1/auth/logout`

Marks the current session as invalid.

Output

- `204 No Content`.

Errors

- None for authenticated callers.

## Refresh

`POST /api/v1/auth/refresh`

Exchanges a refresh token for a new access token.

Output

```json
{
  "accessToken": "string"
}
```

Errors

- `401` if the refresh cookie is missing.
- `403` if the refresh token is invalid, expired, or does not belong to the caller.

## Me

`GET /api/v1/auth/me`

Returns the authenticated principal and role-specific profile data.

Output

- For staff accounts, the payload matches `UserMeOutput`.
- For student accounts, the payload matches `StudentMeOutput`.

Errors

- `401` if the request is not authenticated.
- `404` if the account cannot be found.

## Change Password

`PATCH /api/v1/auth/change-password`

Input

```json
{
  "oldPassword": "string",
  "newPassword": "string",
  "newPasswordConfirm": "string"
}
```

Output

```json
{
  "message": "string"
}
```

Errors

- `400` if the new password confirmation does not match.
- `401` if the account is not authenticated.
- `403` if the current password is incorrect.
