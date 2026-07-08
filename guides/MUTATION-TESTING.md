# Mutation Testing Guide for ESI.ts

## Overview

Mutation testing measures whether your tests actually detect bugs — not just whether they execute code. [Stryker](https://stryker-mutator.io/) introduces small changes ("mutants") into your source code and checks if any test fails. If a test fails, the mutant is "killed" (good). If all tests pass, the mutant "survived" (your tests missed a potential bug).

This is fundamentally different from code coverage: you can have 100% line coverage with tests that never assert anything. Mutation testing catches that.

## Quick Start

```bash
npm run mutation           # Run mutation testing (full report)
npm run mutation:report    # Run with HTML + clear-text reporters only
```

The HTML report is written to `reports/mutation/mutation.html`.

## How It Works

1. **Instrumentation**: Stryker parses all files matching the `mutate` glob and identifies possible mutations (2800+ in this project).
2. **Dry run**: Stryker runs the full test suite once to establish a baseline and map which tests cover which code.
3. **Mutation**: For each mutant, Stryker modifies the source and runs only the tests that cover the changed code (`perTest` coverage analysis).
4. **Scoring**: Each mutant is classified:

| Status         | Meaning                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| **Killed**     | A test failed — the mutation was detected                               |
| **Survived**   | All tests passed — a potential blind spot                               |
| **Timeout**    | A test timed out — likely an infinite loop mutation, counts as detected |
| **NoCoverage** | No test executes this code path                                         |
| **Ignored**    | Static/module-level code, skipped via `ignoreStatic`                    |

## Configuration

Config file: `stryker.config.mjs`

### Scope

Stryker mutates `src/core/**/*.ts` with these exclusions:

- `src/core/endpoints/**` — endpoint definitions are data declarations, not logic
- `src/core/logger/ILogger.ts`, `src/core/cache/ICache.ts`, `src/core/rateLimiter/IRateLimiter.ts` — interfaces with no runtime code

Files NOT in scope (and why):

| Excluded                                      | Reason                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| `src/clients/**`                              | Thin delegation layers tested via BDD scenarios       |
| `src/schemas/**`                              | Zod schema declarations — no branching logic          |
| `src/types/**`                                | Type-only files, no runtime code                      |
| `src/config/**`                               | Configuration setup, not core logic                   |
| `src/EsiClient.ts`, `src/EsiClientBuilder.ts` | High-level orchestration tested via integration tests |
| `*.generated.ts`                              | Auto-generated from OpenAPI spec                      |

### Thresholds

```
break: 65    — CI fails if mutation score drops below 65%
low:  60    — score below 60% is highlighted red
high: 80    — score above 80% is highlighted green
```

### Sandbox and Module Resolution

Stryker runs tests in an isolated sandbox (`.stryker-tmp/sandbox-XXX/`) containing mutated source files. Since tests live outside the sandbox at `tests/`, a `moduleNameMapper` redirects relative imports like `../../../src/core/...` to the sandbox's mutated source:

```js
moduleNameMapper: {
  '^(?:\\.\\./)+src/(.*)$': '<rootDir>/src/$1',
}
```

Without this, tests would import the original (un-mutated) source and every mutant would show as "NoCoverage."

### Static Mutants

`ignoreStatic: true` is enabled. Static mutants are mutations in module-level code (e.g., default values, constant expressions) that are only executed once during module initialization. These are expensive to test (they require re-running ALL tests since every test loads the module) and represent only ~1% of mutants. They are reported as "Ignored" in the output.

## Reading the Report

The HTML report at `reports/mutation/mutation.html` shows:

- **Per-file scores** with color coding (green ≥ 80%, yellow ≥ 60%, red < 60%)
- **Individual mutants** with their status, the original code, and the mutation applied
- **Covering tests** for each mutant (which tests would need to kill it)

### Baseline Scores (as of v7.2.0)

| Module              | Score | Key Files                                        |
| ------------------- | ----- | ------------------------------------------------ |
| `util/`             | 87%   | error.ts, validation.ts, headersUtil.ts          |
| `middleware/`       | 92%   | Middleware.ts                                    |
| `circuitBreaker/`   | 72%   | CircuitBreaker.ts                                |
| `rateLimiter/`      | 70%   | RateLimiter.ts                                   |
| `ApiRequestHandler` | 58%   | Main request pipeline                            |
| `cache/`            | 57%   | ETagCacheManager.ts                              |
| `pagination/`       | 57%   | PaginationHandler.ts, CursorPaginationHandler.ts |

## Improving the Score

When a mutant survives, it means changing that line doesn't break any test. To kill it:

1. Open the HTML report and find the survived mutant
2. Read what the mutation does (e.g., `a > b` changed to `a >= b`)
3. Write a test case where the original behavior and mutated behavior produce different results

High-value targets for improvement:

- **`ApiRequestHandler.ts`** (74 survived) — the core request pipeline has many edge cases around retries, error handling, and header parsing
- **`PaginationHandler.ts`** (35 survived) — page boundary conditions
- **`RateLimiter.ts`** (54 survived) — rate limit bucket edge cases
- **`ETagCacheManager.ts`** (39 survived) — cache hit/miss/stale conditions

## CI Integration

Mutation testing runs as a non-blocking CI job (`mutation-testing` in `ci.yml`):

- Triggered on every push/PR
- `continue-on-error: true` — does not block the quality gate
- 30-minute timeout
- HTML report uploaded as a CI artifact

To promote mutation testing to a blocking check, remove `continue-on-error: true` and add `mutation-testing` to the quality gate's `needs` list.

## Runtime

Mutation testing takes approximately 3-20 minutes depending on the number of mutants and test coverage. The `perTest` coverage analysis and `ignoreStatic` settings significantly reduce runtime by only running relevant tests per mutant.
