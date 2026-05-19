# API Reference

> Base URL: `/api/v1`

This folder is split by module. Use this page as the entry point.

## Documentation Standard

Each module doc follows the same layout:

1. Overview and public base path
2. Endpoint table
3. Per-endpoint sections with:
    - Auth and permission
    - Input
    - Output
    - Errors
    - Notes

Use `docs/API_RESPONSE_GUIDE.md` for the canonical response and error envelope.

## Index

| Module            | File                                             | Public base path                                                                                             |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Auth              | [AUTH_API.md](./AUTH_API.md)                     | `/auth`                                                                                                      |
| Notification      | [NOTIFICATION_API.md](./NOTIFICATION_API.md)     | `/notifications`                                                                                             |
| User provisioning | [USER_API.md](./USER_API.md)                     | `/users`                                                                                                     |
| Statistics        | [STATISTICS_API.md](./STATISTICS_API.md)         | `/statistics`                                                                                                |
| Event             | [EVENT_API.md](./EVENT_API.md)                   | `/events`                                                                                                    |
| Item phase        | [ITEM_PHASE_API.md](./ITEM_PHASE_API.md)         | `/campaigns/:campaignId/item-phases`                                                                         |
| Item donation     | [ITEM_DONATION_API.md](./ITEM_DONATION_API.md)   | `/donations/items`, `/item-phases/items`, `/donations/:phaseId/donations`, `/item-phases/:phaseId/donations` |
| Money donation    | [MONEY_DONATION_API.md](./MONEY_DONATION_API.md) | `/campaigns/:campaignId/money-phases`, `/money-phases`                                                       |
| Campaign          | [CAMPAIGN_API.md](./CAMPAIGN_API.md)             | `/campaigns`                                                                                                 |
| Donation          | [DONATION_API.md](./DONATION_API.md)             | `/donations`                                                                                                 |
| Club              | [CLUB_API.md](./CLUB_API.md)                     | `/clubs`                                                                                                     |
| Upload            | [upload.md](./upload.md)                         | `/upload`, `/files`                                                                                          |

## Conventions

- Protected endpoints require `Authorization: Bearer <access_token>`.
- Standard response patterns follow `docs/API_RESPONSE_GUIDE.md`.
- Roles used across the API: `SINHVIEN`, `CLB`, `LCD`, `DOANTRUONG`.
- Unless a route says otherwise, successful responses use `ApiResponse.success`.
- Validation errors return `400` with a structured `errors` array.
- File upload endpoints return file metadata plus the generated public URL.
