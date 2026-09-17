# Testing Guide for ESI.ts

## Overview

ESI.ts uses a multi-tier testing strategy to ensure correctness at every level — from individual functions to live API contract validation.

| Tier                 |      Tests |   Suites | Purpose                                                                     |
| -------------------- | ---------: | -------: | --------------------------------------------------------------------------- |
| TDD (unit)           |      4,357 |      130 | Per-module unit tests with mocked HTTP                                      |
| BDD (behavioral)     |        600 |       41 | Gherkin-style scenarios covering user-facing behaviors                      |
| Benchmark (perf)     |         18 |        1 | mitata micro-benchmarks, compared base against head statistically           |
| Heap soak            |          1 |        1 | 100 000 requests through the pipeline, heap flat after forced GC            |
| Integration (mocked) |         20 |        1 | Full request lifecycle with mocked fetch                                    |
| Integration (live)   |         61 |        3 | Real HTTP against live ESI — smoke tests, client integration, spec contract |
| Integration (gated)  |         33 |        1 | Authenticated endpoints with real OAuth token                               |
| Contract (deep)      |         15 |        2 | Endpoint definitions validated against live OpenAPI spec (8 categories)     |
| Contract (replay)    |        110 |        4 | Recorded public ESI payloads replayed through the pipeline, no network      |
| Fuzz (fast-check)    |        601 |        4 | Property-based testing of validation, URLs, schemas, pagination             |
| Composition          |         41 |        7 | Pipeline stages interacting under concurrent calls, every schedule explored |
| Type (tsd)           |            |        1 | Consumer API type correctness                                               |
| Consumer contract    |            |        1 | The `npm pack` tarball installed, type-checked and run by a clean consumer  |
| Doc examples         |            |        1 | Every `ts` block in README, guides and SDE docs type-checked vs the tarball |
| **Total**            | **4,957+** | **171+** | (`npm test` runs TDD + BDD; `npm run test:all` includes fuzz + types)       |

## Coverage

Current coverage (unit + BDD, measured by Jest):

| Metric     |  Value | Threshold |
| ---------- | -----: | --------: |
| Statements | 98.37% |       90% |
| Branches   | 95.14% |       80% |
| Functions  | 96.09% |       75% |
| Lines      | 98.17% |       90% |

Coverage is collected from `src/**/*.ts` (excluding `.d.ts` and `src/types/`).

### Per-File Test Breakdown (Notable Test Suites)

| File                           | Tests | Category                                          |
| ------------------------------ | ----: | ------------------------------------------------- |
| `resilience.test.ts`           |    12 | Rate limits, malformed responses, retry, dedup    |
| `security.test.ts`             |    23 | Token leakage, HTTPS, host allowlist, injection   |
| `configValidation.test.ts`     |    33 | Builder, factory, config combos, shutdown         |
| `publicApiSurface.test.ts`     |   135 | Export snapshot — breaking-change detector        |
| `crossCutting.test.ts`         |    15 | Diagnostics, middleware ordering, logger          |
| `apiSurfaceSnapshots.test.ts`  |     5 | API export & shape snapshot regression            |
| `concurrency.test.ts`          |    11 | Deduplicator, batch fetch, rate limiter races     |
| `utilFunctions.test.ts`        |    25 | camelToSnake, sleep, retryDelay, buildError       |
| `schemaRejection.test.ts`      |   423 | Valid/invalid/extra-field for all 35 schemas      |
| `clientErrorTests.ts` (helper) |   150 | HTTP 401/403/404/429/500 across 30 clients        |
| `esi-spec-contract.test.ts`    |    10 | Live OpenAPI drift detection                      |
| `client-integration.test.ts`   |    11 | Full EsiClient against live ESI                   |
| `live-esi.test.ts` (expanded)  |    40 | Smoke tests across 42 endpoints                   |
| `streamMethods.test.ts`        |    71 | Stream method delegation across 19 domain clients |
| `coverageBranches.test.ts`     |    13 | BaseEsiClient, EsiClient, builder branch coverage |
| `paginationBranches.test.ts`   |    12 | Pagination handler edge case branches             |

## Test Structure

```
tests/
├── tdd/                          # Unit tests (one per domain client + core)
│   ├── access-lists/AccessListsClient.test.ts
│   ├── alliances/AllianceClient.test.ts
│   ├── assets/AssetsClient.test.ts
│   ├── calendar/CalendarClient.test.ts
│   ├── characters/CharacterClient.test.ts
│   ├── clients/FreelanceJobsClient.test.ts
│   ├── clones/ClonesClient.test.ts
│   ├── contacts/ContactsClient.test.ts
│   ├── contracts/ContractsClient.test.ts
│   ├── core/
│   │   ├── __snapshots__/                  # Jest snapshot files (auto-generated)
│   │   ├── ApiRequestHandler.test.ts
│   │   ├── apiSurfaceSnapshots.test.ts     # API export & shape snapshots (5 tests)
│   │   ├── AsyncPaginationIterator.test.ts
│   │   ├── BatchRequestHandler.test.ts
│   │   ├── buildEndpointPath.test.ts
│   │   ├── circuitBreaker.test.ts
│   │   ├── concurrency.test.ts             # Async scheduling correctness (11 tests)
│   │   ├── configValidation.test.ts        # Config combos, builder, factory
│   │   ├── constants.test.ts
│   │   ├── createClient.test.ts
│   │   ├── crossCutting.test.ts            # Diagnostics, middleware, logger
│   │   ├── CursorPaginationHandler.test.ts
│   │   ├── CursorPaginationIntegration.test.ts
│   │   ├── dependencyInjection.test.ts
│   │   ├── endpointDefinitions.test.ts
│   │   ├── EsiDiagnostics.test.ts
│   │   ├── EsiError.test.ts
│   │   ├── ETagCacheManager.test.ts
│   │   ├── ETagIntegration.test.ts
│   │   ├── headersUtil.test.ts
│   │   ├── middleware.test.ts
│   │   ├── PaginationHandler.test.ts
│   │   ├── PaginationIntegration.test.ts
│   │   ├── publicApiSurface.test.ts        # 135 export snapshot tests
│   │   ├── RateLimitIntegration.test.ts
│   │   ├── RateLimiter.test.ts
│   │   ├── RequestDeduplicator.test.ts
│   │   ├── resilience.test.ts              # Rate limit, retry, dedup
│   │   ├── RetryBackoff.test.ts
│   │   ├── security.test.ts               # Token, HTTPS, injection
│   │   ├── SpecAwareCaching.test.ts
│   │   ├── streamEndpoint.test.ts
│   │   ├── Timeout.test.ts
│   │   ├── tokenRefresh.test.ts
│   │   ├── utilFunctions.test.ts           # Core utility functions (25 tests)
│   │   ├── validation.test.ts
│   │   ├── WithMetadata.test.ts
│   │   ├── coverageBranches.test.ts        # BaseEsiClient, EsiClient, builder branches (13 tests)
│   │   └── paginationBranches.test.ts      # Pagination handler edge cases (12 tests)
│   ├── clients/
│   │   └── streamMethods.test.ts           # Stream method delegation across 19 clients (71 tests)
│   ├── helpers/                  # Shared test utilities
│   │   └── clientErrorTests.ts             # Reusable HTTP error test generator
│   ├── schemas/                  # Schema validation tests (Zod)
│   │   ├── common-schemas.test.ts
│   │   ├── schema-validation.test.ts
│   │   ├── schemaRejection.test.ts         # Full schema rejection coverage (423 tests)
│   │   └── validation-integration.test.ts
│   ├── corporations/CorporationsClient.test.ts
│   ├── dogma/DogmaClient.test.ts
│   ├── factions/FactionClient.test.ts
│   ├── fittings/FittingsClient.test.ts
│   ├── fleets/FleetClient.test.ts
│   ├── incursions/IncursionsClient.test.ts
│   ├── industry/IndustryClient.test.ts
│   ├── insurance/InsuranceClient.test.ts
│   ├── killmails/KillmailClient.test.ts
│   ├── location/LocationClient.test.ts
│   ├── loyalty/LoyaltyClient.test.ts
│   ├── mail/MailClient.test.ts
│   ├── market/
│   │   ├── MarketClient.test.ts
│   │   └── MarketClient.streaming.test.ts
│   ├── mercenary/MercenaryClient.test.ts
│   ├── meta/MetaClient.test.ts
│   ├── pi/PiClient.test.ts
│   ├── route/RouteClient.test.ts
│   ├── search/searchClient.test.ts
│   ├── skills/SkillsClient.test.ts
│   ├── skyhooks/SkyhooksClient.test.ts
│   ├── sovereignty/SovereigntyClient.test.ts
│   ├── status/StatusClient.test.ts
│   ├── ui/UiClient.test.ts
│   ├── universe/UniverseClient.test.ts
│   ├── wallet/WalletClient.test.ts
│   └── wars/WarsClient.test.ts
├── bdd/                          # BDD tests (Gherkin features + step definitions)
│   ├── features/
│   │   ├── core/                 # 36 domain feature files
│   │   │   ├── alliance.feature
│   │   │   ├── market.feature
│   │   │   ├── runtime-validation.feature
│   │   │   ├── universe.feature
│   │   │   └── ... (36 total)
│   │   ├── integration/
│   │   │   └── integration-workflows.feature
│   │   └── performance/
│   │       └── performance.feature
│   ├── step-definitions/
│   │   ├── core/                 # 36 domain step files
│   │   │   ├── alliance.steps.ts
│   │   │   ├── market.steps.ts
│   │   │   ├── runtime-validation.steps.ts
│   │   │   └── ... (36 total)
│   │   ├── integration/
│   │   │   └── integration-workflows.steps.ts
│   │   ├── performance/
│   │   │   └── performance.steps.ts
│   │   └── shared/
│   │       └── common.ts
│   └── support/
│       └── world.ts
└── integration/                  # Integration tests
    ├── full-stack.test.ts        # Mocked full-lifecycle (20 tests)
    ├── live-esi.test.ts          # Live API smoke tests (40 tests)
    ├── client-integration.test.ts # Live EsiClient integration (11 tests)
    ├── esi-spec-contract.test.ts  # ESI spec drift detection (10 tests)
    ├── gated-auth.test.ts        # Authenticated endpoint tests (33 tests)
    └── gated-auth-setup.ts       # Auth test setup/helpers
```

