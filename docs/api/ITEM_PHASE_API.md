# Item Phase API

> Base URL: `/api/v1/campaigns/:campaignId/item-phases`

## Overview

This module manages item-donation phases scoped to a campaign.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/` | Yes | Creator only | Create an item donation phase |
| `GET` | `/` | Yes | Authenticated | List item phases for a campaign |
| `PUT` | `/:phaseId` | Yes | Creator only | Update an item donation phase |
| `DELETE` | `/:phaseId` | Yes | Creator only | Delete an item donation phase |

## Common Errors

- `400 Bad Request` when the payload or dates are invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller is not the campaign creator.
- `404 Not Found` when the campaign or phase does not exist.

## Create Item Phase

`POST /api/v1/campaigns/:campaignId/item-phases`

Input

```json
{
  "acceptedItems": ["SACH", "VAN PHONG PHAM"],
  "collectionAddress": "string",
  "startDate": "2026-04-22T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z"
}
```

Output

- The created item phase object.

## List Item Phases

`GET /api/v1/campaigns/:campaignId/item-phases`

Output

- A list of item phase objects for the campaign.

## Update Item Phase

`PUT /api/v1/campaigns/:campaignId/item-phases/:phaseId`

Input

```json
{
  "acceptedItems": ["SACH", "VAN PHONG PHAM"],
  "collectionAddress": "string",
  "startDate": "2026-04-22T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z"
}
```

Output

- The updated item phase object.

## Delete Item Phase

`DELETE /api/v1/campaigns/:campaignId/item-phases/:phaseId`

Output

- `success: true` with a null payload.
