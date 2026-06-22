# BKVol Backend - Implementation Plan

> Generated: 2026-05-05
> Based on: `spec/` (00-08) vs `src/features/` current implementation
> Spec defines **67 REST endpoints** | Current implements **~45 endpoints**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Implementation Status](#2-current-implementation-status)
3. [Database Schema Gaps](#3-database-schema-gaps)
4. [Refactoring Tasks](#4-refactoring-tasks)
5. [New Feature Tasks](#5-new-feature-tasks)
6. [Improvement Tasks](#6-improvement-tasks)
7. [Suggested Execution Order](#7-suggested-execution-order)

---

## 1. Executive Summary

### Gap Overview

| Category | Count | Priority |
|----------|-------|----------|
| Critical refactors (state machine, shared types, bugs) | 4 | HIGH |
| New modules (certificate, approval, SePay, audit, jobs, reports) | 6 | HIGH/MEDIUM |
| New endpoints in existing modules | 8 | MEDIUM/LOW |
| Schema changes required | 5 tables + 3 enums | HIGH |

### What's Done

- Auth (login/refresh/logout/me/change-password) - **5/5 spec endpoints**
- Faculty CRUD + stats - **8 endpoints** (spec: 4, extras: 4)
- Club CRUD - **5 endpoints** (spec: partial, covers needs)
- Title CRUD - **5 endpoints** (spec: partial, covers needs)
- Upload (image + document) - **4 endpoints**
- Notification (list/read/read-all) - **3/3 spec endpoints**
- Student profile + points + titles - **5 endpoints** (spec: 6, missing dashboard)
- Forgot Password (User only) - **2/2 endpoints** (missing Student support)
- Event full lifecycle - **14 endpoints** (exceeds spec)
- Campaign CRUD + state machine - **13 endpoints** (state machine diverges from spec)
- Donation verify/reject/my/admin - **5 endpoints**
- Money Phase CRUD + progress - **6 endpoints**
- Item Phase CRUD - **4 endpoints**
- Item Donation create/verify/list - **3 endpoints**
- Statistics (system-wide) - **1 endpoint** (spec: 10+)
- User create only - **1 endpoint** (spec: 5+)

### What's Missing

- Certificate module (entire) - **7 endpoints**
- Approval workflow (entire) - **7 endpoints**
- Public discovery (entire) - **4 endpoints**
- SePay webhook integration - **1 endpoint + matching logic**
- Student dashboard - **1 endpoint**
- Organization management - **2 endpoints**
- Reports - **3 endpoints**
- Audit logs - **1 endpoint + recording logic**
- Background jobs - **system + 6 job types**
- Payment transactions table and matching logic
- Campaign state machine alignment (SUBMITTED, PRE_APPROVED, PUBLISHED, ONGOING)
- Organization model and scope enforcement

---

## 2. Current Implementation Status

### Feature-by-Feature Matrix

#### Auth (`src/features/auth/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Login | POST | `/auth/login` | DONE |
| Refresh token | POST | `/auth/refresh` | DONE |
| Logout | POST | `/auth/logout` | DONE |
| Get current user | GET | `/auth/me` | DONE |
| Change password | PATCH | `/auth/change-password` | DONE |

**Files:** `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`, `auth.route.ts`, `auth.validation.ts`, `types.ts`, `utils.ts`, `index.ts`, `tests/` (5 files)

#### Campaign (`src/features/campaign/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create campaign | POST | `/campaigns` | DONE |
| List campaigns | GET | `/campaigns` | DONE |
| Get available campaigns | GET | `/campaigns/available` | DONE (BUG) |
| Get campaign by ID | GET | `/campaigns/:id` | DONE |
| Get campaign statistics | GET | `/campaigns/:id/statistics` | DONE |
| Update campaign | PUT | `/campaigns/:id` | DONE |
| Delete campaign | DELETE | `/campaigns/:id` | DONE |
| Submit for approval | POST | `/campaigns/:id/submit` | DONE |
| Approve campaign | POST | `/campaigns/:id/approve` | DONE |
| Reject campaign | POST | `/campaigns/:id/reject` | DONE |
| Complete campaign | POST | `/campaigns/:id/complete` | DONE |
| Cancel campaign | POST | `/campaigns/:id/cancel` | DONE |
| Upload plan file | POST | `/campaigns/:id/plan-file` | DONE |
| Upload budget file | POST | `/campaigns/:id/budget-file` | DONE |

**Missing vs spec:**
- Submit review → Publish → End flow (currently DRAFT→PENDING→ACTIVE, spec wants DRAFT→SUBMITTED→PRE_APPROVED→APPROVED→PUBLISHED→ONGOING→ENDED)
- Request revision endpoint
- Pre-approve endpoint
- Publish endpoint (separate from approve)
- End endpoint (separate from complete)

**Files:** `campaign.controller.ts`, `campaign.service.ts`, `campaign.repository.ts`, `campaign.route.ts`, `campaign.validation.ts`, `campaign.permission.ts`, `campaign.status.ts`, `types.ts`, `index.ts`, `tests/` (6 files)

#### Club (`src/features/club/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create club | POST | `/clubs` | DONE |
| Update club | PUT | `/clubs/:id` | DONE |
| Delete club | DELETE | `/clubs/:id` | DONE |
| List clubs | GET | `/clubs` | DONE |
| Get club by ID | GET | `/clubs/:id` | DONE |

**Files:** `club.controller.ts`, `club.service.ts`, `club.repository.ts`, `club.route.ts`, `club.validation.ts`, `types.ts`, `index.ts`, `tests/` (5 files)

#### Donation (`src/features/donation/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Submit money donation | POST | `/donations/money` | DONE |
| Reject donation | POST | `/donations/:id/reject` | DONE |
| Verify donation | PUT | `/donations/:id` | DONE |
| My donation history | GET | `/donations/me` | DONE |
| Admin donation list | GET | `/donations/admin` | DONE |

**Files:** `donation.controller.ts`, `donation.service.ts`, `donation.repository.ts`, `donation.route.ts`, `donation.validation.ts`, `donation.permission.ts`, `donation.types.ts`, `tests/` (4 files)

#### Event (`src/features/event/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create event | POST | `/campaigns/:campaignId/events` | DONE |
| Update event | PUT | `/campaigns/:campaignId/events/:eventId` | DONE |
| Delete event | DELETE | `/campaigns/:campaignId/events/:eventId` | DONE |
| List events by campaign | GET | `/campaigns/:campaignId/events` | DONE |
| Get event by ID | GET | `/events/:eventId` | DONE |
| Register for event | POST | `/events/:eventId/register` | DONE |
| Cancel registration | DELETE | `/events/:eventId/register` | DONE |
| My participations | GET | `/participants/me` | DONE |
| List participants | GET | `/events/:eventId/participants` | DONE |
| Approve participant | POST | `/participants/:id/approve` | DONE |
| Reject participant | POST | `/participants/:id/reject` | DONE |
| Check-in participant | POST | `/participants/:id/check-in` | DONE |
| Send certificate | POST | `/participants/:id/certificate` | DONE |
| Bulk send certificates | POST | `/events/:eventId/certificates` | DONE |

**Files:** `event.controller.ts`, `event.service.ts`, `event.repository.ts`, `event.route.ts`, `event.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Faculty (`src/features/faculty/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create faculty | POST | `/faculties` | DONE |
| Update faculty | PUT | `/faculties/:id` | DONE |
| Delete faculty | DELETE | `/faculties/:id` | DONE |
| List faculties | GET | `/faculties` | DONE |
| List all faculties | GET | `/faculties/list` | DONE |
| Get faculty by code | GET | `/faculties/code/:code` | DONE |
| Get faculty stats | GET | `/faculties/:id/statistics` | DONE |
| Get faculty by ID | GET | `/faculties/:id` | DONE |

**Files:** `faculty.controller.ts`, `faculty.service.ts`, `faculty.repository.ts`, `faculty.route.ts`, `faculty.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Forgot Password (`src/features/forgotPassword/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Request reset | POST | `/password/forgot-password` | DONE (User only) |
| Reset password | POST | `/password/reset-password/:token` | DONE (User only) |

**Files:** `forgotPassword.controller.ts`, `forgotPassword.service.ts`, `password.route.ts`, `password.validation.ts`, `types.ts`, `index.ts`, `tests/` (2 files)

#### Gamification (`src/features/gamification/`)

| Function | Status |
|----------|--------|
| `awardPoints()` | DONE (service-only) |
| `checkAndUnlockTitles()` | DONE (service-only) |
| `findManyByStudentId()` | DONE |
| `sumPointsByStudentId()` | DONE |

**Files:** `gamification.service.ts`, `pointTransaction.repository.ts`, `types.ts`, `index.ts`, `tests/` (2 files)

**No routes** - internal service used by donation, event modules.

#### Item Donation (`src/features/item-donation/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create item donation | POST | `/donations/items` | DONE |
| Verify item donation | POST | `/item-phases/:id/verify` | DONE |
| List by phase | GET | `/item-phases/:phaseId/donations` | DONE |

**Files:** `item-donation.controller.ts`, `item-donation.service.ts`, `item-donation.repository.ts`, `item-donation.route.ts`, `item-donation.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Item Phase (`src/features/item-phase/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create item phase | POST | `/campaigns/:campaignId/item-phases` | DONE |
| Get item phases | GET | `/campaigns/:campaignId/item-phases` | DONE |
| Update item phase | PUT | `/campaigns/:campaignId/item-phases/:phaseId` | DONE |
| Delete item phase | DELETE | `/campaigns/:campaignId/item-phases/:phaseId` | DONE |

**Files:** `item-phase.controller.ts`, `item-phase.service.ts`, `item-phase.repository.ts`, `item-phase.route.ts`, `item-phase.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Money Donation (`src/features/money-donation/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create money phase | POST | `/campaigns/:campaignId/money-phases` | DONE |
| Get money phase | GET | `/campaigns/:campaignId/money-phases/:phaseId` | DONE |
| Update money phase | PUT | `/campaigns/:campaignId/money-phases/:phaseId` | DONE |
| Delete money phase | DELETE | `/campaigns/:campaignId/money-phases/:phaseId` | DONE |
| Get progress | GET | `/campaigns/:campaignId/money-phases/:phaseId/progress` | DONE |
| List donations | GET | `/money-phases/:phaseId/donations` | DONE |

**Files:** `money-donation.controller.ts`, `money-donation.service.ts`, `money-donation.repository.ts`, `money-donation.route.ts`, `money-donation.permission.ts`, `money-donation.types.ts`, `money-donation.validation.ts`, `tests/` (4 files)

#### Notification (`src/features/notification/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| List my notifications | GET | `/notifications/me` | DONE |
| Mark as read | PUT | `/notifications/:id/read` | DONE |
| Mark all as read | PUT | `/notifications/read-all` | DONE |

**Files:** `notification.controller.ts`, `notification.service.ts`, `notification.repository.ts`, `notification.route.ts`, `notification.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Statistics (`src/features/statistics/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| System statistics | GET | `/statistics/system` | DONE |

**Files:** `statistics.controller.ts`, `statistics.service.ts`, `statistics.repository.ts`, `statistics.route.ts`, `index.ts`, `tests/` (2 files)

#### Student (`src/features/student/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Get my profile | GET | `/students/me` | DONE |
| Update my profile | PUT | `/students/me` | DONE |
| My points history | GET | `/students/me/points` | DONE |
| My titles | GET | `/students/me/titles` | DONE |
| Get student by ID | GET | `/students/:id` | DONE |

**Missing vs spec:**
- `GET /students/me/dashboard` - personal dashboard (stats, title, recent activities)
- `GET /students/me/activities` - activity history
- `GET /students/me/donations` - donation history (currently in donation module)
- `GET /students/me/certificates` - certificate list

**Files:** `student.controller.ts`, `student.service.ts`, `student.repository.ts`, `student.route.ts`, `student.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Title (`src/features/title/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create title | POST | `/titles` | DONE |
| Update title | PUT | `/titles/:id` | DONE |
| Delete title | DELETE | `/titles/:id` | DONE |
| List titles | GET | `/titles` | DONE |
| Get title by ID | GET | `/titles/:id` | DONE |

**Files:** `title.controller.ts`, `title.service.ts`, `title.repository.ts`, `title.route.ts`, `title.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### Upload (`src/features/upload/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Upload image | POST | `/upload/image` | DONE |
| Upload document | POST | `/upload/document` | DONE |
| Serve image | GET | `/files/images/:filename` | DONE |
| Serve document | GET | `/files/documents/:filename` | DONE |

**Files:** `upload.controller.ts`, `upload.service.ts`, `upload.route.ts`, `upload.validation.ts`, `types.ts`, `index.ts`, `tests/` (3 files)

#### User (`src/features/user/`)

| Endpoint | Method | Path | Status |
|----------|--------|------|--------|
| Create user | POST | `/users` | DONE |

**Missing vs spec:**
- `GET /users` - list users (DOANTRUONG)
- `GET /users/:id` - get user detail
- `PUT /users/:id` - update user
- `DELETE /users/:id` - soft-delete user

**Files:** `user.controller.ts`, `user.service.ts`, `user.repository.ts`, `user.route.ts`, `user.validation.ts`, `types.ts`, `index.ts`, `tests/` (2 files)

---

## 3. Database Schema Gaps

### Current Schema vs Spec

The current Prisma schema has **18 models**. The spec requires **21 tables**. Below are the gaps:

### 3.1 Missing Tables

| Table | Spec Purpose | Priority |
|-------|-------------|----------|
| `organizations` | Replace current `clubs` + add LCD/School Union entities with type, code, logo_url, description, status | HIGH |
| `campaign_reviews` | Review comments on campaigns (author_type, visibility, attachment) | HIGH |
| `campaign_activities` | Activity log per campaign (actor_type, activity_type, data_json) | MEDIUM |
| `payment_transactions` | SePay bank transaction records (provider, match_status, raw_payload) | HIGH |
| `certificate_templates` | Certificate template definitions (layout_json, file_url) | HIGH |
| `certificates` | Issued certificates (certificate_no, snapshot_json, file_hash, replacement_certificate_id) | HIGH |
| `audit_logs` | Immutable audit trail (before_json, after_json, ip_address) | MEDIUM |
| `background_jobs` | Async job queue (payload_json, attempts, run_at) | MEDIUM |
| `item_targets` | Item donation targets (name, unit, target_quantity, received_quantity) | MEDIUM |
| `item_pledges` | Item donation pledges (replaces part of current Donation model for items) | MEDIUM |

### 3.2 Missing Enums

| Enum | Values | Priority |
|------|--------|----------|
| `CampaignStatus` additions | `SUBMITTED`, `PRE_APPROVED`, `PUBLISHED`, `ONGOING`, `ENDED`, `ARCHIVED`, `REVISION_REQUIRED` | HIGH |
| `ModuleStatus` | `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, `OPEN`, `CLOSED`, `CANCELLED` | MEDIUM |
| `OrganizationType` | `SCHOOL_UNION`, `FACULTY_UNION`, `CLUB` | HIGH |
| `CertificateStatus` | `PENDING`, `READY`, `FAILED`, `REVOKED` | HIGH |
| `JobStatus` | `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` | MEDIUM |
| `MatchStatus` | `UNMATCHED`, `MATCHED` | HIGH |

### 3.3 Schema Changes to Existing Models

| Model | Change | Details |
|-------|--------|---------|
| `Campaign` | Add fields | `slug` (UNIQUE), `summary`, `cover_image_url`, `beneficiary`, `published_at`, `organization_id` (replace `creatorId` for org ownership) |
| `Campaign` | Add status values | See missing enums above - full state machine expansion |
| `CampaignModules` | New model | Replace current STI pattern (MoneyDonationCampaign, ItemDonationCampaign, EventCampaign) with unified `campaign_modules` table + `settings_json` per spec |
| `Donation` | Split model | Spec has separate `money_donations` and `item_pledges` with different fields; current unified Donation model conflates both |
| `EventCampaign` → `event_registrations` | Field changes | Add `answers_json`, `checked_in_at`, `checked_out_at`, `hours`, `reviewed_by`, `review_note` |
| `Student` | Add fields | `avatar_url`, `major`, `year` |
| `Notification` | Add field | `data_json` for structured notification data |
| `User` (→ `operator_accounts`) | Rename/restructure | Spec uses `operator_accounts` with `organization_id` instead of `User` with `facultyId` |

### 3.4 Migration Strategy

**Important:** The schema changes are substantial and affect the core data model. Two approaches:

**Option A: Incremental Migration (Recommended)**
1. Add new tables alongside existing ones
2. Add new enum values as additive changes
3. Migrate data gradually with dual-write periods
4. Deprecate old models only after full migration

**Option B: Full Schema Redesign**
1. Create new schema from scratch matching spec exactly
2. Write one-time migration scripts
3. Update all services at once

---

## 4. Refactoring Tasks

### R-01: Extract Shared Types to Common

**Priority:** HIGH
**Effort:** Small (2-3h)
**Blocks:** R-02, all new feature modules

**Problem:**
- `UserRole` type is duplicated in `auth/types.ts`, `campaign/types.ts`, `donation/donation.types.ts`
- `PaginatedResult` type is defined in `gamification/types.ts` but used by Club, Faculty, and other modules
- No central type definitions for cross-cutting concerns

**Changes:**
```
src/common/types/
├── index.ts          # Re-export all
├── role.types.ts     # UserRole, RoleScope
├── pagination.types.ts # PaginatedResult, PaginationMeta
└── api.types.ts      # Common API types (if needed)
```

**Specific moves:**
1. Create `src/common/types/role.types.ts` with unified `UserRole = 'SINHVIEN' | 'CLB' | 'LCD' | 'DOANTRUONG'`
2. Create `src/common/types/pagination.types.ts` with `PaginatedResult<T>` and `PaginationMeta`
3. Update all imports in: `auth/types.ts`, `campaign/types.ts`, `donation/donation.types.ts`, `club/`, `faculty/`, `student/`
4. Remove duplicate definitions

**Files to modify:**
- `src/features/auth/types.ts` - remove UserRole, import from common
- `src/features/campaign/types.ts` - remove UserRole, import from common
- `src/features/donation/donation.types.ts` - remove UserRole, import from common
- `src/features/gamification/types.ts` - remove PaginatedResult, import from common
- `src/features/club/` - update PaginatedResult import
- `src/features/faculty/` - update PaginatedResult import
- All controller/service files referencing these types

**Testing:** Run `pnpm test` to verify no regressions after import changes.

---

### R-02: Campaign State Machine Alignment

**Priority:** HIGH
**Effort:** Large (8-12h)
**Blocks:** Approval workflow module, Certificate module depends on campaign lifecycle

**Problem:**
Current state machine is simplified:
```
DRAFT → PENDING → ACTIVE → COMPLETED
                 → REJECTED              → CANCELLED
```

Spec requires a richer state machine:
```
DRAFT → SUBMITTED → REVISION_REQUIRED → SUBMITTED (loop)
                   → PRE_APPROVED → APPROVED → PUBLISHED → ONGOING → ENDED → ARCHIVED
                   → REJECTED
```

**Current enum values:** `DRAFT, PENDING, ACTIVE, REJECTED, COMPLETED, CANCELLED`
**Required enum values:** `DRAFT, SUBMITTED, REVISION_REQUIRED, PRE_APPROVED, APPROVED, PUBLISHED, ONGOING, ENDED, ARCHIVED, REJECTED`

**Changes:**

1. **Prisma schema** - Update `CampaignStatus` enum:
   ```prisma
   enum CampaignStatus {
     DRAFT
     SUBMITTED        // was PENDING (submitted for review)
     REVISION_REQUIRED // new
     PRE_APPROVED      // new (reviewer pre-approves)
     APPROVED          // was ACTIVE (final approved)
     PUBLISHED         // new (org admin publishes)
     ONGOING           // new (auto after start_at)
     ENDED             // was COMPLETED
     ARCHIVED          // new
     REJECTED
     CANCELLED
   }
   ```

2. **Update `campaign.status.ts`** - Rewrite status transition rules:
   ```
   DRAFT → SUBMITTED (CLB/LCD/DOANTRUONG)
   SUBMITTED → REVISION_REQUIRED (DOANTRUONG)
   SUBMITTED → PRE_APPROVED (DOANTRUONG)
   SUBMITTED → REJECTED (DOANTRUONG)
   REVISION_REQUIRED → SUBMITTED (CLB/LCD/DOANTRUONG)
   PRE_APPROVED → APPROVED (DOANTRUONG)
   APPROVED → PUBLISHED (CLB/LCD/DOANTRUONG)
   PUBLISHED → ONGOING (SYSTEM - auto when start_at reached)
   ONGOING → ENDED (CLB/LCD/DOANTRUONG or SYSTEM auto)
   ENDED → ARCHIVED (DOANTRUONG)
   DRAFT → CANCELLED (CLB/LCD/DOANTRUONG)
   ```

3. **Update `campaign/types.ts`** - Rewrite `STATUS_TRANSITIONS` array with new states

4. **Update `campaign/campaign.status.ts`** - Update all helper functions (`isCampaignEditable`, `isCampaignDeletable`, etc.) for new states

5. **Update `campaign/campaign.permission.ts`** - Add scope checks for new transitions

6. **Update `campaign.controller.ts`** - Add new endpoints:
   - `POST /campaigns/:id/request-revision` (DOANTRUONG)
   - `POST /campaigns/:id/pre-approve` (DOANTRUONG)
   - `POST /campaigns/:id/publish` (CLB/LCD/DOANTRUONG)
   - `POST /campaigns/:id/end` (replaces complete)

7. **Update `campaign.service.ts`** - Business logic for new transitions:
   - `requestRevision()` - sets status + sends notification to org
   - `preApprove()` - preliminary approval
   - `publish()` - makes campaign visible publicly
   - `end()` - final state with progress summary

8. **Update `campaign.validation.ts`** - Add validation schemas for new endpoints

9. **Update `campaign.route.ts`** - Register new routes

10. **Database migration** - Migrate existing data:
    - `PENDING` → `SUBMITTED`
    - `ACTIVE` → `APPROVED` (or `PUBLISHED` if already public)
    - `COMPLETED` → `ENDED`

**Files to create/modify:**
- `prisma/schema.prisma` - enum update
- `prisma/migrations/` - new migration
- `src/features/campaign/types.ts` - new transitions
- `src/features/campaign/campaign.status.ts` - rewrite
- `src/features/campaign/campaign.permission.ts` - update
- `src/features/campaign/campaign.controller.ts` - add endpoints
- `src/features/campaign/campaign.service.ts` - add methods
- `src/features/campaign/campaign.repository.ts` - update queries
- `src/features/campaign/campaign.validation.ts` - add schemas
- `src/features/campaign/campaign.route.ts` - add routes
- `src/features/donation/` - update status checks (PENDING→SUBMITTED references)
- `src/features/event/` - update status checks
- `src/features/statistics/` - update status aggregation

**Testing:**
- Update all existing campaign tests for new state names
- Add tests for new transitions (request-revision, pre-approve, publish, end)
- Verify notification sending on state changes
- Verify permission enforcement per transition

---

### R-03: Fix Campaign Available Endpoint Faculty Scoping Bug

**Priority:** HIGH
**Effort:** Small (1-2h)

**Problem:**
`GET /campaigns/available` does not correctly filter `KHOA`-scope campaigns to students of the same faculty. The `where.OR` condition is always true regardless of scope.

**Changes:**
1. In `campaign.repository.ts` or `campaign.service.ts`, fix the `getAvailableCampaigns` query:
   - `TRUONG` scope campaigns: visible to all students
   - `KHOA` scope campaigns: visible only to students whose `facultyId` matches the campaign creator's faculty
2. Add filter: when student's `facultyId` is provided, `KHOA` campaigns must have creator's `facultyId` matching

**Files to modify:**
- `src/features/campaign/campaign.repository.ts` - fix query
- `src/features/campaign/campaign.service.ts` - pass student's facultyId
- `src/features/campaign/tests/` - add test for faculty scoping

---

### R-04: Student Forgot Password Support

**Priority:** HIGH
**Effort:** Small (2-3h)

**Problem:**
Current forgot password only works for `User` model. Students cannot reset their passwords via the forgot password flow.

**Changes:**
1. In `forgotPassword.service.ts`:
   - Add `resetStudentPassword()` function that updates `prismaClient.student` password
   - Add `findStudentByEmail()` function in forgot password flow
   - Update `requestPasswordReset()` to check both User and Student emails
2. Add `StudentResetToken` model to Prisma schema (or add `accountType` discriminator to existing `ResetToken`)
3. In `forgotPassword.repository.ts`:
   - Add `createStudentResetToken()`
   - Add `findStudentResetToken()`
   - Add `deleteStudentResetToken()`
4. Update validation if needed for student-specific identifiers

**Files to create/modify:**
- `prisma/schema.prisma` - add StudentResetToken or update ResetToken
- `src/features/forgotPassword/forgotPassword.service.ts` - add student flow
- `src/features/forgotPassword/forgotPassword.repository.ts` - add student repository functions
- `src/features/forgotPassword/types.ts` - add student types
- `src/features/forgotPassword/tests/` - add student forgot password tests

---

### R-05: File Upload Flow for Campaign Plan/Budget

**Priority:** LOW
**Effort:** Small (1-2h)

**Problem:**
Campaign `plan-file` and `budget-file` endpoints accept URL strings directly, bypassing the upload system. This means:
- No file type validation
- No file size limits
- No storage management
- Files could be external URLs with no control

**Changes:**
1. Refactor `POST /campaigns/:id/plan-file` and `POST /campaigns/:id/budget-file` to accept multipart file uploads
2. Use the existing upload middleware/system
3. Store files via the upload feature and return the generated URL
4. Update validation schemas to accept file uploads instead of URL strings

**Files to modify:**
- `src/features/campaign/campaign.controller.ts` - use multer middleware
- `src/features/campaign/campaign.route.ts` - add upload middleware
- `src/features/campaign/campaign.validation.ts` - update schemas
- `src/features/campaign/campaign.service.ts` - update to handle file path

---

## 5. New Feature Tasks

### N-01: Approval Workflow Module

**Priority:** HIGH
**Effort:** Large (10-14h)
**Depends on:** R-02 (campaign state machine)

**Spec endpoints (7):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/approvals/campaigns` | SCHOOL_REVIEWER/ADMIN | Review queue |
| GET | `/approvals/campaigns/:id` | SCHOOL_REVIEWER/ADMIN | Campaign review detail |
| POST | `/approvals/campaigns/:id/comments` | SCHOOL_REVIEWER/ADMIN | Add review comment |
| POST | `/approvals/campaigns/:id/request-revision` | SCHOOL_REVIEWER/ADMIN | Request revision |
| POST | `/approvals/campaigns/:id/pre-approve` | SCHOOL_REVIEWER/ADMIN | Pre-approve |
| POST | `/approvals/campaigns/:id/approve` | SCHOOL_REVIEWER/ADMIN | Final approve |
| POST | `/approvals/campaigns/:id/reject` | SCHOOL_REVIEWER/ADMIN | Reject campaign |

**Schema additions:**

```prisma
model CampaignReview {
  id              String   @id @default(cuid())
  campaignId      String   @map("campaign_id")
  moduleId        Int?     @map("module_id")
  authorType      String   @map("author_type")  // USER | SYSTEM
  authorId        String   @map("author_id")
  body            String   @db.Text
  visibility     String   @default("INTERNAL") // INTERNAL | PUBLIC
  attachmentUrl   String?  @map("attachment_url")
  createdAt      DateTime @default(now()) @map("created_at")

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([campaignId])
  @@map("campaign_reviews")
}

model CampaignActivity {
  id           String   @id @default(cuid())
  campaignId   String   @map("campaign_id")
  moduleId     Int?     @map("module_id")
  actorType    String   @map("actor_type")
  actorId      String   @map("actor_id")
  activityType String   @map("activity_type")
  message      String   @db.Text
  dataJson     String?  @map("data_json") @db.Text

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([campaignId])
  @@index([activityType])
  @@map("campaign_activities")
}
```

**Files to create:**
```
src/features/approval/
├── approval.controller.ts
├── approval.service.ts
├── approval.repository.ts
├── approval.route.ts
├── approval.validation.ts
├── types.ts
├── index.ts
└── tests/
    ├── approval.controller.test.ts
    ├── approval.service.test.ts
    └── approval.repository.test.ts
```

**Business logic:**
1. Review queue returns campaigns in `SUBMITTED` or `REVISION_REQUIRED` status
2. Comments are stored with visibility (INTERNAL for reviewers, PUBLIC for org to see)
3. Request revision: `SUBMITTED` → `REVISION_REQUIRED` + notification to org admin
4. Pre-approve: `SUBMITTED` → `PRE_APPROVED` (intermediate state)
5. Approve: `PRE_APPROVED` → `APPROVED` + notification to org admin
6. Reject: `SUBMITTED` → `REJECTED` + notification with reason
7. All actions create audit log entries (after N-05 is ready)
8. All actions create campaign activity records

**Validation schemas:**
- Comments: `body` required (min 1, max 2000), `visibility` optional (INTERNAL/PUBLIC)
- Request revision: `reason` required (min 10, max 1000)
- Approve: `comment` optional
- Reject: `reason` required (min 10, max 1000)

---

### N-02: SePay Webhook Integration

**Priority:** HIGH
**Effort:** Medium (6-8h)

**Spec endpoint (1):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| POST | `/fundraising/sepay/webhook` | Provider (SePay) | Receive bank transaction webhook |

**Schema additions:**

```prisma
model PaymentTransaction {
  id                    String   @id @default(cuid())
  campaignId            String   @map("campaign_id")
  moduleId             Int?     @map("module_id")
  provider             String   @default("SEPAY")
  providerTransactionId String  @map("provider_transaction_id")
  amount               Decimal  @db.Decimal(15, 2)
  content              String   @db.Text
  accountNo            String   @map("account_no") @db.VarChar(20)
  transactionTime      DateTime @map("transaction_time")
  rawPayload           String?  @map("raw_payload") @db.Text
  matchStatus          String   @default("UNMATCHED") @map("match_status") // UNMATCHED | MATCHED
  matchedDonationId    String?  @map("matched_donation_id")
  createdAt            DateTime @default(now()) @map("created_at")

  campaign Campaign @relation(fields: [campaignId], references: [id])
  matchedDonation Donation? @relation(fields: [matchedDonationId], references: [id])

  @@unique([provider, providerTransactionId]) // Idempotency
  @@index([campaignId])
  @@index([matchStatus])
  @@index([accountNo])
  @@map("payment_transactions")
}
```

**Files to create:**
```
src/features/sepay/
├── sepay.controller.ts
├── sepay.service.ts
├── sepay.repository.ts
├── sepay.route.ts
├── sepay.validation.ts
├── sepay.utils.ts        # Signature validation, content parsing
├── types.ts
├── index.ts
└── tests/
    ├── sepay.controller.test.ts
    ├── sepay.service.test.ts
    └── sepay.repository.test.ts
```

**Business logic:**
1. Webhook receives SePay payload: `id`, `amount`, `content`, `account_no`, `transaction_time`
2. Validate signature/secret from SePay (return 403 if invalid)
3. **Idempotency**: Check `provider + providerTransactionId` - if exists, return 200 (already processed)
4. Save transaction to `payment_transactions`
5. Try to match with an existing PENDING donation:
   - Parse `content` for donation reference code or student info
   - Match by `accountNo` → find campaign → find money phase
   - If matched: set `matchStatus = MATCHED`, link `matchedDonationId`
   - If not matched: keep `matchStatus = UNMATCHED` for manual processing
6. **Important**: Matching only sets `MATCHED`, does NOT auto-verify. Verification is still manual.
7. Create audit log entry
8. Recalculate campaign progress (trigger background job if available)

**Validation:**
- Webhook secret validation
- Payload structure validation (required fields)
- Amount must be positive

**SePay payload format reference:**
```json
{
  "id": "123456",
  "amount": 500000,
  "content": "CK THIET TV 2024 NGUYEN VAN A",
  "account_no": "1234567890",
  "transaction_time": "2024-01-15T10:30:00Z"
}
```

---

### N-03: Certificate Module

**Priority:** HIGH
**Effort:** Large (12-16h)
**Depends on:** R-02 (campaign END state), N-06 (background jobs for rendering)

**Spec endpoints (7):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/certificates/templates` | ORG/SCHOOL | List certificate templates |
| POST | `/certificates/templates` | SCHOOL_ADMIN | Create template |
| POST | `/certificates/campaigns/:campaignId/generate` | ORG_ADMIN | Generate certificates for eligible students |
| POST | `/certificates/:id/render` | ORG_ADMIN | Queue PDF render job |
| GET | `/certificates/:id/download` | OWNER/ORG | Get download URL |
| POST | `/certificates/:id/revoke` | ORG/SCHOOL | Revoke certificate |
| POST | `/certificates/:id/reissue` | ORG/SCHOOL | Reissue certificate |

**Public endpoint:**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/public/certificates/verify/:certificateNo` | PUBLIC | Verify certificate validity |

**Schema additions:**

```prisma
model CertificateTemplate {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  type        String   @db.VarChar(50) // EVENT | DONATION | GENERAL
  fileUrl     String?  @map("file_url")
  layoutJson  String?  @map("layout_json") @db.Text
  status      String   @default("ACTIVE") // ACTIVE | ARCHIVED
  createdById String?  @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  createdBy User? @relation(fields: [createdById], references: [id])
  certificates Certificate[]

  @@map("certificate_templates")
}

model Certificate {
  id                      String   @id @default(cuid())
  certificateNo           String   @unique @map("certificate_no")
  campaignId              String   @map("campaign_id")
  moduleId               Int?     @map("module_id")
  studentId              String   @map("student_id")
  templateId             Int?     @map("template_id")
  status                 String   @default("PENDING") // PENDING | READY | FAILED | REVOKED
  snapshotJson           String   @map("snapshot_json") @db.Text // IMMUTABLE after READY
  fileUrl                String?  @map("file_url")
  fileHash               String?  @map("file_hash")
  issuedAt               DateTime? @map("issued_at")
  revokedAt              DateTime? @map("revoked_at")
  revokedById            String?  @map("revoked_by")
  revokeReason           String?  @map("revoke_reason") @db.Text
  replacementCertificateId String? @map("replacement_certificate_id")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  campaign               Campaign             @relation(fields: [campaignId], references: [id])
  student                Student               @relation(fields: [studentId], references: [id])
  template               CertificateTemplate? @relation(fields: [templateId], references: [id])
  revokedBy              User?                 @relation(fields: [revokedById], references: [id])
  replacementCertificate Certificate?          @relation("CertificateReissue", fields: [replacementCertificateId], references: [id])
  reissue                Certificate?          @relation("CertificateReissue")

  @@index([campaignId])
  @@index([studentId])
  @@index([status])
  @@index([certificateNo])
  @@map("certificates")
}
```

**Files to create:**
```
src/features/certificate/
├── certificate.controller.ts
├── certificate.service.ts
├── certificate.repository.ts
├── certificate.route.ts
├── certificate.validation.ts
├── certificate.utils.ts        # Certificate number generation, snapshot creation
├── types.ts
├── index.ts
└── tests/
    ├── certificate.controller.test.ts
    ├── certificate.service.test.ts
    └── certificate.repository.test.ts
```

**Business logic:**
1. **Generate**: Find eligible students (COMPLETED event registrations), create certificate records with PENDING status and immutable `snapshot_json`
2. **Snapshot fields**: student (code, name, faculty), campaign (title, org name), achievement (role, hours, completed_at)
3. **Render**: Create background job `RENDER_CERTIFICATE`. Worker: fetch template, inject data, render PDF, embed QR verify + checksum, upload to storage, update status to READY or FAILED
4. **Download**: Return presigned URL or file path. Only owner (student) or org admin can access
5. **Revoke**: Set status=REVOKED, store `revokedBy`, `revokeReason`. Public verify returns `valid=false`
6. **Reissue**: Revoke existing + create new certificate with `replacementCertificateId` link
7. **Public verify**: Accepts `certificateNo`, returns `{ valid: boolean, certificate: { studentName, campaignTitle, issueDate } }` — no internal data exposure
8. **Certificate number**: Auto-generated, unique format (e.g., `BKVol-2024-00001`)

**Validation schemas:**
- Create template: `name` required, `type` required, `layoutJson` optional
- Generate: `campaignId` from route, optional `moduleIds` filter
- Render: `certificateId` from route
- Revoke: `reason` required (min 10 chars)
- Reissue: optional `reason`

---

### N-04: Public Discovery Module

**Priority:** MEDIUM
**Effort:** Medium (6-8h)
**Depends on:** R-02 (PUBLISHED state), N-03 (certificate verify)

**Spec endpoints (4):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/public/campaigns` | PUBLIC | List public campaigns with search/filter/pagination |
| GET | `/public/campaigns/:slug` | PUBLIC | Campaign detail with modules, progress |
| GET | `/public/organizations/:code` | PUBLIC | Public org profile and campaigns |
| GET | `/public/certificates/verify/:certificateNo` | PUBLIC | Verify certificate validity |

**Files to create:**
```
src/features/public/
├── public.controller.ts
├── public.service.ts
├── public.repository.ts
├── public.route.ts
├── public.validation.ts
├── types.ts
├── index.ts
└── tests/
    ├── public.controller.test.ts
    ├── public.service.test.ts
    └── public.repository.test.ts
```

**Business logic:**
1. **List campaigns**: Only show `PUBLISHED` or `ONGOING` campaigns. Support search by keyword, filter by scope/type, pagination
2. **Campaign detail**: Show campaign + modules + progress. Do not expose admin-only data (reviews, approver, etc.)
3. **Organization profile**: Show org info + their campaigns. Requires `organizations` table (see N-08)
4. **Certificate verify**: Return minimal info — `valid`, `studentName`, `campaignTitle`, `issuedAt`. No user IDs, no internal data

**Important**: All public endpoints must NOT require authentication. Rate limiting recommended.

---

### N-05: Audit Log Module

**Priority:** MEDIUM
**Effort:** Medium (6-8h)

**Spec endpoint (1):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/admin/audit-logs` | SCHOOL_ADMIN | Query audit logs with filters |

**Schema addition:**

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  actorType   String   @map("actor_type")  // USER | STUDENT | SYSTEM
  actorId     String?  @map("actor_id")
  action      String   @db.VarChar(100)
  entityType  String   @map("entity_type") @db.VarChar(50)
  entityId    String   @map("entity_id") @db.VarChar(191)
  beforeJson  String?  @map("before_json") @db.Text
  afterJson   String?  @map("after_json") @db.Text
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([actorType, actorId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**Files to create:**
```
src/features/audit/
├── audit.controller.ts
├── audit.service.ts
├── audit.repository.ts
├── audit.route.ts
├── audit.validation.ts
├── types.ts
├── index.ts
└── tests/
    ├── audit.controller.test.ts
    ├── audit.service.test.ts
    └── audit.repository.test.ts
```

**Business logic:**
1. **Query endpoint**: Filter by `action`, `entityType`, `actorType`, `dateRange`, pagination
2. **Immutable**: Audit logs can never be updated or deleted
3. **Recording**: Create a shared `createAuditLog()` function in `audit.service.ts` that all modules call
4. **Required audit events** (per spec):
   - Campaign: create, edit, submit, approve, reject, request-revision
   - Donation: verify, reject
   - Item handover: confirm, record
   - Event registration: approve, reject, check-in, complete
   - Certificate: generate, render, revoke, reissue
   - Organization: member role changes
   - Fundraising: bank account config changes
5. Integrate `createAuditLog()` calls into existing services: campaign, donation, event, item-donation

**Integration approach:**
- Add `src/features/audit/audit.service.ts` with `createAuditLog(params)` as an exported function
- Import and call in all existing service files at mutation points
- Pass `req.ip` from controllers to services for IP address logging

---

### N-06: Background Jobs System

**Priority:** MEDIUM
**Effort:** Large (10-14h)

**Schema addition:**

```prisma
model BackgroundJob {
  id         String   @id @default(cuid())
  type       String   @db.VarChar(50) // RENDER_CERTIFICATE | MATCH_SEPAY | etc.
  status     String   @default("PENDING") // PENDING | RUNNING | COMPLETED | FAILED
  payloadJson String  @map("payload_json") @db.Text
  attempts   Int      @default(0)
  maxAttempts Int     @default(3)
  lastError  String?  @map("last_error") @db.Text
  runAt      DateTime @map("run_at")
  startedAt  DateTime? @map("started_at")
  completedAt DateTime? @map("completed_at")
  lockedAt   DateTime? @map("locked_at")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([status, runAt])
  @@index([type])
  @@map("background_jobs")
}
```

**Files to create:**
```
src/features/jobs/
├── job.service.ts          # Job scheduling, execution, retry logic
├── job.repository.ts       # Job queue queries
├── job.runner.ts           # Main runner loop (polls for pending jobs)
├── job.handlers.ts         # Individual job type handlers
├── types.ts                # JobType enum, JobPayload types
├── index.ts
└── tests/
    ├── job.service.test.ts
    └── job.handlers.test.ts
```

**Job types to implement (from spec):**

| Job Type | Trigger | Handler Logic |
|----------|---------|---------------|
| `MATCH_SEPAY_TRANSACTION` | SePay webhook | Match transaction to donation/campaign |
| `RECALCULATE_CAMPAIGN_PROGRESS` | Donation/registration status change | Recalculate progress percentages |
| `GENERATE_CERTIFICATE_CANDIDATES` | Campaign/module ends | Build eligible student list |
| `RENDER_CERTIFICATE` | Certificate PENDING | Render PDF, upload, update status |
| `SEND_NOTIFICATION` | Business events | Send notification + optional email |
| `GENERATE_REPORT_SNAPSHOT` | Campaign end / scheduled | Save report snapshot |

**Business logic:**
1. Job scheduler: `scheduleJob(type, payload, runAt?)` - creates a PENDING job
2. Job runner: Polls `background_jobs` for PENDING jobs where `runAt <= now()`, locks job, executes handler
3. Retry: On failure, increment `attempts`, store `lastError`, if `attempts < maxAttempts` reschedule, else set FAILED
4. Handlers: Each job type has a dedicated handler function in `job.handlers.ts`
5. Integration: Replace direct service calls with `scheduleJob()` where appropriate (e.g., render certificate, send notification, recalculate progress)

**No REST endpoints** - this is an internal system. Jobs are scheduled by other services.

---

### N-07: Report Module

**Priority:** MEDIUM
**Effort:** Medium (6-8h)

**Spec endpoints (3):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/reports/campaigns/:id` | ORG/SCHOOL | Campaign report |
| GET | `/reports/organizations/:id` | ORG/SCHOOL | Organization report |
| GET | `/reports/school/overview` | SCHOOL_ADMIN | School-wide dashboard |

**Files to create:**
```
src/features/report/
├── report.controller.ts
├── report.service.ts
├── report.repository.ts
├── report.route.ts
├── report.validation.ts
├── types.ts
├── index.ts
└── tests/
    ├── report.controller.test.ts
    └── report.service.test.ts
```

**Business logic:**
1. **Campaign report**: Aggregate donation totals, item quantities, participant counts, completion rates by status
2. **Organization report**: All campaigns summary, donation totals, active campaign count, participant statistics
3. **School overview**: Cross-organization comparison, total campaigns by status, donation totals, faculty-level breakdown, leaderboard data

---

### N-08: Organization Management & Scope Enforcement

**Priority:** MEDIUM
**Effort:** Large (8-12h)
**Depends on:** Schema migration (organizations table)

**Background:**
The spec uses `organizations` (with types: SCHOOL_UNION, FACULTY_UNION, CLUB) instead of the current `clubs` table. The current `User` model maps loosely to the spec's `operator_accounts`. This is a significant structural change.

**Two approaches:**
1. **Add `organizations` table alongside `clubs`** — keep `clubs` for backward compatibility, add `organizations` as the spec-compliant table
2. **Replace `clubs` with `organizations`** — full migration

**Spec endpoints:**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/organizations/me` | OPERATOR | Current org and scope |
| PATCH | `/organizations/:id` | ORG_ADMIN | Update org profile |
| GET | `/admin/organizations` | SCHOOL_ADMIN | List/manage organizations |
| POST | `/admin/organizations` | SCHOOL_ADMIN | Create organization |
| PATCH | `/admin/organizations/:id` | SCHOOL_ADMIN | Update organization |

**Schema addition:**

```prisma
model Organization {
  id          String   @id @default(cuid())
  code        String   @unique @db.VarChar(20)
  name        String   @db.VarChar(255)
  type        String   // SCHOOL_UNION | FACULTY_UNION | CLUB
  facultyId   Int?     @map("faculty_id")
  logoUrl     String?  @map("logo_url")
  description String?  @db.Text
  status      String   @default("ACTIVE") // ACTIVE | INACTIVE
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  faculty Faculty? @relation(fields: [facultyId], references: [id])

  @@index([type])
  @@index([facultyId])
  @@map("organizations")
}
```

**Scope enforcement rules:**
- `operator_accounts.organization_id` determines which org the operator belongs to
- Org admins can only operate on campaigns owned by their organization
- Students are scoped to their faculty via `students.faculty_id`
- LCD cannot create campaigns outside their faculty scope unless granted permission

**Files to create:**
```
src/features/organization/
├── organization.controller.ts
├── organization.service.ts
├── organization.repository.ts
├── organization.route.ts
├── organization.validation.ts
├── types.ts
├── index.ts
└── tests/
    ├── organization.controller.test.ts
    ├── organization.service.test.ts
    └── organization.repository.test.ts
```

---

### N-09: Student Dashboard Endpoint

**Priority:** MEDIUM
**Effort:** Small (3-4h)

**Spec endpoint (1):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/students/me/dashboard` | SINHVIEN | Personal dashboard |

**Response shape:**
```json
{
  "data": {
    "student": { "id", "fullName", "mssv", "totalPoints" },
    "currentTitle": { "id", "name", "iconUrl" },
    "stats": {
      "totalDonations": 5,
      "totalDonationAmount": 500000,
      "totalEventsParticipated": 3,
      "totalHours": 12.5,
      "totalCertificates": 2
    },
    "recentActivities": [
      { "type": "DONATION_VERIFIED", "description": "...", "date": "..." },
      { "type": "EVENT_CHECKED_IN", "description": "...", "date": "..." }
    ]
  }
}
```

**Files to modify:**
- `src/features/student/student.controller.ts` - add `getDashboard`
- `src/features/student/student.service.ts` - add `getStudentDashboard()`
- `src/features/student/student.repository.ts` - add dashboard aggregation query
- `src/features/student/student.route.ts` - add GET `/students/me/dashboard`
- `src/features/student/student.validation.ts` - if needed

---

### N-10: User Management Endpoints

**Priority:** MEDIUM
**Effort:** Small (3-4h)

**Spec endpoints (4 missing):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/users` | DOANTRUONG | List users with filters + pagination |
| GET | `/users/:id` | DOANTRUONG | Get user by ID |
| PUT | `/users/:id` | DOANTRUONG | Update user |
| DELETE | `/users/:id` | DOANTRUONG | Soft-delete user |

**Files to modify:**
- `src/features/user/user.controller.ts` - add 4 handlers
- `src/features/user/user.service.ts` - add 4 service functions
- `src/features/user/user.repository.ts` - add 4 repository functions
- `src/features/user/user.route.ts` - add 4 routes
- `src/features/user/user.validation.ts` - add validation schemas
- `src/features/user/types.ts` - add Input/Output types
- `src/features/user/tests/` - add tests

**Business rules:**
- DOANTRUONG can manage all users
- LCD can only view users in their faculty
- CLB can only view themselves
- Cannot delete a user who is a campaign creator (safety check)
- Soft-delete only (set `deletedAt`)

---

### N-11: Admin Student Management Endpoints

**Priority:** MEDIUM
**Effort:** Small (3-4h)

**Spec endpoints (missing):**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/admin/students` | DOANTRUONG | List students with filters + pagination |
| GET | `/admin/students/:id` | DOANTRUONG | Get student detail (admin view) |
| PATCH | `/admin/students/:id` | DOANTRUONG | Update student (admin operation) |
| POST | `/admin/students` | DOANTRUONG | Create student (batch or single) |

**Files to create/modify:**
- Add admin routes to `src/features/student/student.route.ts` or create separate admin routes
- Add admin service functions to `src/features/student/student.service.ts`
- Add admin repository functions to `src/features/student/student.repository.ts`
- Add validation schemas and types

**Business rules:**
- DOANTRUONG can manage all students
- LCD can view students in their faculty
- Student creation should validate MSSV format against faculty code conventions
- Batch creation via CSV upload could be a future enhancement

---

### N-12: Statistics Enhancements

**Priority:** MEDIUM
**Effort:** Medium (5-6h)

**Current:** Only `GET /statistics/system` (system-wide for DOANTRUONG)

**Missing endpoints:**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| GET | `/statistics/faculty/:facultyId` | DOANTRUONG/LCD | Faculty-specific statistics |
| GET | `/statistics/leaderboard` | isAuth | Student leaderboard by points |
| GET | `/statistics/campaigns/:id` | isAuth | Campaign-specific statistics (may overlap with campaign/:id/statistics) |

**Files to modify:**
- `src/features/statistics/statistics.controller.ts` - add endpoints
- `src/features/statistics/statistics.service.ts` - add service functions
- `src/features/statistics/statistics.repository.ts` - add aggregation queries
- `src/features/statistics/statistics.route.ts` - add routes
- `src/features/statistics/types.ts` - create types file (missing)
- `src/features/statistics/statistics.validation.ts` - create validation (missing)

---

### N-13: Notification Enhancements

**Priority:** LOW
**Effort:** Small (2-3h)

**Missing endpoints:**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| DELETE | `/notifications/:id` | isAuth | Delete notification |
| GET | `/notifications/unread-count` | isAuth | Get unread notification count |

**Files to modify:**
- `src/features/notification/notification.controller.ts` - add 2 handlers
- `src/features/notification/notification.service.ts` - add 2 functions
- `src/features/notification/notification.repository.ts` - add 2 functions
- `src/features/notification/notification.route.ts` - add 2 routes
- `src/features/notification/notification.validation.ts` - update if needed

---

### N-14: Upload Delete Endpoint

**Priority:** LOW
**Effort:** Small (1-2h)

**Missing endpoint:**

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| DELETE | `/upload/:type/:filename` | isAuth | Delete uploaded file |

**Business rules:**
- Only the uploader can delete their own files
- Review documents cannot be deleted after campaign is submitted (content-locked)
- Certificate files can never be deleted

**Files to modify:**
- `src/features/upload/upload.controller.ts` - add delete handler
- `src/features/upload/upload.service.ts` - add delete logic (unlink file)
- `src/features/upload/upload.route.ts` - add DELETE route

---

## 6. Improvement Tasks

### I-01: Add `NotificationType` Enum Values

**Priority:** LOW
**Effort:** Tiny (0.5h)

**Current values:** CAMPAIGN_APPROVED, CAMPAIGN_REJECTED, DONATION_VERIFIED, DONATION_REJECTED, ITEM_DONATION_VERIFIED, PARTICIPANT_APPROVED, PARTICIPANT_REJECTED, PARTICIPANT_CHECKED_IN, CERTIFICATE_SENT

**Missing (from spec):**
- `CAMPAIGN_REVISION_REQUESTED` — notify org admin
- `CAMPAIGN_PUBLISHED` — notify org members
- `DONATION_MATCHED` — notify student that bank transfer matched
- `CERTIFICATE_READY` — notify student PDF is ready
- `CERTIFICATE_REVOKED` — notify student
- `EVENT_REGISTRATION_OPEN` — notify eligible students
- `EVENT_COMPLETED` — notify participants

**File:** `prisma/schema.prisma`

---

### I-02: Add `RecipientType` to Notification

**Priority:** LOW
**Effort:** Tiny (0.5h)

**Problem:**
Current Notification uses separate `recipientUserId` and `recipientStudentId` nullable fields. This is functional but makes querying by recipient type inconsistent.

**Improvement (optional):**
Add `recipientType` field for easier filtering, or keep the current dual-FK approach. The current approach is actually fine — skip unless refactoring the notification system.

---

### I-03: Remove Unused Account Model

**Priority:** LOW
**Effort:** Tiny (0.5h)

**Problem:** `Account` model exists in Prisma schema but has no feature module and is unused.

**Action:** Remove the `Account` model from `prisma/schema.prisma` and create a migration to drop the table.

---

### I-04: Add Rate Limiting to Public Endpoints

**Priority:** LOW
**Effort:** Small (1-2h)

**Problem:** Public endpoints (planned in N-04) will be unauthenticated and vulnerable to abuse.

**Action:**
1. Add rate limiter middleware for public routes (e.g., 100 req/min per IP)
2. Apply to `/public/*` routes
3. Keep auth limiter (production only) on `/auth/*` routes

---

### I-05: Add `data_json` to Notifications

**Priority:** LOW
**Effort:** Tiny (0.5h)

**Problem:** Spec requires `data_json` field on notifications for structured data, but current schema only has `title` + `message` text fields.

**Action:** Add `dataJson String? @map("data_json") @db.Text` to `Notification` model in Prisma schema.

---

### I-06: Student Profile Fields Alignment

**Priority:** LOW
**Effort:** Tiny (0.5h)

**Problem:** Spec expects `avatar_url`, `major`, `year` fields on Student. Current schema is missing these.

**Action:** Add fields to Prisma schema:
```prisma
avatarUrl  String?  @map("avatar_url")
major      String?  @db.VarChar(100)
year       Int?
```

---

## 7. Suggested Execution Order

### Phase 1: Foundation & Refactoring (Week 1-2)

| # | Task | ID | Priority | Effort | Dependencies |
|---|------|----|----------|--------|--------------|
| 1 | Extract shared types | R-01 | HIGH | 2-3h | None |
| 2 | Fix campaign faculty scoping bug | R-03 | HIGH | 1-2h | None |
| 3 | Student forgot password | R-04 | HIGH | 2-3h | None |
| 4 | Add missing Prisma fields (I-05, I-06) | I-05, I-06 | LOW | 1h | None |
| 5 | Remove unused Account model | I-03 | LOW | 0.5h | None |
| 6 | Add NotificationType enum values | I-01 | LOW | 0.5h | None |

### Phase 2: Campaign State Machine & Approval (Week 2-4)

| # | Task | ID | Priority | Effort | Dependencies |
|---|------|----|----------|--------|--------------|
| 7 | Campaign state machine alignment | R-02 | HIGH | 8-12h | R-01 |
| 8 | Approval workflow module | N-01 | HIGH | 10-14h | R-02 |
| 9 | Audit log module | N-05 | MEDIUM | 6-8h | None |

### Phase 3: Payment & Finance (Week 4-5)

| # | Task | ID | Priority | Effort | Dependencies |
|---|------|----|----------|--------|--------------|
| 10 | SePay webhook integration | N-02 | HIGH | 6-8h | None |
| 11 | Background jobs system | N-06 | MEDIUM | 10-14h | None |

### Phase 4: Certificates & Public (Week 5-7)

| # | Task | ID | Priority | Effort | Dependencies |
|---|------|----|----------|--------|--------------|
| 12 | Certificate module | N-03 | HIGH | 12-16h | R-02, N-06 |
| 13 | Public discovery module | N-04 | MEDIUM | 6-8h | R-02, N-03 |
| 14 | Student dashboard | N-09 | MEDIUM | 3-4h | None |

### Phase 5: Reporting & Admin (Week 7-9)

| # | Task | ID | Priority | Effort | Dependencies |
|---|------|----|----------|--------|--------------|
| 15 | Organization management | N-08 | MEDIUM | 8-12h | Schema migration |
| 16 | Report module | N-07 | MEDIUM | 6-8h | N-08 |
| 17 | Statistics enhancements | N-12 | MEDIUM | 5-6h | None |
| 18 | User management | N-10 | MEDIUM | 3-4h | None |
| 19 | Admin student management | N-11 | MEDIUM | 3-4h | None |

### Phase 6: Polish & Improvements (Week 9-10)

| # | Task | ID | Priority | Effort | Dependencies |
|---|------|----|----------|--------|--------------|
| 20 | File upload flow refactor | R-05 | LOW | 1-2h | None |
| 21 | Notification enhancements | N-13 | LOW | 2-3h | None |
| 22 | Upload delete endpoint | N-14 | LOW | 1-2h | None |
| 23 | Rate limiting for public | I-04 | LOW | 1-2h | N-04 |
| 24 | Integration testing | — | HIGH | 8-10h | All features |

---

## Total Effort Estimate

| Category | Tasks | Estimated Hours |
|----------|-------|----------------|
| Refactoring | R-01 through R-05 | 14-22h |
| New Features | N-01 through N-14 | 74-105h |
| Improvements | I-01 through I-06 | 3-5h |
| **Total** | **19 tasks** | **91-132h** |

---

## Appendix A: Spec Endpoint → Implementation Mapping

### Fully Implemented (Matches Spec)

| Spec Endpoint | Current Endpoint | Module |
|---------------|-----------------|--------|
| POST /auth/login | POST /auth/login | auth |
| POST /auth/refresh | POST /auth/refresh | auth |
| POST /auth/logout | POST /auth/logout | auth |
| GET /auth/me | GET /auth/me | auth |
| PATCH /auth/me/password | PATCH /auth/change-password | auth |
| GET /notifications | GET /notifications/me | notification |
| PATCH /notifications/:id/read | PUT /notifications/:id/read | notification |
| PATCH /notifications/read-all | PUT /notifications/read-all | notification |

### Partially Implemented (Needs Changes)

| Spec Endpoint | Current Endpoint | Gap |
|---------------|-----------------|-----|
| POST /campaigns | POST /campaigns | Missing slug, beneficiary, cover_image |
| GET /campaigns | GET /campaigns | OK but status filter uses old enum |
| POST /campaigns/:id/submit-review | POST /campaigns/:id/submit | Submit goes to SUBMITTED not PENDING |
| POST /campaigns/:id/approve | POST /campaigns/:id/approve | Goes to APPROVED not PUBLISHED |
| POST /fundraising/modules/:moduleId/donations | POST /donations/money | Different URL pattern |
| GET /students/me/dashboard | — | Not implemented |
| GET /students/me/activities | — | Not implemented |
| GET /students/me/donations | GET /donations/me | Different URL pattern |

### Not Implemented (New)

| Spec Endpoint | Priority |
|---------------|----------|
| POST /approvals/campaigns/:id/comments | HIGH |
| POST /approvals/campaigns/:id/request-revision | HIGH |
| POST /approvals/campaigns/:id/pre-approve | HIGH |
| POST /approvals/campaigns/:id/approve | HIGH |
| POST /approvals/campaigns/:id/reject | HIGH |
| GET /approvals/campaigns | HIGH |
| GET /approvals/campaigns/:id | HIGH |
| POST /fundraising/sepay/webhook | HIGH |
| GET /certificates/templates | HIGH |
| POST /certificates/templates | HIGH |
| POST /certificates/campaigns/:campaignId/generate | HIGH |
| POST /certificates/:id/render | HIGH |
| GET /certificates/:id/download | HIGH |
| POST /certificates/:id/revoke | HIGH |
| POST /certificates/:id/reissue | HIGH |
| GET /public/campaigns | MEDIUM |
| GET /public/campaigns/:slug | MEDIUM |
| GET /public/organizations/:code | MEDIUM |
| GET /public/certificates/verify/:certificateNo | MEDIUM |
| GET /reports/campaigns/:id | MEDIUM |
| GET /reports/organizations/:id | MEDIUM |
| GET /reports/school/overview | MEDIUM |
| GET /organizations/me | MEDIUM |
| PATCH /organizations/:id | MEDIUM |
| GET /admin/organizations | MEDIUM |
| POST /admin/organizations | MEDIUM |
| PATCH /admin/organizations/:id | MEDIUM |
| GET /admin/audit-logs | MEDIUM |
| GET /admin/faculties | LOW (exists as GET /faculties) |
| POST /admin/faculties | LOW (exists as POST /faculties) |
| PATCH /admin/faculties/:id | LOW (exists as PUT /faculties/:id) |

---

## Appendix B: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Campaign state machine migration breaks existing data | HIGH | Write migration script with data validation; test on staging first |
| SePay webhook reliability | MEDIUM | Implement idempotency, retry queue, UNMATCHED manual resolution UI |
| Certificate rendering pipeline failure | MEDIUM | Max 3 retries, FAILED status, manual re-trigger via API |
| Organization model migration from clubs | HIGH | Dual-write period; keep clubs table until full migration verified |
| Background job runner scalability | LOW | Start with simple polling; upgrade to Redis/BullMQ if needed |
| Test coverage regression during refactoring | MEDIUM | Run full test suite after each task; add tests before refactoring |