## Running Tests

```bash
# All unit + BDD tests (default) — 171 suites, 4,957 tests
npm test

# Watch mode for development
npm run test:watch

# With coverage report
npm run coverage

# Micro-benchmarks for this tree — 18 tasks, no comparison
npm run benchmark

# Benchmarks against another tree, then the statistical comparison
npm run bench:ab -- --base ../base-worktree --head .
npm run bench:compare

# Heap soak: 100 000 requests, forced GC, bounded cache
npm run soak
```

### Running Subsets

```bash
# BDD scenarios only
npm run bdd

# Individual BDD domains
npm run bdd:alliance
npm run bdd:character
npm run bdd:corporation
npm run bdd:market
npm run bdd:universe
npm run bdd:integration
npm run bdd:performance

# All other BDD domains are also runnable individually:
# npm run bdd:access-lists, bdd:assets, bdd:calendar, bdd:clones,
# npm run bdd:contacts, bdd:contracts, bdd:dogma, bdd:etag-caching,
# npm run bdd:factions, bdd:fittings, bdd:fleets, bdd:freelance,
# npm run bdd:incursions, bdd:industry, bdd:insurance, bdd:killmails,
# npm run bdd:location, bdd:loyalty, bdd:mail, bdd:mercenary, bdd:meta,
# npm run bdd:pi, bdd:route, bdd:search, bdd:skills, bdd:skyhooks,
# npm run bdd:sovereignty, bdd:status, bdd:ui, bdd:wallet, bdd:wars
```

## Test Tiers

### Tier 1: TDD Unit Tests

**Location:** `tests/tdd/`
**Config:** `jest.unit.config.cjs`
**Run:** `npm test`

130 test files covering:

- **Domain clients** (37 files) — One per ESI API module (AllianceClient, MarketClient, etc.). Each mocks `fetch` and verifies correct URL construction, response parsing, and type safety. All 30 non-trivial clients include HTTP error path coverage (401, 403, 404, 429, 500) via the shared `describeClientErrors` helper.
- **Core infrastructure** (35+ files) — Circuit breaker, rate limiter, pagination (offset + cursor), ETag cache, request deduplication, retry with backoff, middleware pipeline, endpoint definitions, validation, error handling, timeout behavior, diagnostics, and configuration.
- **Core utilities** (`utilFunctions.test.ts`) — `camelToSnake` string conversion, `sleep` with fake timers, `retryDelay` exponential backoff with jitter bounds, `buildError` formatting, `EsiValidationError` construction and `isValidationError` type guard.
- **Concurrency** (`concurrency.test.ts`) — `RequestDeduplicator` (100 concurrent same-key calls, 10-key fanout, error propagation, pending state cleanup), `batchFetch` (simultaneous batches, mixed resolve/reject, monotonic progress, empty keys), `RateLimiter` (50 concurrent checks, group isolation, concurrent update+check).
- **API surface snapshots** (`apiSurfaceSnapshots.test.ts`) — Jest snapshots of public API exports, schema exports, `EsiError` shape, `RateLimiter` status shape, and `CircuitBreaker` stats shape. Catches accidental changes to public interfaces.
- **Schema rejection** (`schemaRejection.test.ts`) — 423 table-driven tests covering all 141 schemas across 35 schema files. Each schema is tested for valid data acceptance, wrong-type rejection, and extra-field preservation (`looseObject` behavior).
- **Resilience** (`resilience.test.ts`) — 429/420 rate limit handling, malformed JSON, truncated responses, empty bodies, stale cache fallback on 5xx, retry with backoff, network timeout, request deduplication under concurrent load.
- **Security** (`security.test.ts`) — Token not leaked to public endpoints, token sent only to authenticated endpoints, HTTPS enforcement, host allowlist, path parameter injection prevention, query parameter length limits, NaN/Infinity rejection.
- **Configuration** (`configValidation.test.ts`) — Default config, all features enabled simultaneously, EsiClientBuilder selective/full client registration, EsiApiFactory methods, token provider, datasource/language config, shutdown idempotency, legacy retry config.
- **Public API Surface** (`publicApiSurface.test.ts`) — Snapshot of all 37 domain client exports, 21 class/function exports, 8 type guard functions, 37 domain accessors on EsiClient, and 13 EsiClient methods. Acts as a contract — if a public export is accidentally removed, this test breaks.
- **Cross-Cutting** (`crossCutting.test.ts`) — Diagnostics accuracy (cache stats, circuit breaker stats, clearCache, resetCircuitBreaker), middleware ordering (request before response, registration order, remove at runtime, constructor config), and custom logger integration.
- **Stream methods** (`streamMethods.test.ts`) — 71 tests verifying all `stream*()` methods across 19 domain clients delegate correctly to `BaseEsiClient.streamEndpoint()` with the right endpoint name and arguments.
- **Pagination branches** (`paginationBranches.test.ts`) — Edge case branches in `PaginationHandler` (no rate limiter, non-Error thrown values, null page data), `CursorPaginationHandler` (pageFetch delegate, non-abort errors, invalid JSON, body passthrough), `resolveRateLimiter` error path, and `handleOffsetPagination` generic error wrapping.
- **Coverage branches** (`coverageBranches.test.ts`) — `BaseEsiClient.withSafeMode()` and `withMetadata()` memoization, `EsiClient.batch()` and `batchPost()` delegation, `EsiApiFactory` static factory config branches, and `CustomEsiClient` constructor config branches.

### Tier 2: BDD Behavioral Tests

**Location:** `tests/bdd/`
**Config:** `jest.unit.config.cjs` (same runner as TDD)
**Run:** `npm run bdd`

41 feature files written in Gherkin, with matching step definitions. Covers:

- All 37 domain API modules (alliance, market, universe, etc.)
- Cross-cutting behaviors: ETag caching, response header extraction, deprecation warnings
- Integration workflows: character profile assembly, market analysis, fleet operations
- Performance scenarios: concurrency, large datasets, memory efficiency

Individual modules can be run selectively: `npm run bdd:market`, `npm run bdd:alliance`, etc.

The feature files are an EARS specification, and three gates decide whether a Rule protects anything (`tests/bdd/README.md`, "When a Rule is protection"):

- **Well-formed:** `npm run spec:audit` holds every Rule to one `shall`, at least one Scenario under it, no Scenario outside a Rule, and a tracker tag (`@esi-<bead>` or `@gh-<issue>`) beside every `@bug`.
- **Executed:** `mkdir -p reports/bdd`, `npm run bdd -- --json --outputFile=reports/bdd/jest-results.json` then `npm run bdd:report` joins the run to the feature files. It fails when any scenario did not execute (`feature-not-run`, `scenario-not-executed`), and writes `reports/bdd/junit.xml` with each test case named `Feature › Rule › Scenario`. CI uploads it as the `bdd-junit` artifact and puts the Rules not verified in the job summary.
- **Able to fail:** `npm run mutation:bdd:ratchet` floors the BDD-only mutation score per source directory in `mutation-bdd-thresholds.json`. The file is empty today, so no directory is ratcheted yet.

#### BDD Test Categories

- **Core** (`bdd/features/core/`): Domain-specific scenarios for all 37 domain clients plus cross-cutting concerns (ETag caching, response headers)
- **Integration** (`bdd/features/integration/`): Cross-domain workflows — character profile assembly, market analysis, fleet operations
- **Performance** (`bdd/features/performance/`): Smoke checks of concurrency, large payloads and the error path. These scenarios state no latency or throughput budget; the only time bounds they keep are the ones that separate overlapping requests from serial dispatch, and the numbers live in Tier 2.5

