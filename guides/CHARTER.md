# ESI.ts Engineering Charter

**Package:** `@lgriffin/esi.ts` · **Charter revision:** 1 (2026-09-15) · **Status:** adopted

The governing statement of how ESI.ts is designed, built, tested, secured, documented and released. Every guide in this folder derives from a numbered requirement here, and every requirement is written in the same EARS form the test suite already uses, so the charter can be audited the way the specification is.

| Measured at v9.8.0                              |                        |
| ----------------------------------------------- | ---------------------- |
| Domain clients                                  | 39                     |
| ESI endpoints wired                             | 235                    |
| EARS requirements in the specification          | 327 (52 feature files) |
| Gherkin scenarios                               | 401                    |
| Test files across seven Jest/tsd configurations | 201                    |
| Statement coverage                              | 98.2%                  |

---

## Part 0 · How to read this

This is a control document, not a tutorial. It states what the project holds itself to and points at the mechanism that proves it. Where the mechanism does not exist yet, the requirement says so with a status rather than pretending.

### Requirement identifiers

| Prefix | Governs                                                            | Derived guide                              |
| ------ | ------------------------------------------------------------------ | ------------------------------------------ |
| `ARCH` | Layering, request pipeline, module boundaries, public surface      | `guides/ARCHITECTURE.md`                   |
| `DES`  | Naming, schema conventions, endpoint definitions, extension seams  | `guides/DESIGN-RULES.md` (new)             |
| `TEST` | Test tiers, specification discipline, coverage and mutation floors | `guides/TESTING.md` + `tests/bdd/GUIDE.md` |
| `GATE` | What runs at commit, push, PR, nightly and release                 | `guides/QUALITY-GATES.md` (new)            |
| `SEC`  | Runtime defences, secrets, supply chain                            | `SECURITY.md` + `guides/SECURITY.md`       |
| `DOC`  | Where documentation lives, what is canonical, how it is published  | `guides/DOCUMENTATION.md`                  |
| `REL`  | Versioning, changelog, publishing, support window                  | `guides/RELEASE.md` (new)                  |
| `PROC` | Issue tracking, agent conduct, branch rules                        | `guides/BEADS.md` + `CONTRIBUTING.md`      |

### Status legend

| Status        | Meaning                                   |
| ------------- | ----------------------------------------- |
| **Enforced**  | A script or CI job fails on violation     |
| **Practised** | True in the code, but not machine-checked |
| **Partial**   | Holds in some places                      |
| **Gap**       | Stated intent, not yet true               |

### Form and precedence

Each requirement uses one of the five EARS patterns already enforced on the feature files by `npm run spec:audit`: ubiquitous, event-driven (_When_), state-driven (_While_), optional (_Where_) and unwanted (_If … then_). One _shall_ per requirement, the system named, no vague quantifiers.

Precedence when documents disagree: the running code and its CI results are the fact. This charter is the intent. A guide explains how to meet the intent. The README sells and orients. If code and charter diverge, that is a bead to file, not a sentence to soften.

---

## Part 1 · Posture

Seven positions that explain most of the individual choices below. A proposal that contradicts one of these needs to argue with the principle, not just with the rule.

1. **The OpenAPI spec is upstream.** Types, cache TTLs, rate-limit groups and scopes are generated from the live ESI spec and CI fails if they go stale. Hand-written code is diffed against the spec, never trusted blindly.
2. **Hand-write where judgement matters.** Domain clients, endpoint definitions and Zod schemas are written by people, because method names, argument shapes and validation strictness are product decisions. Drift reports keep them honest.
3. **Tolerate additive change.** `z.looseObject` everywhere and `esiEnum` unions mean a new field or enum member from CCP never breaks a consumer at runtime. Removal is a breaking change; addition is not.
4. **Resilience is pluggable.** Retry, rate limiting, circuit breaking, deduplication, caching and the transport itself are interfaces with default implementations and setters. Nothing in the pipeline imports a concrete middleware.
5. **Secure by construction.** HTTPS and a host allowlist at construction, tokens attached only where a scope is declared, URLs redacted in every error, cache keys hashed per token. The controls are tests, not advice.
6. **The specification executes.** Behaviour is stated as EARS requirements in Gherkin, one per `Rule:`, verified by scenarios that mock the transport seam. The audit fails a PR that weakens the wording.
7. **Verifiable supply chain.** Every action SHA-pinned, least-privilege tokens, npm provenance on both registries, keyless cosign signatures and checksums on release assets, advisories accepted only with an expiry date.

---

## Part 2 · Architecture

Five layers, one request path, and four side modules that deliberately share nothing with the HTTP pipeline.

| Layer                | Where                                                         | Role                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction         | `src/EsiClient.ts`, `src/EsiClientBuilder.ts`                 | `EsiClient` (lazy getters for every domain), `EsiClientBuilder` → `CustomEsiClient` (subset), `EsiApiFactory` (one client). All three feed `configureApiClient`, the single place config becomes middleware.                                          |
| Domain clients       | `src/clients` (39 + `BaseEsiClient`)                          | One class per ESI domain. Adds ergonomics only: named methods, `stream*` and `fetchAll*` wrappers, `withSafeMode()` envelopes. No HTTP knowledge.                                                                                                     |
| Endpoint definitions | `src/core/endpoints` (39 files, 235 endpoints)                | Declarative maps (`as const satisfies EndpointMap`) wiring path, method, `requiresAuth`, pagination kind, `responseSchema`, `requestSchema`, deprecation. `createClient()` turns a map into typed methods; return types are inferred from the schema. |
| Request pipeline     | `src/core`, `src/core/requestPipeline/*`                      | Pure functions receiving their dependencies as parameters (`dependencies.ts` is the only resolver). Cache policy, headers, fetch execution, status handling, pagination orchestration, middleware bridge.                                             |
| Transport            | `FetchLike`, `globalThis.fetch`                               | Injectable via `setFetch()`. Timeout by `AbortController`. Node 18 floor exists because this layer relies on the global fetch.                                                                                                                        |
| Side modules         | `./schemas`, `./errors`, `./testing`, `./sde`, `./sde/memory` | The SDE module shares no code with the pipeline. It is an offline lookup layer for enriching ESI responses, with its own error hierarchy and its own docs.                                                                                            |

### The request path

Every domain method takes this route. Order is the information: a stage cannot see the effect of a later one.

