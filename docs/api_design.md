# API Design Overview

## Base URL

`/api/v1`

## Source of Truth

The current API documentation is split by module in `docs/api/` and follows a shared template with input, output, errors, and notes for each endpoint.

- Start here: [docs/api/README.md](/home/mintori/Documents/[2] Obsidian/02_University/Semester%2006/Pbl5/BKVolBackend/integration/docs/api/README.md:1)
- Campaigns: [docs/api/CAMPAIGN_API.md](/home/mintori/Documents/[2] Obsidian/02_University/Semester%2006/Pbl5/BKVolBackend/integration/docs/api/CAMPAIGN_API.md:1)
- Donations: [docs/api/DONATION_API.md](/home/mintori/Documents/[2] Obsidian/02_University/Semester%2006/Pbl5/BKVolBackend/integration/docs/api/DONATION_API.md:1)
- Clubs: [docs/api/CLUB_API.md](/home/mintori/Documents/[2] Obsidian/02_University/Semester%2006/Pbl5/BKVolBackend/integration/docs/api/CLUB_API.md:1)
- Upload: [docs/api/upload.md](/home/mintori/Documents/[2] Obsidian/02_University/Semester%2006/Pbl5/BKVolBackend/integration/docs/api/upload.md:1)

## Notes

- `POST /auth/login` is the shared login endpoint for student and user accounts.
- `POST /users` is internal provisioning by `DOANTRUONG`, not self-registration.
- `GET /faculties/:id/statistics` is the current faculty statistics endpoint.
- `GET /campaigns/:id/statistics` and `GET /statistics/system` are the statistics endpoints currently exposed.
