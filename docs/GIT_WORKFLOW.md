# SCMS – Git & GitHub Workflow Guide

**Project:** Smart Chit Management System (SCMS)  
**Purpose:** Standard Git workflow for maintaining code quality and safely committing and pushing changes to GitHub.

---

## 1. Standard Git Workflow

Follow these steps whenever you are preparing to commit changes.

### Step 1: Fetch Latest Changes

Fetch the latest information from the remote repository.

```bash
git fetch origin
```

Check the current branch:

```bash
git branch --show-current
```

If working in a shared branch, ensure you have incorporated the latest changes before starting new work.

### Step 2: Review Modified Files

Check the working tree:

```bash
git status
```

Review unstaged changes:

```bash
git diff
```

Verify that:

- Only intended files are modified.
- No temporary or generated files are included unnecessarily.
- No unrelated changes are mixed into the commit.

### Step 3: Check Sensitive Files

Ensure the following are never committed:

- `.env` and environment-specific secrets.
- Database passwords and credentials.
- JWT secrets and API keys.
- Private SSH keys and certificates.
- Production database backups.
- Personal or confidential customer data.

Check:

```bash
git status --short
```

Verify that `.gitignore` excludes sensitive files.

**Important:** If a secret was already committed, adding it to `.gitignore` is not sufficient. Rotate the exposed credential.

### Step 4: Run Code Quality Checks

Run the project-wide lint command:

```bash
pnpm lint
```

Current SCMS validation setup:

| Application | Validation                  |
| ----------- | --------------------------- |
| API         | ESLint                      |
| Web         | TypeScript (`tsc --noEmit`) |

Resolve all errors before proceeding.

### Step 5: Run Relevant Tests

Run API tests:

```bash
pnpm --filter api test
```

For individual tests, use the appropriate Jest options.

Run tests for other affected components when applicable.

### Step 6: Verify Production Builds

For significant changes and before release-related commits:

**API build:**

```bash
pnpm --filter api build
```

**Web build:**

```bash
pnpm --filter web build
```

Ensure both builds complete successfully.

### Step 7: Stage Changes

Stage all intended changes:

```bash
git add .
```

Alternatively, stage individual files:

```bash
git add apps/api/src/modules/payments/
```

Review staged changes:

```bash
git diff --cached
```

Make sure no unwanted files or secrets are staged.

### Step 8: Commit Changes

Use Conventional Commits for consistent commit history.

```bash
git commit -m "feat(api): add payment management"
```

During the commit, Husky automatically executes the pre-commit hook.

The configured `lint-staged` tasks are:

| Task                  | API | Web |
| --------------------- | --- | --- |
| ESLint autofix        | Yes | No  |
| TypeScript validation | No  | Yes |
| Prettier formatting   | Yes | Yes |

If a check fails, fix the issue and retry the commit.

### Step 9: Push to GitHub

Push the current branch:

```bash
git push origin dev-1
```

Replace `dev-1` with the actual branch name when necessary.

Verify that the push completes successfully.

---

## 2. Automated Pre-Commit Checks

The SCMS repository uses:

- Husky – Git hooks.
- lint-staged – Runs checks on staged files.
- ESLint – API code quality.
- TypeScript – Web type checking.
- Prettier – Consistent formatting.

### What runs automatically?

When committing:

1. Husky triggers the pre-commit hook.
2. lint-staged identifies staged files.
3. API files are processed by ESLint with autofix.
4. Web changes trigger TypeScript validation.
5. Prettier formats applicable staged files.
6. The commit proceeds only if the hook succeeds.

**Note:** Unit tests and production builds are not automatically executed by the current pre-commit configuration.

---

## 3. Conventional Commit Messages

Follow this naming convention:

```text
type(scope): description
```

### Commit Types

| Type       | Purpose                      |
| ---------- | ---------------------------- |
| `feat`     | Introduce a new feature      |
| `fix`      | Fix a bug                    |
| `refactor` | Restructure existing code    |
| `docs`     | Documentation changes        |
| `style`    | Formatting-only changes      |
| `test`     | Add or modify tests          |
| `chore`    | Maintenance and dependencies |
| `perf`     | Performance improvements     |
| `build`    | Build system changes         |

### Examples

```bash
git commit -m "feat(api): add withdrawal approval"
```

```bash
git commit -m "fix(web): correct payment form validation"
```

```bash
git commit -m "refactor(api): simplify payment service"
```

