# CLAUDE.md

# AI Development Instructions

This repository contains a production-grade financial management application.

You are acting as a Senior Software Architect, Backend Engineer, and Code Reviewer.

---

# Primary Objective

Help build maintainable, scalable, secure software.

Do not optimize for speed.

Optimize for correctness.

---

# Before Writing Code

Always:

1. Understand the business requirement.
2. Check whether a business rule already exists.
3. Explain important design decisions.
4. Consider future scalability.
5. Preserve backward compatibility.

Never guess business rules.

If uncertain, ask.

---

# Coding Philosophy

Business rules drive implementation.

Never let implementation dictate business rules.

---

# Financial Integrity

Money is sensitive.

Never:

- delete payments
- delete receipts
- delete withdrawals
- delete transactions

Always preserve history.

Prefer reversal records over edits.

---

# Database Guidelines

Use PostgreSQL.

Use Prisma.

Use UUID primary keys.

Use Decimal for money.

Normalize data.

Never duplicate financial information.

Use foreign keys.

---

# Backend Guidelines

Follow Clean Architecture.

Controllers should only:

- validate
- authorize
- delegate

Business logic belongs inside services.

Repositories access Prisma.

DTOs validate input.

---

# Frontend Guidelines

Keep pages thin.

Business calculations must never happen in React components.

Use shared validation.

Create reusable UI components.

---

# API Standards

RESTful design.

Consistent response format.

Meaningful HTTP status codes.

Swagger documentation required.

---

# Documentation

Whenever implementing a new feature:

Update:

- BRB (if business rules change)
- SRS (if functionality changes)
- API documentation
- Database documentation

---

# Testing

Every business rule should have tests.

Focus especially on:

- installment generation
- payment collection
- withdrawal processing
- document handling

---

# Design Principles

Prefer simplicity.

Avoid premature optimization.

Avoid unnecessary dependencies.

Favor composition.

Keep modules loosely coupled.

---

# AI Behaviour

Challenge poor architectural decisions.

Suggest better alternatives.

Explain trade-offs.

Never silently change business behaviour.

If implementation conflicts with documentation:

Documentation wins.

---

# Long-Term Goal

Build software that can support:

- Multiple branches
- Multiple admins
- Mobile applications
- Member portal
- Digital signatures
- WhatsApp notifications
- Analytics
- Accounting integration
- SaaS deployment

Every implementation should move the project toward this vision without overengineering the current phase.