1. **Domain method → `createClient` closure.** Deprecation warning if declared. `buildEndpointPath` assembles path, query and body (from `hasBody` or `bodyBuilder`). Request body validated against `requestSchema` only when `validateRequest` is on.
2. **Spec-aware cache check.** `trySpecAwareCacheHit` may answer from cache with no network call. TTL precedence: generated `esiCacheTtls` > `Cache-Control: max-age` > cache default (5 min).
3. **Deduplication.** Identical in-flight GETs without a body coalesce onto one promise. On by default.
4. **`RetryStrategy.execute`.** Exponential backoff with 0.75–1.25× jitter. Retries only status 0, 420, 429, 502, 503, 504. One 401 token refresh per call when a provider exists. Mutations never retried unless `retryMutations`. `CircuitOpenError` is rethrown immediately.
5. **`executeSingleFetch`.** Build headers (User-Agent, compatibility date, `If-None-Match`, bearer only if `requiresAuth`) → request interceptors → circuit breaker check → rate limiter check → timed fetch → parse headers → rate limiter learns from response → breaker records outcome.
6. **Status handling.** 201 returns early. 204 yields `undefined`. 304 serves the cached body or throws if none. 5xx with a cached copy serves stale. 401/403 get remediation text appended.
7. **Cache write and pagination.** Successful GETs are cached under a key that hashes the auth header. Non-GET success invalidates the path prefix. Offset pagination follows `x-pages`; cursor pagination follows `x-cursor-after`.
8. **Response interceptors → Zod validation → envelope.** Body replaced by `safeParse().data` when `validateResponse` is on (default). Failure throws `EsiValidationError`. `withMetadata` and `withSafeMode` wrap the result last.

### Middleware inventory

| Concern         | Interface                                    | Default            | Key defaults                                                                 |
| --------------- | -------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| Rate limiter    | `IRateLimiter`                               | on, mandatory      | Buckets from generated groups; 420/429 → 60 s block; token cost 2xx=2, 4xx=5 |
| Circuit breaker | `ICircuitBreaker`                            | off, opt-in        | 5 failures, 30 s reset, 1 half-open probe, key by resolved path              |
| Deduplicator    | `IDeduplicator`                              | on                 | GET without body only                                                        |
| Retry           | `IRetryStrategy`                             | on                 | 3 retries, 1 s base, 30 s cap                                                |
| ETag cache      | `ICache`                                     | on                 | 1000 entries, 5 min default TTL, 60 s sweep                                  |
| Interceptors    | `RequestInterceptor` / `ResponseInterceptor` | none               | Sequential, unsubscribe closure returned                                     |
| Transport       | `FetchLike`                                  | global fetch       | 30 s timeout                                                                 |
| Logger          | `ILogger`                                    | pino, level `warn` | Per-client, falls back to global, then default                               |

### Error taxonomy

```
Error
├── EsiError (statusCode, sanitised url, requestId)      .retryable ⇐ {0, 420, 429, 502, 503, 504}
│   ├── TimeoutError (+ timeoutMs)
│   └── EsiValidationError (+ ZodError, direction: request | response)
├── CircuitOpenError (endpoint, failures, retryAfterMs)   not an EsiError
└── SdeError → SdeDatabaseError | SdeValidationError | SdeVersionMismatchError
```

Configuration and plumbing faults (`NO_AUTH_TOKEN`, `CONFIGURATION_ERROR`, `JSON_PARSE_ERROR`, `PAGINATION_INCOMPLETE`, `TOKEN_REFRESH_FAILED`) are plain `Error`s with a bracketed type prefix. That is a known inconsistency, registered in Part 10.

### Requirements

#### ARCH-01 · Ubiquitous · Enforced

The library **shall** derive response types, cache TTLs, rate-limit groups and endpoint scopes from the live ESI OpenAPI specification and commit the generated output.

- **Why:** CCP changes ESI on its own schedule. Generated metadata is the only way to keep 235 endpoints honest.
- **Verified by:** `npm run generate:types` then `git diff --exit-code src/types/generated/` in the CI static-analysis job and the release gate.

#### ARCH-02 · Ubiquitous · Enforced

Every endpoint exposed by a domain client **shall** be declared in exactly one `*Endpoints.ts` definition map that names its path, method, authentication requirement and response schema.

- **Why:** The definition is the contract. `createClient`, the contract tests, the scope validator and the OKF bundle all read from it.
- **Verified by:** `npm run validate:esi`, `npm run validate:auth-scopes`, `tests/contract/`.

#### ARCH-03 · Ubiquitous · Practised

Request-pipeline modules under `src/core/requestPipeline` **shall** receive cache, rate limiter and circuit breaker as function parameters rather than importing a concrete implementation.

- **Why:** Keeps every stage unit-testable without an `ApiClient` and keeps `dependencies.ts` the one place resolution happens.
- **Verified by:** Code review. Candidate for an ESLint `no-restricted-imports` rule scoped to that directory.

#### ARCH-04 · Ubiquitous · Enforced

Each resilience concern (retry, rate limiting, circuit breaking, deduplication, caching, transport, logging) **shall** be exposed as an interface with a default implementation and a setter on `ApiClient`.

- **Why:** Consumers embed the client in very different runtimes. Swapping a strategy must not require a fork.
- **Verified by:** `tests/typetests/` and `etc/esi.ts.api.md` (API surface check fails on removal).

#### ARCH-05 · Ubiquitous · Enforced

The package **shall** publish a dual CJS and ESM build with declaration files for the six entry points: root, `schemas`, `errors`, `testing`, `sde` and `sde/memory`.

- **Why:** Subpath entries are the tree-shaking story while the root barrel stays wide.
- **Verified by:** `tsup.config.ts`, the `package-lint` job in `ci.yml` (publint and Are The Types Wrong on the packed tarball), and the consumer contract.

#### ARCH-06 · Ubiquitous · Gap

The package manifest **shall** declare `"sideEffects": false`, and no module in `src/` **shall** construct a logger, timer or network client at import time.

- **Why:** Six entry points are wasted if bundlers must assume side effects. Today `DefaultLogger.ts` and `logger.ts` each build a pino instance on import.
- **Verified by:** To add: a knip or custom script asserting the flag, plus a bundle-size check on `import { EsiError } from '@lgriffin/esi.ts'`.

#### ARCH-07 · Ubiquitous · Partial

Every public error the pipeline can throw **shall** be an instance of a class exported from `@lgriffin/esi.ts/errors` with a matching type guard.

- **Why:** Consumers branch on errors. String-prefixed plain `Error`s and the missing `isCircuitOpen` export on the subpath break that.
- **Verified by:** To add: a type test that the guard set on `.` equals the guard set on `./errors`.

#### ARCH-08 · Ubiquitous · Partial

Every construction surface (`EsiClient`, `CustomEsiClient`, `EsiApiFactory`) **shall** expose the same set of domain clients.

