# Club API

> Base URL: `/api/v1/clubs`

## Overview

Clubs are managed by `DOANTRUONG` and can be listed or retrieved by authenticated users.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Yes | `DOANTRUONG` | Create a club |
| `PUT` | `/:id` | Yes | `DOANTRUONG` | Update a club |
| `DELETE` | `/:id` | Yes | `DOANTRUONG` | Delete a club |
| `GET` | `/` | Yes | Authenticated | List clubs |
| `GET` | `/:id` | Yes | Authenticated | Get one club |

## Common Errors

- `400 Bad Request` when the payload is invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller is not `DOANTRUONG` for mutations.
- `404 Not Found` when the club or referenced leader does not exist.

## Create Club

`POST /api/v1/clubs`

Input

```json
{
  "name": "string",
  "facultyId": 1,
  "leaderId": "string"
}
```

Output

- The created club object, including any resolved faculty or leader relation.

Errors

- `403` if the caller is not `DOANTRUONG`.
- `404` if `leaderId` is provided but the user does not exist.

## Update Club

`PUT /api/v1/clubs/:id`

Input

```json
{
  "name": "string",
  "facultyId": 1,
  "leaderId": "string"
}
```

Output

- The updated club object.

Errors

- `403` if the caller is not `DOANTRUONG`.
- `404` if the club does not exist.

## Delete Club

`DELETE /api/v1/clubs/:id`

Output

- `success: true` with a null payload.

Errors

- `403` if the caller is not `DOANTRUONG`.
- `404` if the club does not exist.

## List Clubs

`GET /api/v1/clubs`

Input

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `facultyId` | number | - | Filter by faculty |
| `search` | string | - | Search by club name |

Output

- Paginated club list: `{ data: ClubDetail[], meta: { total, page, limit, totalPages } }`.

## Club Detail

`GET /api/v1/clubs/:id`

Input

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | Club ID |

Output

- A single club object. The response may include nested `faculty` and `leader` data.

Errors

- `404` if the club does not exist.
