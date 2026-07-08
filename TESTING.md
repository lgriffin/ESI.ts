# Testing Guide

## Overview

ESI.ts uses a multi-tier testing strategy to ensure correctness at every level — from individual functions to live API contract validation.

| Tier                 |      Tests |   Suites | Purpose                                                                     |
| -------------------- | ---------: | -------: | --------------------------------------------------------------------------- |
| TDD (unit)           |            |       81 | Per-module unit tests with mocked HTTP                                      |
| BDD (behavioral)     |            |       40 | Gherkin-style scenarios covering user-facing behaviors                      |
| Integration (mocked) |         20 |        1 | Full request lifecycle with mocked fetch                                    |
| Integration (live)   |         61 |        3 | Real HTTP against live ESI — smoke tests, client integration, spec contract |
| Integration (gated)  |         33 |        1 | Authenticated endpoints with real OAuth token                               |
| Deep contract        |         15 |        2 | Endpoint definitions validated against live OpenAPI spec                    |
| Property-based fuzz  |        601 |        4 | Random/adversarial inputs via fast-check                                    |
| Type-level (tsd)     |         15 |        1 | Compile-time type assertions on public API surface                          |
| **Total**            | **3,800+** | **130+** | (`npm test` runs TDD + BDD)                                                 |

### Before / After This Effort

| Metric      | Before |  After |   Delta |
| ----------- | -----: | -----: | ------: |
| Test suites |    112 |    121 |      +9 |
| Total tests |  2,901 |  3,224 |    +323 |
| Statements  | 90.32% | 96.35% | +6.03pp |
| Branches    | 86.92% | 87.40% | +0.48pp |
| Functions   | 84.37% | 93.20% | +8.83pp |
| Lines       | 92.21% | 96.38% | +4.17pp |

### New Test Files — Per-File Breakdown

| File                          |   Tests | Category                                        |
| ----------------------------- | ------: | ----------------------------------------------- |
| `resilience.test.ts`          |      12 | Rate limits, malformed responses, retry, dedup  |
| `security.test.ts`            |      23 | Token leakage, HTTPS, host allowlist, injection |
| `configValidation.test.ts`    |      33 | Builder, factory, config combos, shutdown       |
| `publicApiSurface.test.ts`    |     135 | Export snapshot — breaking-change detector      |
| `crossCutting.test.ts`        |      15 | Diagnostics, middleware ordering, logger        |
| `esi-spec-contract.test.ts`   |      10 | Live OpenAPI drift detection                    |
| `client-integration.test.ts`  |      11 | Full EsiClient against live ESI                 |
| `live-esi.test.ts` (expanded) |      40 | Smoke tests across 42 endpoints                 |
| **New/expanded total**        | **279** |                                                 |

## Coverage

Current coverage (unit + BDD, measured by Jest):

| Metric     |  Value | Threshold |
| ---------- | -----: | --------: |
| Statements | 96.35% |       90% |
| Branches   | 87.40% |       80% |
| Functions  | 93.20% |       75% |
| Lines      | 96.38% |       90% |

Coverage is collected from `src/**/*.ts` (excluding `.d.ts` and `src/types/`).

## Test Tiers

### Tier 1: TDD Unit Tests

**Location:** `tests/tdd/`
**Config:** `jest.unit.config.cjs`
**Run:** `npm test`

81 test files covering:

