# Donation API

> Base URL: `/api/v1/donations`

## Overview

This module handles money donation submissions and the admin review workflow.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/money` | Yes | `SINHVIEN` | Submit a money donation |
| `POST` | `/:id/reject` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Reject a donation |
| `PUT` | `/:id` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Verify a donation |
| `GET` | `/me` | Yes | `SINHVIEN` | List the current student's donations |
| `GET` | `/admin` | Yes | `CLB`, `LCD`, `DOANTRUONG` | List donations for admin review |

## Common Errors

- `400 Bad Request` when the payload or filter is invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller does not have the required role.
- `404 Not Found` when the donation or donation phase does not exist.
- `409 Conflict` when the donation is not in a reviewable state.

## Submit Money Donation

`POST /api/v1/donations/money`

Input

```json
{
  "moneyPhaseId": 1,
  "amount": 100000,
  "proofImageUrl": "https://example.com/proof.jpg"
}
```

Output

- The created donation record with its initial status.

Errors

- `400` if required fields are missing or invalid.
- `401` if the caller is not authenticated.
- `403` if the caller is not `SINHVIEN`.

## Reject Donation

`POST /api/v1/donations/:id/reject`

Input

```json
{
  "reason": "string"
}
```

Output

- The updated donation record.

Errors

- `403` if the caller is not allowed to review donations.
- `404` if the donation does not exist.

Notes

- Rejecting a donation creates a notification for the donor.

## Verify Donation

`PUT /api/v1/donations/:id`

Input

```json
{
  "verifiedAmount": 100000
}
```

Output

- The updated donation record.

Errors

- `403` if the caller is not allowed to review donations.
- `404` if the donation does not exist.

Notes

- Verifying a donation creates a notification for the donor.

## My Donations

`GET /api/v1/donations/me`

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by `PENDING`, `VERIFIED`, or `REJECTED` |
| `page` | string | Page number |
| `limit` | string | Items per page |

Output

- Paginated donation list: `{ donations: DonationWithPhase[], meta: { total, page, limit, totalPages } }`.

## Admin Donations

`GET /api/v1/donations/admin`

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by donation status |
| `phaseType` | string | Filter by `money` or `item` |
| `studentId` | string | Filter by student ID |
| `page` | string | Page number |
| `limit` | string | Items per page |

Output

- Paginated donation list for administrative review.
