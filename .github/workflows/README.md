# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the ESI.ts project.

## Workflow Overview

### Main CI/CD Pipeline (`ci.yml`)

**Triggers:** Push to `master`/`main`/`develop`, Pull Requests

| Job              | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Lint & Build     | ESLint (with security + sonarjs plugins), Prettier format check, TypeScript compilation  |
| Static Analysis  | Dead code detection (knip), generated-type freshness, schema drift, auth/scope alignment |
| Unit Tests       | Test suite across Node.js 18, 20, 22                                                     |
| Coverage         | Tests with coverage threshold enforcement                                                |
| BDD Tests        | Behavior-driven development scenarios (40 suites)                                        |
| Full Test Suite  | Complete test run                                                                        |
| Dependency Audit | Advisories this PR _introduces_, base vs head (skipped when deps are unchanged)          |
| Documentation    | Auto-generate and deploy docs (master/main only)                                         |
| Quality Gate     | All-or-nothing validation checkpoint                                                     |

### Release Pipeline (`release.yml`)

**Triggers:** Git tags (`v*.*.*`), GitHub releases

| Job                  | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| Validate Release     | Lint, format check, knip, security audit, build, full tests, docs |
| Publish to NPM       | Automated package publishing                                      |
| Deploy Documentation | Release documentation deployment                                  |
| Create Assets        | Generate release artifacts                                        |

### Maintenance & Security (`maintenance.yml`)

**Triggers:** Weekly schedule (Mondays 9 AM UTC), Manual dispatch

| Job                | Description                                     |
| ------------------ | ----------------------------------------------- |
| Dependency Updates | Package freshness monitoring                    |
| Security Audit     | Vulnerability scanning                          |
| Code Quality       | Lint, formatting, dead code detection, coverage |
| Health Check       | Build and runtime health                        |

## Static Analysis Tools

Every PR and CI run includes:

- **ESLint** with `@typescript-eslint`, `eslint-plugin-security`, `eslint-plugin-sonarjs`
- **Prettier** formatting verification
- **knip** dead code and unused export detection
- **Jest coverage** with enforced thresholds (branches: 80%, functions: 75%, lines: 90%, statements: 90%)

## Dependency Auditing

`npm audit` reports the state of the world, not the state of a diff: an unchanged
commit passes before an advisory is published and fails after it. Running it as a
plain merge gate turns every open PR red for something its author did not do, so
the audit is split across three places:

| Where                            | Question it answers                                  | Blocking       |
| -------------------------------- | ---------------------------------------------------- | -------------- |
| `ci.yml` → Dependency Audit      | Does this PR _introduce_ an advisory the base lacks? | Yes            |
| `nightly-audit.yml`              | Does `master` have any unaccepted advisory today?    | Files an issue |
| `release.yml` → Validate Release | Is the tree clean at/above `high` before we publish? | Yes            |

The merge-path job audits base and head in one run, from the manifest and lockfile
alone, and fails only on advisories the PR adds. It skips entirely when neither
`package.json` nor `package-lock.json` changed, because head advisories then equal
base advisories by construction.

**Accepting a known risk.** When an advisory has no acceptable fix, record it in
[`scripts/audit-exceptions.json`](../../scripts/audit-exceptions.json) with a
reason and an `expires` date. All three paths honour the allowlist, so an accepted
advisory stops blocking releases and stops re-filing nightly issues. An entry past
its expiry is a hard failure — that is how acceptance gets revisited rather than
quietly becoming permanent.

```bash
npm run audit:check          # unaccepted advisories at/above high
npm run audit:check -- --level=moderate
npm run audit:diff -- --base base.json --head head.json
```

## Required Secrets

| Secret         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `NPM_TOKEN`    | NPM authentication token for package publishing    |
| `GITHUB_TOKEN` | Provided automatically for GitHub Pages deployment |

## Workflow Status Badges

```markdown
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![Release Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/release.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/release.yml)
[![Maintenance](https://github.com/lgriffin/ESI.ts/actions/workflows/maintenance.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/maintenance.yml)
```
