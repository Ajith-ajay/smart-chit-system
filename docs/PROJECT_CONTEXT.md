# PROJECT_CONTEXT.md

# Smart Chit Management System (SCMS)

## Project Summary

Smart Chit Management System (SCMS) is a production-grade web application developed to digitize a family-operated chit business.

The application is intended to replace notebooks, paper agreements, handwritten receipts, manual calculations, and physical document storage with a secure and centralized digital platform.

This project models the family's real business workflow rather than a generic chit fund.

---

# Business Overview

The business operates predefined chit plans.

Examples:

- ₹50,000
- ₹1,00,000
- ₹2,00,000
- ₹5,00,000

Each plan contains:

- Fixed 20-installment payment schedule
- Fixed withdrawal schedule

The schedules are predefined.

The application must never calculate them dynamically.

---

# Important Business Fact

This is NOT an auction chit system.

There are:

- No auctions
- No bidding
- No dividend calculations

Members request withdrawals.

The organizer decides whether to approve them based on the current business situation and available funds.

---

# Business Workflow

1. Register Member
2. Upload KYC
3. Create Batch
4. Enroll Member into Batch using a Plan Template
5. Generate Installments
6. Collect Monthly Payments
7. Send Payment Reminders (if required)
8. Receive Withdrawal Request
9. Organizer Approves Withdrawal
10. Generate Declaration & Receipt
11. Upload Signed Documents
12. Complete Enrollment

---

# Core Business Concepts

## Plan Template

A reusable predefined payment schedule.

Examples:

- ₹50K
- ₹1L
- ₹2L
- ₹5L

Each template contains twenty payment amounts and twenty withdrawal amounts.

---

## Batch

Represents one running 20-month collection cycle.

Multiple batches may run simultaneously.

---

## Member

Represents a customer.

A member may join:

- Multiple batches
- Multiple plans
- Multiple enrollments

Members do not access the application directly during Phase 1.

---

## Enrollment (Core Aggregate)

Enrollment is the heart of the application.

Enrollment connects:

Member

↓

Batch

↓

Plan Template

Everything else belongs to Enrollment:

- Installments
- Payments
- Withdrawals
- Documents
- Receipts

### Enrollment assignment workflow

- An administrator selects an active member and an existing draft/running batch. The batch determines the plan template and its stored schedule; schedules are never recalculated during enrollment.
- Each assignment receives a unique `ENR-` reference and remains linked to the member and batch for its full history.
- A member cannot be enrolled twice in the same batch. Cancelled enrollments remain in the history and do not permit a second assignment to that same batch.
- Only active plan templates and active members can be assigned. Completed/cancelled batches are not joinable.
- The initial API currently activates enrollments only when all batch installments are still pending. Joining a batch after collection has begun requires collecting each missed scheduled installment and issuing receipts first. The payment and receipt workflow is a separate vertical slice and must be completed before late enrollment is enabled.

API endpoints (authenticated, admin roles):

- `GET /api/v1/enrollments/available-batches` — joinable batches with the plan's stored schedule.
- `GET /api/v1/enrollments/members/:memberId` — a member's enrollment history.
- `POST /api/v1/enrollments/members/:memberId` — assign the member to a batch using `{ "batchId": "<uuid>", "remarks": "optional" }`.

---

# Payment Rules

Collection deadline:

9th of every month.

Withdrawal day:

10th of every month.

Accepted payment methods:

- Cash
- UPI
- Bank Transfer

Late payment is allowed.

No penalty is applied.

Advance payments are supported.

---

# Withdrawal Rules

Withdrawal is manually approved.

Approval depends on available business funds.

Split payments are allowed.

Every completed withdrawal requires:

- Declaration
- Receipt
- Signed documents

---

# Current User Roles

Phase 1

- Super Admin
- Admin

Future

- Member Portal

---

# Technology Stack

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend

- NestJS
- Prisma
- PostgreSQL
- Redis

Infrastructure

- Docker
- AWS
- GitHub Actions

---

# Architecture Principles

- Enrollment is the center of the system.
- Financial history is immutable.
- Business rules override software assumptions.
- Derived values should not be stored.
- Use Decimal for all monetary values.
- Every financial action must be auditable.

---

# Development Strategy

Develop features vertically.

Business Rule

↓

Database

↓

Backend

↓

API

↓

Frontend

↓

Testing

---

# Current Progress

Completed

- Business Analysis
- BRD
- BRB
- Architecture Planning
- Tech Stack Selection
- Folder Structure
- AGENT.md

Current Stage

Prisma Schema Design

Next Steps

1. Design ER Model
2. Implement Prisma Schema
3. Create Initial Migration
4. Authentication
5. Member Management
6. Plan Templates
7. Batch Management
8. Enrollment Module

---

# Project Vision

Build a production-ready financial management platform that can eventually evolve into a SaaS application supporting multiple organizations while preserving the current family's business workflow.

## Implemented Financial and Document Modules

The current API implementation includes:

- Authentication and role-based access
- Member management
- Multi-plan batch management
- Enrollment and late-enrollment catch-up
- Flexible payment collection and payment allocation
- Payment receipts
- Withdrawal requests, manual approval, and split payouts
- Document metadata management and KYC verification

### Payment flexibility

A member may pay one installment through any number of partial payments. Payments can also be allocated across multiple installments, including advance payments and intentionally skipped earlier installments. Installment schedules remain immutable; balances are derived from payment allocations.

### Withdrawal flexibility

There is no monthly limit on the number of members who can withdraw. Any number of eligible members may have withdrawal requests approved in the same month, subject to the predefined withdrawal schedule and manual business approval.

### Document/KYC rules

Documents are registered against enrollments and can reference the related member, payment, or withdrawal. KYC documents require a KYC type and number and start in PENDING status. Only administrators can verify or reject KYC documents. A verified KYC document cannot be downgraded; a replacement must be uploaded as a new document.

## Lifecycle and operational rules (2026-10)

- Installment months are due dates, not hard payment cutoffs. A past-due installment remains open until its required member balances are fully reconciled.
- Multiple installments may remain ACTIVE simultaneously. The lifecycle processor never closes a previous installment merely because a new month starts.
- An installment can become COMPLETED only after the late-enrollment window has closed (after installment 3) and all non-cancelled enrollments in that plan have fully paid that installment.
- Enrollment completion is derived from all 20 installment balances reaching zero.
- Batch completion requires the 20 installment records to be COMPLETED and no ACTIVE enrollments to remain.
- Documents are physically stored in the local filesystem during development. The storage service is isolated so it can later be replaced with S3.
- Payment reminders are currently WhatsApp-only. The provider uses configurable WhatsApp Business Cloud API credentials; additional channels can be added later behind the provider boundary.
- Any number of eligible members may withdraw in the same month; there is no monthly withdrawal-count cap.
