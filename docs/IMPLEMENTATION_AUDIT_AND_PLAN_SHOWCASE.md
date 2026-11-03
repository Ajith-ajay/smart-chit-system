# SCMS Source Audit and Plan Showcase API

Audit basis: source archive supplied on 2026-11-03. This is a static source review; runtime integration tests were not run because dependencies were not installed in the supplied archive.

## 1. Plan showcase API

The plan master data is `PlanTemplate` with child `PlanScheduleTemplate` rows. The database stores `totalAmount`, `installmentCount`, `isActive`, and each schedule row's `installmentNumber`, `installmentAmount`, and `withdrawalAmount`. The seeded plans are ₹50,000, ₹1,00,000, ₹2,00,000, and ₹5,00,000, each intended to have 20 fixed schedule rows.

The following read-only API is implemented in this audit patch:

| Method | Endpoint            | Access                  | Purpose                                                                 |
| ------ | ------------------- | ----------------------- | ----------------------------------------------------------------------- |
| GET    | `/api/v1/plans`     | JWT + SUPER_ADMIN/ADMIN | List active plans, ordered by total amount, including all schedule rows |
| GET    | `/api/v1/plans/:id` | JWT + SUPER_ADMIN/ADMIN | Fetch one active plan and its complete stored schedule                  |

### Response contract

The global response interceptor wraps successful results as `{ success, timestamp, data }`.

`GET /api/v1/plans` returns `data` as an array; `GET /api/v1/plans/:id` returns `data` as one plan. A plan contains:

- `id`, `name`, `totalAmount`, `installmentCount`, `isActive`
- `schedules[]`: `installmentNumber`, `installmentAmount`, `withdrawalAmount`

Prisma Decimal values serialize as decimal strings. The frontend should convert them to JavaScript numbers only for display formatting, not for financial calculations. The frontend must display the returned schedule and must not synthesize missing rows or calculate withdrawal amounts.

Example shape (illustrative field shape only; values must come from the database):

```json
{
  "success": true,
  "timestamp": "2026-11-03T12:00:00.000Z",
  "data": {
    "id": "<plan-uuid>",
    "name": "₹50,000 Plan",
    "totalAmount": "50000.00",
    "installmentCount": 20,
    "isActive": true,
    "schedules": [
      {
        "installmentNumber": 1,
        "installmentAmount": "<stored-decimal>",
        "withdrawalAmount": "<stored-decimal>"
      }
    ]
  }
}
```

Only active templates are returned. A missing or inactive plan returns 404. The API is intentionally read-only: approved plan schedules are seeded from the JSON master files, and batch creation snapshots those values into `BatchInstallment` rows. Plan editing should not silently mutate schedules already used by batches.

### Existing related endpoint

`GET /api/v1/batches/plan-templates` already returns active templates with their schedules and is used by batch creation. It remains useful for the batch workflow. The new `/plans` endpoints are the dedicated plan showcase contract. Both are authenticated admin routes.

## 2. Implemented API catalogue

All routes below use the `/api/v1` prefix. Unless specified, routes are protected by JWT. Role labels: **Admin** = SUPER_ADMIN/ADMIN; **Employee** = SUPER_ADMIN/ADMIN/EMPLOYEE; **JWT-only** = JWT guard exists but no role guard is enforced in that controller.

### Authentication

| Method | Route                   | Access |
| ------ | ----------------------- | ------ |
| POST   | `/auth/login`           | Public |
| POST   | `/auth/refresh`         | Public |
| POST   | `/auth/forgot-password` | Public |
| POST   | `/auth/reset-password`  | Public |
| POST   | `/auth/signup`          | Public |
| GET    | `/auth/me`              | JWT    |
| PATCH  | `/auth/change-password` | JWT    |
| POST   | `/auth/logout`          | JWT    |

### Members

| Method | Route                               | Access              |
| ------ | ----------------------------------- | ------------------- |
| GET    | `/members?page&limit&search&status` | Admin               |
| POST   | `/members`                          | Admin               |
| GET    | `/members/:id`                      | Admin               |
| PATCH  | `/members/:id`                      | Admin               |
| DELETE | `/members/:id`                      | Admin (soft delete) |

### Plans and batches

| Method | Route                                | Access             |
| ------ | ------------------------------------ | ------------------ |
| GET    | `/plans`                             | Admin              |
| GET    | `/plans/:id`                         | Admin              |
| GET    | `/batches/plan-templates`            | Admin              |
| GET    | `/batches?status`                    | Admin              |
| POST   | `/batches`                           | Admin              |
| GET    | `/batches/:id`                       | Admin              |
| PATCH  | `/batches/:id`                       | Admin (DRAFT only) |
| POST   | `/batches/:id/plans`                 | Admin (DRAFT only) |
| DELETE | `/batches/:id/plans/:planTemplateId` | Admin (DRAFT only) |
| POST   | `/batches/:id/start`                 | Admin              |
| POST   | `/batches/:id/lifecycle/process`     | Admin              |
| POST   | `/batches/lifecycle/process-all`     | Admin              |
| POST   | `/batches/:id/complete`              | Admin              |
| POST   | `/batches/:id/cancel`                | Admin              |

