# Campaign API

> Base URL: `/api/v1/campaigns`

## Overview

Campaigns are the core workflow entity. They move through draft, review, active, completed, and cancelled states. Creator-only actions are enforced at the service layer.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Create a campaign |
| `GET` | `/` | Yes | Authenticated | List campaigns with filters |
| `GET` | `/available` | Yes | Authenticated | List campaigns available for students |
| `GET` | `/:id` | Yes | Authenticated | Get one campaign |
| `GET` | `/:id/statistics` | Yes | Authenticated | Get campaign statistics |
| `PUT` | `/:id` | Yes | Creator only | Update a campaign |
| `DELETE` | `/:id` | Yes | Creator only | Delete a campaign |
| `POST` | `/:id/submit` | Yes | Creator only | Submit a campaign for approval |
| `POST` | `/:id/approve` | Yes | `DOANTRUONG` | Approve a campaign |
| `POST` | `/:id/reject` | Yes | `DOANTRUONG` | Reject a campaign |
| `POST` | `/:id/complete` | Yes | Creator only | Mark a campaign as completed |
| `POST` | `/:id/cancel` | Yes | Creator only | Cancel a campaign |
| `POST` | `/:id/plan-file` | Yes | Creator only | Attach a plan file |
| `POST` | `/:id/budget-file` | Yes | Creator only | Attach a budget file |

## Common Errors

- `400 Bad Request` when the payload is invalid or the state transition is not allowed.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller does not own the campaign or lacks the required role.
- `404 Not Found` when the campaign does not exist.
- `409 Conflict` when the workflow state prevents the requested action.

## Create Campaign

`POST /api/v1/campaigns`

Input

```json
{
  "title": "string",
  "description": "string",
  "scope": "KHOA | TRUONG",
  "facultyId": 1
}
```

Output

- The created campaign object, including the generated `id` and workflow fields.

Errors

- `400` if required fields are missing or `facultyId` is invalid for the chosen scope.
- `401` if the caller is not authenticated.
- `403` if the caller is not allowed to create campaigns.

Notes

- `facultyId` is required when `scope` is `KHOA`.
- Only `CLB`, `LCD`, and `DOANTRUONG` can create campaigns.

## List Campaigns

`GET /api/v1/campaigns`

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by campaign status |
| `scope` | string | Filter by campaign scope |
| `facultyId` | string | Filter by faculty ID |
| `creatorId` | string | Filter by creator ID |
| `page` | number | Page number |
| `limit` | number | Items per page |

Output

- Paginated campaign list: `{ campaigns: CampaignOutput[], meta: { total, page, limit, totalPages } }`.

Errors

- `401` if the caller is not authenticated.

## Available Campaigns

`GET /api/v1/campaigns/available`

Output

- Paginated list of campaigns available for student participation or donation.

Errors

- `401` if the caller is not authenticated.

## Campaign Detail

`GET /api/v1/campaigns/:id`

Input

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | Campaign ID |

Output

- A single campaign object. The response may include `creator` and `approver` sub-objects when available.

Errors

- `401` if the caller is not authenticated.
- `404` if the campaign does not exist.

## Campaign Statistics

`GET /api/v1/campaigns/:id/statistics`

Input

| Name | Type | Description |
| --- | --- | --- |
| `id` | string | Campaign ID |

Output

- Aggregated campaign-level totals such as donation counts, donation amounts, event counts, and participant counts.

Errors

- `401` if the caller is not authenticated.
- `404` if the campaign does not exist.

## Update Campaign

`PUT /api/v1/campaigns/:id`

Input

```json
{
  "title": "string",
  "description": "string"
}
```

Output

- The updated campaign object.

Errors

- `401` if the caller is not authenticated.
- `403` if the caller is not the campaign creator.
- `404` if the campaign does not exist.

## Delete Campaign

`DELETE /api/v1/campaigns/:id`

Output

- `success: true` with a null payload.

Errors

- `401` if the caller is not authenticated.
- `403` if the caller is not the campaign creator.
- `404` if the campaign does not exist.

## Workflow Actions

The following endpoints move a campaign through its lifecycle:

- `POST /api/v1/campaigns/:id/submit`
- `POST /api/v1/campaigns/:id/approve`
- `POST /api/v1/campaigns/:id/reject`
- `POST /api/v1/campaigns/:id/complete`
- `POST /api/v1/campaigns/:id/cancel`

Input

| Endpoint | Body |
| --- | --- |
| `/submit` | No body |
| `/approve` | `{ "comment": "string" }` |
| `/reject` | `{ "comment": "string" }` |
| `/complete` | `{ "eventPhotos": ["string"] }` |
| `/cancel` | No body |

Output

- The updated campaign object after the status transition.

Errors

- `401` if the caller is not authenticated.
- `403` if the caller is not the required role or not the creator.
- `404` if the campaign does not exist.
- `409` if the current campaign status does not allow the transition.

Notes

- These actions may emit notifications for the creator or related users.
- `approve` and `reject` are limited to `DOANTRUONG`.

## File Attachments

`POST /api/v1/campaigns/:id/plan-file`

`POST /api/v1/campaigns/:id/budget-file`

Input

```json
{
  "planFileUrl": "string"
}
```

```json
{
  "budgetFileUrl": "string"
}
```

Output

- The updated campaign object with the attached file URL.

Errors

- `401` if the caller is not authenticated.
- `403` if the caller is not the campaign creator.
- `404` if the campaign does not exist.