### Composition and concurrency

**Location:** `tests/tdd/composition/` (agent notes in its `AGENTS.md`)
**Config:** `jest.unit.config.cjs`, so it runs in `npm test` and Stryker covers it
**Run:** `npx jest --config jest.unit.config.cjs --testPathPatterns=composition`
**Nightly:** `nightly-interleave.yml`

Owns one failure class: request pipeline stages that are each correct alone but wrong together when calls overlap. Each scenario drives a real `EsiClient` with every stage on (rate limiter out of test mode, circuit breaker, deduplication, retry, ETag cache, Zod validation) and mocks only HTTP, at the BDD transport seam. The interleaving scheduler (`support/interleave.ts`) holds each request at the seam and chooses step by step which call starts, which response arrives and when fake time advances, then checks named invariants over the sequence of requests (method, path, If-None-Match) and outcomes.

| Scenario                    | Interaction                                              |
| --------------------------- | -------------------------------------------------------- |
| `retryCircuit.test.ts`      | Retry inside a circuit that has just opened              |
| `staleRefresh.test.ts`      | Stale-on-error while the stale entry is being refreshed  |
| `dedupeRejection.test.ts`   | Deduplication when the shared in-flight request fails    |
| `etagOrdering.test.ts`      | A 304 for an old ETag arriving after a 200 for a new one |
| `errorLimit.test.ts`        | The ESI error-limit back-off holding back every endpoint |
| `writeInvalidation.test.ts` | A write invalidating the cache while a read is in flight |

On every PR each scenario runs every schedule of two and three calls; the schedule counts are pinned, so a change that stops calls overlapping fails instead of silently testing less. The whole tier takes about 5 seconds. Nightly, four calls run in seeded random order. A failure prints the broken invariant, the event log and the command that replays the schedule (`ESI_INTERLEAVE_REPLAY=...`, plus `ESI_INTERLEAVE_MODE=random` for a nightly failure). The scheduler's own tests (`interleave.test.ts`) show it enumerating exactly the schedules that exist, finding and replaying a planted race, and failing closed on deadlock, nondeterminism and malformed environment variables.

### Tier 2.5: Benchmarks and the heap soak

**Location:** `tests/benchmark/` (see [`tests/benchmark/AGENTS.md`](../tests/benchmark/AGENTS.md))
**Run:** `npm run benchmark`, `npm run bench:ab`, `npm run bench:compare`, `npm run soak`

This tier owns one failure class: the client got slower, or started holding memory. Bundle size is owned by the size-limit budgets.

The Jest benchmark suites that used to live here asserted raw wall-clock upper bounds (`expect(elapsed).toBeLessThan(500)`) that sat 10 to 100 times above the real cost. A bound that loose cannot see a 30% regression, and a tighter one flakes on a shared runner, so they were retired rather than converted.

