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
