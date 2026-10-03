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
