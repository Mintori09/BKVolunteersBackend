# Notification API

> Base URL: `/api/v1/notifications`

## Overview

Notifications are created automatically by workflow events such as campaign approval, donation verification, participant moderation, and certificate delivery.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/me` | Yes | List notifications for the current principal |
| `PUT` | `/:id/read` | Yes | Mark one notification as read |
| `PUT` | `/read-all` | Yes | Mark all notifications as read |

## Common Errors

- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the notification belongs to another principal.
- `404 Not Found` when a notification does not exist.

## List My Notifications

`GET /api/v1/notifications/me`

Input

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page, max `50` |

Output

- A paginated notification list with `data` and `meta`.

Errors

- `401` if the caller is not authenticated.

## Mark One As Read

`PUT /api/v1/notifications/:id/read`

Marks one notification as read for the current principal.

Output

- The updated notification record.

Errors

- `401` if the caller is not authenticated.
- `403` if the notification does not belong to the current principal.
- `404` if the notification does not exist.

## Mark All As Read

`PUT /api/v1/notifications/read-all`

Marks every notification for the current principal as read.

Output

- The batch update result returned by the service layer.

Errors

- `401` if the caller is not authenticated.
