# Event API

> Base URL: `/api/v1/events`

## Overview

Event routes are always authenticated. They cover campaign event management, registrations, participant moderation, check-ins, and certificates.

## Endpoints

| Method | Path | Auth | Permission | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/campaigns/:campaignId/events` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Create an event for a campaign |
| `PUT` | `/campaigns/:campaignId/events/:eventId` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Update an event |
| `DELETE` | `/campaigns/:campaignId/events/:eventId` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Delete an event |
| `GET` | `/campaigns/:campaignId/events` | Yes | Authenticated | List events of a campaign |
| `GET` | `/events/:eventId` | Yes | Authenticated | Get one event |
| `POST` | `/events/:eventId/register` | Yes | `SINHVIEN` | Register for an event |
| `DELETE` | `/events/:eventId/register` | Yes | `SINHVIEN` | Cancel event registration |
| `GET` | `/participants/me` | Yes | `SINHVIEN` | List my event participations |
| `GET` | `/events/:eventId/participants` | Yes | Authenticated | List participants of an event |
| `POST` | `/participants/:id/approve` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Approve a participant |
| `POST` | `/participants/:id/reject` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Reject a participant |
| `POST` | `/participants/:id/check-in` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Check in a participant |
| `POST` | `/participants/:id/certificate` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Send a certificate to one participant |
| `POST` | `/events/:eventId/certificates` | Yes | `CLB`, `LCD`, `DOANTRUONG` | Send certificates in bulk |

## Common Errors

- `400 Bad Request` when the payload, query, or date range is invalid.
- `401 Unauthorized` when the caller is not authenticated.
- `403 Forbidden` when the caller does not have the required role.
- `404 Not Found` when the event, participant, or campaign does not exist.
- `409 Conflict` when capacity or workflow state prevents the action.

## Create Event

`POST /api/v1/events/campaigns/:campaignId/events`

Input

```json
{
  "location": "string",
  "maxParticipants": 100,
  "registrationStart": "2026-04-22T00:00:00.000Z",
  "registrationEnd": "2026-04-30T23:59:59.000Z",
  "eventStart": "2026-05-01T00:00:00.000Z",
  "eventEnd": "2026-05-01T12:00:00.000Z"
}
```

Output

- The created event object.

Errors

- `403` if the caller is not allowed to manage the campaign.
- `404` if the campaign does not exist.

## Update Event

`PUT /api/v1/events/campaigns/:campaignId/events/:eventId`

Input

```json
{
  "location": "string",
  "maxParticipants": 100,
  "registrationStart": "2026-04-22T00:00:00.000Z",
  "registrationEnd": "2026-04-30T23:59:59.000Z",
  "eventStart": "2026-05-01T00:00:00.000Z",
  "eventEnd": "2026-05-01T12:00:00.000Z"
}
```

Output

- The updated event object.

## Delete Event

`DELETE /api/v1/events/campaigns/:campaignId/events/:eventId`

Output

- `success: true` with a null payload.

## List Campaign Events

`GET /api/v1/events/campaigns/:campaignId/events`

Output

- A list of events for the campaign.

## Event Detail

`GET /api/v1/events/:eventId`

Output

- A single event object, including campaign summary data.

## Register for Event

`POST /api/v1/events/:eventId/register`

Output

- The created participant registration record.

Errors

- `403` if the caller is not `SINHVIEN`.
- `409` if the participant cannot be registered because the event is full or closed.

## Cancel Registration

`DELETE /api/v1/events/:eventId/register`

Output

- The updated participant registration record.

## My Participations

`GET /api/v1/participants/me`

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by participant status |
| `page` | number | Page number |
| `limit` | number | Items per page |

Output

- Paginated participant records for the current student.

## Event Participants

`GET /api/v1/events/:eventId/participants`

Input

| Name | Type | Description |
| --- | --- | --- |
| `status` | string | Filter by participant status |
| `isCheckedIn` | boolean | Filter by check-in state |
| `page` | number | Page number |
| `limit` | number | Items per page |

Output

- Paginated participant records for the event.

## Participant Actions

The following endpoints operate on a participant record:

- `POST /api/v1/participants/:id/approve`
- `POST /api/v1/participants/:id/reject`
- `POST /api/v1/participants/:id/check-in`
- `POST /api/v1/participants/:id/certificate`

Input

```json
{
  "comment": "string"
}
```

```json
{
  "reason": "string"
}
```

```json
{
  "certificateUrl": "string",
  "points": 10
}
```

Output

- The updated participant record.

Notes

- Participant moderation and certificate delivery create notifications.
- `check-in` toggles the participant's checked-in state.

## Bulk Certificates

`POST /api/v1/events/:eventId/certificates`

Input

```json
{
  "pointsPerParticipant": 10
}
```

Output

```json
{
  "successCount": 0,
  "failedCount": 0,
  "failedParticipants": []
}
```

Errors

- `403` if the caller is not allowed to manage the event.
- `404` if the event does not exist.