**Micro-benchmarks.** `tests/benchmark/tasks.ts` holds 18 tasks over the paths a client pays for on every call: parse and Zod-validate a small object, a 1000-order market page and a nested colony layout; ETag cache hit, miss, write and write-at-capacity; cache-key derivation; response-header parsing (`ETag`, `Expires`, `X-Pages`, rate-limit headers); the rate limiter's acquire; the circuit breaker's check; `batchFetch`; and two whole-pipeline requests against an instant transport. `harness.ts` runs them with [mitata](https://github.com/evanwashere/mitata), which batches fast operations so a 50 ns call is not lost in timer resolution, forces a collection before each task, and reports per-sample nanoseconds. mitata was chosen over tinybench for that batching and because it exposes the samples the comparison works on.

**Comparison.** A benchmark number alone means nothing; the question is "slower than what". `npm run bench:ab` bundles the harness for two trees — typically a pull request's base tip and its head — and runs them in alternating processes on one machine, so runner-to-runner noise cancels. The observation per task is one per-process median; `npm run bench:compare` applies a one-sided Mann-Whitney U test per task, Holm-adjusted across tasks at alpha = 0.05, and calls a task regressed only if the ratio of medians is also at least 1.10 and the absolute difference at least 2 ns/op. Improvements are reported. A missing baseline, too few rounds or a dropped task fails closed. The decision logic is unit-tested against synthetic distributions in `tests/tdd/benchmark/`.

**Heap soak.** `tests/benchmark/soak.ts` drives 100 000 requests through a real `EsiClient` against an in-process transport, with a bounded ETag cache and a distinct key per request. Under `--expose-gc` it forces a full collection at 50 sample points and fails when a least-squares fit over the second half projects growth beyond the threshold, when the cache exceeds its bound, or when timers or process listeners survive `shutdown()`. `npm run soak -- --inject-leak --expect-fail` runs the same soak with a response interceptor that retains every response and passes only if the leak is flagged; the unit suite runs that fixture too, so the detector is checked on every pull request.

**Where it runs.** The `benchmarks` job in `ci.yml` runs the A/B comparison only when `src/core/`, `src/schemas/`, the harness, the bench scripts or the lockfile change, and otherwise reports success with a summary line. `nightly-benchmarks.yml` compares master with a pinned reference commit, runs the soak, publishes the trend to the `bench-data` branch, and keeps one `performance-nightly` issue open while either fails.

### Tier 3: Integration Tests (Mocked)

**Location:** `tests/integration/full-stack.test.ts`
**Config:** `jest.integration.config.cjs`
**Run:** `npm run test:integration`

20 tests verifying the full request lifecycle with mocked fetch:

- EsiClient → StatusClient → ApiClient → ApiRequestHandler → fetch (mocked)
- ETag cache round-trip (first request caches, second returns cached)
- Circuit breaker trip and recovery
- Middleware pipeline (request/response interceptors, ordering, removal)
- Token refresh flow (401 → refresh → retry)
- Pagination assembly (multi-page into single array)
- Error propagation (404, 403, stale cache on 5xx)
- Client creation patterns (constructor, builder, factory)
- DI isolation (separate caches per client)

### Tier 4: Live API Smoke Tests

**Location:** `tests/integration/live-esi.test.ts`
**Run:** `ESI_LIVE_TESTS=true npm run test:integration`

40 tests making real HTTP requests to `https://esi.evetech.net/latest/`:

| Category           | Tests | Endpoints Tested                                                                                                                                                                                                                                                                                                        |
| ------------------ | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status             |     1 | `/status/`                                                                                                                                                                                                                                                                                                              |
| Alliances          |     2 | `/alliances/`, `/alliances/{id}/`                                                                                                                                                                                                                                                                                       |
| Market             |     5 | `/markets/prices/`, `/markets/{region}/history/`, `/markets/{region}/orders/`, `/markets/{region}/types/`, `/markets/groups/`                                                                                                                                                                                           |
| Universe           |    13 | `/universe/types/`, `/universe/types/{id}/`, `/universe/systems/{id}/`, `/universe/categories/`, `/universe/regions/`, `/universe/constellations/`, `/universe/stations/{id}/`, `/universe/groups/`, `/universe/races/`, `/universe/bloodlines/`, `/universe/ancestries/`, `/universe/factions/`, `/universe/graphics/` |
| Dogma              |     3 | `/dogma/attributes/`, `/dogma/effects/`, `/dogma/attributes/{id}/`                                                                                                                                                                                                                                                      |
| Wars               |     2 | `/wars/`, `/wars/{id}/`                                                                                                                                                                                                                                                                                                 |
| Industry           |     2 | `/industry/systems/`, `/industry/facilities/`                                                                                                                                                                                                                                                                           |
| Insurance          |     1 | `/insurance/prices/`                                                                                                                                                                                                                                                                                                    |
| Incursions         |     1 | `/incursions/`                                                                                                                                                                                                                                                                                                          |
| Sovereignty        |     3 | `/sovereignty/campaigns/`, `/sovereignty/map/`, `/sovereignty/structures/`                                                                                                                                                                                                                                              |
| Route              |     1 | `/route/{origin}/{destination}/`                                                                                                                                                                                                                                                                                        |
| Faction Warfare    |     4 | `/fw/stats/`, `/fw/wars/`, `/fw/systems/`, `/fw/leaderboards/`                                                                                                                                                                                                                                                          |
| Killmails          |     1 | `/killmails/{id}/{hash}/`                                                                                                                                                                                                                                                                                               |
| Rate Limit Headers |     1 | Validates `x-ratelimit-*` headers                                                                                                                                                                                                                                                                                       |

Note: Opportunities endpoints (`/opportunities/groups/`, `/opportunities/tasks/`) were removed — CCP has retired these from the ESI spec.

Each test validates HTTP 200, response shape (required properties, correct types), and array/object structure.

### Tier 5: Client Integration Tests (Live)

**Location:** `tests/integration/client-integration.test.ts`
**Run:** `ESI_LIVE_TESTS=true npm run test:integration`

11 tests using the actual `EsiClient` against live ESI (no mocks):

- Full-stack status, market prices, alliance info, universe type lookups
- ETag cache round-trip with real responses
- Rate limit tracking with real headers
- Multi-page pagination assembly (universe/types — 30k+ items)
- Error handling (404 for non-existent alliance)
- Route calculation (Jita → Amarr)
- Diagnostics reporting after real requests

### Tier 6: ESI Spec Contract Tests (Live)

**Location:** `tests/integration/esi-spec-contract.test.ts`
**Run:** `ESI_LIVE_TESTS=true npm run test:integration`

10 tests that fetch the live ESI OpenAPI spec and validate:

- **Endpoint coverage** — Phantom endpoints, HTTP method mismatches, and uncovered spec endpoints are reported as warnings (known drift from newer EVE features not yet in public spec)
- **Type drift** — Missing fields and optionality mismatches are reported as warnings (known gap: ~45 fields, ~14 optionality mismatches)
- **Cache TTL drift** — `esi-cache-ttls.generated.ts` matches `x-cached-seconds` in live spec (**hard fail** — indicates stale generated files)
- **Scope drift** — `esi-scopes.generated.ts` matches security requirements in live spec (**hard fail** — indicates stale generated files)

Known-drift tests warn rather than fail because the discrepancies are tracked debt, not regressions. Cache TTL and scope drift remain hard failures because they indicate the generated files need regeneration (`npm run generate:types`).

### Tier 7: Deep Contract Tests (Live)

**Location:** `tests/contract/`
**Config:** `jest.contract.config.cjs`
**Run:** `ESI_LIVE_TESTS=true npm run contract:live` (fails in global setup if `ESI_LIVE_TESTS` is not `true`, instead of skipping every suite)

15 tests across 2 suites that fetch the live ESI OpenAPI spec and structurally validate every endpoint definition:

- **Path parameter alignment** — `{param}` names in path template match spec's `parameters` where `in: "path"`
- **Query parameter alignment** — required spec query params present in SDK `queryParams`
- **Request body alignment** — `hasBody`/`bodyBuilder` matches spec `requestBody`
- **Auth alignment** — `requiresAuth` matches spec `security` scopes
- **Response schema coverage** — GET endpoints with JSON responses have Zod schemas (advisory)
- **HTTP method match** — SDK method matches spec operation
- **Pagination contract** — endpoints with `X-Pages` header flagged if missing pagination metadata (advisory)
- **Deprecation sync** — spec-deprecated endpoints flagged if missing SDK `deprecated` metadata (advisory)
- **Spec snapshot comparison** — detects upstream changes since last snapshot (path/operation/schema counts, cache TTL changes)

Known contract deviations are tracked in the test file and reported as warnings. Unknown mismatches hard-fail.

Related tools:

- `npm run contract:snapshot` — saves a baseline spec for drift comparison
- `npm run contract:diff` — runs oasdiff (Docker) to detect breaking spec changes

### Tier 7b: Recorded Payload Replay

**Location:** `tests/contract/replay/`, fixtures in `tests/contract/fixtures/recorded/`, agent notes in [`tests/contract/AGENTS.md`](../tests/contract/AGENTS.md)
**Config:** `jest.contract.replay.config.cjs`
**Run:** `npm run contract:replay` (no network; CI job `contract-replay`). One endpoint: `npm run contract:replay -- -t "market.getMarketOrders"`.
**Record:** `ESI_LIVE_TESTS=true npm run contract:record [-- --only=<endpoint key>]` (refuses to run without `ESI_LIVE_TESTS=true`)

Tier 7 checks the spec against the endpoint definitions. This tier checks the other truth: the bodies ESI actually sends. `tests/contract/record.ts` records one sanitised response per public (unauthenticated) GET endpoint definition, calling the real client method with a capturing `fetch` so the URL, `User-Agent` and `X-Compatibility-Date` are the client's own, then sending that request itself one at a time (stopping on a 420, waiting out a 429 once, pausing when the error limit runs low). Each fixture keeps the `ETag`, `Expires`, `Last-Modified`, `Cache-Control`, `Content-Type` and `X-Pages` headers, the compatibility date, the hash of the OpenAPI document served for it and the operation's `x-cache-age`. Arrays, maps and long strings are truncated, every cut is listed in `truncated`, paginated endpoints keep two pages with `X-Pages` rewritten to match and the upstream count kept in `upstreamPages`. Fixtures are capped at 24 KiB each and 256 KiB together (`tests/contract/recorded/policy.ts`); 78 fixtures take about 150 KiB.

Each replay goes through the BDD transport seam, so the whole pipeline runs, and checks that:

- the endpoint's Zod schema accepts the recorded body;
- the returned value keeps every key path of the recording, and a field added to the body survives validation;
- offset pagination sends one request per recorded page;
- within the recorded `x-cache-age` a second call is served from the cache, and after it the client revalidates with `If-None-Match` set to the recorded ETag.

`coverage.test.ts` fails when a public GET endpoint has neither a fixture nor an entry in `tests/contract/fixtures/unrecordable.json`, when an entry or fixture is stale, when a fixture was recorded under a different compatibility date than the client sends, and when the size budget is exceeded. `unrecordable.json` and `known-mismatches.json` (endpoints whose replay fails today, each with the reason) only shrink against `origin/master`, and the check fails closed when no base ref can be read. The failure signal is `tests/contract/fixtures/recorded-negative/status.getStatus.json`, a recording with `players` edited to a string, which the replay must reject with an `EsiValidationError` naming `players`.

`.github/workflows/nightly-recorded-payloads.yml` re-records every night, restores fixtures whose shape did not change (`npm run contract:shape-diff -- --revert-unchanged`: status, which cache headers are sent, and the JSON type at each key path; values such as prices, IDs and ETags are ignored), replays the rest and opens a pull request with the shape diff and the replay result. Nothing merges automatically. A failed run keeps an issue labelled `recorded-payloads-check-failed` open.

### Tier 8: Property-Based Fuzz Tests

**Location:** `tests/fuzz/`
**Config:** `jest.fuzz.config.cjs`
**Run:** `npm run fuzz`

601 tests using [fast-check](https://github.com/dubzzz/fast-check) for property-based testing:

- **Parameter validation fuzzing** (`parameter-fuzz.test.ts`) — `validatePathParam()` and `validateQueryParam()` with random strings, numbers, null/undefined, NaN/Infinity, objects with broken `toString`. Verifies: unsafe chars always rejected, valid integers always accepted, non-finite numbers always rejected.
- **URL construction fuzzing** (`url-construction-fuzz.test.ts`) — `buildEndpointPath()` with adversarial path params, path traversal strings, and random inputs. Verifies: no unsubstituted `{param}` placeholders, slashes always rejected, special chars safely encoded.
- **Schema fuzzing** (`schema-fuzz.test.ts`) — all Zod schemas in `src/schemas/` tested with `fc.anything()`. Verifies: `safeParse()` never throws (returns `{success: false}` instead), all primitive edge cases handled.
- **Pagination fuzzing** (`pagination-fuzz.test.ts`) — page parameter via `buildEndpointPath()` with zero, negative, float, NaN, Infinity, and large values. Verifies: NaN/Infinity rejected, valid page numbers accepted.
- **Response validation fault injection** (`response-validation-fault-injection.test.ts`) — bodies that violate an endpoint's `responseSchema` (one corrupted or missing field, one corrupted array element, or arbitrary JSON of the wrong shape, each kept only if the endpoint's own schema rejects it) served through the BDD transport seam, so they travel the real `handleRequest` pipeline to validation in `createClient`. Covers `status.getStatus` (object), `market.getMarketPrices` (array) and `characters.getCharacterPublicInfo` (path parameter). Verifies: the client rejects with an `EsiValidationError` (`direction: 'response'`, status `0`, the request URL) whose Zod issues match the schema's own verdict; exactly one request is sent, with no retry; safe mode returns the error as `{ ok: false }` instead; with `validateResponse: false` the same body comes back unchanged; no unhandled rejection is left behind.

#### Model-based properties

**Location:** `tests/fuzz/*.property.test.ts` (rules in [`tests/fuzz/AGENTS.md`](../tests/fuzz/AGENTS.md))
**Run:** `npm run fuzz` (PR), `npm run fuzz:properties` (properties only)
**Nightly:** `.github/workflows/nightly-properties.yml`, 10000 runs per property, one seed per night, a single `Nightly property run failed` issue on failure

These state invariants rather than examples. Each drives real code (a domain client against a fake ESI on the `jest-fetch-mock` seam, or the unit itself) and compares it with a small reference model:

| Property                                 | Invariant                                                                                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `circuit-breaker-model.property.test.ts` | Admit/reject decisions and reported state match a closed → open → half-open → closed model for any sequence of calls, overlapping outcomes, status codes and clock advances; half-open never admits more than `halfOpenMaxAttempts`  |
| `pagination-assembly.property.test.ts`   | Eager, `fetchAll*` and cursor walks return every page exactly once and in order, for any page count, transient failures, X-Pages drift, response arrival order and cursor tokens; a page that exhausts retries never yields a prefix |
| `cache-key.property.test.ts`             | Cache keys are deterministic across equivalent spellings, injective across different values (`+`, `%20`, space, `&`, `=`), in definition order, and never shared between access tokens                                               |
| `etag-cache-model.property.test.ts`      | For any history of calls, identities, ESI changes, faults (304, 200 without ETag, 4xx, 5xx, network) and time, the requests sent, If-None-Match, results and stored entries match the caching rules                                  |
| `backoff.property.test.ts`               | `retryDelay` is finite, within `[0, maxDelayMs]`, monotonic in attempt, and inside the 0.75–1.25× jitter window below the cap                                                                                                        |

**Replay.** A failure prints the shrunk counter-example, seed, path and the exact command (`FC_SEED=… FC_PATH=… npx jest --config jest.fuzz.config.cjs --testPathPatterns <file> -t "<name>"`). `FC_NUM_RUNS` raises the run count.

**Vacuity check.** Every property registers known-bad mutants (an extra half-open probe, a dropped page, a cache key that ignores the token, a 304 that does not refresh the TTL, uncapped backoff, …) and the suite asserts the property fails against each one. A mutant that survives fails CI, so the number of vacuous properties is held at 0.

**Counter-examples** found by a property are committed as named example tests in the PR that fixes the bug. The first run found five: the uncounted half-open probe (`esi-l38.11`), a late success closing an open circuit, the unscoped cache key for combined pages (`esi-l38.1`), page 1 revalidated alone after a page exhausted its retries, and a `NaN` backoff past attempt 1023 with a zero base delay.

### Tier 9: Gated Auth Tests (Live)

**Location:** `tests/integration/gated-auth.test.ts`
**Run:** `ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=... npm run test:integration:gated`

33 tests for authenticated endpoints using a real OAuth token:

- Location, Skills, Wallet, Assets, Characters, Clones, Contacts, Killmails, Mail, Fittings, Industry, Market (auth), Loyalty, Contracts, Calendar, Search, Faction Warfare

### Consumer contract

**Location:** `tests/consumer/` (a private downstream package), driven by `scripts/consumer-contract.ts`
**Run:** `npm run test:consumer` (`-- --skip-build` packs the existing `dist/`, `-- --keep` keeps the workspace)
**CI:** `consumer-contract` in `ci.yml`, Node 18, 20 and 22, inside `ci-success`. Not part of `npm test`.

Every other tier imports from `src/`, so none of them sees the package a consumer installs. This one does:

1. Builds and runs `npm pack`, then installs the tarball, plus the repository's `typescript` and `@types/node` versions, into a copy of `tests/consumer/` in a temporary directory outside the repository, so resolution cannot fall back to the repo's `node_modules`.
2. Fails if a sub-path in the packed `exports` map is not imported by each consumer source (`src/require.cts`, `src/import.mts`, `bundler/index.mts`).
3. Type-checks with `skipLibCheck: false`, so the shipped declarations are checked too, under `module: nodenext` (the `.cts` file resolves through the `require` condition, the `.mts` file through `import`) and under `moduleResolution: bundler`.
4. Runs the emitted CommonJS and ES module consumers: a real `EsiClient` against a stubbed `fetch`, a malformed body rejected with `EsiValidationError` and a 404, both recognised by the classes and guards imported from `./errors`, schemas, `TestDataFactory` and the SDE providers.
5. `runtime/parity.mjs` loads every sub-path under both `require` and `import` and fails if the CJS and ESM builds export different names, or if, within one build, two sub-paths export the same name as different values (a class exported from `.` and `./errors` must be one class; the root `schemas` namespace is compared with `./schemas`).
6. `runtime/sde-optional-peers.mjs` covers `js-yaml` and `adm-zip`, the optional peer dependencies of `./sde`. Steps 2 to 5 run without them installed; before that, `absent` checks that `./sde` loads and that `fromDirectory` and `fromZip` throw an `SdeError` naming the missing package. At the end the runner installs both and `present` loads real YAML and ZIP files through the CJS and ESM builds.

Defects the contract finds are recorded as known issues against their beads: each logs while it reproduces and fails the run once it stops, so the fix has to remove the workaround. There are none open; `esi-v2s.15` (error class identity across sub-paths) and `esi-v2s.16` (`./sde` peer dependencies) were the last two.

### Documentation examples

**Location:** `scripts/doc-examples.ts` and `scripts/doc-examples-core.ts`; prelude and stub fetch in `tests/doc-examples/`; self-tests and fixtures in `tests/tdd/doc-examples/`
**Run:** `npm run test:docs-examples` (`-- --skip-build` packs the existing `dist/`, `-- --keep` keeps the workspace)
**CI:** `doc-examples` in `ci.yml`, Node 20, inside `ci-success`. Not part of `npm test`; the unit suite checks the annotations, the baseline and the fixtures against a stub package.

Packs the library as the consumer contract does and type-checks every fenced `ts`/`typescript` block in `README.md`, `guides/*.md`, `src/sde/README.md` and `src/sde/docs/*.md` as its own module under nodenext and bundler resolution, then runs the blocks marked `runnable` against a stubbed `fetch`. The annotation convention, the prelude and the shrink-only known-broken baseline are described in [DOCUMENTATION.md](DOCUMENTATION.md#documentation-examples-are-checked).

### Type mutation

**Location:** `scripts/type-mutation.ts` (CLI), `scripts/type-mutation-core.ts` (operators, sampling, ratchet), `scripts/type-mutation-run.ts` (workspaces, tsd)
**Run:** `npm run build && npm run test:type-mutation` (`-- --ratchet` gates, `-- --update` raises floors, `--max`, `--seed`, `--workers`)
**CI:** `type-mutation-testing` in `nightly-mutation.yml`. Not a pull request job.

The tsd suite (`npm run test:types`) is only as good as the promises it pins. Type mutation checks that the way Stryker checks the unit suite: it makes one deliberate edit to a copy of the built declarations and runs the tsd tests against it, with their `../../src` imports pointed at the copy. Mutants come from the declarations the `package.json` `exports` entries reach, found with the TypeScript compiler API:

| Operator               | Edit                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `return-unknown`       | A function, method, accessor or call signature returns `unknown`                     |
| `drop-readonly`        | A `readonly` modifier or `readonly T[]` loses `readonly`                             |
| `optional-to-required` | `x?:` becomes `x:` (properties and parameters)                                       |
| `required-to-optional` | `x:` becomes `x?:` (parameters only when nothing required follows)                   |
| `union-drop-member`    | The first, last or a nullish member of a union is dropped                            |
| `widen-literal`        | A literal, or a union of same-kind literals, becomes `string`, `number` or `boolean` |
| `remove-overload`      | One signature of an overload group is removed                                        |
| `constraint-unknown`   | `T extends X` becomes `T extends unknown`                                            |

A mutant is **killed** when tsd reports a failure in a type test, **invalid** when the mutated declarations themselves no longer compile (excluded from the score; a generated test imports every entry point, so this is seen even where no type test reaches), and **survives** when tsd passes. A survivor is a missing tsd case. The score per entry point is killed / (killed + survived).

About eight thousand candidates exist, so at most 500 run. Entry points take turns picking their next mutant in order of a seeded hash of the mutant's id (built from file, symbol, operator and the mutated text, not offsets), so the same seed and surface always give the same sample, and each mutant a change adds displaces at most one sampled mutant instead of reshuffling the rest. `--ratchet` refuses a non-default `--seed` or `--max`, because the floors in `scripts/type-mutation-thresholds.json` were measured on the default sample. The report is `reports/type-mutation/type-mutation.{json,md}`.

`tests/tdd/type-mutation/` holds the negative fixture: a one-interface package whose tsd test pins `Widget.id` and never mentions `Widget.label`. The suite runs the real mutation against it and fails unless making `id` optional is killed and making `label` optional survives, alongside unit tests for each operator, the sampler and the ratchet.

## Suite-health lint

**Run:** `npm run lint:suite-health` (ESLint over `tests/`, fixture trees excluded)
**CI:** `ci-fast.yml` on every push; the `spec-audit` job in `ci.yml`, inside `ci-success`

Keeps a green suite from quietly becoming a decorative one. It rejects a committed `.only`, `fit` or `fdescribe`; a `.skip`, `xit`, `xdescribe` or `.todo`; a test with no assertion; a `catch` that swallows an assertion's failure without rethrowing or asserting; and a `console` method mocked and never restored. The same applies to jest-cucumber scenarios (`test.only`, `test.skip` inside `defineFeature`) and to BDD Then steps: under `tests/bdd` every `Then(...)` step file and every legacy `then(...)` step must assert. `expect`, any `expect*` helper and `fc.assert` count as assertions. There is no baseline; every finding fails. Gate a live-only suite with a condition (`LIVE ? describe : describe.skip`), not a committed `.skip`. The rule table and the reasoning are in [QUALITY-GATES.md](QUALITY-GATES.md#suite-health-lint); each rule has a fixture in `tests/tdd/suite-health/fixtures/` that its Jest suite must see rejected.

## Integration Tests

Integration tests live in `tests/integration/` and hit the real ESI API. They are **not** part of the default `npm test` run and require a separate config.

```bash
# Mocked integration tests (no network required)
npm run test:integration

# Live smoke tests (requires network)
ESI_LIVE_TESTS=true npm run test:integration

# On Windows (PowerShell), use cross-env:
npx cross-env ESI_LIVE_TESTS=true npm run test:integration

# Authenticated endpoint tests (requires OAuth token)
ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=<token> npm run test:integration:gated

# On Windows:
npx cross-env ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=<token> npm run test:integration:gated
```

### Running Specific Integration Suites

```bash
# Mocked full-stack only
npx jest --config jest.integration.config.cjs --testPathPattern=full-stack

# Live smoke tests only
npx jest --config jest.integration.config.cjs --testPathPattern=live-esi

# Client integration only
npx jest --config jest.integration.config.cjs --testPathPattern=client-integration

# Spec contract only
npx jest --config jest.integration.config.cjs --testPathPattern=esi-spec-contract

# Gated auth only
npx jest --config jest.integration.config.cjs --testPathPattern=gated-auth
```

**Note:** Integration tests are rate-limited and have longer timeouts (30s). They may fail if ESI is experiencing downtime. CI runs them on a schedule rather than on every push.

### Live API Verification

The `examples/` directory contains scripts that hit the real ESI API. Public examples need no auth; authenticated examples require `ESI_ACCESS_TOKEN` with the noted scopes.

```bash
# Public endpoints (no auth needed)
npm run example:status       # Quickest smoke test — server status
npm run example:character    # Character lookup
npm run example:universe     # System/constellation/region/station
npm run example:market       # Market prices + history
npm run example:alliance     # Alliance info + member corps
npm run example:route        # Route planning with system names
npm run example:wars         # Recent wars
npm run example:sovereignty  # Nullsec sovereignty map
npm run example:skyhooks     # Sovereignty hubs + orbital skyhooks
npm run example:mercenary    # Mercenary dens + tactical operations
npm run example:industry     # Industry facilities + insurance
npm run example:incursions   # Incursions + faction warfare
npm run example:dogma        # Item types + dogma attributes
npm run example:contracts    # Public region contracts + auction details
npm run example:universe-encyclopedia  # Ancestries, bloodlines, races, celestials
npm run example:dogma-meta-sov         # Dogma effects, sovereignty, meta endpoint
npm run example:faction-details        # Faction warfare leaderboards and stats

# Authenticated endpoints (require ESI_ACCESS_TOKEN with listed scopes)
npm run example:wallet       # Wallet balance, journal, transactions
npm run example:skills       # Trained skills, queue, attributes
npm run example:assets       # Asset inventory with bulk lookups
npm run example:killmails    # Killmail summaries + full details
npm run example:fleet        # Fleet info, members, wings/squads
npm run example:mail         # Inbox, labels, mailing lists
npm run example:location     # Current system, online, ship
npm run example:fittings     # Ship fittings + clones + implants
npm run example:contacts     # Contact list with standings
npm run example:access-lists # Access list entries (requires ACL scope)
npm run example:character-details      # Blueprints, roles, standings, medals
npm run example:corporation-details    # Corp members, divisions, structures
npm run example:calendar-search        # Calendar events + character search
npm run example:loyalty-pi             # Loyalty points + planetary interaction
npm run example:industry-mining        # Industry jobs + mining ledger
npm run example:market-orders          # Character/corp market orders
npm run example:corp-contracts-wallet  # Corp contracts, contacts, wallets

# Write operation examples (require specific scopes + caution)
npm run example:write-ops              # Contacts, fittings, mail, UI lifecycle tests
npm run example:universe-posts         # Name resolution + character affiliation
npm run example:freelance-jobs         # Freelance job queries

# Utility / advanced pattern examples
npm run example:rate-limiting      # Rate limiter behavior demo
npm run example:cursor-pagination  # Cursor-based pagination demo
npm run example:token-refresh      # Token refresh flow demo
```

## How Tests Work

### Configuration

Four Jest configs drive the test suites (the benchmarks and the soak are not Jest tests; see Tier 2.5):

- **Unit + BDD**: `jest.unit.config.cjs` — runs TDD and BDD tests with `jest-fetch-mock`
- **Integration**: `jest.integration.config.cjs` — runs integration tests against live ESI (30s timeout)
- **Contract**: `jest.contract.config.cjs` — runs deep contract tests against live spec (60s timeout)
- **Fuzz**: `jest.fuzz.config.cjs` — runs property-based fuzz tests with fast-check (30s timeout)

Common setup:

- **Setup**: `src/config/jest/jest.setup.ts` — enables `jest-fetch-mock`, creates a shared `ApiClient`, resets rate limiter before each test
- **Global setup/teardown**: `src/config/jest/globalSetup.ts` and `globalTeardown.ts`

### Mocking

All unit and BDD tests use [jest-fetch-mock](https://github.com/jefflau/jest-fetch-mock) to intercept `fetch` calls. No real HTTP requests are made during unit/BDD tests.

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import fetchMock from 'jest-fetch-mock';

fetchMock.mockResponseOnce(JSON.stringify({ name: 'Jita' }));
const result = await universeClient.getSystemById(30000142);
expect(result.name).toBe('Jita');
```

Error scenarios mock non-200 status codes:

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
fetchMock.mockResponseOnce('Not Found', { status: 404 });
await expect(client.getAllianceById(99999999)).rejects.toThrow(
  'Resource not found',
);
```

### Time and randomness

An assertion about `Expires`, retry backoff or circuit half-open timing is only deterministic if the code under test takes its time from something the test controls. `npm run lint:determinism` (`eslint.determinism.rules.cjs`, driven by `scripts/determinism-lint.ts`) restricts these in `src/`: `Date.now()`, `new Date()` and `Date()` with no arguments, `performance.now()`, `process.hrtime`, `Math.random()`, `setTimeout`, `setInterval`, `setImmediate`, `queueMicrotask` (bare or through `globalThis`, `global`, `window`, `self`) and imports of `timers` / `timers/promises`. Parsing a date (`new Date(header)`, `Date.parse`) is allowed. The one allow-listed path is the clock module, `src/core/clock.ts`; inline `eslint-disable` comments are ignored.

The sites that exist today are counted per file and construct in `scripts/determinism-baseline.json`. The baseline only shrinks: a count above its entry fails (a new site), a count below its entry fails until the entry is lowered (`npm run lint:determinism -- --update`, which never raises one), and an entry above `origin/master`'s fails. With no base ref resolvable (set `DETERMINISM_BASE_REF`, or fetch master) the check fails closed. Until call sites move to an injected clock, tests of existing timing code keep using `jest.useFakeTimers()`.

Each restricted construct has a negative fixture in `tests/tdd/determinism-lint/fixtures/violations/`, linted through ESLint's Node API by `tests/tdd/determinism-lint/determinism-lint.test.ts`, alongside compliant fixtures (including the clock module at its allow-listed path) that must produce no findings and the ratchet's added, stale and no-base-ref cases.

### Test Helpers

**`src/core/util/testHelpers.ts`** — provides `getBody()` wrapper used in TDD tests:

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { getBody } from '../../../src/core/util/testHelpers';

const result = await getBody(() => allianceClient.getAllianceById(allianceId));
expect(result.name).toBe('Goonswarm Federation');
```

**`src/testing/TestDataFactory.ts`** — factory for creating mock data with sensible defaults and optional overrides:

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

// Create mock data with defaults
const alliance = TestDataFactory.createAllianceInfo();
// => { alliance_id: 99005338, name: 'Goonswarm Federation', ticker: 'CONDI', ... }

// Override specific fields
const custom = TestDataFactory.createAllianceInfo({
  name: 'My Alliance',
  ticker: 'TEST',
});

// Create error instances
const notFound = TestDataFactory.createError(404);
// => EsiError { statusCode: 404, message: 'Resource not found' }
```

Available factory methods:

| Method                                 | Returns                        |
| -------------------------------------- | ------------------------------ |
| `createAllianceInfo()`                 | `AllianceInfo`                 |
| `createAllianceContact()`              | `AllianceContact`              |
| `createAllianceContactLabel()`         | `AllianceContactLabel`         |
| `createCharacterInfo()`                | `CharacterInfo`                |
| `createCharacterPortrait()`            | `CharacterPortrait`            |
| `createCharacterAttributes()`          | `CharacterAttributes`          |
| `createCharacterSkill()`               | `CharacterSkill`               |
| `createCharacterRoles()`               | Roles object                   |
| `createCharacterLocation()`            | Location object                |
| `createCharacterSkills()`              | Skills summary                 |
| `createCharacterAsset()`               | Asset object                   |
| `createCharacterMarketOrder()`         | Character market order         |
| `createCharacterOrderHistory()`        | Order history entry            |
| `createCharacterMedal()`               | Medal object                   |
| `createCharacterNotification()`        | Notification object            |
| `createCorporationInfo()`              | `CorporationInfo`              |
| `createCorporationHistoryEntry()`      | Corp history entry             |
| `createCorporationMemberRoles()`       | Member roles object            |
| `createCorporationAsset()`             | Corp asset object              |
| `createCorporationStructure()`         | Structure object               |
| `createCorporationWallet()`            | Wallet division                |
| `createMarketOrder()`                  | `MarketOrder`                  |
| `createMarketPrice()`                  | Price object                   |
| `createMarketHistory()`                | History entry                  |
| `createWalletTransaction()`            | `WalletTransaction`            |
| `createCorporationWalletTransaction()` | `CorporationWalletTransaction` |
| `createWalletJournalEntry()`           | Journal entry                  |
| `createContract()`                     | `Contract`                     |
| `createPublicContract()`               | `PublicContract`               |
| `createFleetInfo()`                    | Fleet object                   |
| `createFleetMember()`                  | Fleet member                   |
| `createFleetWing()`                    | Fleet wing                     |
| `createIndustryJob()`                  | Industry job                   |
| `createCorporationIndustryJob()`       | Corporation industry job       |
| `createBlueprint()`                    | Blueprint object               |
| `createSolarSystem()`                  | System object                  |
| `createStation()`                      | Station object                 |
| `createStructure()`                    | Structure object               |
| `createItemType()`                     | Type object                    |
| `createItemGroup()`                    | Group object                   |
| `createStar()`                         | Star object                    |
| `createPlanet()`                       | Planet object                  |
| `createSearchResults()`                | Search result set              |
| `createEntityName()`                   | Named entity                   |
| `createSovereigntySystem()`            | Sovereignty system (combined)  |
| `createSovereigntyHub()`               | Sovereignty hub                |
| `createOrbitalSkyhook()`               | Orbital skyhook                |
| `createRaidableSkyhook()`              | Raidable skyhook               |
| `createMercenaryDen()`                 | Mercenary den                  |
| `createMercenaryTacticalOperation()`   | Mercenary tactical operation   |
| `createAccessListEntry()`              | Access list entry              |
| `createError(statusCode)`              | `EsiError`                     |
| `createTestScenarios()`                | Full test scenario set         |
| `createPerformanceTestData(size)`      | Bulk test data                 |
| `createRealisticTestData()`            | Linked alliance/corp/character |

Every payload builder's default output passes the Zod schema its endpoint is validated with. `tests/tdd/testing/TestDataFactory.schemas.test.ts` enforces this, so a new builder must be added to its map. The same test checks that builders leave out fields ESI never sends (an entity's own ID on its detail route, for example) and include the fields its spec marks required.

## TDD Test Pattern

Each domain client has one test file. Tests instantiate the client directly with a mock `ApiClient`, mock the fetch response, call the method, and assert the result.

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { AllianceClient } from '../../../src/clients/AllianceClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

describe('AllianceClient', () => {
  let allianceClient: AllianceClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .build();
    allianceClient = new AllianceClient(client);
  });

  it('should return alliance info', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
      }),
    );

    const result = await getBody(() =>
      allianceClient.getAllianceById(99005338),
    );
    expect(result.name).toBe('Goonswarm Federation');
  });

  it('should throw on 404', async () => {
    fetchMock.mockResponseOnce('Not Found', { status: 404 });
    await expect(allianceClient.getAllianceById(99999999)).rejects.toThrow(
      'Resource not found',
    );
  });
});
```

## BDD Test Pattern

BDD tests use proper Gherkin `.feature` files with matching step definition files using `jest-cucumber`.

**Feature file** (`tests/bdd/features/core/alliance.feature`):

```gherkin
Feature: Alliance API
  Scenario: Get alliance details for valid ID
    Given a valid alliance ID
    When I request alliance details
    Then I receive alliance information with name and ticker
