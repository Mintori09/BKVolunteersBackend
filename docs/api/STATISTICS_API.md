# Statistics API

> Base URL: `/api/v1/statistics`

## Overview

This module exposes aggregated statistics for privileged users.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/system` | Yes | `DOANTRUONG` | Return system-wide statistics |

## Common Errors

- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller is not `DOANTRUONG`.

## System Statistics

`GET /api/v1/statistics/system`

Returns aggregated counters for the platform, such as total users, campaigns, and donation-related totals.

Output

- The aggregated system statistics object returned by the service layer.

Errors

- `401` if the caller is not authenticated.
- `403` if the caller is not `DOANTRUONG`.