- **Domain clients** (35 files) — One per ESI API module (AllianceClient, MarketClient, etc.). Each mocks `fetch` and verifies correct URL construction, response parsing, and type safety.
- **Core infrastructure** (35+ files) — Circuit breaker, rate limiter, pagination (offset + cursor), ETag cache, request deduplication, retry with backoff, middleware pipeline, endpoint definitions, validation, error handling, timeout behavior, diagnostics, and configuration.
- **Resilience** (`resilience.test.ts`) — 429/420 rate limit handling, malformed JSON, truncated responses, empty bodies, stale cache fallback on 5xx, retry with backoff, network timeout, request deduplication under concurrent load.
- **Security** (`security.test.ts`) — Token not leaked to public endpoints, token sent only to authenticated endpoints, HTTPS enforcement, host allowlist, path parameter injection prevention, query parameter length limits, NaN/Infinity rejection.
- **Configuration** (`configValidation.test.ts`) — Default config, all features enabled simultaneously, EsiClientBuilder selective/full client registration, EsiApiFactory methods, token provider, datasource/language config, shutdown idempotency, legacy retry config.
- **Public API Surface** (`publicApiSurface.test.ts`) — Snapshot of all 35 domain client exports, 21 class/function exports, 8 type guard functions, 35 domain accessors on EsiClient, and 13 EsiClient methods. Acts as a contract — if a public export is accidentally removed, this test breaks.
- **Cross-Cutting** (`crossCutting.test.ts`) — Diagnostics accuracy (cache stats, circuit breaker stats, clearCache, resetCircuitBreaker), middleware ordering (request before response, registration order, remove at runtime, constructor config), and custom logger integration.

**Testing pattern:**

```typescript
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

const client = new EsiClient({
  baseUrl: 'https://esi.test.local',
  unsafeAllowCustomHost: true,
  enableETagCache: false,
});

fetchMock.mockResponseOnce(JSON.stringify(mockData), {
  headers: standardHeaders(),
});

const result = await client.status.getStatus();
expect(result.players).toBe(12345);
```

### Tier 2: BDD Behavioral Tests

**Location:** `tests/bdd/`
**Config:** `jest.unit.config.cjs` (same runner as TDD)
**Run:** `npm run bdd`

40 feature files written in Gherkin, with matching step definitions. Covers:

- All 35 domain API modules (alliance, market, universe, etc.)
- Cross-cutting behaviors: ETag caching, response header extraction, deprecation warnings
- Integration workflows: character profile assembly, market analysis, fleet operations
- Performance scenarios: concurrency, large datasets, memory efficiency

Individual modules can be run selectively: `npm run bdd:market`, `npm run bdd:alliance`, etc.

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

### Tier 7: Gated Auth Tests (Live)

**Location:** `tests/integration/gated-auth.test.ts`
**Run:** `ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=... npm run test:integration:gated`

30+ tests for authenticated endpoints using a real OAuth token:

- Location, Skills, Wallet, Assets, Characters, Clones, Contacts, Killmails, Mail, Fittings, Industry, Market (auth), Loyalty, Contracts, Calendar, Search, Faction Warfare

### Tier 8: Deep Contract Tests

**Location:** `tests/contract/`
**Config:** `jest.contract.config.cjs`
**Run:** `ESI_LIVE_TESTS=true npm run contract:live`

15 tests across 2 suites that fetch the live ESI OpenAPI 3.1 spec and validate every SDK endpoint definition against it.

**Contract validation** (`esi-contract.test.ts`) — uses a brace-counting parser to extract all 208 endpoint definitions from `*Endpoints.ts` files, then validates 8 dimensions:

- **Path parameter alignment** — `{param}` names in spec path match the SDK's `pathParams` array
- **Query parameter alignment** — spec's `required: true` query params appear in the SDK's `queryParams`
- **Request body alignment** — spec `requestBody` presence matches SDK's `hasBody`/`bodyBuilder`
- **Auth alignment** — spec OAuth security scopes match SDK's `requiresAuth`
- **Response schema coverage** (advisory) — GET endpoints with JSON responses have a Zod `responseSchema` wired
- **HTTP method match** — SDK method matches spec operation
- **Pagination contract** (advisory) — spec `X-Pages` response headers align with SDK pagination metadata
- **Deprecation sync** (advisory) — spec `deprecated: true` matches SDK's `deprecated` flag

