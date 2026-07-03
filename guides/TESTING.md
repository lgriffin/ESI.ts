# Testing Guide for ESI.ts

## Overview

ESI.ts uses a multi-tier testing strategy to ensure correctness at every level — from individual functions to live API contract validation.

| Tier                 |     Tests |  Suites | Purpose                                                                     |
| -------------------- | --------: | ------: | --------------------------------------------------------------------------- |
| TDD (unit)           |     2,784 |      78 | Per-module unit tests with mocked HTTP                                      |
| BDD (behavioral)     |       335 |      39 | Gherkin-style scenarios covering user-facing behaviors                      |
| Integration (mocked) |        20 |       1 | Full request lifecycle with mocked fetch                                    |
| Integration (live)   |        61 |       3 | Real HTTP against live ESI — smoke tests, client integration, spec contract |
| Integration (gated)  |        33 |       1 | Authenticated endpoints with real OAuth token                               |
| **Total**            | **3,233** | **122** |                                                                             |

## Coverage

Current coverage (unit + BDD, measured by Jest):

| Metric     |  Value | Threshold |
| ---------- | -----: | --------: |
| Statements | 96.35% |       90% |
| Branches   | 87.40% |       80% |
| Functions  | 93.20% |       75% |
| Lines      | 96.38% |       90% |

Coverage is collected from `src/**/*.ts` (excluding `.d.ts` and `src/types/`).

### Per-File Test Breakdown (New Test Suites)

| File                          | Tests | Category                                        |
| ----------------------------- | ----: | ----------------------------------------------- |
| `resilience.test.ts`          |    12 | Rate limits, malformed responses, retry, dedup  |
| `security.test.ts`            |    23 | Token leakage, HTTPS, host allowlist, injection |
| `configValidation.test.ts`    |    33 | Builder, factory, config combos, shutdown       |
| `publicApiSurface.test.ts`    |   135 | Export snapshot — breaking-change detector      |
| `crossCutting.test.ts`        |    15 | Diagnostics, middleware ordering, logger        |
| `esi-spec-contract.test.ts`   |    10 | Live swagger drift detection                    |
| `client-integration.test.ts`  |    11 | Full EsiClient against live ESI                 |
| `live-esi.test.ts` (expanded) |    40 | Smoke tests across 42 endpoints                 |

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
│   │   ├── ApiRequestHandler.test.ts
│   │   ├── AsyncPaginationIterator.test.ts
│   │   ├── BatchRequestHandler.test.ts
│   │   ├── buildEndpointPath.test.ts
│   │   ├── circuitBreaker.test.ts
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
│   │   ├── validation.test.ts
│   │   └── WithMetadata.test.ts
│   ├── schemas/                  # Schema validation tests (Zod)
│   │   ├── common-schemas.test.ts
│   │   ├── schema-validation.test.ts
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
# All unit + BDD tests (default) — 121 suites, 3,222 tests
npm test

# Watch mode for development
npm run test:watch

# With coverage report
npm run coverage
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

78 test files covering:

- **Domain clients** (35 files) — One per ESI API module (AllianceClient, MarketClient, etc.). Each mocks `fetch` and verifies correct URL construction, response parsing, and type safety.
- **Core infrastructure** (35+ files) — Circuit breaker, rate limiter, pagination (offset + cursor), ETag cache, request deduplication, retry with backoff, middleware pipeline, endpoint definitions, validation, error handling, timeout behavior, diagnostics, and configuration.
- **Resilience** (`resilience.test.ts`) — 429/420 rate limit handling, malformed JSON, truncated responses, empty bodies, stale cache fallback on 5xx, retry with backoff, network timeout, request deduplication under concurrent load.
- **Security** (`security.test.ts`) — Token not leaked to public endpoints, token sent only to authenticated endpoints, HTTPS enforcement, host allowlist, path parameter injection prevention, query parameter length limits, NaN/Infinity rejection.
- **Configuration** (`configValidation.test.ts`) — Default config, all features enabled simultaneously, EsiClientBuilder selective/full client registration, EsiApiFactory methods, token provider, datasource/language config, shutdown idempotency, legacy retry config.
- **Public API Surface** (`publicApiSurface.test.ts`) — Snapshot of all 35 domain client exports, 21 class/function exports, 8 type guard functions, 35 domain accessors on EsiClient, and 13 EsiClient methods. Acts as a contract — if a public export is accidentally removed, this test breaks.
- **Cross-Cutting** (`crossCutting.test.ts`) — Diagnostics accuracy (cache stats, circuit breaker stats, clearCache, resetCircuitBreaker), middleware ordering (request before response, registration order, remove at runtime, constructor config), and custom logger integration.

