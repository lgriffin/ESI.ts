# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the ESI.ts project.

## Workflow Overview

### Main CI/CD Pipeline (`ci.yml`)

**Triggers:** Push to `master`/`main`/`develop`, Pull Requests

| Job             | Description                                                                             |
| --------------- | --------------------------------------------------------------------------------------- |
| Lint & Build    | ESLint (with security + sonarjs plugins), Prettier format check, TypeScript compilation |
| Static Analysis | Dead code detection (knip), npm security audit                                          |
| Unit Tests      | Test suite across Node.js 18, 20, 22                                                    |
| Coverage        | Tests with coverage threshold enforcement                                               |
| BDD Tests       | Behavior-driven development scenarios (7 suites)                                        |
| Full Test Suite | Complete test run                                                                       |
| Documentation   | Auto-generate and deploy docs (master/main only)                                        |
| Quality Gate    | All-or-nothing validation checkpoint                                                    |

### Pull Request Validation (`pr-validation.yml`)

**Triggers:** Pull request events on `master`/`main`/`develop`

| Job                   | Description                              |
| --------------------- | ---------------------------------------- |
| PR Information        | Metadata summary                         |
| Lint, Format & Build  | ESLint, Prettier check, TypeScript build |
| Static Analysis       | knip dead code detection, npm audit      |
| Tests                 | Unit + BDD test matrix                   |
| Coverage              | Coverage with threshold enforcement      |
| PR Validation Summary | Overall pass/fail gate                   |

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
- **npm audit** dependency vulnerability scanning
- **Jest coverage** with enforced thresholds (branches: 50%, functions: 50%, lines: 65%, statements: 65%)

## Required Secrets

| Secret         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| `NPM_TOKEN`    | NPM authentication token for package publishing    |
| `GITHUB_TOKEN` | Provided automatically for GitHub Pages deployment |

## Workflow Status Badges

```markdown
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![Release Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/release.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/release.yml)
[![PR Validation](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml)
[![Maintenance](https://github.com/lgriffin/ESI.ts/actions/workflows/maintenance.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/maintenance.yml)
```