```

**Step definitions** (`tests/bdd/step-definitions/core/alliance.steps.ts`):

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { EsiClient } from '../../../src/EsiClient';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('Feature: Alliance API', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({ clientId: 'test-client' });
  });

  describe('Scenario: Get alliance details for valid ID', () => {
    it('Given a valid alliance ID, When I request details, Then I receive alliance info', async () => {
      const expected = TestDataFactory.createAllianceInfo({
        name: 'Goonswarm Federation',
      });
      jest
        .spyOn(client.alliance, 'getAllianceById')
        .mockResolvedValue(expected);

      const result = await client.alliance.getAllianceById(99005338);

      expect(result.name).toBe('Goonswarm Federation');
      expect(result).toHaveProperty('ticker');
    });
  });
});
```

## Error Handling in Tests

API errors are modeled with `EsiError` (from `src/core/util/error.ts`):

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { EsiError } from '../../../src/core/util/error';

// The API layer throws EsiError on 4xx/5xx responses
fetchMock.mockResponseOnce('Not Found', { status: 404 });
await expect(client.getAllianceById(99999999)).rejects.toThrow(
  'Resource not found',
);

// Or use TestDataFactory for mock errors
const error = TestDataFactory.createError(429, 'Rate limit exceeded');
jest.spyOn(client.alliance, 'getAllianceById').mockRejectedValue(error);
```

### Shared Error Test Helper

The `describeClientErrors` helper (`tests/tdd/helpers/clientErrorTests.ts`) generates a standard error handling `describe` block that tests all 5 HTTP error codes (500, 404, 401, 403, 429) against the exact messages from `ApiRequestHandler.STATUS_MESSAGES`, and checks that the thrown error carries the status code. Each case builds a fresh `ApiClient` and passes it to the callback, which must construct the domain client from it rather than reuse the suite's client: a 429 blocks the endpoint's rate-limit group for 60 seconds on the client that received it, and a shared client would make every later test in the file time out once `jest --randomize` puts the 429 case first.

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { describeClientErrors } from '../helpers/clientErrorTests';

describe('MarketClient', () => {
  // ... other tests ...

  describeClientErrors('MarketClient', (apiClient) =>
    new MarketClient(apiClient).getMarketPrices(),
  );
});
```