### Enrollments

| Method | Route                                                                 | Access |
| ------ | --------------------------------------------------------------------- | ------ |
| GET    | `/enrollments/available-batches`                                      | Admin  |
| GET    | `/enrollments/members/:memberId`                                      | Admin  |
| POST   | `/enrollments/members/:memberId`                                      | Admin  |
| GET    | `/enrollments/members/:memberId/catch-up-preview?batchId&batchPlanId` | Admin  |
| POST   | `/enrollments/members/:memberId/catch-up`                             | Admin  |

There is no global `GET /enrollments`, no `GET /enrollments/:id`, and no `POST /enrollments` route in the backend controller.

### Payments and receipts

| Method | Route                                         | Access   |
| ------ | --------------------------------------------- | -------- |
| POST   | `/payments/enrollments/:enrollmentId`         | Employee |
| GET    | `/payments/enrollments/:enrollmentId`         | Employee |
| GET    | `/payments/enrollments/:enrollmentId/summary` | Employee |
| GET    | `/payments/:id`                               | Employee |
| POST   | `/payments/:id/reverse`                       | Employee |
| GET    | `/receipts/:id`                               | Employee |
| GET    | `/receipts/payments/:paymentId`               | Employee |
| POST   | `/receipts/:id/cancel`                        | Employee |
| POST   | `/receipts/:id/reissue`                       | Employee |

There is no global `GET /payments` and no global `GET /receipts` route.

### Withdrawals

| Method | Route                                             | Access   |
| ------ | ------------------------------------------------- | -------- |
| GET    | `/withdrawals/enrollments/:enrollmentId/eligible` | JWT-only |
| GET    | `/withdrawals/enrollments/:enrollmentId`          | JWT-only |
| POST   | `/withdrawals/enrollments/:enrollmentId`          | JWT-only |
| GET    | `/withdrawals/:id`                                | JWT-only |
| POST   | `/withdrawals/:id/approve`                        | JWT-only |
| POST   | `/withdrawals/:id/reject`                         | JWT-only |
| POST   | `/withdrawals/:id/payouts`                        | JWT-only |
| POST   | `/withdrawals/payouts/:payoutId/reverse`          | JWT-only |

### Documents and KYC

| Method | Route                                         | Access   |
| ------ | --------------------------------------------- | -------- |
| POST   | `/documents/enrollments/:enrollmentId`        | Employee |
| POST   | `/documents/enrollments/:enrollmentId/upload` | Employee |
| GET    | `/documents/enrollments/:enrollmentId`        | Employee |
| GET    | `/documents/members/:memberId/kyc`            | Employee |
| GET    | `/documents/:id`                              | Employee |
| GET    | `/documents/:id/file`                         | Employee |
| POST   | `/documents/:id/verify`                       | Admin    |
| POST   | `/documents/:id/reject`                       | Admin    |
| PATCH  | `/documents/:id/kyc-status`                   | Admin    |

### Reminders and follow-ups

| Method | Route                                                  | Access   |
| ------ | ------------------------------------------------------ | -------- |
| GET    | `/reminders?enrollmentId&status`                       | Employee |
| POST   | `/reminders/enrollments/:enrollmentId`                 | Employee |
| PATCH  | `/reminders/:id/status`                                | Admin    |
| POST   | `/reminders/dispatch-due`                              | Admin    |
| GET    | `/reminders/follow-ups?enrollmentId&memberId&onlyOpen` | Employee |
| POST   | `/reminders/enrollments/:enrollmentId/follow-ups`      | Employee |
| POST   | `/reminders/follow-ups/:id/complete`                   | Employee |

### Reports, health, and mail

| Method | Route                          | Access                           |
| ------ | ------------------------------ | -------------------------------- |
| GET    | `/reports/dashboard?from&to`   | Employee                         |
| GET    | `/reports/batches/:id`         | Employee                         |
| GET    | `/reports/enrollments/:id`     | Employee                         |
| GET    | `/reports/collections?from&to` | Employee                         |
| GET    | `/reports/withdrawals?from&to` | Employee                         |
| GET    | `/health`                      | Public                           |
| POST   | `/mail/send`                   | **No guard found in controller** |

## 3. Frontend page inventory and integration gaps

The supplied frontend contains 31 page components and route handling in `apps/web/src/App.tsx`. The package is Next.js 16, but the application itself is mounted through a catch-all `pages/[[...path]].tsx` route and uses a custom path router inside `App.tsx`.

### Existing pages