- **Why:** `CustomEsiClient` now has a getter for every registered client ([#267](https://github.com/lgriffin/ESI.ts/issues/267)); `EsiApiFactory` still has `create*` methods for only 10 of them.
- **Verified by:** `tests/tdd/core/customClientGetters.test.ts` for `CustomEsiClient` (a missing getter fails to compile). To add: the same check for `EsiApiFactory`.

#### ARCH-09 · Ubiquitous · Partial

All pipeline logging **shall** go through the per-client logger with structured context, and the global logger **shall** exist only as a fallback for callers with no client handle.

- **Why:** Per-client logging makes log lines attributable when several clients share a process.
- **Verified by:** `npm run typecheck`, then a grep gate on `from '../logger/loggerUtil'` inside `requestPipeline/`.

---

## Part 3 · Design rules

Conventions that make a 39-client codebase read like one author wrote it. These are the seed of `guides/DESIGN-RULES.md`, which should also carry the walkthrough for adding an endpoint and adding a client.

| Thing          | Convention                                                      | Example                       |
| -------------- | --------------------------------------------------------------- | ----------------------------- |
| Interface      | `I` prefix                                                      | `ICache`, `IRetryStrategy`    |
| Zod schema     | `Schema` suffix, `z.looseObject`                                | `MarketOrderSchema`           |
| Endpoint map   | `Endpoints` suffix, `as const satisfies EndpointMap`            | `allianceEndpoints`           |
| Domain client  | `Client` suffix, extends `BaseEsiClient`                        | `AllianceClient`              |
| Generated file | `.generated.ts` suffix, header comment, never hand-edited       | `esi-scopes.generated.ts`     |
| Config object  | `Config` suffix, all fields optional, readonly on the class     | `CircuitBreakerConfig`        |
| Wire format    | snake_case in types and schemas; camelCase in method parameters | `alliance_id` vs `allianceId` |
| Enum from ESI  | `esiEnum([...])`: known members plus open string                | `esiEnum(['buy','sell'])`     |

#### DES-01 · Ubiquitous · Enforced

Every hand-written response schema **shall** use `z.looseObject` so that fields ESI adds later are preserved in the validated body.

- **Why:** Validation replaces the body with `safeParse().data`. A strict object would silently strip new fields from consumers.
- **Verified by:** `npm run schema:drift` against the spec; 255 uses of `looseObject` versus 2 of `z.object`, both internal.

#### DES-02 · Event-driven · Enforced

When an endpoint is added to a definition map, the library **shall** ship a `responseSchema` for it, since a missing schema degrades the inferred return type to `unknown`.

- **Why:** Types are inferred from the schema. No schema means no type, which is a silent regression for consumers.
- **Verified by:** Contract test response-schema coverage; `tests/typetests/domain-responses.test-d.ts`.

#### DES-03 · Ubiquitous · Enforced

Files ending in `.generated.ts`, the `okf/` bundle and `etc/esi.ts.api.md` **shall** be regenerated by their script and never edited by hand.

- **Why:** A hand edit is overwritten on the next run and hides the real spec change.
- **Verified by:** CI freshness diff for generated types; API surface job for the report; Prettier ignore rules.

#### DES-04 · Ubiquitous · Enforced

An endpoint definition **shall** declare `requiresAuth: true` if and only if the generated scope map lists at least one scope for it.

- **Why:** The bearer token is attached only when `requiresAuth` is set. A mismatch either leaks a token or breaks a call.
- **Verified by:** `npm run validate:auth-scopes` in the CI static-analysis job.

#### DES-05 · Event-driven · Practised

When an endpoint is deprecated upstream, the definition **shall** carry `DeprecationInfo` with a replacement and sunset date, and the client **shall** warn once at call time.

- **Why:** Deprecation is a first-class field, not a comment. Consumers get a log line before the endpoint vanishes.
- **Verified by:** Nightly spec drift files an issue; code review adds the field.

#### DES-06 · Ubiquitous · Practised

Configuration and error objects **shall** be immutable after construction; merges **shall** copy rather than mutate.

- **Why:** `readonly` fields on every error and every strategy config; copy-on-write interceptor lists. Bucket and circuit records are the intentional exception because they are counters.
- **Verified by:** TypeScript `readonly`; code review.

#### DES-07 · Ubiquitous · Enforced

The compiler **shall** run with `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride` and `noFallthroughCasesInSwitch` for `src/`.

- **Why:** The type-level endpoint inference only holds under strict settings. Tests relax `noUncheckedIndexedAccess` and nothing else.
- **Verified by:** `tsconfig.json`; `npm run typecheck` on every push.

#### DES-08 · Ubiquitous · Partial

Pagination helpers **shall** propagate the caller's HTTP method into the retry context and **shall** surface partial results as an error rather than a silent truncation.

- **Why:** `handleSinglePageRequest` hardcodes GET; `CursorPaginationHandler.fetchAll` returns partial data after three consecutive failures. Both are surprising to a consumer.
- **Verified by:** To add: EARS rules in `tests/bdd/features/core/pagination` covering both cases.

---

## Part 4 · Testing

This table is the canonical tier order. Both testing guides merge into one and cite it.

| Tier | Name                           | Where                            | Files                                   | Runner                    | Runs on                  |
| ---- | ------------------------------ | -------------------------------- | --------------------------------------- | ------------------------- | ------------------------ |
| 1    | Unit (TDD)                     | `tests/tdd`                      | 124                                     | jest.unit                 | push, PR (Node 18/20/22) |
| 2    | Specification (EARS/BDD)       | `tests/bdd`                      | 52 features · 327 rules · 401 scenarios | jest.unit + jest-cucumber | PR, plus `spec:audit`    |
| 3    | Type tests                     | `tests/typetests`                | 7                                       | tsd                       | PR (full suite)          |
| 4    | Property fuzz                  | `tests/fuzz`                     | 5                                       | jest.fuzz + fast-check    | PR                       |
| 5    | Contract                       | `tests/contract`                 | 2 + snapshot                            | jest.contract             | PR, soft-skip on ESI 503 |
| 6    | Integration, mocked full stack | `tests/integration`              | 6                                       | jest.integration          | PR (full suite)          |
| 7    | Integration, live              | same, `ESI_LIVE_TESTS`           | ~50                                     | jest.integration          | manual                   |
| 8    | Integration, gated auth        | same, `ESI_GATED_TESTS` + `.env` | 30+                                     | jest.integration          | manual                   |
| 9    | Benchmark and heap soak        | `tests/benchmark`                | 18 tasks + soak                         | mitata + soak driver      | PR (hot paths), nightly  |
| 10   | Mutation                       | `src/core/**`                    | —                                       | Stryker                   | nightly, 4 h budget      |
| 11   | API fuzz                       | Prism mock + Schemathesis        | —                                       | Docker                    | nightly                  |

| Coverage metric | Floor | Current |     | Mutation | Floor                           |
| --------------- | ----- | ------- | --- | -------- | ------------------------------- |
| Statements      | 90%   | 98.17%  |     | Break    | 65                              |
| Branches        | 80%   | 95.14%  |     | Low      | 60                              |
| Functions       | 75%   | 96.09%  |     | High     | 80                              |
| Lines           | 90%   | 98.37%  |     |          | nightly only, does not gate PRs |

#### TEST-01 · Event-driven · Enforced

When observable client behaviour changes, the change **shall** be preceded by an EARS requirement in a `Rule:` block and a scenario that fails before the implementation exists.

- **Why:** The most common defect in the suite has been scenarios that cannot fail. Red before green is the only defence.
- **Verified by:** `ears-gherkin-dev` workflow; `npm run spec:audit` on PR; ratchet file `scripts/spec-audit-exceptions.json` is empty and may only shrink.

#### TEST-02 · Ubiquitous · Enforced

Each `Rule:` block **shall** state exactly one requirement with one _shall_, name the system, use one of the five EARS patterns, and contain no vague language.

- **Why:** A requirement you cannot falsify is not a requirement.
- **Verified by:** `scripts/spec-audit.ts`: eleven finding types, inline GitHub annotations, PR gate.

#### TEST-03 · Ubiquitous · Practised

Scenario steps **shall** mock at the transport seam with `jest-fetch-mock` and **shall not** spy on the client method under test.

- **Why:** Spying on the method makes the pipeline invisible to the test. Reference implementations: `etag-caching.steps.ts`, `resilience.steps.ts`.
- **Verified by:** Code review. Candidate for a lint rule banning `jest.spyOn(client.` in step files.

#### TEST-04 · Ubiquitous · Enforced

Unit coverage **shall** stay at or above 90% statements, 80% branches, 75% functions and 90% lines, measured on `src/**` excluding generated files.

- **Why:** Floors far below the current numbers stop a bad week becoming a broken gate, while still catching an untested module.
- **Verified by:** `jest.unit.config.cjs` thresholds; coverage job posts a PR comment.

#### TEST-05 · Ubiquitous · Enforced

Every endpoint definition **shall** be validated against the live ESI OpenAPI document for path, method, cache TTL and scopes, with a committed snapshot as fallback.

- **Why:** This is the only test that can tell the project CCP moved something.
- **Verified by:** `tests/contract/`; `npm run contract:diff` (oasdiff, breaking changes only).

#### TEST-06 · Ubiquitous · Enforced

The consumer-facing type surface **shall** be asserted by tsd tests covering endpoint argument inference, branded IDs, error guards and the result envelope.

- **Why:** Half the value of the library is at the type level. A refactor can break inference without failing a runtime test.
- **Verified by:** `npm run test:types`.

#### TEST-07 · Ubiquitous · Partial

Mutation testing of `src/core` **shall** hold a score at or above 65, and a PR touching `src/core` **shall** run Stryker on the changed files.

- **Why:** Nightly-only mutation means a weak test lands before anyone sees the score. Incremental Stryker on changed files keeps the PR cost bounded.
- **Verified by:** Nightly Stryker today. To add: `stryker run --incremental` job on PR, scoped by changed files.

#### TEST-08 · Optional · Enforced

Where a test needs live ESI or a real token, it **shall** be gated behind `ESI_LIVE_TESTS` or `ESI_GATED_TESTS` and **shall** soft-skip when ESI returns 503.

- **Why:** Tranquility downtime must not fail a PR that changed nothing about networking.
- **Verified by:** Jest configs and the 503 skip in CI jobs.

#### TEST-09 · Ubiquitous · Gap

Test source under `tests/` **shall** be linted with the same ESLint configuration as `src/`, with test-specific relaxations declared explicitly.

- **Why:** 201 test files currently get Prettier only. Floating promises in a step file produce a scenario that passes without asserting.
- **Verified by:** To add: extend `npm run lint` to `tests/`; fix or annotate the initial findings.

---

## Part 5 · Quality gates

What runs where. ● blocks; ◐ runs but does not block; · does not run.

| Check                                            | Commit |       Push        |        PR        |    Nightly    | Release  |
| ------------------------------------------------ | :----: | :---------------: | :--------------: | :-----------: | :------: |
| lint-staged: ESLint fix + Prettier               |   ●    |         ·         |        ·         |       ·       |    ·     |
| commitlint (conventional commits)                |   ●    |         ·         |        ·         |       ·       |    ·     |
| ESLint, Prettier check, build, typecheck         |   ·    |         ●         |        ●         |       ·       |    ●     |
| Unit tests                                       |   ·    |         ●         |    ● 18/20/22    |       ·       |    ●     |
| Coverage thresholds + PR comment                 |   ·    |         ·         |        ●         |       ·       |    ·     |
| BDD suite + EARS spec audit                      |   ·    |         ·         |        ●         |       ·       |    ●     |
| Generated types fresh, schema drift, auth scopes |   ·    |         ·         |        ●         |       ◐       |    ●     |
| Contract, fuzz, integration, type tests          |   ·    |         ·         |        ●         |       ·       |    ●     |
| API surface diff (api-extractor)                 |   ·    |         ·         |        ●         |       ·       |    ·     |
| Lockfile consistency, Are The Types Wrong        |   ·    |         ·         |        ●         |       ·       |    ·     |
| Dependency audit (diff-aware / allowlist)        |   ·    |         ·         | ● new advisories | ◐ files issue | ● ≥ high |
| knip dead-code                                   |   ·    |         ·         |        ◐         |       ·       |    ◐     |
| CodeQL                                           |   ·    |         ●         |        ●         |   ● weekly    |    ·     |
| zizmor (workflow security)                       |   ·    | ● on `.github/**` |        ●         |       ·       |    ·     |
| Stryker mutation                                 |   ·    |         ·         |        ·         |       ◐       |    ·     |
| Schemathesis API fuzz, spec drift issue          |   ·    |         ·         |        ·         |       ◐       |    ·     |
| OpenSSF Scorecard                                |   ·    |         ·         |        ·         |   ◐ weekly    |    ·     |

#### GATE-01 · Ubiquitous · Enforced

A pull request to `master` **shall** merge only when the aggregate `quality-gate` job reports every blocking job green.

- **Why:** One required check that fans in eleven jobs keeps branch protection simple and complete.
- **Verified by:** `ci.yml` quality-gate with `if: always()`; branch protection requires it.

#### GATE-02 · Ubiquitous · Enforced

Every push on every branch **shall** run lint, format check, build, typecheck and unit tests on Node 20.

- **Why:** Fast feedback before a PR exists.
- **Verified by:** `ci-fast.yml`.

#### GATE-03 · Ubiquitous · Enforced

A change to the public API surface **shall** be visible as a diff to `etc/esi.ts.api.md` in the same pull request.

- **Why:** This is the breaking-change tripwire. Reviewers see the exported shape change, not just the implementation.
- **Verified by:** API Surface Check job, CRLF-normalised diff against HEAD.

#### GATE-04 · Ubiquitous · Gap

knip **shall** block the release gate on unused exports and dependencies, with an explicit ignore list for intentional public re-exports.

- **Why:** Non-blocking everywhere means the report is never read. Blocking only at release keeps PR friction low.
- **Verified by:** To add: drop `--no-exit-code` in `release.yml` once the baseline is clean.

#### GATE-05 · Ubiquitous · Enforced

Every nightly job that finds a problem **shall** file or update a labelled GitHub issue rather than only failing the run.

- **Why:** A red nightly nobody reads is the same as no nightly.
- **Verified by:** `nightly-audit.yml`, `nightly-spec-drift.yml`. Mutation and Schemathesis upload artifacts only; extend them.

#### GATE-06 · Ubiquitous · Partial

Every npm script referenced in a document **shall** exist in `package.json`, and every script in `package.json` **shall** resolve to an existing file.

- **Why:** `sde:seed` points at a script that does not exist. The docs currently reference zero missing scripts, which is worth keeping.
- **Verified by:** `tests/tdd/scripts/package-scripts.test.ts`, in `npm test`.

---

## Part 6 · Security

Runtime defences live in the pipeline and are proven by `tests/tdd/core/security.test.ts`. Supply-chain defences live in the workflows and are scored weekly. The two are one posture and should be one guide.

### Defence chain on every request

1. **HTTPS enforced, host allowlisted.** `http://` rejected at construction. Only `esi.evetech.net` unless `unsafeAllowCustomHost: true` is named explicitly.
2. **Path parameters validated.** Rejects `../`, encoded slashes and dots, null bytes.
3. **Query parameters bounded.** Length limits; NaN, Infinity and null rejected.
4. **Token gated by declared scope.** Bearer header attached only when the definition says `requiresAuth`; missing token fails before the network.
5. **Cache isolated per token.** Authenticated cache keys prefix a truncated SHA-256 of the auth header, so two characters never share a cached body.
6. **URLs sanitised in errors and logs.** Eleven sensitive query names redacted; unparsable URLs truncated.

#### SEC-01 · Unwanted · Enforced

If a consumer supplies a base URL that is not HTTPS or not on the allowlist, then the client **shall** refuse construction unless `unsafeAllowCustomHost` is set.

- **Why:** Server-side request forgery through a configurable base URL is the classic SDK hole.
- **Verified by:** `security.test.ts` host allowlist and HTTPS groups.

#### SEC-02 · Ubiquitous · Enforced

The library **shall** never write an access token to a log line, an error message or a cache key in clear text.

- **Why:** Tokens end up in bug reports. Redaction and hashing make the report safe to paste.
- **Verified by:** `security.test.ts` token leakage group; `cacheKey.ts`.

#### SEC-03 · Ubiquitous · Enforced

Every GitHub Action **shall** be pinned to a full commit SHA with a version comment, and every workflow **shall** declare top-level read-only permissions with per-job escalation.

- **Why:** Tag pinning is mutable. Scorecard scores both dimensions and zizmor enforces them.
- **Verified by:** `zizmor.yml`; weekly Scorecard; Dependabot keeps the SHAs current.

#### SEC-04 · Ubiquitous · Enforced

Published packages **shall** carry npm provenance, and release assets **shall** carry keyless cosign signatures and SHA-256 checksums minted in an isolated job.

- **Why:** A consumer can verify that the tarball came from this repository's workflow, not from a laptop.
- **Verified by:** `release.yml`: `npm publish --provenance`, `sign-and-publish-assets` job.

#### SEC-05 · Unwanted · Enforced

If a dependency advisory is accepted rather than fixed, then the acceptance **shall** carry a reason and an expiry date, and an expired acceptance **shall** fail the release.

- **Why:** Allowlists rot. An expiry forces the conversation again.
- **Verified by:** `scripts/audit-check.ts` with `scripts/audit-exceptions.json`.

#### SEC-06 · Ubiquitous · Enforced

Each release **shall** publish a CycloneDX or SPDX SBOM as a signed release asset.

- **Why:** Provenance says who built it. An SBOM says what is inside. Scorecard and downstream policy tooling look for both.
- **Verified by:** `release.yml` `create-assets` runs `npm run release:sbom`, which fails the release unless the CycloneDX SBOM names the package at the tagged version and lists every runtime dependency, and adds it to `checksums.txt`; `sign-and-publish-assets` signs it. `tests/tdd/release-sbom/` runs the generator against the repository.

#### SEC-07 · Ubiquitous · Gap

The repository **shall** carry a `CODEOWNERS` file, and branch protection on `master` **shall** apply to administrators.

- **Why:** Both are Scorecard code-review inputs. A solo maintainer can still enforce "admins included" and own every path.
- **Verified by:** To add: `.github/CODEOWNERS`; update the ruleset recorded in bead `esi-8we`.

#### SEC-08 · Ubiquitous · Enforced

Local credentials **shall** be minted by the PKCE script into a git-ignored `.env` and **shall** never appear in a committed file, fixture or example.

- **Why:** The example file is the only one that belongs in git.
- **Verified by:** `.gitignore`; `scripts/create-token.ts`; consider a secret-scanning pre-commit hook.

---

## Part 7 · Documentation

The repository has excellent individual documents and, until this charter, no documentation system: three publication surfaces, four copies of the testing story, five copies of the Beads quick reference, and a TypeDoc configuration that used to delete hand-written files.

> **Resolved in revision 1:** TypeDoc now writes to `docs-site/public/api/` (git-ignored). `npm run clean` and `npm run docs` no longer touch `docs/`.

### Surfaces at the time of the survey

| Surface                               | What it is                                          | Published?                  | Problem                                                                           |
| ------------------------------------- | --------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------- |
| `README.md` (1037 lines)              | The de facto manual                                 | npm + GitHub                | Banner says v9.5.2; restates six guides; 39-row client table hand-maintained      |
| `guides/`                             | Maintainer guides, best depth                       | GitHub only                 | Orphaned: nothing links to four of them; two say "37 clients"                     |
| `docs/` (5 files)                     | Examples catalogue, OKF, drift, two strategy papers | GitHub only                 | Was the TypeDoc output dir; nothing links to any of them                          |
| `docs-site/` (VitePress, 21 pages)    | A hand-written fork of the README                   | **Never built or deployed** | Version dropdown says 9.6.1; two commits ever; duplicates everything              |
| TypeDoc on gh-pages                   | API reference from JSDoc                            | gh-pages on release         | The only published site, and the least readable one                               |
| `src/sde/README.md` + `src/sde/docs/` | Complete SDE doc set                                | GitHub only                 | Lives inside `src/`, invisible to the site, re-written independently in docs-site |
| `tests/bdd/README.md` + `GUIDE.md`    | EARS specification rules                            | GitHub only                 | Newest and best docs in the repo; not referenced from the testing guide           |
| Root `TESTING.md`                     | Older copy of `guides/TESTING.md`                   | GitHub only                 | Different tier numbering from the guide; unlinked                                 |

### Target shape

One canonical tree, one published site built from it, counts generated rather than typed. The README shrinks to an orientation page and links out.

```
README.md                       pitch · install · quick start · links only
CONTRIBUTING.md · SECURITY.md   SECURITY.md becomes the short policy, GitHub-surfaced
guides/                         canonical, and the only source the site builds from
├── CHARTER.md                  this document
├── ARCHITECTURE.md             absorbs README caching/rate-limit/streaming prose, interceptors, circuit breaker
├── DESIGN-RULES.md             NEW: conventions + "add an endpoint" + "add a client" walkthroughs
├── TESTING.md                  merges root TESTING.md + MUTATION-TESTING.md; canonical tier table
├── SPECIFICATION.md            moved from tests/bdd/GUIDE.md; README.md there becomes a pointer
├── QUALITY-GATES.md            NEW: gate matrix, every workflow, every script, nightly-spec-drift.md folded in
├── SECURITY.md                 controls + supply chain; policy lines removed (they live in root)
├── ERRORS.md                   NEW: taxonomy, guards, retryability, safe mode
├── LOGGING.md                  NEW: ILogger, per-client loggers, pino adapter, levels
├── PAGINATION.md               NEW: offset, cursor, stream*, fetchAll*, batch, concurrency defaults
├── RUNTIME-VALIDATION.md       keep
├── SDE.md                      index; src/sde/docs/* move to guides/sde/
├── OKF.md                      moved from docs/okf-guide.md
├── RELEASE.md                  NEW: release-please, changelog, provenance, support window
├── SEMVER.md                   NEW: what the public contract is, major/minor/patch decisions, commit markers, merge buttons
├── DOCUMENTATION.md            rewritten: surfaces, site build, TypeDoc, metrics generation
├── BEADS.md                    keep; AGENTS.md and CLAUDE.md shrink to pointers
└── rfcs/                       future design papers (the jitaspace mapping and streaming-websocket strategy were retired as dated)
docs-site/                      VitePress; guide/ populated by scripts/sync-docs.ts from guides/; public/api = TypeDoc
docs/                           retired: okf-guide moved to guides/OKF.md, nightly-spec-drift folded into QUALITY-GATES, the rest deleted
TESTING.md (root)               deleted after merge
etc/doc-metrics.json            NEW: generated counts: clients, endpoints, rules, scenarios, coverage
```

### Guide roadmap

| Target guide                                            | Action | Sources to fold in                                                                                                                 | Charter parts | Tracking                                                          |
| ------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| CHARTER.md                                              | new    | This document                                                                                                                      | all           | —                                                                 |
| ARCHITECTURE.md                                         | merge  | README caching, rate limiting, streaming, error handling sections; docs-site interceptors, circuit-breaker pages; fix "37 clients" | 2             | `esi-07y` · [#286](https://github.com/lgriffin/ESI.ts/issues/286) |
| DESIGN-RULES.md                                         | new    | CLAUDE.md key patterns; `generate:endpoints` scaffold usage; naming table above                                                    | 3             | `esi-lvi` · [#279](https://github.com/lgriffin/ESI.ts/issues/279) |
| TESTING.md                                              | merge  | Root TESTING.md, MUTATION-TESTING.md, README testing section, ARCHITECTURE §8                                                      | 4             | `esi-b4a` · [#273](https://github.com/lgriffin/ESI.ts/issues/273) |
| SPECIFICATION.md                                        | move   | tests/bdd/GUIDE.md + README.md; ears-gherkin-dev skill steps                                                                       | 4             | —                                                                 |
| QUALITY-GATES.md                                        | new    | .github/workflows/README.md, docs/nightly-spec-drift.md, scripts table                                                             | 5             | `esi-30o` · [#280](https://github.com/lgriffin/ESI.ts/issues/280) |
| SECURITY.md (guide)                                     | merge  | Remove policy duplication; add SBOM and CODEOWNERS plan                                                                            | 6             | `esi-p0s` · [#285](https://github.com/lgriffin/ESI.ts/issues/285) |
| ERRORS.md                                               | new    | docs-site reference/errors.md; `src/core/util/error.ts`                                                                            | 2             | `esi-rt2` · [#281](https://github.com/lgriffin/ESI.ts/issues/281) |
| LOGGING.md                                              | new    | Nothing exists; write from the per-client logging refactor                                                                         | 2, 3          | `esi-5zs` · [#282](https://github.com/lgriffin/ESI.ts/issues/282) |
| PAGINATION.md                                           | new    | README streaming and cursor sections; docs-site pagination.md; 9.7.0 changelog for `fetchAll*`                                     | 2             | `esi-358` · [#283](https://github.com/lgriffin/ESI.ts/issues/283) |
| RUNTIME-VALIDATION.md                                   | keep   | Delete README and docs-site copies, link instead                                                                                   | 3             | —                                                                 |
| SDE.md + guides/sde/                                    | move   | src/sde/README.md, src/sde/docs/*, docs-site guide/sde.md                                                                          | 2             | —                                                                 |
| OKF.md                                                  | move   | docs/okf-guide.md; link from README and DESIGN-RULES                                                                               | 3             | —                                                                 |
| RELEASE.md                                              | new    | release-please config, CHANGELOG conventions, release.yml jobs, SECURITY.md support table                                          | 8             | `esi-38g` · [#284](https://github.com/lgriffin/ESI.ts/issues/284) |
| DOCUMENTATION.md                                        | merge  | Rewrite around the target tree; document the site build and metrics                                                                | 7             | —                                                                 |
| BEADS.md                                                | keep   | Collapse AGENTS.md's three blocks and CLAUDE.md's copy to pointers                                                                 | 9             | —                                                                 |
| Root TESTING.md, docs/examples.md, docs-site duplicates | retire | Examples catalogue becomes docs-site/examples generated from `examples/*.ts` headers                                               | 7             | —                                                                 |

#### DOC-01 · Ubiquitous · Gap

Each documentation topic **shall** have exactly one canonical file under `guides/`, and every other mention **shall** link to it rather than restate it.

- **Why:** Four copies of the testing story drifted to two different tier numberings within a month.
- **Verified by:** To add: a link-check script; the roadmap table above is the migration plan.

#### DOC-02 · Ubiquitous · Enforced

Generated API reference output **shall** be written to a git-ignored directory outside `docs/`, and no npm script **shall** delete a directory containing committed markdown.

- **Why:** The previous configuration wiped five committed files on every `npm run docs`.
- **Verified by:** `typedoc.json` `out: docs-site/public/api`; `clean` and `clean:docs` scripts updated; `.gitignore` entry.

#### DOC-03 · Ubiquitous · Gap

The published documentation site **shall** be built from `guides/` by a script in the repository and deployed by the release workflow alongside the API reference.

- **Why:** A site nobody can reach is a maintenance cost with no reader. A site built from the canonical files cannot drift.
- **Verified by:** To add: `scripts/sync-docs.ts`, `docs-site` build in `release.yml`, gh-pages with `/api/` for TypeDoc.

#### DOC-04 · Ubiquitous · Gap

Counts quoted in documentation (clients, endpoints, requirements, scenarios, test files, coverage) **shall** be generated into `etc/doc-metrics.json` and inserted by a script, never typed by hand.

- **Why:** At the time of the survey the docs carried 33, 35, 36, 37 and 39 as the number of clients. Only one is right.
- **Verified by:** To add: `scripts/doc-metrics.ts`; `validate:versions` extended to fail on a stale version banner or count.

#### DOC-05 · Ubiquitous · Gap

Every guide **shall** open with the charter requirement identifiers it implements and **shall** be reachable from the README within one link.

- **Why:** Traceability both ways: from a rule to how it is met, and from a reader's landing page to the depth.
- **Verified by:** To add: link-check script asserting each `guides/*.md` is linked from README and carries an `Implements:` line.

#### DOC-06 · Event-driven · Gap

When a public export is added, the pull request **shall** include its JSDoc, its guide section and, where user-facing, an example under `examples/`.

- **Why:** `fetchAll*` (73 methods), `InMemoryFetch` and `createNoopLogger` exist only in the changelog.
- **Verified by:** PR template checklist; API surface diff makes the addition visible to the reviewer.

---

## Part 8 · Release

Releases are cut by release-please from conventional commits, validated by the full suite, published to two registries with provenance, and signed.

#### REL-01 · Ubiquitous · Enforced

Every commit on `master` **shall** follow the conventional-commit format so that release-please can derive the version bump and changelog section.

- **Why:** `feat` bumps minor, `fix` bumps patch, `!` bumps major. The changelog writes itself only if the commits are honest.
- **Verified by:** commitlint on the commit-msg hook; `release-please.yml`.

#### REL-02 · Ubiquitous · Enforced

A release **shall** publish only after lint, format, audit allowlist, changelog presence, build, schema drift, generated-type freshness and the full test suite pass on the tag.

- **Why:** The tag is the last place to stop a bad build.
- **Verified by:** `release.yml` `validate-release` job.

#### REL-03 · Ubiquitous · Partial

The version string **shall** be identical in `package.json`, `src/core/constants.ts`, the README banner and the docs-site version selector.

- **Why:** The first two are checked. The README and the site have lagged the package by several minors.
- **Verified by:** `scripts/validate-versions.ts`; extend to markdown and the VitePress config, or remove the banners.

#### REL-04 · Unwanted · Gap

If a version is bumped but not published, then the changelog **shall** record it as unreleased rather than skipping the number.

- **Why:** The changelog jumps from 9.1.0 to 9.7.0. Consumers reading it cannot tell whether 9.2 to 9.6 exist.
- **Verified by:** Release guide procedure; backfill the missing entries once.

#### REL-05 · Ubiquitous · Enforced

The package **shall** support Node 18 or newer and **shall** be tested on the 18, 20 and 22 lines before merge.

- **Why:** Global fetch arrived in 18. Dropping 18 is a major version and needs a changelog line, not a silent engines bump.
- **Verified by:** `engines` field; `ci.yml` matrix.

#### REL-06 · Unwanted · Partial

If a change can make code that works against the previous release fail to compile, throw, or return a different result, then the commit that introduces it **shall** be marked breaking (`type!:` and a `BREAKING CHANGE:` footer with the migration), and anything it removes **shall** have been deprecated in an earlier minor release unless ESI has already removed it.

- **Why:** `^9.x` in a consumer's manifest installs every minor and patch automatically. A break released as a minor breaks those installs silently.
- **Verified by:** `guides/SEMVER.md` classification and the Reviewer Checklist; the `api-semver` job (#310) for the root entry point's type surface. Runtime behaviour, schema tightening, sub-path exports and required members on implemented interfaces are review-only.

---

## Part 9 · Process

Agents are contributors here and are bound by the same rules as people, with less authority by default.

#### PROC-01 · Ubiquitous · Practised

All task tracking **shall** live in the Beads tracker (`bd`), with `.beads/issues.jsonl` treated as a passive export and never as the source of truth.

- **Why:** One tracker, shared by people and agents. Markdown TODO lists are forbidden by AGENTS.md.
- **Verified by:** Repository instruction files.

#### PROC-02 · State-driven · Practised

While an agent operates under the default conservative profile, it **shall not** commit, push or sync the tracker without an explicit instruction.

- **Why:** Autonomy is earned per session. The handoff reports changed files and proposed commands instead.
- **Verified by:** AGENTS.md and CLAUDE.md managed blocks.

#### PROC-03 · Ubiquitous · Enforced

`master` **shall** accept changes only through a pull request that is up to date with the base and passes the Quality Gate and Lint/Build/Test checks.

- **Why:** Recorded in bead `esi-8we`. Force-push is disabled.
- **Verified by:** GitHub branch protection.

#### PROC-04 · Ubiquitous · Partial

A branch **shall** carry one concern, named by its conventional-commit type and scope.

- **Why:** Reviewers cannot review two things at once.
- **Verified by:** Code review; PR template.

#### PROC-05 · Ubiquitous · Partial

Agent instruction files (`AGENTS.md`, `CLAUDE.md`) **shall** contain pointers to guides, not copies of them.

- **Why:** The Beads quick reference appears five times across three files. Pointers cannot drift.
- **Verified by:** Roadmap item for BEADS.md; a line-count ceiling on the managed blocks.

---

## Part 10 · Gap register

Everything found during the survey that contradicts a requirement above. Each row is tracked as a bead under epic `esi-l38` and mirrored as a GitHub issue under [#287](https://github.com/lgriffin/ESI.ts/issues/287). The guide roadmap in Part 7 is tracked the same way. Severity is about consumer impact, not effort.

| #   | Sev  | Finding                                                                                       | Requirement               | Fix                                                                                                                                                                               | Bead      | Issue                                                 |
| --- | ---- | --------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1   | HIGH | Branch failed `tsc --noEmit` from the logging refactor (two import paths, one stale call)     | ARCH-09, GATE-02          | **Done in revision 1**: paths fixed, `parseJsonBody` receives the client, pagination logging migrated, `logFatal`/`logTrace` exported, `toPinoLogger` keeps pino's `this` binding | `esi-d3o` | [#262](https://github.com/lgriffin/ESI.ts/issues/262) |
| 2   | HIGH | `npm run docs` / `clean` deleted five committed files in `docs/`                              | DOC-02                    | **TypeDoc moved in revision 1**; remaining: move the markdown to `guides/`                                                                                                        | `esi-a2k` | [#263](https://github.com/lgriffin/ESI.ts/issues/263) |
| 3   | HIGH | docs-site never built or deployed; duplicates README at two-version lag                       | DOC-03                    | Sync script + release deploy                                                                                                                                                      | `esi-06b` | [#264](https://github.com/lgriffin/ESI.ts/issues/264) |
| 4   | MED  | `logFatal`/`logTrace` were not exported; global-logger fallback needs a lint gate             | ARCH-09                   | Exports done in revision 1; add the grep gate                                                                                                                                     | `esi-772` | [#265](https://github.com/lgriffin/ESI.ts/issues/265) |
| 5   | MED  | `isCircuitOpen` missing from `./errors`; plumbing errors are string-typed                     | ARCH-07                   | Export guard; introduce `EsiConfigurationError` family                                                                                                                            | `esi-gyh` | [#266](https://github.com/lgriffin/ESI.ts/issues/266) |
| 6   | MED  | `CustomEsiClient` missing four getters                                                        | ARCH-08                   | **Done**: getters added, compile-time check in `customClientGetters.test.ts`; `EsiApiFactory` still covers 10 clients                                                             | `esi-eqq` | [#267](https://github.com/lgriffin/ESI.ts/issues/267) |
| 7   | MED  | No `sideEffects: false`; two pino instances built at import                                   | ARCH-06                   | Lazy logger; add flag; bundle-size check                                                                                                                                          | `esi-piw` | [#268](https://github.com/lgriffin/ESI.ts/issues/268) |
| 8   | MED  | `handleSinglePageRequest` hardcodes GET; cursor `fetchAll` swallows failures                  | DES-08                    | EARS rules then fix                                                                                                                                                               | `esi-dwi` | [#269](https://github.com/lgriffin/ESI.ts/issues/269) |
| 9   | MED  | No SBOM; no CODEOWNERS; admins exempt from protection                                         | SEC-06, SEC-07            | Add both files; update ruleset                                                                                                                                                    | `esi-wze` | [#270](https://github.com/lgriffin/ESI.ts/issues/270) |
| 10  | MED  | Tests not linted; knip non-blocking; mutation never gates                                     | TEST-09, GATE-04, TEST-07 | Extend lint; block at release; incremental Stryker on PR                                                                                                                          | `esi-p56` | [#271](https://github.com/lgriffin/ESI.ts/issues/271) |
| 11  | MED  | Client count quoted as 33, 35, 36, 37 and 39; BDD counted as 41 features; README banner 9.5.2 | DOC-04, REL-03            | Generated metrics; extend version check                                                                                                                                           | `esi-j03` | [#272](https://github.com/lgriffin/ESI.ts/issues/272) |
| 12  | MED  | Two testing guides with different tier numbers; root `TESTING.md` unlinked                    | DOC-01                    | Merge; adopt the Part 4 table                                                                                                                                                     | `esi-b4a` | [#273](https://github.com/lgriffin/ESI.ts/issues/273) |
| 13  | LOW  | `sde:seed` points at a missing script                                                         | GATE-06                   | Restore or remove                                                                                                                                                                 | `esi-x3z` | [#274](https://github.com/lgriffin/ESI.ts/issues/274) |
| 14  | LOW  | Changelog skips 9.2 to 9.6                                                                    | REL-04                    | Backfill once                                                                                                                                                                     | `esi-5fu` | [#275](https://github.com/lgriffin/ESI.ts/issues/275) |
| 15  | LOW  | Beads quick reference duplicated five times; persona files untracked in the repo root         | PROC-05, PROC-04          | Pointers; move persona files out or ignore them                                                                                                                                   | `esi-udr` | [#276](https://github.com/lgriffin/ESI.ts/issues/276) |
| 16  | LOW  | Nightly mutation and Schemathesis upload artifacts but file no issue                          | GATE-05                   | Add issue step like the audit job                                                                                                                                                 | `esi-mbr` | [#277](https://github.com/lgriffin/ESI.ts/issues/277) |
| 17  | LOW  | `CONTRIBUTING.md` says Node 18 while `.nvmrc` says 20; populated `.env` in working trees      | SEC-08, REL-05            | State "18 supported, 20 recommended"; housekeeping                                                                                                                                | `esi-wc6` | [#278](https://github.com/lgriffin/ESI.ts/issues/278) |

---

## Part 11 · Adoption

The order matters: nothing in the documentation work is safe until step 2 is done, and nothing is trustworthy until step 1 is done.

1. **Make the branch compile.** ✅ Revision 1.
2. **Move TypeDoc output** to `docs-site/public/api` and update `clean`. ✅ Revision 1. The five `docs/` files are moved, folded or retired, and `docs/` no longer exists.
3. **Commit this charter** as `guides/CHARTER.md` and file one bead per row of the gap register, tagged with the requirement ID. ✅ Revision 1.
4. **Merge the duplicates** in the roadmap order: TESTING first (it has the tier conflict), then SECURITY, then ARCHITECTURE. Delete the root copies as each merge lands.
5. **Write the new guides**: DESIGN-RULES, QUALITY-GATES, ERRORS, LOGGING, PAGINATION, RELEASE. Each opens with `Implements: ARCH-03, DES-01 …`.
6. **Generate the numbers.** `scripts/doc-metrics.ts` writes `etc/doc-metrics.json`; a small template step stamps the README and site. Extend `validate:versions` to fail on stale banners.
7. **Publish the site.** `scripts/sync-docs.ts` copies `guides/` into `docs-site/guide/`; release workflow builds VitePress and deploys it with the API reference under `/api/`. Shrink the README to an orientation page.
8. **Close the security gaps**: CODEOWNERS, SBOM asset, admins in branch protection. Re-run Scorecard and record the new score in the charter's next revision.

> **Revision rule.** This charter is revised by pull request like any other file. A requirement's status may only move toward Enforced by citing the script or job that proves it. Moving it the other way needs a bead explaining why.