This adds 5 error tests per client and is used in all 30 non-trivial domain client test files.

## Test Architecture Decisions

### Why ten tiers?

- **TDD unit tests** — fast, deterministic, cover every code path with mocked fetch. Run on every push.
- **BDD behavioral tests** — Gherkin scenarios readable by non-engineers, verify user-facing behaviors. Run on every push.
- **Benchmark tests** — `performance.now()` timing with CI-safe upper bounds on core infrastructure (rate limiter, circuit breaker, cache, batch handler). Guards against performance regressions without flaking on slow CI runners.
- **Mocked integration** (`full-stack.test.ts`) — verifies the full request pipeline (cache → rate limit → circuit breaker → fetch → middleware) with deterministic mocked responses. Run on every push.
- **Live smoke tests** (`live-esi.test.ts`) — catches URL construction bugs, response shape changes, and real HTTP behavior that mocks can't replicate. Run on-demand or scheduled.
- **Client integration** (`client-integration.test.ts`) — verifies the full `EsiClient` facade works end-to-end against live ESI, including pagination and ETag caching. Run on-demand.
- **Spec contract tests** (`esi-spec-contract.test.ts`) — catches API drift by comparing the codebase against the live ESI OpenAPI spec before it causes runtime failures. Run weekly.
- **Deep contract tests** (`tests/contract/`) — structural validation of all endpoint definitions against the live OpenAPI spec: path params, query params, request bodies, auth, schemas, pagination, deprecation. Run on every PR.
- **Property-based fuzz tests** (`tests/fuzz/`) — fast-check fuzzing of `validatePathParam()`, `validateQueryParam()`, `buildEndpointPath()`, and all Zod schemas with random/adversarial inputs. 601 tests. Run on every PR.
- **Gated auth tests** (`gated-auth.test.ts`) — verifies authenticated endpoints with a real OAuth token. Run weekly with token refresh.

