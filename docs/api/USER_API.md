# User Provisioning API

> Base URL: `/api/v1/users`

## Overview

This module is for internal account provisioning. It is not a public self-registration flow.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Yes | `DOANTRUONG` | Create a new account for `CLB`, `LCD`, or `DOANTRUONG` |

## Common Errors

- `400 Bad Request` when required fields are missing or invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller is not `DOANTRUONG`.
- `409 Conflict` when the username or email already exists.

## Create User

`POST /api/v1/users`

Input

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "CLB | LCD | DOANTRUONG",
  "facultyId": 1
}
```

Notes:
- `facultyId` is optional.
- This endpoint exists to reflect the actual business process where `DOANTRUONG` provisions accounts for other roles.

Output

- The created user record returned by the service layer.
- The response uses the standard `ApiResponse.success` envelope.

Errors

- `400` if the payload is invalid.
- `403` if the caller does not have `DOANTRUONG`.
- `409` if the username or email is already in use.