### Tier 2: BDD Behavioral Tests

**Location:** `tests/bdd/`
**Config:** `jest.unit.config.cjs` (same runner as TDD)
**Run:** `npm run bdd`

39 feature files written in Gherkin, with matching step definitions. Covers:

- All 35 domain API modules (alliance, market, universe, etc.)
- Cross-cutting behaviors: ETag caching, response header extraction, deprecation warnings
- Integration workflows: character profile assembly, market analysis, fleet operations
- Performance scenarios: concurrency, large datasets, memory efficiency

Individual modules can be run selectively: `npm run bdd:market`, `npm run bdd:alliance`, etc.

#### BDD Test Categories

- **Core** (`bdd/features/core/`): Domain-specific scenarios for all 35 domain clients plus cross-cutting concerns (ETag caching, response headers)
- **Integration** (`bdd/features/integration/`): Cross-domain workflows — character profile assembly, market analysis, fleet operations
- **Performance** (`bdd/features/performance/`): Concurrent requests, large dataset handling, memory efficiency, error handling performance

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

10 tests that fetch the live ESI swagger spec and validate:

- **Endpoint coverage** — Phantom endpoints, HTTP method mismatches, and uncovered spec endpoints are reported as warnings (known drift from newer EVE features not yet in public spec)
- **Type drift** — Missing fields and optionality mismatches are reported as warnings (known gap: ~45 fields, ~14 optionality mismatches)
- **Cache TTL drift** — `esi-cache-ttls.generated.ts` matches `x-cached-seconds` in live spec (**hard fail** — indicates stale generated files)
- **Scope drift** — `esi-scopes.generated.ts` matches security requirements in live spec (**hard fail** — indicates stale generated files)

Known-drift tests warn rather than fail because the discrepancies are tracked debt, not regressions. Cache TTL and scope drift remain hard failures because they indicate the generated files need regeneration (`npm run generate:types`).

### Tier 7: Gated Auth Tests (Live)

**Location:** `tests/integration/gated-auth.test.ts`
**Run:** `ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=... npm run test:integration:gated`

33 tests for authenticated endpoints using a real OAuth token:

- Location, Skills, Wallet, Assets, Characters, Clones, Contacts, Killmails, Mail, Fittings, Industry, Market (auth), Loyalty, Contracts, Calendar, Search, Faction Warfare

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

# Utility / advanced pattern examples
npm run example:rate-limiting      # Rate limiter behavior demo
npm run example:cursor-pagination  # Cursor-based pagination demo
npm run example:token-refresh      # Token refresh flow demo
```

## How Tests Work

### Configuration

Two Jest configs drive the test suites:

- **Unit + BDD**: `jest.unit.config.cjs` — runs TDD and BDD tests with `jest-fetch-mock`
- **Integration**: `jest.integration.config.cjs` — runs integration tests against live ESI (30s timeout)

Common setup:

- **Setup**: `src/config/jest/jest.setup.ts` — enables `jest-fetch-mock`, creates a shared `ApiClient`, resets rate limiter before each test
- **Global setup/teardown**: `src/config/jest/globalSetup.ts` and `globalTeardown.ts`

### Mocking

All unit and BDD tests use [jest-fetch-mock](https://github.com/jefflau/jest-fetch-mock) to intercept `fetch` calls. No real HTTP requests are made during unit/BDD tests.

```typescript
import fetchMock from 'jest-fetch-mock';

fetchMock.mockResponseOnce(JSON.stringify({ name: 'Jita' }));
const result = await universeClient.getSystemById(30000142);
expect(result.name).toBe('Jita');
```

Error scenarios mock non-200 status codes:

```typescript
fetchMock.mockResponseOnce('Not Found', { status: 404 });
await expect(client.getAllianceById(99999999)).rejects.toThrow(
  'Resource not found',
);
```

### Test Helpers

**`src/core/util/testHelpers.ts`** — provides `getBody()` wrapper used in TDD tests:

```typescript
import { getBody } from '../../../src/core/util/testHelpers';