| Area        | Existing pages                                          | Audit result                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth        | Login, Forgot Password, Reset Password, Change Password | Pages exist; verify API request/response and session refresh behavior in integration tests                                                                                                                             |
| Dashboard   | Dashboard                                               | Page exists, but its expected KPI shape does not match the backend dashboard response; chart/activity arrays are not returned by the current API                                                                       |
| Members     | List, Create, Detail                                    | Pages exist; member API is implemented. Verify member detail's enrollment and KYC panels use the supported scoped endpoints                                                                                            |
| Plans       | List, Detail                                            | Pages exist. Plan API was a placeholder; this patch implements the two read endpoints and aligns the pages with actual schema fields and schedule rows                                                                 |
| Batches     | List, Create, Detail                                    | Pages exist; batch API is implemented. Validate all page assumptions against the actual response fields and lifecycle behavior                                                                                         |
| Enrollments | List, Create, Catch-up, Detail                          | Pages exist, but several frontend API methods target routes that do not exist (`GET /enrollments`, `GET /enrollments/:id`, `POST /enrollments`). Must rewire to member-scoped routes or add the missing backend routes |
| Payments    | List, Create, Detail                                    | Create/detail/reverse and enrollment-scoped history exist. List page reads collection report but expects a different property/status contract; no global payment endpoint exists                                       |
| Receipts    | List, Detail                                            | Detail endpoints exist. List page calls unsupported `GET /receipts`; schema also has no direct `amount` or `issuedAt` fields, so list response must join payment/payout data                                           |
| Withdrawals | List, Detail                                            | Detail and enrollment-scoped operations exist. List page expects a global list/report shape and status names that differ from backend enums; `GET /withdrawals` does not exist                                         |
| Documents   | Documents/KYC list                                      | Page exists, but it loads only the first enrollment's documents when no enrollment is selected. There is no global document list endpoint. Status/search filters are not applied by the current query                  |
| Reminders   | Reminders, Follow-ups                                   | Pages and scoped APIs exist; validate status enum and provider failure handling against UI                                                                                                                             |
| Reports     | Overview, Collections, Withdrawals, Batch Report        | Pages exist, but report DTO/type contracts must be reconciled with repository responses; batch report UI expects richer fields than current batch report response                                                      |
| Settings    | Settings                                                | Currently only API base URL/connectivity settings; not business settings, users/roles, audit, receipt prefix, or company configuration                                                                                 |

### Missing frontend pages / workflows

1. **Audit Log viewer** — `AuditLog` exists in Prisma, but no audit-log controller, service, route, API client, or UI page is present.
2. **Business/System Settings** — `SystemSettings` exists in Prisma, but no settings API or business settings page is present. Current Settings page only changes the API URL in local storage.
3. **Global Receipt Register** — current UI page exists, but backend list route is absent; implement a paginated receipt register endpoint or remove/replace the page.
4. **Global Document/KYC Queue** — current page exists but is not a true global queue; add a filtered global document endpoint if staff need cross-enrollment review.
5. **Plan administration** — no UI/API workflow for creating, editing, activating, or deactivating plan templates. Current approach is seeded read-only master data; if this is intentional, do not add CRUD pages. If the business needs plan changes, design versioning and effective-date rules first.
6. **Public plan catalogue** — current plan routes and pages are authenticated admin functionality. If customers or a public marketing site must view plans, create a separate intentionally public, read-only route and public frontend page; do not remove auth from the admin route just to enable public display.

## 4. Priority defect and gap catalogue

### P0 — fix before relying on the frontend for live operations

