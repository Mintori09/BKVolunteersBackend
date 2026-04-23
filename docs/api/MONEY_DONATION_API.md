# Money Donation API

> Base URLs:
>
> - `/api/v1/campaigns/:campaignId/money-phases`
> - `/api/v1/money-phases`

The router also exposes `GET /api/v1/money-phases/:phaseId/donations` for phase-level donation listing.

## Overview

This module manages money donation phases, their progress, and the donations inside each phase.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Create a money donation phase |
| `GET` | `/:phaseId` | Yes | Authenticated | Get one money donation phase |
| `PUT` | `/:phaseId` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Update a money donation phase |
| `DELETE` | `/:phaseId` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Delete a money donation phase |
| `GET` | `/:phaseId/progress` | Yes | Authenticated | Get phase progress |
| `GET` | `/api/v1/money-phases/:phaseId/donations` | Yes | `CLB`, `LCD`, `DOANTRUONG` | List donations in a phase |

## Common Errors

- `400 Bad Request` when the payload or pagination filter is invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller does not have the required role.
- `404 Not Found` when the campaign or phase does not exist.

## Create Money Phase

`POST /api/v1/campaigns/:campaignId/money-phases`

Input

```json
{
  "targetAmount": 1000000,
  "bankAccountNo": "1234567890",
  "bankAccountName": "CLB ABC",
  "bankCode": "VCB",
  "startDate": "2026-04-22T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z"
}
```

Output

- The created money phase object.

## Money Phase Detail

`GET /api/v1/campaigns/:campaignId/money-phases/:phaseId`

Output

- A single money phase object.

## Update Money Phase

`PUT /api/v1/campaigns/:campaignId/money-phases/:phaseId`

Input

```json
{
  "targetAmount": 1000000,
  "bankAccountNo": "1234567890",
  "bankAccountName": "CLB ABC",
  "bankCode": "VCB",
  "startDate": "2026-04-22T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z"
}
```

Output

- The updated money phase object.

## Delete Money Phase

`DELETE /api/v1/campaigns/:campaignId/money-phases/:phaseId`

Output

- `success: true` with a null payload.

## Progress

`GET /api/v1/campaigns/:campaignId/money-phases/:phaseId/progress`

Output

```json
{
  "phaseId": 1,
  "targetAmount": "string",
  "currentAmount": "string",
  "percentage": 0,
  "totalDonations": 0,
  "verifiedDonations": 0,
  "pendingDonations": 0,
  "rejectedDonations": 0,
  "recentDonations": []
}
```

## Donations in Phase

`GET /api/v1/money-phases/:phaseId/donations`

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by donation status |
| `page` | number | Page number |
| `limit` | number | Items per page |

Output

- Paginated donation list: `{ donations: DonationOutput[], meta: { total, page, limit, totalPages } }`.