4 known SDK-spec mismatches are tracked in exception sets (not false positives — real issues for future fix):

1. `getCorporationStarbaseDetail` — missing required query param `system_id`
2. `createFleetWing` — SDK has `hasBody` but spec has no `requestBody`
3. `getCorporationHistory` — SDK has `requiresAuth: true` but spec has no security scopes
4. `getMarketOrdersInStructure` — spec requires auth but SDK has `requiresAuth: false`

**Snapshot comparison** (`esi-snapshot.test.ts`) — compares a saved spec baseline against the live spec, reporting path additions/removals, schema count changes, and cache TTL drift as advisory warnings.

### Tier 9: Property-Based Fuzz Tests

**Location:** `tests/fuzz/`
**Config:** `jest.fuzz.config.cjs`
**Run:** `npm run fuzz`

601 tests across 4 suites using [fast-check](https://github.com/dubzzz/fast-check) to generate random and adversarial inputs, verifying that invariants hold under all conditions. No network required.

**Parameter fuzzing** (`parameter-fuzz.test.ts`) — fuzzes `validatePathParam()` and `validateQueryParam()` from `src/core/util/validation.ts`:

- Positive integers always pass and return their string representation
- Null, undefined, and empty strings are always rejected
- Strings with unsafe path characters (`/\?#@!$&'()*+,;=<>{}|^``) are always rejected
- NaN, Infinity, -Infinity are always rejected
- Non-primitive inputs (objects, arrays) never pass validation

**URL construction fuzzing** (`url-construction-fuzz.test.ts`) — fuzzes `buildEndpointPath()` from `src/core/endpoints/buildEndpointPath.ts`:

- Output path never contains raw `{param}` placeholders after substitution
- Path traversal strings with slashes are rejected; `..` alone is safely URI-encoded
- Special characters in params are encoded via `encodeURIComponent()`
- Datasource is appended to query string
- Body extraction works correctly

**Schema fuzzing** (`schema-fuzz.test.ts`) — fuzzes all Zod schemas from `src/schemas/`:

- `safeParse()` never throws for any input (565 tests across all schema exports)
- Handles primitive edge cases (null, undefined, 0, empty string, empty array/object)
- Handles deeply nested random objects from `fc.anything()`
- Rejects non-object primitives where schemas expect objects

**Pagination fuzzing** (`pagination-fuzz.test.ts`) — fuzzes page parameter handling:

- Valid pages, zero, negative, large values, NaN, Infinity, floats, numeric strings

### Type-Level Tests (tsd)

**Location:** `tests/typetests/index.test-d.ts`
**Run:** `npm run test:types`

Compile-time type assertions using [tsd](https://github.com/tsdjs/tsd) that verify the public API surface types are correct:

- `EsiClient` construction accepts `{}`
- Error type guards (`isEsiError`, `isRateLimited`, `isNotFound`, etc.) return `boolean`
- `EsiError` has `statusCode: number`
- Core infrastructure constructors (`CircuitBreaker`, `RateLimiter`, `ETagCacheManager`)
- `buildEndpointPath()` returns `{ path: string; body: unknown }`

### Spec Drift Detection (CI)

**Tools:** oasdiff (Docker), Prism, Schemathesis

- **oasdiff** — detects breaking changes between saved and live OpenAPI specs (`npm run contract:diff`)
- **Prism** — spec-conformant ESI mock server on port 4010 (`npm run mock:esi`)
- **Schemathesis** — Docker-based API fuzzer that runs against Prism (`npm run fuzz:api`)
- Spec drift runs weekly in the `maintenance.yml` workflow

## Running Tests

```bash
# All unit + BDD tests (default)
npm test

# BDD tests only
npm run bdd

# BDD for a specific module
npm run bdd:market

# Mocked integration tests
npm run test:integration

# Live smoke tests (requires network)
ESI_LIVE_TESTS=true npm run test:integration

# On Windows (PowerShell), use cross-env:
npx cross-env ESI_LIVE_TESTS=true npm run test:integration

# Authenticated endpoint tests (requires OAuth token)
ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=<token> npm run test:integration:gated

# Deep contract tests (requires network — fetches live spec)
ESI_LIVE_TESTS=true npm run contract:live

# Property-based fuzz tests (no network needed)
npm run fuzz

# Type-level tests
npm run test:types

# Save spec snapshot for drift comparison
npm run contract:snapshot

# Detect breaking spec changes (requires Docker)
npm run contract:diff

# Start ESI mock server (requires npm install)
npm run mock:esi

# API fuzz testing against mock (requires Docker)
npm run fuzz:api

# Everything (unit + BDD + integration + fuzz + types)
npm run test:all

# Full validation (lint + format + build + test + ESI validation)
npm run check:all

# ESI spec validation script (standalone)
npm run validate:esi

# Regenerate types from live spec
npm run generate:types
```

## Test Architecture Decisions

### Why three integration tiers?

- **Mocked integration** (`full-stack.test.ts`) runs in CI on every push — fast, deterministic, catches orchestration bugs.
- **Live smoke tests** (`live-esi.test.ts`, `client-integration.test.ts`) run on-demand or on a schedule — catches URL construction bugs, response shape changes, and real HTTP behavior that mocks can't replicate.
- **Spec contract tests** (`esi-spec-contract.test.ts`) run on-demand — catches API drift before it causes runtime failures.

### Why both TDD and BDD?

TDD tests cover implementation details (internal functions, edge cases, error paths). BDD tests describe user-facing behaviors in Gherkin that can be read by non-engineers. The overlap is intentional — TDD catches the how, BDD verifies the what.

### Why snapshot the public API surface?

`publicApiSurface.test.ts` acts as a breaking-change detector. If someone renames a method, removes an export, or changes a class hierarchy, this test fails immediately — before the change ships as a semver-violating release.

### Why deep contract tests separate from spec contract tests?

The existing Tier 6 spec contract tests (`esi-spec-contract.test.ts`) check surface-level drift — endpoint coverage counts, type field names, and generated file staleness. The Tier 8 deep contract tests validate structural correctness of every endpoint definition: does the SDK's `pathParams` array match the actual `{param}` names in the spec path? Does the SDK require auth when the spec requires auth? These are harder failures that catch real bugs — and indeed found 4 real mismatches on the first run.

### Why property-based fuzzing?

Traditional unit tests check known inputs. Property-based tests check invariants across thousands of random inputs — including edge cases a human wouldn't think to write (objects where `toString` is an array, strings with embedded null bytes, integers at `MAX_SAFE_INTEGER`). The fuzz tests discovered that `validatePathParam` can throw a raw `TypeError` instead of an `EsiError` when given objects with broken `toString` methods — a real edge case that no hand-written test covered.

## Gaps and Future Work

### Known gaps

| Gap                           | Severity | Notes                                                                                                                     |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Phantom endpoints             | Low      | 17 codebase endpoints not yet in public ESI spec (access-lists, freelance-jobs, mercenary, skyhooks — newer EVE features) |
| Type drift                    | Medium   | ~45 fields in spec not yet in hand-written types; ~14 optionality mismatches                                              |
| Route method mismatch         | Low      | Route endpoint is POST in code but GET in spec — needs investigation                                                      |
| Contract deviations (4)       | Medium   | See Tier 8 — 4 real SDK-spec mismatches tracked in exception sets, not yet fixed                                          |
| Non-primitive param edge case | Low      | `validatePathParam` throws raw `TypeError` for objects with broken `toString` — discovered by fuzz testing                |
| No chaos/fault injection      | Low      | No tests for partial network failures, DNS resolution failures, or TLS errors                                             |
| No load/soak testing          | Low      | Performance BDD tests use mocks; no real-world latency benchmarking                                                       |
| Corporate auth endpoints      | Medium   | Gated tests only cover character-level auth, not corporation director endpoints                                           |

### Recommended CI schedule

| Job                      | Frequency                   | Config                                                                                 |
| ------------------------ | --------------------------- | -------------------------------------------------------------------------------------- |
| Unit + BDD               | Every push                  | `npm test && npm run bdd`                                                              |
| Mocked integration       | Every push                  | `npm run test:integration`                                                             |
| Fuzz tests               | Every push                  | `npm run fuzz`                                                                         |
| Type-level tests         | Every push                  | `npm run test:types`                                                                   |
| Deep contract tests      | Every push                  | `ESI_LIVE_TESTS=true npm run contract:live`                                            |
| Live smoke tests         | Daily/weekly                | `ESI_LIVE_TESTS=true npm run test:integration`                                         |
| Spec contract validation | Weekly                      | `ESI_LIVE_TESTS=true npm run test:integration -- --testPathPatterns=esi-spec-contract` |
| Spec drift detection     | Weekly                      | `npm run contract:snapshot && npm run contract:diff`                                   |
| API fuzz (Schemathesis)  | Weekly                      | `npm run fuzz:api` (Docker)                                                            |
| Gated auth tests         | Weekly (with token refresh) | `ESI_GATED_TESTS=true npm run test:integration:gated`                                  |

## File Reference

| Path                                           | Purpose                                      |
| ---------------------------------------------- | -------------------------------------------- |
| `jest.unit.config.cjs`                         | Unit + BDD test config (coverage thresholds) |
| `jest.integration.config.cjs`                  | Integration test config (30s timeout)        |
| `jest.contract.config.cjs`                     | Contract test config (60s timeout)           |
| `jest.fuzz.config.cjs`                         | Fuzz test config (30s timeout)               |
| `tests/tdd/`                                   | 81 TDD test files                            |
| `tests/bdd/features/`                          | 40 Gherkin feature files                     |
| `tests/bdd/step-definitions/`                  | 40 step definition files                     |
| `tests/integration/full-stack.test.ts`         | Mocked full-lifecycle integration            |
| `tests/integration/live-esi.test.ts`           | Live API smoke tests (40 tests)              |
| `tests/integration/client-integration.test.ts` | Live EsiClient integration (11 tests)        |
| `tests/integration/esi-spec-contract.test.ts`  | ESI spec drift detection (10 tests)          |
| `tests/integration/gated-auth.test.ts`         | Authenticated endpoint tests (30+ tests)     |
| `tests/contract/helpers.ts`                    | Shared utilities for contract tests          |
| `tests/contract/esi-contract.test.ts`          | Deep contract validation (8 categories)      |
| `tests/contract/esi-snapshot.test.ts`          | Spec snapshot comparison                     |
| `tests/contract/snapshots/`                    | Saved ESI OpenAPI spec baseline              |
| `tests/fuzz/parameter-fuzz.test.ts`            | Fuzz validatePathParam/validateQueryParam    |
| `tests/fuzz/url-construction-fuzz.test.ts`     | Fuzz buildEndpointPath                       |
| `tests/fuzz/schema-fuzz.test.ts`               | Fuzz all Zod schemas (565 tests)             |
| `tests/fuzz/pagination-fuzz.test.ts`           | Fuzz page parameter handling                 |
| `tests/typetests/index.test-d.ts`              | tsd compile-time type assertions             |
| `scripts/snapshot-openapi.ts`                  | Fetch and save spec snapshot                 |
| `scripts/run-schemathesis.sh`                  | Prism + Schemathesis runner                  |
| `src/testing/TestDataFactory.ts`               | Mock data factory for tests                  |
| `scripts/validate-esi-endpoints.ts`            | Standalone ESI spec validation script        |
| `scripts/generate-esi-types.ts`                | Type/cache/scope generator from live spec    |
