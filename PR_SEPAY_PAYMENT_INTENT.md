# PR: feature/sepay-payment-intent (Draft)

Summary
-------
This PR implements phases A2–A4 of the SePay payment-intent plan:

- Backend: create donation will generate `payment_code`, set `payment_expires_at`, and return `payment_instruction` with `payment_code`, `transfer_content`, `expires_at`, and `vietqr_url`.
- Backend: webhook exact-match logic updated to parse `BKV-{donationId}` in transaction content and prefer exact-match by payment code.
- Backend: added `GET /fundraising/donations/:id` endpoint for frontend polling (access-controlled).
- Frontend: added `getDonationById` API, `PaymentPanel` component showing QR, transfer content and countdown, and polling (5s).
- Docs: updated plan `docs/21_ke_hoach_trien_khai_sepay_payment_intent.md` and progress report `docs/11_bao_cao_tien_do_va_ke_hoach_trien_khai.md`.

Files changed (high level)
-------------------------
- BKVolunteersBackend/src/features/fundraising/types.ts
- BKVolunteersBackend/src/features/fundraising/fundraising.repository.ts
- BKVolunteersBackend/src/features/fundraising/fundraising.service.ts
- BKVolunteersBackend/src/features/fundraising/fundraising.controller.ts
- BKVolunteersBackend/src/features/fundraising/fundraising.route.ts
- BKVolunteersBackend/src/features/fundraising/fundraising.validation.ts
- BKVolunteersBackend/prisma/migrations/20260526140500_add_fundraising_payment_intent_fields/migration.sql
- BKVolunteersFrontend/src/features/campaign/api/fundraising.ts
- BKVolunteersFrontend/src/features/campaign/components/payment-panel/PaymentPanel.tsx
- BKVolunteersFrontend/src/app/routes/app/donate.tsx (navigate to payment panel after create)
- BKVolunteersFrontend/src/app/routes/app/donation-payment.tsx
- BKVolunteersFrontend/src/app/router.tsx
- docs/21_ke_hoach_trien_khai_sepay_payment_intent.md
- docs/11_bao_cao_tien_do_va_ke_hoach_trien_khai.md

Migration note
--------------
- A Prisma migration `20260526140500_add_fundraising_payment_intent_fields` was added to extend `money_donations` with `payment_code`, `payment_expires_at`, `matched_at`.
- Apply migration on staging before enabling the new flow:

  ```bash
  cd BKVolunteersBackend
  npx prisma migrate deploy
  npx prisma generate
  ```

How to test locally
-------------------
- Backend unit tests:
  ```bash
  cd BKVolunteersBackend
  pnpm install
  pnpm test
  ```
- Frontend unit tests:
  ```bash
  cd BKVolunteersFrontend
  pnpm install
  pnpm test
  ```
- Manual end-to-end (dev):
  1. Apply migration locally: `npx prisma migrate dev --name add-payment-intent`
  2. Start backend: `pnpm dev` in BKVolunteersBackend
  3. Start frontend: `pnpm dev` in BKVolunteersFrontend
  4. Create a donation via UI (`/app/donate/:moduleId`) and confirm PaymentPanel appears with QR and transfer content.
  5. Simulate SePay webhook payload referencing the `BKV-{donationId}` in `content` and correct `amount` — donation should become `MATCHED`.

Notes / Risks
-------------
- `payment_code` format: `BKV-{donationId}` (simple & supportable). If you prefer unpredictability, change format and update webhook parser accordingly.
- This PR does not enable auto-`VERIFIED`. Operator verification remains required.
- Ensure staging has correct `SEPAY_WEBHOOK_SECRET` and migration applied before testing with real webhooks.

Follow-ups
----------
- Create a branch from this working state: `feature/sepay-payment-intent` and open PR with the above description.
- Add Playwright E2E to simulate create -> webhook -> verify flow.
- Consider adding a regeneration flow for expired codes.

---

Prepared by: GitHub Copilot (GPT-5 mini)
