# Item Donation API

> Base URLs:
>
> - `/api/v1/donations/items`
> - `/api/v1/item-phases/items`
> - `/api/v1/donations/:phaseId/donations`
> - `/api/v1/item-phases/:phaseId/donations`

## Overview

The same handlers are mounted under two prefixes. Use the prefix that matches the rest of the caller's flow.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/donations/items` | Yes | `SINHVIEN` | Submit an item donation |
| `POST` | `/item-phases/items` | Yes | `SINHVIEN` | Submit an item donation |
| `GET` | `/donations/:phaseId/donations` | Yes | Creator only | List donations for an item phase |
| `GET` | `/item-phases/:phaseId/donations` | Yes | Creator only | List donations for an item phase |
| `POST` | `/donations/:id/verify` | Yes | Creator only | Verify an item donation |
| `POST` | `/item-phases/:id/verify` | Yes | Creator only | Verify an item donation |

## Common Errors

- `400 Bad Request` when the payload or filter is invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller is not allowed to review the donation.
- `404 Not Found` when the phase or donation does not exist.

## Submit Item Donation

`POST /api/v1/donations/items`

Input

```json
{
  "itemPhaseId": 1,
  "itemDescription": "string",
  "proofImageUrl": "https://example.com/proof.jpg"
}
```

Output

- The created item donation object.

Errors

- `400` if required fields are missing or invalid.
- `401` if the caller is not authenticated.
- `403` if the caller is not `SINHVIEN`.

## List Donations for Phase

`GET /api/v1/donations/:phaseId/donations`

Output

- Paginated item donation list for the given phase.

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by donation status |
| `page` | number | Page number |
| `limit` | number | Items per page |

## Verify Item Donation

`POST /api/v1/donations/:id/verify`

Input

```json
{
  "points": 5
}
```

Output

- The updated item donation object.

Notes

- `points` is optional.
- A successful verification creates a notification for the donor.