```bash
git commit -m "docs: update API documentation"
```

```bash
git commit -m "test(api): add enrollment tests"
```

Keep commit messages short, descriptive and specific.

---

## 4. Daily Commit Checklist

Before pushing changes to GitHub, verify the following:

- [ ] Fetch latest remote changes.
- [ ] Review current branch.
- [ ] Check `git status`.
- [ ] Review code differences.
- [ ] Verify no secrets or unwanted files are included.
- [ ] Run `pnpm lint`.
- [ ] Run relevant tests.
- [ ] Verify production builds when appropriate.
- [ ] Stage intended files only.
- [ ] Review staged changes using `git diff --cached`.
- [ ] Commit using Conventional Commits.
- [ ] Ensure pre-commit hooks pass.
- [ ] Push to the correct GitHub branch.

---

## 5. Recommended Workflow Based on Change Size

### Small Changes

Examples:

- Fix a UI issue.
- Update a component.
- Correct an API response.
- Modify a small validation rule.

Workflow:

```bash
git status
git diff
pnpm lint
git add .
git diff --cached
git commit -m "fix(web): correct dashboard layout"
git push origin dev-1
```

### Major Feature Development

Examples:

- Implement a new module.
- Introduce a new business workflow.
- Modify authentication.
- Add payment or withdrawal functionality.

Workflow:

```bash
git fetch origin
git status
git diff

pnpm lint
pnpm --filter api test

pnpm --filter api build
pnpm --filter web build

git add .
git diff --cached

git commit -m "feat(api): implement payment management"
git push origin dev-1
```

Run additional tests for affected components as necessary.

### Database Changes

Whenever modifying Prisma schemas, migrations or database-related functionality:

1. Review the Prisma schema.
2. Validate the schema.
3. Review generated migration SQL.
4. Test migrations against a development database.
5. Verify application compatibility.
6. Run relevant API tests.
7. Commit schema and migration changes together.

Useful commands:

```bash
pnpm prisma:format
pnpm prisma:validate
```

Do not run migrations against production simply to test a commit.

---

## 6. Important Git Safety Rules

1. Never commit `.env` files, passwords, tokens or private credentials.
2. Never use `git push --force` on shared branches without understanding the impact and coordinating with collaborators.
3. Never use `git commit --no-verify` to bypass failed pre-commit checks.
4. Never discard uncommitted work without reviewing it.
5. Do not commit generated files or build artifacts unless explicitly required.
6. Do not commit unfinished or untested database migrations.
7. Always verify the target branch before pushing.

---

## 7. Recommended Branch Strategy

Recommended structure for SCMS:

```text
main
  |
  |-- dev
        |
        |-- feature/authentication
        |-- feature/payments
        |-- feature/withdrawals
        |-- feature/reports
        |
        |-- fix/payment-validation
```

### Branch Responsibilities

| Branch      | Purpose                        |
| ----------- | ------------------------------ |
| `main`      | Stable, production-ready code  |
| `dev`       | Integration and development    |
| `feature/*` | Individual feature development |
| `fix/*`     | Bug fixes                      |

Merge tested features into `dev`. Merge `dev` into `main` after release validation.

Your existing `dev-1` branch can continue to be used during the transition.

---

## 8. Quick Reference Commands

| Task                  | Command                                |
| --------------------- | -------------------------------------- |
| Check status          | `git status`                           |
| Check current branch  | `git branch --show-current`            |
| Fetch remote          | `git fetch origin`                     |
| Review changes        | `git diff`                             |
| Review staged changes | `git diff --cached`                    |
| Run lint              | `pnpm lint`                            |
| Run API tests         | `pnpm --filter api test`               |
| Build API             | `pnpm --filter api build`              |
| Build Web             | `pnpm --filter web build`              |
| Stage changes         | `git add .`                            |
| Commit                | `git commit -m "type(scope): message"` |
| Push                  | `git push origin dev-1`                |

---

## 9. Final Recommendation

For every SCMS development session, follow this principle:

**Review → Validate → Test → Stage → Commit → Push**

For small changes, rely on the automated pre-commit checks plus the project-wide lint command.

For major features, database modifications and release preparation, additionally run tests and production builds.

Maintaining this workflow helps prevent accidental commits, formatting inconsistencies, broken builds and avoidable integration issues.

---

**Document:** SCMS Git & GitHub Workflow Guide  
**Repository:** Smart Chit Management System  
**Maintained by:** Development Team