- **Unprotected mail send endpoint:** `POST /api/v1/mail/send` has no JWT/role guard in `MailController`. Restrict it or remove it if unused; otherwise it can be abused to send mail through the configured provider.
- **Withdrawal authorization:** all withdrawal routes use JWT only and do not apply `RolesGuard`. Restrict approval, rejection, payout, and payout reversal to appropriate admin roles. Decide separately whether request creation should be available to employees.
- **Enrollment route mismatch:** frontend `enrollmentsApi.getAll/getById/create` target endpoints absent from the backend. Enrollment list/create/detail pages cannot be considered integrated until rewired or backend routes are added.
- **Dashboard response mismatch:** backend returns nested `members`, `enrollments`, `batches`, `collections`, `payouts`, and `withdrawals`; dashboard UI expects flat `activeMembers`, `totalCollections`, etc. Backend currently does not return chart trends or recent activity arrays. Fix one side with a documented response DTO; do not display invented values.
- **Receipt register cannot load:** `receiptsApi.getAll()` calls missing `GET /receipts`. The receipt model has no direct amount/issuedAt fields. Add a repository query joining payment and withdrawal payout or redesign the page to use available scoped data.
- **Payment list contract mismatch:** collection report returns `paymentId`, `method`, `referenceNumber`, `amount`, and enrollment/member/batch details. Payment list UI expects `id`, `paymentMethod`, `reference`, and other differently named fields, plus status values such as `SUCCESS` that are not backend payment statuses.
- **Withdrawal list contract mismatch:** withdrawal report returns `withdrawalId`, `requestedAt`, `payouts[]`, etc.; the UI expects `id`, `requestDate`, `paidAmount`, and status labels such as `REQUESTED`/`FULLY_PAID`, which differ from the Prisma enum (`PENDING`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED`).
- **Documents page is not global:** when no enrollment is selected, it fetches only the first enrollment's documents. This can hide KYC documents from the operator. Add a global filtered endpoint or require an explicit enrollment/member selection and communicate that clearly.

### P1 — required for a complete operational product

- Add global, paginated payment and receipt register endpoints with search/date/status filters, or explicitly redesign those screens to be scoped.
- Add global document/KYC review queue with filters for KYC status, member, and document type.
- Add AuditLog read API and audit log page with date/entity/user filters; preserve append-only behavior.
- Add SystemSettings read/update API with strict allow-listed keys and admin authorization; separate it from browser-local API URL settings.
- Reconcile reports frontend types and UI to actual repository responses. Current dashboard, batch report, enrollment report, collection report, and withdrawal report type assumptions are not a reliable contract.
- Fix unused/nonfunctional filters: payment and withdrawal search/status state is not incorporated into the query; document status/search is not applied to the request or local filtering.
- Reconcile stale frontend domain types with Prisma enums and response shapes, especially Enrollment, Payment, Receipt, Withdrawal, KYC Document, and Report types.
- Confirm production CORS origins are environment-configurable. `main.ts` currently hardcodes `http://localhost:3000`.
- Fix Settings page reset URL: it currently resets to `http://localhost:3000/api/v1`, while the API server default port in `main.ts` is 5000.

### P2 — hardening and maintainability

- Add explicit response DTOs for every controller and generate/maintain OpenAPI contracts. Many current services return Prisma records directly.
- Add integration tests for each workflow: batch creation/schedule snapshot, late catch-up, partial/advance allocation, reversals, withdrawal approval/split payout/reversal, receipt cancel/reissue, KYC verification, and lifecycle processing.
- Review role checks consistently across all controllers; avoid a mix of JWT-only and role-protected financial routes.
- Ensure every financial mutation writes a meaningful AuditLog row. The schema has AuditLog, but no read API was found in the supplied controllers.
- Add request correlation IDs and structured audit context for financial mutations.
- Add pagination consistently to global list APIs and enforce maximum `limit` values.

## 5. Important business-rule safeguards

- This is a predefined-schedule chit workflow, not an auction/bidding/dividend system. Do not label withdrawal values as bids or dividend offsets.
- Keep all 20 installment and withdrawal amounts sourced from stored schedule rows. The frontend must never calculate or fabricate missing schedule rows.
- Keep Decimal values authoritative in the backend. Frontend numeric conversion is for display only.
- Batch creation snapshots plan schedules into batch installments. Do not retroactively rewrite existing batch schedules when a plan master record changes.
- Late payments remain valid; no late penalty should be invented by the frontend.
- Payment/payout history should be reversed, not deleted.

## 6. Files changed in this patch

- `apps/api/src/modules/plans/plans.controller.ts`
- `apps/api/src/modules/plans/plans.service.ts`
- `apps/api/src/modules/plans/plans.module.ts`
- `apps/api/src/modules/plans/plans.controller.spec.ts`
- `apps/api/src/modules/plans/plans.service.spec.ts`
- `apps/web/src/types/index.ts`
- `apps/web/src/lib/api/plans.ts` (existing methods now match the implemented endpoints; no route changes required)
- `apps/web/src/features/plans/PlansListPage.tsx`
- `apps/web/src/features/plans/PlanDetailPage.tsx`
- `apps/web/src/features/batches/BatchDetailPage.tsx`
- `apps/web/src/features/batches/BatchCreatePage.tsx`
- `apps/web/src/features/enrollments/EnrollmentCreatePage.tsx`
- `apps/web/src/features/enrollments/EnrollmentCatchUpPage.tsx`

## 7. Verification status

- Static inspection of API controllers, services, DTOs, Prisma schema, frontend API clients, route wiring, and page components: completed for the supplied source archive.
- Plan endpoint implementation and frontend contract alignment: patched.
- Automated unit tests, TypeScript build, database-backed API calls, and browser end-to-end tests: **not run**. The supplied archive did not include installed `node_modules`; run the repository's lint/test/build commands and exercise `/docs` against a development database before merging or deploying.
- The archive includes `.env` files. Treat them as secrets: do not commit or redistribute real credentials; rotate any real passwords, JWT secrets, mail credentials, or database credentials that may have been exposed.