### Why both TDD and BDD?

TDD tests cover implementation details (internal functions, edge cases, error paths). BDD tests describe user-facing behaviors in Gherkin that can be read by non-engineers. The overlap is intentional — TDD catches the how, BDD verifies the what.

### Why snapshot the public API surface?

`publicApiSurface.test.ts` acts as a breaking-change detector. If someone renames a method, removes an export, or changes a class hierarchy, this test fails immediately — before the change ships as a semver-violating release.

### Why check that every export is referenced by a test?

Coverage percentages measure the code tests run, so an exported function nothing calls and an exported type nothing names are invisible to them. `npm run test:export-coverage` lists, per `package.json` entry point, the exports no file under `tests/` resolves to (the TypeScript checker decides, so a name in a comment or string does not count). CI fails on a new unreferenced export and the baseline in `scripts/export-coverage-baseline.json` only shrinks. See [QUALITY-GATES.md](QUALITY-GATES.md#export-coverage).

## Schema Validation Tests

Zod schema validation is tested at multiple levels:

### Schema Parsing Tests (`tests/tdd/schemas/`)

Schema parsing tests validate that each Zod schema in `src/schemas/` correctly matches the expected ESI response shapes. Tests verify that valid ESI response payloads parse successfully, that required fields are enforced, and that `z.looseObject()` preserves extra fields not yet in the schema.

### Schema Rejection Tests (`tests/tdd/schemas/schemaRejection.test.ts`)

423 table-driven tests covering all 141 schemas across 35 schema files. Uses `describe.each` with test cases for:

1. **Valid data** — `safeParse().success === true` with correctly shaped input
2. **Wrong type rejection** — `safeParse().success === false` when a required field has the wrong type
3. **Extra field preservation** — `safeParse().success === true` when extra fields are present, verifying `looseObject` behavior

Uses `TestDataFactory` where factory methods exist; inline data for the rest.

### Validation Integration Tests

Integration-level tests verify that `EsiValidationError` is thrown when `createClient()` receives a response that does not conform to the endpoint's Zod schema. These tests exercise the full validation pipeline: `createClient()` calls `def.responseSchema.safeParse(body)` and converts Zod parse failures into `EsiValidationError` instances with structured error details.

### BDD Validation Scenarios

BDD scenarios cover the validation feature from a consumer perspective, verifying that consumers receive validated, type-safe data from domain client methods when `validateResponse` is enabled (the default), and that invalid responses produce meaningful error messages.

## Adding New Tests

1. **TDD test**: Create `tests/tdd/<domain>/<ClientName>.test.ts`. Mock fetch responses, call client methods, assert results.
2. **BDD test**: Add a `.feature` file in `tests/bdd/features/core/`, a spec entry at the same path under `tests/bdd/specs/core/`, and one file per new step in `tests/bdd/steps/<keyword>/`. Queue HTTP responses at the transport seam; see `tests/bdd/README.md`.
3. **Integration test**: Add to `tests/integration/`. Use real fetch (no mocks). Keep tests idempotent and read-only against ESI.
4. **Test data**: Add factory methods to `src/testing/TestDataFactory.ts` if new response types are needed.

Unit and BDD tests run through `jest.unit.config.cjs`. Integration tests use `jest.integration.config.cjs`.

## Gaps and Future Work

### Known gaps

| Gap                      | Severity | Notes                                                                                                                     |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Phantom endpoints        | Low      | 17 codebase endpoints not yet in public ESI spec (access-lists, freelance-jobs, mercenary, skyhooks — newer EVE features) |
| Type drift               | Medium   | ~45 fields in spec not yet in hand-written types; ~14 optionality mismatches                                              |
| Route method mismatch    | Low      | Route endpoint is POST in code but GET in spec — needs investigation                                                      |
| No chaos/fault injection | Low      | No tests for partial network failures, DNS resolution failures, or TLS errors                                             |
| Corporate auth endpoints | Medium   | Gated tests only cover character-level auth, not corporation director endpoints                                           |

### Recommended CI schedule

| Job                       | Frequency                   | Config                                                |
| ------------------------- | --------------------------- | ----------------------------------------------------- |
| Unit + BDD                | Every push                  | `npm test`                                            |
| Mocked integration        | Every push                  | `npm run test:integration`                            |
| Benchmarks (A/B vs base)  | Every PR touching hot paths | `npm run bench:ab` then `npm run bench:compare`       |
| Benchmarks vs reference   | Nightly                     | `nightly-benchmarks.yml`                              |
| Heap soak                 | Nightly                     | `npm run soak`                                        |
| Deep contract tests       | Every PR                    | `ESI_LIVE_TESTS=true npm run contract:live`           |
| Recorded payload replay   | Every PR                    | `npm run contract:replay`                             |
| Payload re-recording      | Nightly                     | `ESI_LIVE_TESTS=true npm run contract:record`         |
| Property-based fuzz tests | Every PR                    | `npm run fuzz`                                        |
| Consumer type tests       | Every PR                    | `npm run test:types`                                  |
| Type mutation             | Nightly                     | `npm run test:type-mutation -- --ratchet`             |
| Live smoke tests          | Daily/weekly                | `ESI_LIVE_TESTS=true npm run test:integration`        |
| Spec drift detection      | Weekly                      | `npm run contract:snapshot && npm run contract:diff`  |
| Gated auth tests          | Weekly (with token refresh) | `ESI_GATED_TESTS=true npm run test:integration:gated` |

## Debugging

```bash
# Run a single test file
npx jest --config jest.unit.config.cjs tests/tdd/alliances/AllianceClient.test.ts

# Run tests matching a name pattern
npx jest --config jest.unit.config.cjs --testNamePattern="should return valid alliance"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --config jest.unit.config.cjs --runInBand
```

## Other Commands

```bash
# Full validation (lint + format + build + test + ESI validation)
npm run check:all

# ESI spec validation script (standalone)
npm run validate:esi

# Regenerate types from live spec
npm run generate:types
```

## File Reference

| Path                                           | Purpose                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| `jest.unit.config.cjs`                         | Unit + BDD test config (coverage thresholds)        |
| `jest.integration.config.cjs`                  | Integration test config (30s timeout)               |
| `jest.contract.config.cjs`                     | Contract test config (60s timeout)                  |
| `jest.fuzz.config.cjs`                         | Fuzz test config (30s timeout)                      |
| `tests/tdd/`                                   | 130 TDD test files                                  |
| `tests/tdd/helpers/clientErrorTests.ts`        | Shared HTTP error test generator (5 status codes)   |
| `tests/tdd/core/apiSurfaceSnapshots.test.ts`   | API export & shape snapshot tests (5 tests)         |
| `tests/tdd/core/concurrency.test.ts`           | Async scheduling correctness (11 tests)             |
| `tests/tdd/core/utilFunctions.test.ts`         | Core utility function tests (25 tests)              |
| `tests/tdd/schemas/schemaRejection.test.ts`    | Full schema rejection coverage (423 tests)          |
| `tests/benchmark/`                             | Micro-benchmark harness, task catalogue, heap soak  |
| `scripts/bench-ab.ts`                          | Runs two trees in alternating processes             |
| `scripts/bench-compare-core.ts`                | Mann-Whitney U, Holm, bootstrap, the verdict        |
| `scripts/soak-core.ts`                         | Heap trend, cache bound, timer and listener checks  |
| `tests/bdd/features/`                          | 40 Gherkin feature files                            |
| `tests/bdd/step-definitions/`                  | 40 step definition files + shared helpers           |
| `tests/integration/full-stack.test.ts`         | Mocked full-lifecycle integration (20 tests)        |
| `tests/integration/live-esi.test.ts`           | Live API smoke tests (40 tests)                     |
| `tests/integration/client-integration.test.ts` | Live EsiClient integration (11 tests)               |
| `tests/integration/esi-spec-contract.test.ts`  | ESI spec drift detection (10 tests)                 |
| `tests/integration/gated-auth.test.ts`         | Authenticated endpoint tests (33 tests)             |
| `tests/contract/esi-contract.test.ts`          | Deep contract validation (8 categories)             |
| `tests/contract/esi-snapshot.test.ts`          | Spec snapshot comparison                            |
| `tests/contract/helpers.ts`                    | Shared spec parsing utilities                       |
| `tests/fuzz/parameter-fuzz.test.ts`            | Validation function fuzzing                         |
| `tests/fuzz/url-construction-fuzz.test.ts`     | URL construction fuzzing                            |
| `tests/fuzz/schema-fuzz.test.ts`               | Zod schema fuzzing                                  |
| `tests/fuzz/pagination-fuzz.test.ts`           | Pagination parameter fuzzing                        |
| `tests/typetests/index.test-d.ts`              | Consumer type tests (tsd)                           |
| `tests/consumer/`                              | Consumer contract package (`npm run test:consumer`) |
| `tests/doc-examples/`                          | Doc example prelude and stub fetch                  |
| `src/testing/TestDataFactory.ts`               | Mock data factory for tests                         |
| `scripts/validate-esi-endpoints.ts`            | Standalone ESI spec validation script               |
| `scripts/generate-esi-types.ts`                | Type/cache/scope generator from live spec           |
