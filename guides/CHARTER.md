# ESI.ts Engineering Charter

**Package:** `@lgriffin/esi.ts` · **Charter revision:** 2 (2026-09-27) · **Status:** adopted

The governing statement of how ESI.ts is designed, built, tested, secured, documented and released. Every guide in this folder derives from a numbered requirement here, and every requirement is written in the same EARS form the test suite already uses, so the charter can be audited the way the specification is.

| Measured at v10.2.3                                            |                                            |
| -------------------------------------------------------------- | ------------------------------------------ |
| Domain clients                                                 | 39                                         |
| ESI endpoints wired                                            | 235                                        |
| Generated operations (`src/generated/operations.generated.ts`) | 233                                        |
| EARS requirements in the specification                         | 402 (54 feature files)                     |
| Gherkin scenarios                                              | 490                                        |
| Test files across nine Jest configurations plus tsd            | 281                                        |
| Statement coverage                                             | 98.2% (last measured at v9.8.0; floor 90%) |

### What changed in revision 2

- **Corrections from [#299](https://github.com/lgriffin/ESI.ts/issues/299).** Spec TTL source, the HTTPS rule in SEC-01, path-parameter handling, cursor pagination, the order of retry and deduplication, the 8 / 20 / 1000 defaults, rate-limiter token costs, circuit-breaker cleanup, per-call deprecation warnings, the auth error subtree, required check names and the scaffold path.
- **Statuses moved** to match the code at v10.2.3: TEST-03 and TEST-07 to Enforced; TEST-09, SEC-07 and DOC-05 to Partial; GATE-05 back to Partial, tracked by [#277](https://github.com/lgriffin/ESI.ts/issues/277).
- **Phase 0 to 2 of the 11.0 plan** are reflected in Part 2: ports, the generated operations, the clock module and the layer lint.
- **11.0.0 decisions** recorded below. REL-05 now states the Node 22 floor, so it reads Gap until the 11.0.0 engines bump lands; the requirement changed, the code did not regress.
- **Gap register** rows closed with evidence, the eleven findings filed after revision 1 (#290 to #300) added, and one new finding (a bare `..` path parameter) registered.

### Amendments after revision 2

- **2026-09-27, EARS governance.** Six decisions from the review of the specification's reach, taken by the maintainer on the recommendations recorded in the roadmap: exclusions are stated as unwanted-behaviour Rules (TEST-11, new); the charter itself is audited like a feature file (PROC-06, new); every public client method traces to a Rule (TEST-10, new, shared with Track S Run 4); `npm run ears` already runs in CI (`ears.yml`, on every pull request that touches `src/`, `tests/bdd/` or the EARS scripts; `bdd-tests` and `spec-audit` gate the same ground inside `ci-success`), and making it a required check is a branch-protection setting for the maintainer that would first need the workflow's path filters removed, so a documentation-only pull request is not blocked by a check that never ran; TEST-01 moves to Practised because its RED step is a workflow, not a check; TEST-07 gains the 11.0.0 mutation floors. Statuses that moved down did so with the reason in the row.

- **2026-09-27, the charter audit.** `npm run charter:audit` holds every requirement block of this document to the rules `spec:audit` applies to a `Rule:` and fails an Enforced row that names no mechanism (PROC-06, Enforced). To pass it, twenty-three requirements that had stated two or three obligations were reworded to one `shall` each without changing what they require, three that said "it" now name the system, and DES-03, TEST-08 and GATE-03 name their mechanism in backticks.

- **2026-09-27, the pull-request mutation gate.** The maintainer took `mutation-pr` out of `ci-success` and into its own workflow, `mutation-pr.yml`, so a pull request no longer waits up to 37 minutes for it: it still runs and reports on every pull request, the nightly still holds every floor, and ROADMAP.md's release gate carries the row that puts it back before 11.0.0 ships. GATE-01 needs 23 jobs; TEST-07 stays Enforced on the nightly.

- **2026-09-27, logging at the boundary (Phase 4 items 1 and 2).** ARCH-09 moves from Partial to Enforced: every call site logs through the per-client logger, and a `no-restricted-imports` block in `npm run lint` and `lint:layers` keeps the global `loggerUtil` out of `src/core/requestPipeline/` and `src/clients/` ([#265](https://github.com/lgriffin/ESI.ts/issues/265)). SEC-02 gains log lines to its evidence: URLs are redacted with `sanitizeUrl` at the logger boundary ([#296](https://github.com/lgriffin/ESI.ts/issues/296)). ARCH-06 stays a Gap until item 3.

- **2026-09-27, nothing built at import (Phase 4 item 3).** ARCH-06 moves from Gap to Enforced: the default logger builds its pino instance on first use, `package.json` declares `"sideEffects": false`, and `tests/tdd/core/importSideEffects.test.ts` holds both ([#268](https://github.com/lgriffin/ESI.ts/issues/268)).
- **2026-09-27, nightlies file issues (Phase 5 item 3).** `nightly-mutation.yml` and `nightly-schemathesis.yml` now open or comment on one fixed-title issue on failure and close it on the next green night, the pattern `nightly-spec-drift.yml` uses; gap register row 16 is Done ([#277](https://github.com/lgriffin/ESI.ts/issues/277)). GATE-05 stays Partial: the no-retry, interleaving and consumer-matrix nightlies still only fail the run.
- **2026-09-27, the version selector, the documents and the offline endpoint check.** REL-03 moves to Enforced: `validate:versions` also reads the docs-site version selector, which now carries the `x-release-please-version` marker and sits in release-please's `extra-files`, and runs in `static-analysis` as well as at release. GATE-06 moves to Enforced: `package-scripts.test.ts` also fails when a document names an `npm run` that `package.json` does not define. `validate:esi` fails on a definition the spec does not list unless `scripts/spec/esi-endpoint-exceptions.json` gives a reason, and `validate:esi:vendored` runs it offline against the vendored snapshot in `check:local` and after `spec-refresh.yml` regenerates.

- **2026-09-27, CI matches the gate matrix (Phase 5 item 1, [#297](https://github.com/lgriffin/ESI.ts/issues/297)).** `validate-release` now runs `spec:generate:check`, `validate:auth-scopes`, `validate:esi`, `spec:audit`, `validate:spec-consistency`, `contract:replay`, the fault catalogue and the live contract tests (503 soft-skips), with the shrink-only ratchets compared against the previous release tag (the job fails when none resolves). `validate:esi` and `validate:spec` run in `static-analysis` on every pull request, blocking when the pull request touches their inputs; `validate:versions` already ran in the release gate. The generated-freshness diff covers every `src/core/endpoints/esi-*.generated.ts`, so the rate-limit-group and scope files are diffed in CI, at release and nightly (ARCH-01). `validate:auth-scopes` fails both directions of DES-04 and on a stale exception; the fourteen stale entries in `scripts/spec/auth-scope-exceptions.json` are removed. The pull-request contract step gains `pipefail`, without which its `if` read `tee`'s status and a failing live suite passed. The documentation job and `example:sde-cross-ref` were already fixed on master. Gap register row 25 is done.
- **2026-09-27, Scorecard's repository-side checks (Phase 6, code side; [#239](https://github.com/lgriffin/ESI.ts/issues/239), [#270](https://github.com/lgriffin/ESI.ts/issues/270)).** Every workflow already declared read-only top-level permissions; `tests/tdd/workflows/workflow-permissions.test.ts` now holds that, and lists every job-level write scope so a new one is a reviewed edit (SEC-03). `sign-and-publish-assets` attests SLSA build provenance for the tarball, SBOM and docs archive, verifies it with `gh attestation verify`, and attaches it as `lgriffin-esi.ts-X.Y.Z.intoto.jsonl` beside the cosign bundles, the file Scorecard's Signed-Releases check scores highest (SEC-04). The SBOM (SEC-06) and `.github/CODEOWNERS` had landed earlier. Signed-Releases reads the last five releases, and v10.2.2 and v10.2.3 have no assets attached, so the score rises only as signed releases ship. SEC-07 stays Partial: branch protection that includes administrators, required approvals and the Best Practices badge ([#243](https://github.com/lgriffin/ESI.ts/issues/243), [#246](https://github.com/lgriffin/ESI.ts/issues/246)) are settings only the maintainer can change, listed in `guides/SECURITY.md` §5.

### 11.0.0

The next major is 11.0.0, built in the phases of the Road to Done plan (Phase 0 audit in [AUDIT.md](AUDIT.md); Phase 1 generator done; Phase 2 architecture lock in progress). The phase schedule, each phase's definition of done, the SDE programme and the release gate are in [ROADMAP.md](ROADMAP.md). Decided on 2026-09-26:

- The target is 11.0.0, not 1.0.0: npm already carries 10.x.
- Node 22 becomes the floor in 11.0.0, released as a breaking change (REL-05).
- pino and zod stay runtime dependencies.
- Jest, npm, release-please and Dependabot stay the toolchain.

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
5. **Secure by construction.** HTTPS and a host allowlist at construction, tokens attached only where a scope is declared, URLs redacted in every error, cache keys scoped per character (or per hashed token). The controls are tests, not advice.
6. **The specification executes.** Behaviour is stated as EARS requirements in Gherkin, one per `Rule:`, verified by scenarios that mock the transport seam. The audit fails a PR that weakens the wording.
7. **Verifiable supply chain.** Every action SHA-pinned, least-privilege tokens, npm provenance on both registries, keyless cosign signatures and checksums on release assets, advisories accepted only with an expiry date.

---

## Part 2 · Architecture

Five layers, one request path, and side modules that deliberately share nothing with the HTTP pipeline. Phase 2 of the 11.0 plan adds ports and generated operations beneath them; the layer rule is enforced by `npm run lint:layers`.

| Layer                | Where                                                                     | Role                                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Construction         | `src/EsiClient.ts`, `src/EsiClientBuilder.ts`                             | `EsiClient` (lazy getters for every domain), `EsiClientBuilder` → `CustomEsiClient` (subset), `EsiApiFactory` (one client). All three feed `configureApiClient`, the single place config becomes middleware.                                                                                  |
| Domain clients       | `src/clients` (39 + `BaseEsiClient`)                                      | One class per ESI domain. Adds ergonomics only: named methods, `stream*` and `fetchAll*` wrappers, `withSafeMode()` envelopes. No HTTP knowledge.                                                                                                                                             |
| Endpoint definitions | `src/core/endpoints` (39 files, 235 endpoints)                            | Declarative maps (`as const satisfies EndpointMap`) wiring path, method, `requiresAuth`, pagination kind, `responseSchema`, `requestSchema`, deprecation. `createClient()` turns a map into typed methods; return types are inferred from the schema.                                         |
| Request pipeline     | `src/core`, `src/core/requestPipeline/*`                                  | Pure functions receiving their dependencies as parameters (`dependencies.ts` is the only resolver). Cache policy, headers, fetch execution, status handling, pagination orchestration, middleware bridge.                                                                                     |
| Transport            | `FetchLike`, `globalThis.fetch`                                           | Injectable via `setFetch()`. Timeout by `AbortController`. The Node floor (18 today, 22 from 11.0.0) exists because this layer relies on the global fetch.                                                                                                                                    |
| Ports                | `src/core/ports`                                                          | Type-only interfaces (`CacheStore`, `Clock`, `HttpTransport`, `Identity`, `Logger`, `OperationTransport`, `TokenProvider`) that import nothing. Exported from `./client`.                                                                                                                     |
| Generated operations | `src/generated/operations.generated.ts`                                   | One function per spec operation, importing only ports. Checked by `spec:generate:check` and `spec:coverage` in CI; called through `src/client`.                                                                                                                                               |
| Client               | `src/client` (`./client`)                                                 | `createEsi`: one runtime over `configureApiClient`, `esi.public` (a `PublicScopeTree`) and `esi.as(identity)` (a `ScopeTree` sharing the runtime's budgets and cache). Imports core, adapters and generated code, never the legacy tree; `lint:layers` enforces it (Enforced).                |
| Clock                | `src/core/clock.ts`                                                       | `systemClock` is where wall-clock time, timers and `Math.random` belong. `npm run lint:determinism` blocks new direct reads; the existing sites (rate limiter, cache, circuit breaker, request handler and others) sit in `scripts/quality/determinism-baseline.json`, which may only shrink. |
| Auth                 | `src/auth`                                                                | EVE SSO (PKCE), token manager and storage, with its own error subtree. Reached from the root and `./errors`; there is no `./auth` sub-path.                                                                                                                                                   |
| Side modules         | `./schemas`, `./errors`, `./testing`, `./client`, `./sde`, `./sde/memory` | The SDE module shares no code with the pipeline, and `lint:layers` holds that in both directions (ARCH-10). It is an offline lookup layer for enriching ESI responses, with its own error hierarchy and its own docs.                                                                         |

`lint:layers` (`config/eslint/layers.rules.cjs`) holds the direction: ports import nothing, generated code imports only ports, `src/core` imports no domain client, entry point, generated operation, auth, SDE or testing module, and `src/sde` imports nothing from `src/` but the ports while nothing outside it imports the SDE. The baseline of exempt files is empty, and `tests/tdd/layers/layers-lint.test.ts` keeps it so.

### The request path

Every domain method takes this route. Order is the information: a stage cannot see the effect of a later one.

1. **Domain method → `createClient` closure.** Deprecation warning if declared. `buildEndpointPath` assembles path, query and body (from `hasBody` or `bodyBuilder`). Request body validated against `requestSchema` only when `validateRequest` is on.
2. **Spec-aware cache check.** `trySpecAwareCacheHit` may answer a GET from cache with no network call, but only when the endpoint has a generated TTL. The spec TTL comes from the operation's `x-cache-age` field, generated into `esi-cache-ttls.generated.ts`. `Cache-Control: max-age` never avoids a network call on its own.
3. **`RetryStrategy.execute`.** Wraps deduplication and the fetch. Exponential backoff with 0.75–1.25× jitter. Retries only status 0, 420, 429, 502, 503, 504. One 401 token refresh per call when a provider exists. Mutations never retried unless `retryMutations`. `CircuitOpenError` is rethrown immediately. Each attempt re-checks the spec-TTL cache first.
4. **Deduplication.** Inside each attempt, identical in-flight GETs without a body coalesce onto one promise, keyed by URL and caller identity. On by default.
5. **`executeSingleFetch`.** Build headers (User-Agent, compatibility date, `If-None-Match`, bearer only if `requiresAuth`) → request interceptors → circuit breaker check → rate limiter check → timed fetch → parse headers → rate limiter learns from response → breaker records outcome.
6. **Status handling.** 201 returns the parsed body. 204 yields `undefined`. 304 serves the cached body; if the entry was evicted mid-flight the request is repeated without `If-None-Match`, and only then does it throw. 5xx with a cached copy serves stale. 401/403 get remediation text appended.
7. **Cache write and pagination.** Successful GETs that carry an ETag are cached under a key that hashes the auth header. Stored TTL: spec TTL, else `max-age`, else the cache default (5 min), plus 1 h stale retention. Non-GET success invalidates the path prefix. Offset pagination follows `x-pages`. Cursor routes take `before`/`after` query parameters; `x-cursor-before`/`x-cursor-after` headers come back on the result as `cursors` and are never followed automatically, so callers page with `fetchAllCursorPages()`.
8. **Response interceptors → Zod validation → envelope.** Body replaced by `safeParse().data` when `validateResponse` is on (default). Failure throws `EsiValidationError`. `withMetadata` and `withSafeMode` wrap the result last.

### Middleware inventory

| Concern         | Interface                                    | Default            | Key defaults                                                                                                                                                                                                                    |
| --------------- | -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limiter    | `IRateLimiter`                               | on, mandatory      | Buckets from generated groups; adopts `x-ratelimit-*` from responses; honours `Retry-After`; 420/429 → 60 s block; tracks `x-esi-error-limit`. It does not charge token costs itself (`getTokenCost()` is a static helper only) |
| Circuit breaker | `ICircuitBreaker`                            | off, opt-in        | 5 failures, 30 s reset, 1 half-open probe, key by resolved path; stale-record cleanup off unless `cleanupIntervalMs > 0`                                                                                                        |
| Deduplicator    | `IDeduplicator`                              | on                 | GET without body only                                                                                                                                                                                                           |
| Retry           | `IRetryStrategy`                             | on                 | 3 retries, 1 s base, 30 s cap (set by `configureApiClient`; a bare `RetryStrategy` defaults to 0 retries)                                                                                                                       |
| Pagination      | —                                            | —                  | `fetchAll*` concurrency 8; `batch` concurrency 20; `batchPost` chunk size 1000                                                                                                                                                  |
| ETag cache      | `ICache`                                     | on                 | 1000 entries, 5 min default TTL, 60 s sweep                                                                                                                                                                                     |
| Interceptors    | `RequestInterceptor` / `ResponseInterceptor` | none               | Sequential, unsubscribe closure returned                                                                                                                                                                                        |
| Transport       | `FetchLike`                                  | global fetch       | 30 s timeout                                                                                                                                                                                                                    |
| Logger          | `ILogger`                                    | pino, level `warn` | Per-client, falls back to global, then default                                                                                                                                                                                  |

### Error taxonomy

```
Error
├── EsiError (statusCode, sanitised url, requestId)      .retryable ⇐ {0, 420, 429, 502, 503, 504}
│   ├── TimeoutError (+ timeoutMs)
│   └── EsiValidationError (+ ZodError, direction: request | response)
├── CircuitOpenError (endpoint, failures, retryAfterMs)   not an EsiError
├── AuthError
│   ├── SsoError (+ statusCode)                           .retryable ⇐ 429 or ≥ 500
│   ├── TokenRevokedError
│   ├── TokenDecodeError                                  no type guard yet
│   └── CharacterNotFoundError
└── SdeError → SdeDatabaseError | SdeValidationError | SdeVersionMismatchError
```

The auth subtree is exported from the root and from `./errors`, with guards `isAuthError`, `isSsoError`, `isTokenRevoked` and `isCharacterNotFound`.

Configuration and plumbing faults (`NO_AUTH_TOKEN`, `CONFIGURATION_ERROR`, `JSON_PARSE_ERROR`, `PAGINATION_INCOMPLETE`, `TOKEN_REFRESH_FAILED`, `VALIDATION_ERROR`) are plain `Error`s with a bracketed type prefix, built by `buildError` in `src/core/util/error.ts`. That is a known inconsistency, registered in Part 10.

### Requirements

#### ARCH-01 · Ubiquitous · Enforced

The library **shall** derive response types, cache TTLs, rate-limit groups and endpoint scopes from the live ESI OpenAPI specification and commit the generated output.

- **Why:** CCP changes ESI on its own schedule. Generated metadata is the only way to keep 235 endpoints honest.
- **Verified by:** `npm run generate:types` then `git diff --exit-code` on `src/types/generated/` and every `src/core/endpoints/esi-*.generated.ts` (cache TTLs, rate-limit groups, scopes) in CI, the release gate and the nightly spec-drift run. The PR check fails only when a PR touches the generator inputs and warns otherwise. `spec:generate:check` does the same for the generated operations, on pull requests and at release.

#### ARCH-02 · Ubiquitous · Enforced

Every endpoint exposed by a domain client **shall** be declared in exactly one `*Endpoints.ts` definition map that names its path, method, authentication requirement and response schema.

- **Why:** The definition is the contract. `createClient`, the contract tests, the scope validator and the OKF bundle all read from it.
- **Verified by:** `npm run validate:esi` and `npm run validate:auth-scopes` in the CI static-analysis job and the release gate (a definition the spec does not list fails unless `scripts/spec/esi-endpoint-exceptions.json` gives a reason; `validate:esi:vendored` runs the same check offline in `check:local`), `tests/contract/`.

#### ARCH-03 · Ubiquitous · Practised

Request-pipeline modules under `src/core/requestPipeline` **shall** receive cache, rate limiter and circuit breaker as function parameters rather than importing a concrete implementation.

- **Why:** Keeps every stage unit-testable without an `ApiClient` and keeps `dependencies.ts` the one place resolution happens.
- **Verified by:** Code review. `lint:layers` keeps `src/core` away from clients and entry points but does not check this rule; candidate for an extra rule in `config/eslint/layers.rules.cjs` scoped to that directory.

#### ARCH-04 · Ubiquitous · Enforced

Each resilience concern (retry, rate limiting, circuit breaking, deduplication, caching, transport, logging) **shall** be exposed as an interface with a default implementation and a setter on `ApiClient`.

- **Why:** Consumers embed the client in very different runtimes. Swapping a strategy must not require a fork.
- **Verified by:** `tests/typetests/` and `etc/esi.ts.api.md` (API surface check fails on removal).

#### ARCH-05 · Ubiquitous · Enforced

The package **shall** publish a dual CJS and ESM build with declaration files for the six entry points: root, `schemas`, `errors`, `testing`, `sde` and `sde/memory`.

- **Why:** Subpath entries are the tree-shaking story while the root barrel stays wide.
- **Verified by:** `tsup.config.ts`, the `package-lint` job in `ci.yml` (publint and Are The Types Wrong on the packed tarball), and the consumer contract.

#### ARCH-06 · Ubiquitous · Enforced

The package **shall** declare `"sideEffects": false` in its manifest and construct no logger, timer or network client at import time in any module under `src/`.

- **Why:** Seven entry points are wasted if bundlers must assume side effects. The default logger builds its pino instance on first use, not on import ([#268](https://github.com/lgriffin/ESI.ts/issues/268)).
- **Verified by:** `tests/tdd/core/importSideEffects.test.ts`: it imports the source of every `exports` entry with pino replaced by a spy and fails if the spy was called, asserts the manifest flag, and bundles `import { EsiError }` from the root entry with esbuild (ESM and CJS) and fails if the bundle reaches pino. `npm run size` holds every entry to its budget.

#### ARCH-07 · Ubiquitous · Partial

Every public error the pipeline can throw **shall** be an instance of a class exported from `@lgriffin/esi.ts/errors` with a matching type guard.

- **Why:** Consumers branch on errors. String-prefixed plain `Error`s, the missing `isCircuitOpen` export on the subpath and the missing `TokenDecodeError` guard break that.
- **Verified by:** To add: a type test that the guard set on `.` equals the guard set on `./errors`.

#### ARCH-08 · Ubiquitous · Partial

Every construction surface (`EsiClient`, `CustomEsiClient`, `EsiApiFactory`, and `createEsi` for the generated operations) **shall** expose the same set of operations and configure the pipeline through `configureApiClient`.

- **Why:** `CustomEsiClient` now has a getter for every registered client ([#267](https://github.com/lgriffin/ESI.ts/issues/267)). `EsiApiFactory` reaches all 39 through the generic `createClient(type)`, but has named `create*Client` methods for only 9, deprecated since 11.0.0 in favour of `createEsi`.
- **Verified by:** `tests/tdd/core/customClientGetters.test.ts` for `CustomEsiClient` (a missing getter fails to compile). `constructionParity.test.ts` checks that the three legacy surfaces configure middleware the same way, not that they expose the same clients. `createEsi` (`src/client/runtime.ts`) calls `configureApiClient` and exposes every generated operation through `ScopeTree`, which `spec:coverage` keeps complete. To add: a client-set check for `EsiApiFactory`. Its named methods are `@deprecated` in favour of `createEsi` (Phase 7) and go no earlier than 12.0.0.

#### ARCH-09 · Ubiquitous · Enforced

All pipeline logging **shall** go through the per-client logger with structured context, with the global logger existing only as a fallback for callers with no client handle.

- **Why:** Per-client logging makes log lines attributable when several clients share a process.
- **Verified by:** `npm run lint` and `npm run lint:layers` (`--no-inline-config`) forbid the global `loggerUtil` in `src/core/requestPipeline/` and `src/clients/` (`config/eslint/logger-imports.rules.cjs`, proved by `tests/tdd/layers/logger-imports-lint.test.ts`, [#265](https://github.com/lgriffin/ESI.ts/issues/265)). The rate limiter, the ETag cache's startup line, `EsiClient.batch` and the token manager's fallback are covered by `tests/tdd/core/loggerThreading.test.ts` ([#296](https://github.com/lgriffin/ESI.ts/issues/296)). The global logger serves only the standalone batch exports and `EsiTokenManager`, which hold no client.

#### ARCH-10 · Ubiquitous · Enforced

`src/sde` **shall** import only Node built-ins, its own files, its peer packages (`zod`, `js-yaml`, `adm-zip`, `better-sqlite3`) and `src/core/ports`, be imported by no file under `src/` outside `src/sde`, and keep the `./sde/memory` bundle free of file-system, YAML, ZIP or SQLite code.

- **Why:** The SDE is a side module: an offline lookup layer that enriches ESI responses without a consumer in the pipeline. Holding the boundary in both directions keeps the SDE free to change without a release of the client, and keeps the client free of the SDE's optional peers. A bridge between the two was considered on 2026-09-27 and cut; if one is ever wanted it is a separate package above both, so nothing here is added for it.
- **Verified by:** `npm run lint:layers` (the `sde` and `sideModule` messages of `layers/inward-imports`, covered in both directions by `tests/tdd/layers/layers-lint.test.ts`) and `tests/tdd/sde/memory-entry-bundle.test.ts`, which bundles `src/sde/memory.ts` and the built `dist/sde/memory.{mjs,js}` and fails on `node:fs`, `js-yaml`, `adm-zip` or `better-sqlite3`.

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
- **Verified by:** `npm run schema:drift` against the spec; 398 uses of `looseObject` versus 2 of `z.object`, both internal.

#### DES-02 · Event-driven · Enforced

When an endpoint is added to a definition map, the library **shall** ship a `responseSchema` for it, since a missing schema degrades the inferred return type to `unknown`.

- **Why:** Types are inferred from the schema. No schema means no type, which is a silent regression for consumers.
- **Verified by:** `npm run spec:response-schemas` in `ci.yml` `lint-and-build` (every definition whose spec operation returns JSON declares a schema); `tests/typetests/domain-responses.test-d.ts`.

#### DES-03 · Ubiquitous · Enforced

Files ending in `.generated.ts`, the `okf/` bundle and `etc/esi.ts.api.md` **shall** be regenerated by their script and never edited by hand.

- **Why:** A hand edit is overwritten on the next run and hides the real spec change.
- **Verified by:** the generated-types freshness diff (`npm run generate:types` then `git diff --exit-code`) in `ci.yml`; the `api-surface` job for the report; `.prettierignore`.

#### DES-04 · Ubiquitous · Enforced

An endpoint definition **shall** declare `requiresAuth: true` if and only if the generated scope map lists at least one scope for it.

- **Why:** The bearer token is attached only when `requiresAuth` is set. A mismatch either leaks a token or breaks a call.
- **Verified by:** `npm run validate:auth-scopes` in the CI static-analysis job and the release gate; both directions exit 1, and so does an entry in `scripts/spec/auth-scope-exceptions.json` that no longer excuses a mismatch.

#### DES-05 · Event-driven · Practised

When an endpoint is deprecated upstream, the client **shall** carry `DeprecationInfo` with a replacement and sunset date on the endpoint's definition and log a warning on every call to it.

- **Why:** Deprecation is a first-class field, not a comment. Consumers get a log line before the endpoint vanishes. The warning is not memoised (`createClient.ts`), so a hot loop logs on each call; revision 1 said "once", which was never true.
- **Verified by:** Nightly spec drift files an issue; code review adds the field.

#### DES-06 · Ubiquitous · Practised

Configuration and error objects **shall** be immutable after construction, with merges copying rather than mutating.

- **Why:** `readonly` fields on every error and every strategy config; copy-on-write interceptor lists. Bucket and circuit records are the intentional exception because they are counters.
- **Verified by:** TypeScript `readonly`; code review.

#### DES-07 · Ubiquitous · Enforced

The compiler **shall** run with `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride` and `noFallthroughCasesInSwitch` for `src/`.

- **Why:** The type-level endpoint inference only holds under strict settings. Tests relax `noUncheckedIndexedAccess` and nothing else.
- **Verified by:** `tsconfig.json`; `npm run typecheck` on every push.

#### DES-08 · Ubiquitous · Partial

Pagination helpers **shall** propagate the caller's HTTP method into the retry context and surface partial results as an error rather than a silent truncation.

- **Why:** A helper that retries a mutation, or returns a short list as if it were complete, surprises the consumer. The retry method and the cursor `fetchAll` meet it; the eager 1000-page cap still ends with a log line, not an error ([PAGINATION.md](PAGINATION.md#known-gaps)).
- **Verified by:** `tests/bdd/features/core/0051-resilience.feature` (a streamed POST answered with 503 is sent once; three failed cursor pages reject).

---

## Part 4 · Testing

This table is the canonical tier order. Both testing guides merge into one and cite it.

| Tier | Name                           | Where                            | Files                                   | Runner                    | Runs on                                                        |
| ---- | ------------------------------ | -------------------------------- | --------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| 1    | Unit (TDD)                     | `tests/tdd`                      | 192                                     | jest.unit                 | push (Node 20), PR (Node 18/20/22)                             |
| 2    | Specification (EARS/BDD)       | `tests/bdd`                      | 54 features · 402 rules · 490 scenarios | jest.unit + jest-cucumber | push (`npm test`), PR (`bdd-tests`), plus `spec:audit`         |
| 3    | Type tests                     | `tests/typetests`                | 7                                       | tsd                       | PR (full suite)                                                |
| 4    | Property fuzz                  | `tests/fuzz`                     | 12                                      | jest.fuzz + fast-check    | PR, nightly properties                                         |
| 5    | Contract                       | `tests/contract`                 | 6 (2 live + 4 replay) + snapshot        | jest.contract(.replay)    | PR (`contract-replay`), soft-skip on ESI 503                   |
| 6    | Fault catalogue                | `tests/faults`                   | 3                                       | jest.faults               | PR (`fault-catalogue`), nightly                                |
| 7    | Integration, mocked full stack | `tests/integration`              | 6                                       | jest.integration          | PR (full suite)                                                |
| 8    | Integration, live              | same, `ESI_LIVE_TESTS`           | ~50                                     | jest.integration.live     | manual                                                         |
| 9    | Integration, gated auth        | same, `ESI_GATED_TESTS` + `.env` | 30+                                     | jest.integration.live     | manual                                                         |
| 10   | Benchmark and heap soak        | `tests/benchmark`                | 18 tasks + soak                         | mitata + soak driver      | PR (A/B on hot paths), nightly                                 |
| 11   | Mutation                       | `src/**`                         | —                                       | Stryker                   | PR (changed files), nightly sharded unit + BDD + type mutation |
| 12   | API fuzz                       | Prism mock + Schemathesis        | —                                       | Docker                    | nightly                                                        |

Other nightlies: interleave, no-retry, recorded payloads, consumer matrix, examples against live ESI, and a post-publish canary.

| Coverage metric | Floor | Last measured (v9.8.0) |     | Mutation | Floor                                                                           |
| --------------- | ----- | ---------------------- | --- | -------- | ------------------------------------------------------------------------------- |
| Statements      | 90%   | 98.17%                 |     | Unit     | Per directory, `config/mutation/unit-thresholds.json`, ratcheted                |
| Branches        | 80%   | 95.14%                 |     | BDD      | Per directory, `config/mutation/bdd-thresholds.json`, ratcheted                 |
| Functions       | 75%   | 96.09%                 |     | PR       | Changed files, gated by the same thresholds                                     |
| Lines           | 90%   | 98.37%                 |     |          | The global `break` is off (`config/mutation/stryker.config.mjs`, `break: null`) |

#### TEST-01 · Event-driven · Practised

When observable client behaviour changes, the change **shall** be preceded by an EARS requirement in a `Rule:` block and a scenario that fails before the implementation exists.

- **Why:** The most common defect in the suite has been scenarios that cannot fail. Red before green is the only defence. The form of the requirement is machine-checked; that the scenario failed first is a step in a workflow, and no check can establish it after the fact, so the status is Practised (moved from Enforced on 2026-09-27 for that reason, not because the code regressed).
- **Verified by:** The `ears-gherkin-dev` workflow for the RED step. The form is enforced: `npm run spec:audit` on PR; the ratchet file `scripts/spec/spec-audit-exceptions.json` has an empty `unconverted` list and a `legacyStepFiles` list, and both may only shrink.

#### TEST-02 · Ubiquitous · Enforced

Each `Rule:` block **shall** state exactly one requirement with one _shall_, name the system, use one of the five EARS patterns, and contain no vague language.

- **Why:** A requirement you cannot falsify is not a requirement.
- **Verified by:** `scripts/spec/spec-audit.ts`: eleven finding types, inline GitHub annotations, PR gate.

#### TEST-03 · Ubiquitous · Enforced

Scenario steps **shall** mock at the transport seam with `jest-fetch-mock` rather than spying on the client method under test.

- **Why:** Spying on the method makes the pipeline invisible to the test. Reference implementations: `etag-caching.steps.ts`, `resilience.steps.ts`.
- **Verified by:** `npm run lint:bdd-seam` (`config/eslint/bdd-seam.config.mjs`) on every push (`ci-fast.yml`) and PR (`ci.yml`).

#### TEST-04 · Ubiquitous · Enforced

Unit coverage **shall** stay at or above 90% statements, 80% branches, 75% functions and 90% lines, measured on `src/**` excluding generated files.

- **Why:** Floors far below the current numbers stop a bad week becoming a broken gate, while still catching an untested module.
- **Verified by:** `config/jest/unit.config.cjs` thresholds; coverage job posts a PR comment.

#### TEST-05 · Ubiquitous · Enforced

Every endpoint definition **shall** be validated against the live ESI OpenAPI document for path, method, cache TTL and scopes, with a committed snapshot as fallback.

- **Why:** This is the only test that can tell the project CCP moved something.
- **Verified by:** `tests/contract/`; `npm run contract:diff` (oasdiff, breaking changes only).

#### TEST-06 · Ubiquitous · Enforced

The consumer-facing type surface **shall** be asserted by tsd tests covering endpoint argument inference, branded IDs, error guards and the result envelope.

- **Why:** Half the value of the library is at the type level. A refactor can break inference without failing a runtime test.
- **Verified by:** `npm run test:types`.

#### TEST-07 · Ubiquitous · Enforced

Mutation testing **shall** hold each directory at or above its floor in `config/mutation/unit-thresholds.json` (unit) and `config/mutation/bdd-thresholds.json` (BDD), with a PR touching mutated source running Stryker on the changed files.

- **Why:** Nightly-only mutation means a weak test lands before anyone sees the score. Per-directory floors replace the single score of 65, which let a strong directory hide a weak one. Incremental Stryker on changed files keeps the PR cost bounded.
- **11.0.0 floors (decided 2026-09-27).** The ratchets only rise, and the release gate names where they must stand: every directory in `config/mutation/unit-thresholds.json` at 60 or above, every directory in `config/mutation/bdd-thresholds.json` at 20 or above, and every SDE directory at 90 or with each survivor carrying an equivalence reason (Track S Run M). `src/schemas` is measured by the unit tier and `schema:drift` only: scenarios send valid ESI-shaped bodies through the transport seam, so a mutant that relaxes a field is invisible to them by design, and its BDD entry stays at 0 rather than pretending otherwise.
- **Verified by:** `mutation-pr` job ("Mutation (changed files)") in `mutation-pr.yml`, advisory on every pull request since 2026-09-27 and back inside `ci-success` at the release gate; nightly ratchets in `nightly-mutation.yml`. Open: flip-flopping mutants ([#382](https://github.com/lgriffin/ESI.ts/issues/382)) and stale incremental results ([#380](https://github.com/lgriffin/ESI.ts/issues/380)).

#### TEST-08 · Optional · Enforced

Where a test needs live ESI or a real token, the test **shall** be gated behind `ESI_LIVE_TESTS` or `ESI_GATED_TESTS` and soft-skip when ESI returns 503.

- **Why:** Tranquility downtime must not fail a PR that changed nothing about networking.
- **Verified by:** `config/jest/integration.live.config.cjs` and `config/jest/contract.live.config.cjs` refuse to run without `ESI_LIVE_TESTS`; `tests/integration/gated-auth.test.ts` reads `ESI_GATED_TESTS`; the 503 soft-skip sits in the CI jobs that run those tiers.

#### TEST-09 · Ubiquitous · Partial

Test source under `tests/` **shall** be linted with the same ESLint configuration as `src/`, with test-specific relaxations declared explicitly.

- **Why:** Floating promises in a step file produce a scenario that passes without asserting. Targeted rules now cover the worst failure modes, but the main configuration still skips `tests/`.
- **Verified by:** `lint:suite-health` over `tests/` (no `.only`/`.skip`/`.todo`, no assertion-free tests or Then steps, no swallowed assertions) and `lint:bdd-seam` over `tests/bdd`, both on push and PR. To add: extend `npm run lint` (still `eslint src`) to `tests/`, including `no-floating-promises` ([#271](https://github.com/lgriffin/ESI.ts/issues/271)).

#### TEST-10 · Ubiquitous · Gap

Every public method of a domain client and of `IStaticDataProvider` **shall** be named by at least one `Rule:` block or bound step, with the list of methods without one only ever shrinking.

- **Why:** The audit proves every Rule has a scenario, but nothing proves every behaviour has a Rule. Two hundred and thirty-five wired endpoints and ninety-nine provider methods can each lose their specification without a check noticing. A shrink-only baseline turns "specified" into a number that cannot go down.
- **Verified by:** To add. Track S Run 4 writes `scripts/sde/sde-spec-coverage.ts` for the provider (moves this row to Partial); ROADMAP Phase 5 item 8 extends it to `src/clients/**` with `scripts/spec/client-spec-coverage-baseline.json` (moves it to Enforced), both in `check:all` and `ci.yml`'s `spec-audit` job.

#### TEST-11 · Optional · Partial

Where the client deliberately does not act on an ESI behaviour (a status, a header, a field, an endpoint feature), the exclusion **shall** be stated as an unwanted-behaviour Rule (`If <condition>, then the <system> shall not <response>.`) with a scenario that proves the absence.

- **Why:** The specification governs what the client does; what it ignores is a decision too, and an unstated exclusion reads as an omission the next contributor "fixes". One such Rule exists today (the circuit breaker not counting 4xx other than 420 and 429, `0051-resilience.feature`); the other exclusions live in prose (`SECURITY.md`, `SDE.md`, `ARCHITECTURE.md`) where nothing executes them.
- **Verified by:** The form: `npm run spec:audit` accepts the unwanted pattern with a negated response. The register: `npm run ears` lists every `shall not` Rule with its verdict and scenarios in the "Exclusion register" section of `reports/ears/ears-report.md` and the job summary (`scripts/quality/ears-core.ts`, `isExclusion`; `tests/tdd/spec-audit/ears-report.test.ts`); TESTING.md documents it and `tests/bdd/GUIDE.md` shows how to write one. The completeness is a review question (AGENTS.md checklist), not a check: no script can know what the client should ignore, so the row stays Partial until each phase has written its area's exclusions as Rules.

---

## Part 5 · Quality gates

What runs where. ● blocks; ◐ runs but does not block; · does not run.

| Check                                                           | Commit | Push |             PR              |        Nightly         |  Release  |
| --------------------------------------------------------------- | :----: | :--: | :-------------------------: | :--------------------: | :-------: |
| lint-staged: ESLint fix + Prettier                              |   ●    |  ·   |              ·              |           ·            |     ·     |
| commitlint (conventional commits)                               |   ●    |  ·   |              ·              |           ·            |     ·     |
| ESLint, Prettier check, build, typecheck, examples typecheck    |   ·    |  ●   |              ●              |           ·            |     ●     |
| lint:layers, lint:bdd-seam, lint:suite-health                   |   ·    |  ●   |              ●              |           ·            |     ·     |
| lint:determinism                                                |   ·    |  ·   |              ●              |           ·            |     ·     |
| Unit tests + BDD (`npm test`)                                   |   ·    | ● 20 |         ● 18/20/22          |           ·            |     ●     |
| Coverage thresholds + PR comment                                |   ·    |  ·   |              ●              |           ·            |     ·     |
| EARS spec audit, BDD report                                     |   ·    |  ·   |              ●              |           ·            |     ●     |
| Generated types and operations fresh, schema drift, auth scopes |   ·    |  ·   | ● if inputs touched, else ◐ |     ◐ files issue      |     ●     |
| Endpoint definitions against the spec (`validate:esi`)          |   ·    |  ·   | ● if inputs touched, else ◐ |           ·            |     ●     |
| Redocly lint of the ESI spec (`validate:spec`)                  |   ·    |  ·   | ● if inputs touched, else ◐ |           ·            |     ·     |
| Version consistency (`validate:versions`)                       |   ·    |  ·   |              ·              |           ·            |     ●     |
| Live contract tests                                             |   ·    |  ·   |          ● (503 ◐)          |        ◐ weekly        | ● (503 ◐) |
| Contract replay, fault catalogue, fuzz, integration, type tests |   ·    |  ·   |              ●              |           ◐            |     ●     |
| API surface diff (api-extractor) and api-semver                 |   ·    |  ·   |              ●              |           ·            |     ·     |
| Export coverage, package lint (publint, attw), size-limit       |   ·    |  ·   |              ●              |           ·            |     ·     |
| Consumer contract (Node 18/20/22/24), doc examples              |   ·    |  ·   |              ●              |   ◐ consumer matrix    |     ·     |
| TypeDoc build                                                   |   ·    |  ·   |              ●              |           ·            |     ·     |
| Benchmarks A/B                                                  |   ·    |  ·   |              ●              |           ◐            |     ·     |
| Dependency audit (diff-aware / allowlist)                       |   ·    |  ·   |      ● new advisories       |     ◐ files issue      | ● ≥ high  |
| knip dead-code                                                  |   ·    |  ·   |              ◐              |           ·            |     ◐     |
| CodeQL                                                          |   ·    |  ●   |              ●              |        ● weekly        |     ·     |
| zizmor (workflow security), workflow lint                       |   ·    |  ·   |              ●              |           ·            |     ·     |
| Stryker mutation                                                |   ·    |  ·   |       ● changed files       | ◐ ratchet, files issue |     ·     |
| Schemathesis API fuzz                                           |   ·    |  ·   |              ·              |     ◐ files issue      |     ·     |
| Spec drift, faults, properties, examples, recorded payloads     |   ·    |  ·   |              ·              |     ◐ files issue      |     ·     |
| OpenSSF Scorecard                                               |   ·    |  ·   |              ·              |        ◐ weekly        |     ·     |

#### GATE-01 · Ubiquitous · Enforced

A pull request to `master` **shall** merge only when the aggregate `ci-success` job reports every blocking job green.

- **Why:** One required check that fans in every PR job keeps branch protection simple and complete.
- **Verified by:** `ci.yml` `ci-success` with `if: always()`, needing 23 jobs, plus a self-check that fails if a job is missing from its `needs`; branch protection requires it alongside Lint, Build & Test. The pull-request mutation job is in `mutation-pr.yml`, outside the gate until the release gate row in ROADMAP.md moves it back (decided 2026-09-27).

#### GATE-02 · Ubiquitous · Enforced

Every push on every branch **shall** run lint, format check, build, typecheck and the unit and BDD tests on Node 20.

- **Why:** Fast feedback before a PR exists.
- **Verified by:** `ci-fast.yml` ("Lint, Build & Test"): lint, `lint:layers`, `lint:bdd-seam`, `lint:suite-health`, format, build, typecheck, `typecheck:examples` and `npm test`, whose Jest config includes the BDD specs.

#### GATE-03 · Ubiquitous · Enforced

A change to the public API surface **shall** be visible as a diff to `etc/esi.ts.api.md` in the same pull request.

- **Why:** This is the breaking-change tripwire. Reviewers see the exported shape change, not just the implementation.
- **Verified by:** the `api-surface` job ("API Surface Check") in `ci.yml`, a CRLF-normalised diff against HEAD.

#### GATE-04 · Ubiquitous · Gap

knip **shall** block the release gate on unused exports and dependencies, with an explicit ignore list for intentional public re-exports.

- **Why:** Non-blocking everywhere means the report is never read. Blocking only at release keeps PR friction low.
- **Verified by:** To add: drop `--no-exit-code` in `release.yml` once the baseline is clean.

#### GATE-05 · Ubiquitous · Partial

Every nightly job that finds a problem **shall** file or update a labelled GitHub issue rather than only failing the run.

- **Why:** A red nightly nobody reads is the same as no nightly. Revision 1 marked this Enforced while two nightlies still filed nothing; revision 2 corrected it, and [#277](https://github.com/lgriffin/ESI.ts/issues/277) (bead `esi-mbr`) closed those two.
- **Verified by:** Audit, spec drift, faults, properties, benchmarks, examples, mutation, Schemathesis and the post-publish canary file issues. `nightly-mutation.yml` and `nightly-schemathesis.yml` each end in a `report` job that opens or comments on one fixed-title issue (labels `mutation` and `api-fuzz`) and closes it on the next green run. Recorded-payload drift opens a pull request instead, and only a failed run files an issue. Still failing the run only: `nightly-no-retry.yml`, `nightly-interleave.yml` and `consumer-matrix-nightly.yml`, which is why this stays Partial.

#### GATE-06 · Ubiquitous · Enforced

`package.json` **shall** hold every npm script a document references, each resolving to an existing file.

- **Why:** A script that points at a missing file (`sde:seed`, fixed in [#274](https://github.com/lgriffin/ESI.ts/issues/274)) fails only when someone runs it, and a document that tells the reader to run a script that does not exist fails only the reader.
- **Verified by:** `tests/tdd/scripts/package-scripts.test.ts`, in `npm test`: every script target exists, and every `npm run <name>` in `README.md`, `CLAUDE.md`, `AGENTS.md`, `guides/` (ROADMAP.md aside, which names scripts later items add) and the BDD README and GUIDE is a defined script.

---

## Part 6 · Security

Runtime defences live in the pipeline and are proven by `tests/tdd/core/security.test.ts`. Supply-chain defences live in the workflows and are scored weekly. The two are one posture and should be one guide.

### Defence chain on every request

1. **HTTPS enforced, host allowlisted.** `http://` rejected at construction, always. Only `esi.evetech.net` unless `unsafeAllowCustomHost: true` is named explicitly; the flag lifts the host check only.
2. **Path parameters validated.** Rejects `/`, `\`, `?`, `#`, `@` and the other URL delimiters, empty values and non-finite numbers, so `../x` is refused. Everything else, including `%` and null bytes, is percent-encoded by `encodeURIComponent`, not rejected. A bare `..` currently passes and is collapsed by URL parsing (Part 10, row 29).
3. **Query parameters bounded.** Length limits; NaN, Infinity and null rejected.
4. **Token gated by declared scope.** Bearer header attached only when the definition says `requiresAuth`; missing token fails before the network.
5. **Cache isolated per token.** Authenticated cache keys prefix a truncated SHA-256 of the auth header, so two characters never share a cached body.
6. **URLs sanitised in errors and logs.** Eleven sensitive query names redacted; unparsable URLs truncated.

#### SEC-01 · Unwanted · Enforced

If a consumer supplies a base URL that is not HTTPS, or whose host is not on the allowlist while `unsafeAllowCustomHost` is unset, then the client **shall** refuse construction.

- **Why:** Server-side request forgery through a configurable base URL is the classic SDK hole. `unsafeAllowCustomHost` exists for proxies and mocks, and lifts only the host check; there is no way to turn HTTPS off.
- **Verified by:** `security.test.ts` host allowlist and HTTPS groups; `src/core/util/validation.ts`.

#### SEC-02 · Ubiquitous · Enforced

The library **shall** never write an access token to a log line, an error message or a cache key in clear text.

- **Why:** Tokens end up in bug reports. Redaction and hashing make the report safe to paste.
- **Verified by:** `security.test.ts` token leakage group; `cacheKey.ts`; for log lines, `sanitizeUrl` at the logger boundary (`src/core/logger/redactLog.ts`), covered by `redactLog.test.ts`, `clientLog.test.ts` and `tests/bdd/features/core/0058-logging.feature`.

#### SEC-03 · Ubiquitous · Enforced

Every GitHub Action **shall** be pinned to a full commit SHA with a version comment, inside a workflow that declares top-level read-only permissions with per-job escalation.

- **Why:** Tag pinning is mutable. Scorecard scores both dimensions and zizmor enforces them.
- **Verified by:** the zizmor job in `ci.yml` (config `.zizmor.yml`); `npm run lint:workflows` (`scripts/quality/workflow-lint.ts`); `tests/tdd/workflows/workflow-permissions.test.ts`, which fails a workflow without read-only top-level permissions and any job-level write scope not on its list; weekly Scorecard; Dependabot keeps the SHAs current.

#### SEC-04 · Ubiquitous · Enforced

Published packages **shall** carry npm provenance, with release assets carrying keyless cosign signatures and SHA-256 checksums minted in an isolated job.

- **Why:** A consumer can verify that the tarball came from this repository's workflow, not from a laptop.
- **Verified by:** `release.yml`: `npm publish --provenance`, `sign-and-publish-assets` job, which also attests SLSA build provenance for the tarball, SBOM and docs archive (`actions/attest-build-provenance`), checks it with `gh attestation verify` and attaches it as a `.intoto.jsonl` asset; `tests/tdd/workflows/workflow-permissions.test.ts` fails if the job stops signing, attesting or uploading any of them.

#### SEC-05 · Unwanted · Enforced

If a dependency advisory is accepted rather than fixed, then the acceptance **shall** carry a reason and an expiry date, after which the release fails.

- **Why:** Allowlists rot. An expiry forces the conversation again.
- **Verified by:** `scripts/quality/audit-check.ts` with `scripts/quality/audit-exceptions.json`.

#### SEC-06 · Ubiquitous · Enforced

Each release **shall** publish a CycloneDX or SPDX SBOM as a signed release asset.

- **Why:** Provenance says who built it. An SBOM says what is inside. Scorecard and downstream policy tooling look for both.
- **Verified by:** `release.yml` `create-assets` runs `npm run release:sbom`, which fails the release unless the CycloneDX SBOM names the package at the tagged version and lists every runtime dependency, and adds it to `checksums.txt`; `sign-and-publish-assets` signs it. `tests/tdd/release-sbom/` runs the generator against the repository.

#### SEC-07 · Ubiquitous · Partial

The repository **shall** carry a `CODEOWNERS` file and branch protection on `master` that applies to administrators.

- **Why:** Both are Scorecard code-review inputs. A solo maintainer can still enforce "admins included" and own every path.
- **Verified by:** `.github/CODEOWNERS` exists and assigns every path to `@lgriffin`. Admin enforcement lives in GitHub settings and cannot be seen from the repository; the steps the maintainer takes, and the API call that verifies them, are in `guides/SECURITY.md` §5 ([#270](https://github.com/lgriffin/ESI.ts/issues/270)). The row moves to Enforced when that call shows administrators included.

#### SEC-08 · Ubiquitous · Enforced

Local credentials **shall** be minted by the PKCE script into a git-ignored `.env`, never appearing in a committed file, fixture or example.

- **Why:** The example file is the only one that belongs in git.
- **Verified by:** `.gitignore`; `scripts/auth/create-token.ts`; consider a secret-scanning pre-commit hook.

---

## Part 7 · Documentation

The repository has excellent individual documents and, until this charter, no documentation system: three publication surfaces, four copies of the testing story, five copies of the Beads quick reference, and a TypeDoc configuration that used to delete hand-written files.

> **Resolved in revision 1:** TypeDoc now writes to `docs-site/public/api/` (git-ignored). `npm run clean` and `npm run docs` no longer touch `docs/`.
>
> **State at revision 2:** fourteen guides exist in `guides/`, plus `AUDIT.md` from Phase 0. The five original `docs/` files are gone, but `docs/` itself now holds `knowledge-graph/`, `spikes/generator/` and `esi-evolution/`. Root `TESTING.md` and `guides/MUTATION-TESTING.md` are still separate. The docs-site is still unbuilt and still says v9.6.1, and the README banner still says v9.5.2. The full README, docs and examples rewrite is scheduled last in the 11.0 plan, so it documents the finished API.

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
docs-site/                      VitePress; guide/ populated by scripts/docs/sync-docs.ts from guides/; public/api = TypeDoc
docs/                           hand-written guides retired (okf-guide → guides/OKF.md, nightly-spec-drift → QUALITY-GATES); now holds only spikes and generated artefacts
TESTING.md (root)               deleted after merge
etc/doc-metrics.json            NEW: generated counts: clients, endpoints, rules, scenarios, coverage
```

### Guide roadmap

| Target guide                                            | Action | Status (rev 2)                                                                            | Sources to fold in                                                                                               | Charter parts | Tracking                                                          |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| CHARTER.md                                              | new    | Done                                                                                      | This document                                                                                                    | all           | —                                                                 |
| ARCHITECTURE.md                                         | merge  | Done                                                                                      | README caching, rate limiting, streaming, error handling sections; docs-site interceptors, circuit-breaker pages | 2             | `esi-07y` · [#286](https://github.com/lgriffin/ESI.ts/issues/286) |
| DESIGN-RULES.md                                         | new    | Done                                                                                      | CLAUDE.md key patterns; `generate:endpoints` scaffold usage; naming table above                                  | 3             | `esi-lvi` · [#279](https://github.com/lgriffin/ESI.ts/issues/279) |
| TESTING.md                                              | merge  | Root copy folded in and deleted 2026-09-27; MUTATION-TESTING kept as the linked deep-dive | Root TESTING.md, MUTATION-TESTING.md, README testing section, ARCHITECTURE §8                                    | 4             | `esi-b4a` · [#273](https://github.com/lgriffin/ESI.ts/issues/273) |
| SPECIFICATION.md                                        | move   | Open                                                                                      | tests/bdd/GUIDE.md + README.md; ears-gherkin-dev skill steps                                                     | 4             | —                                                                 |
| QUALITY-GATES.md                                        | new    | Done                                                                                      | .github/workflows/README.md, docs/nightly-spec-drift.md, scripts table                                           | 5             | `esi-30o` · [#280](https://github.com/lgriffin/ESI.ts/issues/280) |
| SECURITY.md (guide)                                     | merge  | Done; CODEOWNERS text stale                                                               | Remove policy duplication; add SBOM and CODEOWNERS plan                                                          | 6             | `esi-p0s` · [#285](https://github.com/lgriffin/ESI.ts/issues/285) |
| ERRORS.md                                               | new    | Done                                                                                      | docs-site reference/errors.md; `src/core/util/error.ts`                                                          | 2             | `esi-rt2` · [#281](https://github.com/lgriffin/ESI.ts/issues/281) |
| LOGGING.md                                              | new    | Done                                                                                      | Write from the per-client logging refactor                                                                       | 2, 3          | `esi-5zs` · [#282](https://github.com/lgriffin/ESI.ts/issues/282) |
| PAGINATION.md                                           | new    | Done                                                                                      | README streaming and cursor sections; docs-site pagination.md; 9.7.0 changelog for `fetchAll*`                   | 2             | `esi-358` · [#283](https://github.com/lgriffin/ESI.ts/issues/283) |
| RUNTIME-VALIDATION.md                                   | keep   | Kept; no `Implements:` line yet                                                           | Delete README and docs-site copies, link instead                                                                 | 3             | —                                                                 |
| SDE.md + guides/sde/                                    | move   | Open: `src/sde/docs/` still in place                                                      | src/sde/README.md, src/sde/docs/\*, docs-site guide/sde.md                                                       | 2             | —                                                                 |
| OKF.md                                                  | move   | Done                                                                                      | docs/okf-guide.md; link from README and DESIGN-RULES                                                             | 3             | —                                                                 |
| RELEASE.md                                              | new    | Done                                                                                      | release-please config, CHANGELOG conventions, release.yml jobs, SECURITY.md support table                        | 8             | `esi-38g` · [#284](https://github.com/lgriffin/ESI.ts/issues/284) |
| DOCUMENTATION.md                                        | merge  | Open: still TypeDoc-centred                                                               | Rewrite around the target tree; document the site build and metrics                                              | 7             | —                                                                 |
| BEADS.md                                                | keep   | Open: AGENTS.md still has three Beads blocks                                              | Collapse AGENTS.md's three blocks and CLAUDE.md's copy to pointers                                               | 9             | [#276](https://github.com/lgriffin/ESI.ts/issues/276)             |
| Root TESTING.md, docs/examples.md, docs-site duplicates | retire | Root TESTING.md retired 2026-09-27; the rest open                                         | Examples catalogue becomes docs-site/examples generated from `examples/*.ts` headers                             | 7             | [#264](https://github.com/lgriffin/ESI.ts/issues/264)             |

#### DOC-01 · Ubiquitous · Gap

Each documentation topic **shall** have exactly one canonical file under `guides/`, with every other mention linking to it rather than restating it.

- **Why:** Four copies of the testing story drifted to two different tier numberings within a month.
- **Verified by:** To add: a link-check script; the roadmap table above is the migration plan.

#### DOC-02 · Ubiquitous · Enforced

Generated API reference output **shall** be written to a git-ignored directory outside `docs/`, with no npm script deleting a directory containing committed markdown.

- **Why:** The previous configuration wiped five committed files on every `npm run docs`.
- **Verified by:** `typedoc.json` `out: docs-site/public/api`; `clean` and `clean:docs` scripts updated; `.gitignore` entry.

#### DOC-03 · Ubiquitous · Gap

The published documentation site **shall** be built from `guides/` by a script in the repository and deployed by the release workflow alongside the API reference.

- **Why:** A site nobody can reach is a maintenance cost with no reader. A site built from the canonical files cannot drift.
- **Verified by:** To add: `scripts/docs/sync-docs.ts`, `docs-site` build in `release.yml`, gh-pages with `/api/` for TypeDoc.

#### DOC-04 · Ubiquitous · Gap

Counts quoted in documentation (clients, endpoints, requirements, scenarios, test files, coverage) **shall** be generated into `etc/doc-metrics.json` and inserted by a script, never typed by hand.

- **Why:** At the time of the survey the docs carried 33, 35, 36, 37 and 39 as the number of clients. Only one is right.
- **Verified by:** To add: `scripts/docs/doc-metrics.ts`; `validate:versions` extended to fail on a stale version banner or count.

#### DOC-05 · Ubiquitous · Partial

Every guide **shall** open with the charter requirement identifiers it implements and be reachable from the README within one link.

- **Why:** Traceability both ways: from a rule to how it is met, and from a reader's landing page to the depth. Ten of seventeen guides carry an `Implements:` line (TESTING, BEADS, DOCUMENTATION, RUNTIME-VALIDATION, AUDIT, MUTATION-TESTING and CHARTER do not), and every guide except `AUDIT.md` is linked from the README.
- **Verified by:** To add: link-check script asserting each `guides/*.md` is linked from README and carries an `Implements:` line.

#### DOC-06 · Event-driven · Gap

When a public export is added, the pull request **shall** include its JSDoc, its guide section and, where user-facing, an example under `examples/`.

- **Why:** `fetchAll*` (73 methods), `InMemoryFetch` and `createNoopLogger` exist only in the changelog.
- **Verified by:** To add: a PR template checklist (the repository has none). Today the API surface diff makes the addition visible to the reviewer, and `test:export-coverage --ci` fails a PR that adds an export no test references.

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
- **Verified by:** `release.yml` `validate-release` job, which also runs `validate:versions`, `spec:generate:check`, `validate:auth-scopes`, `validate:esi`, `spec:audit`, `validate:spec-consistency`, `contract:replay`, the fault catalogue and the live contract tests.

#### REL-03 · Ubiquitous · Enforced

The version string **shall** be identical in `package.json`, `src/core/constants.ts` and the docs-site version selector.

- **Why:** The site selector had lagged the package by a major (v9.6.1 against 10.2.3) because nothing checked it and release-please did not bump it. The README carries a live npm badge, not a banner.
- **Verified by:** `scripts/package/validate-versions.ts` (`npm run validate:versions`) in `ci.yml` `static-analysis` and `release.yml` `validate-release`; release-please bumps all three through `extra-files` and the `x-release-please-version` marker.

#### REL-04 · Unwanted · Gap

If a version is bumped but not published, then the changelog **shall** record it as unreleased rather than skipping the number.

- **Why:** The changelog jumps from 9.1.0 to 9.7.0. Consumers reading it cannot tell whether 9.2 to 9.6 exist.
- **Verified by:** Release guide procedure; backfill the missing entries once.

#### REL-05 · Ubiquitous · Gap

From 11.0.0 the package **shall** support Node 22 or newer, tested on every supported Node line before merge.

- **Why:** Node 18 and 20 have reached end of life (20 in April 2026). Raising the floor is a major version and needs a `feat!:` commit with a `BREAKING CHANGE:` footer, not a silent engines bump; decided for 11.0.0 on 2026-09-26.
- **Verified by:** Today `engines` says `>=18.0.0`, unit tests run on 18/20/22 and the consumer contract on 18/20/22/24 (`ci.yml`). Moves to Enforced when the 11.0.0 engines bump and the matching CI matrix land.

#### REL-06 · Unwanted · Partial

If a change can make code that works against the previous release fail to compile, throw, or return a different result, then the commit introducing that change **shall** be marked breaking (`type!:` and a `BREAKING CHANGE:` footer with the migration), with anything the change removes deprecated in an earlier minor release unless ESI has already removed it.

- **Why:** `^9.x` in a consumer's manifest installs every minor and patch automatically. A break released as a minor breaks those installs silently.
- **Verified by:** `guides/SEMVER.md` classification and the Reviewer Checklist; the `api-semver` job in `ci.yml` (`npm run api-report:semver`) for the root entry point's type surface. Runtime behaviour, schema tightening, sub-path exports and required members on implemented interfaces are review-only.

---

## Part 9 · Process

Agents are contributors here and are bound by the same rules as people, with less authority by default.

#### PROC-01 · Ubiquitous · Practised

All task tracking **shall** live in the Beads tracker (`bd`), with `.beads/issues.jsonl` treated as a passive export and never as the source of truth.

- **Why:** One tracker, shared by people and agents. Markdown TODO lists are forbidden by AGENTS.md.
- **Verified by:** Repository instruction files.

#### PROC-02 · State-driven · Practised

While an agent operates under the default conservative profile, the agent **shall not** commit, push or sync the tracker without an explicit instruction.

- **Why:** Autonomy is earned per session. The handoff reports changed files and proposed commands instead.
- **Verified by:** AGENTS.md and CLAUDE.md managed blocks.

#### PROC-03 · Ubiquitous · Enforced

`master` **shall** accept changes only through a pull request that is up to date with the base and passes the `ci-success` and Lint, Build & Test checks.

- **Why:** Recorded in bead `esi-8we`. Force-push is disabled.
- **Verified by:** GitHub `branch protection` on `master`, a repository setting.

#### PROC-04 · Ubiquitous · Partial

A branch **shall** carry one concern, named by its conventional-commit type and scope.

- **Why:** Reviewers cannot review two things at once.
- **Verified by:** Code review. There is no PR template yet (see DOC-06).

#### PROC-05 · Ubiquitous · Partial

Agent instruction files (`AGENTS.md`, `CLAUDE.md`) **shall** contain pointers to guides, not copies of them.

- **Why:** The Beads quick reference still appears three times in `AGENTS.md` and once in `CLAUDE.md`. Pointers cannot drift. The persona files are gone from the repository root.
- **Verified by:** Roadmap item for BEADS.md; a line-count ceiling on the managed blocks.

#### PROC-06 · Ubiquitous · Enforced

Every requirement block in this charter **shall** satisfy the rules `spec:audit` applies to a `Rule:` block (one _shall_, a named system, one of the five patterns, no vague language) and, when its status is Enforced, name the script or job that proves it.

- **Why:** The charter claims to be auditable the way the specification is. Before the audit it was EARS by convention only: a row could say Enforced with a "Verified by" that named nothing, and nobody was told.
- **Verified by:** `npm run charter:audit` (`scripts/quality/charter-audit.ts`; the checks in `scripts/quality/charter-audit-core.ts`, tested by `tests/tdd/scripts/charter-audit.test.ts`) parses every `####` block with the spec-audit rules and fails an Enforced row that names no script, job or file that exists. Runs in `check:all`, `scripts/quality/verify-local-core.ts` and `ci.yml`'s `spec-audit` job.

---

## Part 10 · Gap register

Everything found during the survey, and since, that contradicts a requirement above. Rows marked **Done** stay for traceability until the next revision. Each row is tracked as a bead under epic `esi-l38` and mirrored as a GitHub issue under [#287](https://github.com/lgriffin/ESI.ts/issues/287). The guide roadmap in Part 7 is tracked the same way. Severity is about consumer impact, not effort.

| #   | Sev  | Finding                                                                                                                         | Requirement               | Fix                                                                                                                                                                               | Bead         | Issue                                                                                                        |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| 1   | HIGH | Branch failed `tsc --noEmit` from the logging refactor (two import paths, one stale call)                                       | ARCH-09, GATE-02          | **Done in revision 1**: paths fixed, `parseJsonBody` receives the client, pagination logging migrated, `logFatal`/`logTrace` exported, `toPinoLogger` keeps pino's `this` binding | `esi-d3o`    | [#262](https://github.com/lgriffin/ESI.ts/issues/262)                                                        |
| 2   | HIGH | `npm run docs` / `clean` deleted five committed files in `docs/`                                                                | DOC-02                    | **Done**: TypeDoc moved in revision 1; the five markdown files moved, folded or retired                                                                                           | `esi-a2k`    | [#263](https://github.com/lgriffin/ESI.ts/issues/263)                                                        |
| 3   | HIGH | docs-site never built or deployed; duplicates README at two-version lag                                                         | DOC-03                    | Sync script + release deploy; scheduled with the 11.0 docs rewrite                                                                                                                | `esi-06b`    | [#264](https://github.com/lgriffin/ESI.ts/issues/264)                                                        |
| 4   | MED  | `logFatal`/`logTrace` were not exported; global-logger fallback needs a lint gate                                               | ARCH-09                   | **Done**: exports in revision 1; `no-restricted-imports` gate in `npm run lint` and `lint:layers`                                                                                 | `esi-772`    | [#265](https://github.com/lgriffin/ESI.ts/issues/265)                                                        |
| 5   | MED  | `isCircuitOpen` missing from `./errors`; plumbing errors are string-typed                                                       | ARCH-07                   | Export guard; introduce `EsiConfigurationError` family                                                                                                                            | `esi-gyh`    | [#266](https://github.com/lgriffin/ESI.ts/issues/266)                                                        |
| 6   | MED  | `CustomEsiClient` missing four getters                                                                                          | ARCH-08                   | **Done**: getters added, compile-time check in `customClientGetters.test.ts`; `EsiApiFactory` reaches all 39 through `createClient(type)`, with named methods for 9               | `esi-eqq`    | [#267](https://github.com/lgriffin/ESI.ts/issues/267)                                                        |
| 7   | MED  | No `sideEffects: false`; two pino instances built at import                                                                     | ARCH-06                   | **Done**: default logger built on first use; `"sideEffects": false`; `importSideEffects.test.ts` spies on pino and bundles `import { EsiError }`                                  | `esi-piw`    | [#268](https://github.com/lgriffin/ESI.ts/issues/268)                                                        |
| 8   | MED  | `handleSinglePageRequest` hardcodes GET; cursor `fetchAll` swallows failures                                                    | DES-08                    | **Done**: rules in `0051-resilience.feature`; the stream helpers pass the real method and the cursor `fetchAll` rejects                                                           | `esi-dwi`    | [#269](https://github.com/lgriffin/ESI.ts/issues/269)                                                        |
| 9   | MED  | No SBOM; no CODEOWNERS; admins exempt from protection                                                                           | SEC-06, SEC-07            | SBOM **done** (SEC-06); CODEOWNERS **done**; admins-included is a maintainer setting, steps in SECURITY.md §5                                                                     | `esi-wze`    | [#270](https://github.com/lgriffin/ESI.ts/issues/270)                                                        |
| 10  | MED  | Tests not linted; knip non-blocking; mutation never gates                                                                       | TEST-09, GATE-04, TEST-07 | Incremental Stryker on PR **done** (TEST-07); suite-health and seam lint added; extend `npm run lint`; block knip at release                                                      | `esi-p56`    | [#271](https://github.com/lgriffin/ESI.ts/issues/271)                                                        |
| 11  | MED  | Client count quoted as 33, 35, 36, 37 and 39; BDD counted as 41 features; README banner 9.5.2                                   | DOC-04, REL-03            | Generated metrics; extend version check                                                                                                                                           | `esi-j03`    | [#272](https://github.com/lgriffin/ESI.ts/issues/272)                                                        |
| 12  | MED  | Two testing guides with different tier numbers; root `TESTING.md` unlinked (root folded into guides/TESTING.md 2026-09-27)      | DOC-01                    | Merge; adopt the Part 4 table                                                                                                                                                     | `esi-b4a`    | [#273](https://github.com/lgriffin/ESI.ts/issues/273)                                                        |
| 13  | LOW  | `sde:seed` points at a missing script                                                                                           | GATE-06                   | **Done**: removed; script targets checked by `package-scripts.test.ts`                                                                                                            | `esi-x3z`    | [#274](https://github.com/lgriffin/ESI.ts/issues/274)                                                        |
| 14  | LOW  | Changelog skips 9.2 to 9.6                                                                                                      | REL-04                    | Backfill once                                                                                                                                                                     | `esi-5fu`    | [#275](https://github.com/lgriffin/ESI.ts/issues/275)                                                        |
| 15  | LOW  | Beads quick reference duplicated five times; persona files untracked in the repo root                                           | PROC-05, PROC-04          | Persona files **gone**; pointers still to do                                                                                                                                      | `esi-udr`    | [#276](https://github.com/lgriffin/ESI.ts/issues/276)                                                        |
| 16  | LOW  | Nightly mutation and Schemathesis upload artifacts but file no issue                                                            | GATE-05                   | **Done**: each ends in a `report` job that opens, comments on or closes one fixed-title issue (`mutation`, `api-fuzz`)                                                            | `esi-mbr`    | [#277](https://github.com/lgriffin/ESI.ts/issues/277)                                                        |
| 17  | LOW  | `CONTRIBUTING.md` says Node 18 while `.nvmrc` says 20; populated `.env` in working trees                                        | SEC-08, REL-05            | State the 11.0.0 floor (Node 22) in CONTRIBUTING; housekeeping                                                                                                                    | `esi-wc6`    | [#278](https://github.com/lgriffin/ESI.ts/issues/278)                                                        |
| 18  | HIGH | Authenticated paginated results cached under an unhashed key; repeat calls returned page 1                                      | DES-08, SEC-02            | **Done**: the combined body is cached with `requiresAuth`, so it lands under the token-hashed key                                                                                 | `esi-l38.1`  | [#290](https://github.com/lgriffin/ESI.ts/issues/290)                                                        |
| 19  | HIGH | Default all-pages call silently returned page 1 when a later page kept failing                                                  | DES-08                    | **Done**: surfaces `PAGINATION_INCOMPLETE` ([#413](https://github.com/lgriffin/ESI.ts/pull/413))                                                                                  | `esi-l38.2`  | [#291](https://github.com/lgriffin/ESI.ts/issues/291)                                                        |
| 20  | MED  | `stream*`/`fetchAll*` threw `EsiError` 304 after a normal call to the same endpoint                                             | DES-08                    | **Done**: the cached body is served on a 304                                                                                                                                      | `esi-l38.3`  | [#292](https://github.com/lgriffin/ESI.ts/issues/292)                                                        |
| 21  | MED  | Mutations returning 201/204 did not invalidate the cache path prefix                                                            | Part 2 step 7             | **Done**                                                                                                                                                                          | `esi-l38.4`  | [#293](https://github.com/lgriffin/ESI.ts/issues/293)                                                        |
| 22  | HIGH | Release pipeline broken: release-please GraphQL failure, cosign `--bundle`, token trigger, version marker                       | REL-02, SEC-04            | **Done**: cosign 3 bundle, `x-release-please-version` marker; the remaining trigger problems are row 30                                                                           | `esi-l38.5`  | [#294](https://github.com/lgriffin/ESI.ts/issues/294)                                                        |
| 23  | MED  | Validation errors retryable, network faults untyped, safe mode and token refresh collapse types                                 | ARCH-07                   | **Done**: typed classes ([#470](https://github.com/lgriffin/ESI.ts/pull/470))                                                                                                     | `esi-l38.6`  | [#295](https://github.com/lgriffin/ESI.ts/issues/295)                                                        |
| 24  | MED  | Log lines carry unsanitised URLs; several call sites bypass the per-client logger                                               | SEC-02, ARCH-09           | **Done**: `sanitizeUrl` at the logger boundary; rate limiter, cache, batch and token manager migrated                                                                             | `esi-l38.7`  | [#296](https://github.com/lgriffin/ESI.ts/issues/296)                                                        |
| 25  | MED  | CI does not match the gate matrix: release gate, never-run validators, dead docs job, freshness diff                            | GATE-01..06, REL-02       | **Done**: release gate runs the charter's validators; `validate:esi` and `validate:spec` wired; freshness diff covers every `esi-*.generated.ts`                                  | `esi-l38.8`  | [#297](https://github.com/lgriffin/ESI.ts/issues/297)                                                        |
| 26  | MED  | Endpoints returning a body lack `responseSchema`                                                                                | DES-02                    | **Done**: `spec:response-schemas` ([#471](https://github.com/lgriffin/ESI.ts/pull/471))                                                                                           | `esi-l38.9`  | [#298](https://github.com/lgriffin/ESI.ts/issues/298)                                                        |
| 27  | LOW  | Charter revision 1 carried factual errors found while writing the guides                                                        | DOC-01                    | **Done in revision 2**                                                                                                                                                            | `esi-l38.10` | [#299](https://github.com/lgriffin/ESI.ts/issues/299)                                                        |
| 28  | LOW  | Minor defects: `schema:drift` pairing, half-open extra probe, unused `clientId`, TEST-03 spy                                    | several                   | **Done**                                                                                                                                                                          | `esi-l38.11` | [#300](https://github.com/lgriffin/ESI.ts/issues/300)                                                        |
| 29  | MED  | A path parameter of exactly `..` passes validation and URL parsing collapses the segment (`characters/../assets/` → `/assets/`) | Part 6 step 2, SEC-01     | Reject `.` and `..` as path parameters; add the case to `security.test.ts`                                                                                                        | —            | [#430](https://github.com/lgriffin/ESI.ts/pull/430)                                                          |
| 30  | HIGH | Releases need a manual dispatch of `release.yml`, and CI on the release-please PR waits for manual approval                     | REL-02                    | A GitHub App token for release-please; waiting on the maintainer to create it                                                                                                     | —            | [#378](https://github.com/lgriffin/ESI.ts/issues/378), [#383](https://github.com/lgriffin/ESI.ts/issues/383) |
| 31  | MED  | No check that every public client method or provider method has a Rule                                                          | TEST-10                   | Shrink-only method coverage baselines: Track S Run 4 (provider), Phase 5 item 8 (clients)                                                                                         | —            | —                                                                                                            |
| 32  | LOW  | Exclusions (what the client ignores) stated in prose, not as executable unwanted-behaviour Rules; one such Rule exists          | TEST-11                   | Register **done**: `ears` lists the `shall not` Rules; exclusions written as Rules as each phase touches its area                                                                 | —            | —                                                                                                            |
| 33  | LOW  | The charter is EARS by convention; no audit parses its requirement blocks or checks Enforced rows name a mechanism              | PROC-06                   | **Done**: `npm run charter:audit` (Phase 5 item 7)                                                                                                                                | —            | —                                                                                                            |

---

## Part 11 · Adoption

The order matters: nothing in the documentation work is safe until step 2 is done, and nothing is trustworthy until step 1 is done.

1. **Make the branch compile.** ✅ Revision 1.
2. **Move TypeDoc output** to `docs-site/public/api` and update `clean`. ✅ Revision 1. The five hand-written `docs/` files are moved, folded or retired; `docs/` now holds only spikes and generated artefacts.
3. **Commit this charter** as `guides/CHARTER.md` and file one bead per row of the gap register, tagged with the requirement ID. ✅ Revision 1.
4. **Merge the duplicates** in the roadmap order: TESTING first (it has the tier conflict), then SECURITY, then ARCHITECTURE. Delete the root copies as each merge lands. ◐ SECURITY and ARCHITECTURE merged; TESTING and the root copy remain ([#273](https://github.com/lgriffin/ESI.ts/issues/273)).
5. **Write the new guides**: DESIGN-RULES, QUALITY-GATES, ERRORS, LOGGING, PAGINATION, RELEASE. Each opens with `Implements: ARCH-03, DES-01 …`. ✅ All six exist with `Implements:` lines.
6. **Generate the numbers.** `scripts/docs/doc-metrics.ts` writes `etc/doc-metrics.json`; a small template step stamps the README and site. Extend `validate:versions` to fail on stale banners. Open ([#272](https://github.com/lgriffin/ESI.ts/issues/272)).
7. **Publish the site.** `scripts/docs/sync-docs.ts` copies `guides/` into `docs-site/guide/`; release workflow builds VitePress and deploys it with the API reference under `/api/`. Shrink the README to an orientation page. Open ([#264](https://github.com/lgriffin/ESI.ts/issues/264)); lands with the 11.0 docs rewrite.
8. **Close the security gaps**: CODEOWNERS, SBOM asset, admins in branch protection. Re-run Scorecard and record the new score in the charter's next revision. ◐ SBOM and CODEOWNERS done; admins-included and the new score still to record ([#239](https://github.com/lgriffin/ESI.ts/issues/239)).

> **Revision rule.** This charter is revised by pull request like any other file. A requirement's status may only move toward Enforced by citing the script or job that proves it. Moving it the other way needs a bead explaining why.
