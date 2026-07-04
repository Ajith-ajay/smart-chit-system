# AGENT.md

## Smart Chit Management System (SCMS)

### Mission

Build a secure, scalable, maintainable full-stack application for
managing a traditional chit business. Prioritize correctness, financial
accuracy, auditability, and simplicity over rapid feature delivery.

## Core Principles

- Business rules before code.
- Every financial action must be auditable.
- Never delete financial history.
- Security by default.
- Prefer clarity over cleverness.
- Update documentation with every feature.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Zustand

### Backend

- NestJS
- Prisma
- PostgreSQL
- Redis
- BullMQ
- JWT
- Swagger

### Infrastructure

- Docker
- Docker Compose
- Nginx
- AWS EC2
- AWS S3
- GitHub Actions

## Repository Layout

```text
apps/
  web/
  api/
packages/
  ui/
  utils/
  validation/
  config/
prisma/
docs/
docker/
infrastructure/
```

## Workflow

1.  Understand business rule.
2.  Update docs.
3.  Design database.
4.  Design API.
5.  Implement backend.
6.  Implement frontend.
7.  Write tests.
8.  Verify business logic.
9.  Update documentation.

## Coding Standards

- TypeScript strict mode.
- Avoid `any`.
- Feature-based architecture.
- Reusable components.
- Dependency Injection.
- No duplicated business logic.

## Naming

- folders: kebab-case
- components: PascalCase
- variables: camelCase
- constants: UPPER_CASE
- tables: snake_case

## Git

Branches: - main - develop - feature/* - fix/* - hotfix/\*

Commits: - feat: - fix: - refactor: - docs: - test: - chore:

## Security

- bcrypt password hashing
- RBAC
- Request validation
- Environment variables only
- Files stored in S3
- Audit logging enabled

## Financial Rules

- No direct deletion of payments.
- Corrections through reversal entries.
- Every payment generates a receipt.
- Every prize payment requires acknowledgement.

## Testing

- Unit
- Integration
- Authorization
- Validation
- Financial calculation

## Documentation

Maintain: - SRS - API docs - ER diagrams - Deployment guide - User
manual

## Definition of Done

- Business logic verified
- Tests pass
- Lint passes
- Documentation updated
- API documented
- Responsive UI
- Security reviewed

## AI Agent Rules

- Read existing code before changes.
- Reuse existing modules.
- Ask when requirements are ambiguous.
- Never invent financial rules.
- Preserve backward compatibility.

## Long-Term Vision

Support: - Multi-admin - Multi-branch - Mobile app - Digital
signatures - WhatsApp notifications - Analytics - SaaS deployment

# AGENT.md

# Smart Chit Management System (SCMS)

> AI Development Guide & Engineering Standards

---

# Mission

Build a production-ready financial management system for a family-operated chit business.

The application must prioritize:

- Business correctness
- Financial integrity
- Security
- Maintainability
- Scalability
- Auditability

The software must adapt to the existing business workflow rather than forcing the business to change.

---

# Project Overview

SCMS is **NOT** an auction-based chit system.

It is a predefined schedule-based chit management application where:

- Members enroll in predefined plan templates.
- Multiple batches run simultaneously.
- Members may participate in multiple plans and batches.
- Withdrawals are manually approved.
- Financial records are immutable.
- All supporting documents are stored digitally.

---

# Source of Truth

Development must always follow this order of priority:

1. Business Requirements Document (BRD)
2. Business Rule Book (BRB)
3. Architecture Decision Records (ADR)
4. Database Schema
5. API Contracts
6. Application Code

If implementation conflicts with business rules, the business rules take precedence.

---

# Core Business Principles

## Enrollment is the center of the system.

Everything revolves around an Enrollment.

Member

↓

Enrollment

↓

Installments

↓

Payments

↓

Withdrawals

↓

Documents

Do not build features directly around Member or Batch.

---

## Never Calculate Business Schedules

Installment amounts and withdrawal amounts come from Plan Templates.

Never calculate them dynamically.

---

## Never Delete Financial Data

Payments

Receipts

Withdrawals

Transactions

must never be permanently deleted.

Use reversal or adjustment records instead.

---

## Everything Must Be Auditable

Every important action must be traceable.

Record:

- Who
- What
- When
- Previous Value
- New Value
- Reason (where applicable)

---

# Development Philosophy

Always implement features vertically.

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

Never build pages before backend logic.

Never build backend before understanding the business rule.

---

# Architecture Principles

Follow Clean Architecture.

Business logic belongs only in backend services.

Controllers remain thin.

Repositories access data.

Never place business logic inside controllers.

---

# Technology Stack

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zustand
- Zod

Backend

- NestJS
- Prisma
- PostgreSQL
- Redis
- BullMQ

Infrastructure

- Docker
- Docker Compose
- AWS EC2
- AWS S3
- Nginx
- GitHub Actions

---

# Coding Standards

Use:

- TypeScript Strict Mode
- ESLint
- Prettier

Avoid:

- any
- duplicated code
- magic strings
- business logic inside UI

Prefer:

- reusable services
- reusable components
- dependency injection
- composition over inheritance

---

# Financial Rules

Use Decimal for money.

Never use Float.

Never store calculated balances.

Always derive:

- Outstanding
- Remaining Installments
- Total Paid
- Profit

from source data.

---

# Repository Structure

apps/

- api
- web

packages/

- ui
- validation
- types
- config
- utils

docs/

prisma/

docker/

infrastructure/

---

# Feature Development Order

1. Authentication
2. Member Management
3. Plan Templates
4. Batch Management
5. Enrollment
6. Installments
7. Payments
8. Withdrawals
9. Documents
10. Reports
11. Dashboard
12. Notifications

---

# Naming Conventions

Folders

kebab-case

Components

PascalCase

Variables

camelCase

Constants

UPPER_CASE

Database Tables

snake_case

---

# Database Rules

Normalize data.

Never duplicate financial information.

Use foreign keys.

Use soft deletion only for non-financial entities.

Prefer UUID primary keys.

Store timestamps on every entity.

---

# API Rules

RESTful APIs.

Consistent response format.

Validate every request.

Never expose internal errors.

Document all endpoints using Swagger.

---

# Security

Hash passwords using bcrypt.

Use JWT authentication.

Use Role-Based Access Control.

Validate authorization for every endpoint.

Store secrets only in environment variables.

Never commit secrets.

---

# Testing

Every business rule must have tests.

Required:

- Unit Tests
- Integration Tests
- Authorization Tests
- Validation Tests
- Financial Calculation Tests

---

# Definition of Done

A feature is complete only if:

- Business rule implemented
- Database migration completed
- Backend implemented
- Frontend completed
- Validation added
- Tests passing
- Documentation updated
- No lint errors

---

# AI Agent Instructions

Before writing code:

1. Read the relevant business rule.
2. Understand existing architecture.
3. Reuse existing modules.
4. Avoid unnecessary dependencies.
5. Explain trade-offs before major design changes.
6. Ask questions if business requirements are ambiguous.
7. Never invent financial rules.
8. Never break backward compatibility without approval.

---

# Long-Term Vision

The architecture should support:

- Multi-admin
- Multi-branch
- Member portal
- Mobile application
- Digital signatures
- WhatsApp notifications
- Advanced reporting
- Accounting integration
- SaaS deployment

Every implementation decision should consider future scalability while keeping the current solution simple.

---

# Guiding Principle

> Build software that reflects the business, not software that forces the business to change.