const result = await getBody(() => allianceClient.getAllianceById(allianceId));
expect(result.name).toBe('Goonswarm Federation');
```

**`src/testing/TestDataFactory.ts`** — factory for creating mock data with sensible defaults and optional overrides:

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

| Method                               | Returns                        |
| ------------------------------------ | ------------------------------ |
| `createAllianceInfo()`               | `AllianceInfo`                 |
| `createAllianceContact()`            | `AllianceContact`              |
| `createAllianceContactLabel()`       | `AllianceContactLabel`         |
| `createCharacterInfo()`              | `CharacterInfo`                |
| `createCharacterPortrait()`          | `CharacterPortrait`            |
| `createCharacterAttributes()`        | `CharacterAttributes`          |
| `createCharacterSkill()`             | `CharacterSkill`               |
| `createCharacterRoles()`             | Roles object                   |
| `createCharacterLocation()`          | Location object                |
| `createCharacterSkills()`            | Skills summary                 |
| `createCharacterAsset()`             | Asset object                   |
| `createCharacterMarketOrder()`       | Character market order         |
| `createCharacterOrderHistory()`      | Order history entry            |
| `createCharacterMedal()`             | Medal object                   |
| `createCharacterNotification()`      | Notification object            |
| `createCorporationInfo()`            | `CorporationInfo`              |
| `createCorporationHistoryEntry()`    | Corp history entry             |
| `createCorporationMemberRoles()`     | Member roles object            |
| `createCorporationAsset()`           | Corp asset object              |
| `createCorporationStructure()`       | Structure object               |
| `createCorporationWallet()`          | Wallet division                |
| `createMarketOrder()`                | `MarketOrder`                  |
| `createMarketPrice()`                | Price object                   |
| `createMarketHistory()`              | History entry                  |
| `createWalletTransaction()`          | `WalletTransaction`            |
| `createWalletJournalEntry()`         | Journal entry                  |
| `createContract()`                   | `Contract`                     |
| `createFleetInfo()`                  | Fleet object                   |
| `createFleetMember()`                | Fleet member                   |
| `createFleetWing()`                  | Fleet wing                     |
| `createIndustryJob()`                | Industry job                   |
| `createBlueprint()`                  | Blueprint object               |
| `createSolarSystem()`                | System object                  |
| `createStation()`                    | Station object                 |
| `createStructure()`                  | Structure object               |
| `createItemType()`                   | Type object                    |
| `createItemGroup()`                  | Group object                   |
| `createStar()`                       | Star object                    |
| `createPlanet()`                     | Planet object                  |
| `createSearchResults()`              | Search result set              |
| `createEntityName()`                 | Named entity                   |
| `createSovereigntySystem()`          | Sovereignty system (combined)  |
| `createSovereigntyHub()`             | Sovereignty hub                |
| `createOrbitalSkyhook()`             | Orbital skyhook                |
| `createRaidableSkyhook()`            | Raidable skyhook               |
| `createMercenaryDen()`               | Mercenary den                  |
| `createMercenaryTacticalOperation()` | Mercenary tactical operation   |
| `createAccessListEntry()`            | Access list entry              |
| `createError(statusCode)`            | `EsiError`                     |
| `createTestScenarios()`              | Full test scenario set         |
| `createPerformanceTestData(size)`    | Bulk test data                 |
| `createRealisticTestData()`          | Linked alliance/corp/character |

## TDD Test Pattern

Each domain client has one test file. Tests instantiate the client directly with a mock `ApiClient`, mock the fetch response, call the method, and assert the result.

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

## Test Architecture Decisions

### Why seven tiers?

- **TDD unit tests** — fast, deterministic, cover every code path with mocked fetch. Run on every push.
- **BDD behavioral tests** — Gherkin scenarios readable by non-engineers, verify user-facing behaviors. Run on every push.
- **Mocked integration** (`full-stack.test.ts`) — verifies the full request pipeline (cache → rate limit → circuit breaker → fetch → middleware) with deterministic mocked responses. Run on every push.
- **Live smoke tests** (`live-esi.test.ts`) — catches URL construction bugs, response shape changes, and real HTTP behavior that mocks can't replicate. Run on-demand or scheduled.
- **Client integration** (`client-integration.test.ts`) — verifies the full `EsiClient` facade works end-to-end against live ESI, including pagination and ETag caching. Run on-demand.
- **Spec contract tests** (`esi-spec-contract.test.ts`) — catches API drift by comparing the codebase against the live ESI swagger spec before it causes runtime failures. Run weekly.
- **Gated auth tests** (`gated-auth.test.ts`) — verifies authenticated endpoints with a real OAuth token. Run weekly with token refresh.

### Why both TDD and BDD?

TDD tests cover implementation details (internal functions, edge cases, error paths). BDD tests describe user-facing behaviors in Gherkin that can be read by non-engineers. The overlap is intentional — TDD catches the how, BDD verifies the what.

### Why snapshot the public API surface?

`publicApiSurface.test.ts` acts as a breaking-change detector. If someone renames a method, removes an export, or changes a class hierarchy, this test fails immediately — before the change ships as a semver-violating release.

## Schema Validation Tests

Zod schema validation is tested at multiple levels:

### Schema Parsing Tests (`tests/tdd/schemas/`)

Schema parsing tests validate that each Zod schema in `src/schemas/` correctly matches the expected ESI response shapes. Tests verify that valid ESI response payloads parse successfully, that required fields are enforced, and that `z.looseObject()` preserves extra fields not yet in the schema.

### Validation Integration Tests

Integration-level tests verify that `EsiValidationError` is thrown when `createClient()` receives a response that does not conform to the endpoint's Zod schema. These tests exercise the full validation pipeline: `createClient()` calls `def.responseSchema.safeParse(body)` and converts Zod parse failures into `EsiValidationError` instances with structured error details.

### BDD Validation Scenarios

BDD scenarios cover the validation feature from a consumer perspective, verifying that consumers receive validated, type-safe data from domain client methods when `validateResponse` is enabled (the default), and that invalid responses produce meaningful error messages.

## Adding New Tests

1. **TDD test**: Create `tests/tdd/<domain>/<ClientName>.test.ts`. Mock fetch responses, call client methods, assert results.
2. **BDD test**: Add a `.feature` file in `tests/bdd/features/core/` and a matching `.steps.ts` in `tests/bdd/step-definitions/core/`. Use `jest.spyOn` on `EsiClient` properties.
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
| No load/soak testing     | Low      | Performance BDD tests use mocks; no real-world latency benchmarking                                                       |
| Corporate auth endpoints | Medium   | Gated tests only cover character-level auth, not corporation director endpoints                                           |

### Recommended CI schedule

| Job                      | Frequency                   | Config                                                                                |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------- |
| Unit + BDD               | Every push                  | `npm test`                                                                            |
| Mocked integration       | Every push                  | `npm run test:integration`                                                            |
| Live smoke tests         | Daily/weekly                | `ESI_LIVE_TESTS=true npm run test:integration`                                        |
| Spec contract validation | Weekly                      | `ESI_LIVE_TESTS=true npm run test:integration -- --testPathPattern=esi-spec-contract` |
| Gated auth tests         | Weekly (with token refresh) | `ESI_GATED_TESTS=true npm run test:integration:gated`                                 |

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

| Path                                           | Purpose                                      |
| ---------------------------------------------- | -------------------------------------------- |
| `jest.unit.config.cjs`                         | Unit + BDD test config (coverage thresholds) |
| `jest.integration.config.cjs`                  | Integration test config (30s timeout)        |
| `tests/tdd/`                                   | 78 TDD test files                            |
| `tests/bdd/features/`                          | 39 Gherkin feature files                     |
| `tests/bdd/step-definitions/`                  | 39 step definition files + shared helpers    |
| `tests/integration/full-stack.test.ts`         | Mocked full-lifecycle integration (20 tests) |
| `tests/integration/live-esi.test.ts`           | Live API smoke tests (40 tests)              |
| `tests/integration/client-integration.test.ts` | Live EsiClient integration (11 tests)        |
| `tests/integration/esi-spec-contract.test.ts`  | ESI spec drift detection (10 tests)          |
| `tests/integration/gated-auth.test.ts`         | Authenticated endpoint tests (33 tests)      |
| `src/testing/TestDataFactory.ts`               | Mock data factory for tests                  |
| `scripts/validate-esi-endpoints.ts`            | Standalone ESI spec validation script        |
| `scripts/generate-esi-types.ts`                | Type/cache/scope generator from live spec    |
