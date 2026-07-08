# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [7.0.0] - 2026-07-08

### Breaking Changes

- **Swagger 2.0 → OpenAPI 3.1 migration** — all generated types, cache TTLs, scopes, and rate limit groups are now sourced from the ESI OpenAPI 3.1 spec (`/meta/openapi.json`) instead of the deprecated Swagger 2.0 spec (`/latest/swagger.json`). See [esi-issues#1490](https://github.com/esi/esi-issues/issues/1490).
- **Generated interface names changed** — `EsiSpec` namespace types now use OpenAPI schema names (e.g., `AllianceDetail` instead of `GetAlliancesAllianceIdOk`). These are generated types; hand-written consumer types are unchanged.
- **Cache TTL metadata key** — internally changed from `x-cached-seconds` to `x-cache-age`. No consumer-facing impact (cache behavior is identical).

### Changed

- Single OpenAPI spec fetch instead of dual Swagger + OpenAPI fetches
- Updated all scripts, tests, and documentation to reference OpenAPI spec
- Generated types now include 161 interfaces (up from 147), 126 cache TTLs, 70 scopes

## [6.1.0] - 2026-07-07

### Added

- **Fleet wing/squad name validation** — `renameFleetWing()` and `renameFleetSquad()` now reject names exceeding ESI's 10-character limit before sending the request, with a clear error message
- **43 runnable example scripts** covering all 210 ESI endpoints against live Tranquility (10 new example files: character-details, corporation-details, calendar-search, loyalty-pi, faction-details, industry-mining, market-orders, universe-encyclopedia, corp-contracts-wallet, dogma-meta-sov)
- **3 write-operation example scripts** — `write-operations.ts` (contacts, fittings, mail, UI lifecycle), `universe-post-helpers.ts` (name resolution, affiliation), `freelance-jobs.ts` (cursor-paginated queries)
- Live output captured for all example scripts in `examples/output/`
- 3 new TDD test files and 1 new BDD feature file (81 TDD files, 40 BDD features total)
- 2 new fleet validation unit tests

### Fixed

- **Fleet test babel parse errors** — replaced TypeScript cast syntax `(result as any[]).forEach(...)` with direct index access in fleet tests (pre-existing bug unmasked by stricter transpilation)
- **Fleet rename test names** — test mock names shortened to respect ESI's 10-character limit (`'New Squad Name'` → `'New Squad'`)

### Changed

- README rewritten with "Why ESI.ts vs. OpenAPI-generated clients" comparison, full endpoint coverage table, and updated architecture/testing references
- `guides/ARCHITECTURE.md`, `guides/TESTING.md`, and `TESTING.md` updated to current test counts (121 suites, 3,224 tests)
- Autopilot example waypoint changed from Jita to Rens

### Schemas

- Multiple Zod schema fixes discovered during live endpoint validation: added missing enum values, corrected optional fields, and adjusted types to match actual ESI responses

## [6.0.0] - 2026-07-03

### Added

- **Runtime response validation** via [Zod](https://zod.dev/) schemas — every ESI endpoint response is validated at runtime, catching shape mismatches before they propagate to consumer code
- Zod schemas for all 31 domain modules (133 interfaces) in `src/schemas/`, exported under the `schemas` namespace
- `EsiValidationError` class (extends `EsiError`) thrown when response data doesn't match the expected schema
- `isValidationError()` type guard for catching validation errors
- `validateResponse` option on `EsiClientConfig` — on by default, can be disabled globally
- `responseSchema` field on `EndpointDefinition` — wires schemas into the request pipeline via `createClient()`
- New developer guide: `guides/RUNTIME-VALIDATION.md`
- Response Validation Pipeline diagram in `guides/ARCHITECTURE.md`
- Comprehensive TDD tests for schema parsing, validation integration, and common schemas (94 new tests)
- BDD feature and step definitions for 9 runtime validation scenarios

### Changed

- All TypeScript types in `src/types/` are now derived from Zod schemas via `z.infer<>` — schemas are the single source of truth
- Schemas use `.passthrough()` mode so extra fields from ESI are preserved, not rejected
- Test mock data across 25 test files updated to be spec-accurate (required by runtime validation)
- Path-parameter IDs (e.g., `character_id`, `alliance_id`) are now optional in schemas, matching ESI which omits them from response bodies

### Dependencies

- Added `zod` as a production dependency

## [5.3.0] - 2026-06-30

### Added

- **Accept-Language configuration** — `language` option on `EsiClientConfig` injects the `Accept-Language` header for localized ESI responses (en, de, fr, ja, ru, zh, ko, es); changeable at runtime via `ApiClient.setLanguage()`
- **ESI scope metadata** — generated `esi-scopes.generated.ts` with `EsiScope` union type (63 scopes) and `esiEndpointScopes` record mapping 119 authenticated endpoints to their required OAuth scopes
- Exported `EsiScope` type and `esiEndpointScopes` map from package root
- **Streaming pagination** — `stream*` methods on domain clients yield `PageResult<T>` one page at a time via `AsyncGenerator`, enabling backpressure and early termination for large paginated datasets
- Streaming methods added to `MarketClient` (6), `ContractsClient` (3), `WalletClient` (3), `AssetsClient` (2), `KillmailsClient` (2)
- `buildEndpointPath()` utility extracted from `createClient.ts` and exported from package root
- `streamEndpoint()` protected method on `BaseEsiClient` for building custom streaming domain clients
- Streaming pagination example (`npm run example:streaming`)

## [5.2.0] - 2026-06-29

### Added

- **Spec-driven type generation** from ESI swagger spec (`npm run generate:types`) — 147 TypeScript interfaces + cache TTL map for 119 endpoints
- **Spec-aware cache bypass** — GET requests within ESI-specified `x-cached-seconds` TTL return cached data with zero HTTP calls, layered on top of ETag caching
- **`batch()` and `batchPost()` methods** on `EsiClient` — bounded concurrency for multi-ID fetches, auto-chunking for POST endpoints
- **`EsiSpec` namespace export** with generated response types alongside hand-written types
- **Type drift detection** in `npm run validate:esi` — compares hand-written types against generated spec types
- CI step to verify generated types are up to date
- **Retry with exponential backoff** — configurable retry for transient 5xx, timeout, and rate limit errors with jitter; respects circuit breaker state; GET-only by default with `retryMutations` opt-in
- **`TimeoutError`** subclass of `EsiError` — typed timeout errors with `timeoutMs` property; per-request timeout override via `handleRequest()`
- **Enhanced response metadata** via `withMetadata()` — rate limit info (`RateLimitMeta`), response timing (`responseTimeMs`), and cache hit type (`cacheHitType`: `'spec-ttl'` | `'etag-304'` | `'stale-on-error'`)
- `RetryConfig` interface and `retryConfig` option on `EsiClientConfig`
- `CircuitOpenError` passthrough in request handler (previously wrapped as generic Error)
- **Per-group rate limiting** — 36 ESI rate limit groups extracted from the OpenAPI meta spec at build time; each group gets its own token bucket instead of a single global counter, preventing a burst of market requests from starving unrelated endpoints
- **Optional per-user bucketing** — `userKeyExtractor` config option creates separate bucket sets per user key, supporting multi-character EVE applications
- **Group-aware rate limit status** — `getGroupStatus(group)` and `getAllGroupStatuses()` methods for fine-grained rate limit monitoring; `isBlocked(group?)` accepts an optional group name
- Generated `esi-rate-limit-groups.generated.ts` with 146 endpoint-to-group mappings
- Exported `RateLimitGroupStatus` and `RateLimitGroupSpec` types

## [5.1.0] - 2026-06-26

### Added

- **`noUncheckedIndexedAccess`** compiler flag — array/record indexing now returns `T | undefined`, catching unguarded index access at compile time
- **`noImplicitReturns`** compiler flag — all function code paths must explicitly return a value
- **`noImplicitOverride`** compiler flag — `override` keyword required when overriding base class methods
- **`tsconfig.test.json`** — separate TypeScript config for tests, relaxing `noUncheckedIndexedAccess` for test utility patterns

### Changed

- `RateLimiter` token cost lookup inlined (removed unnecessary `Record` indirection)
- Jest configs (`jest.unit.config.cjs`, `jest.integration.config.cjs`) now use `tsconfig.test.json`

### Fixed

- Unguarded indexed access in `ApiRequestHandler`, `CircuitBreaker`, `RateLimiter`, and `headersUtil`

## [5.0.0] - 2026-06-26

### Breaking Changes

- **Removed `SovereigntyClient.getSovereigntyMap()`** — sunset ESI endpoint; use `getSovereigntySystems()` instead
- **Removed `SovereigntyClient.getSovereigntyStructures()`** — sunset ESI endpoint; use `getSovereigntySystems()` instead

### Added

- **Dependabot** — automated weekly dependency update PRs with grouped ESLint and testing ecosystems
- **CodeQL Analysis** — GitHub-native security scanning workflow
- **Commitlint** — conventional commit message validation via husky hook
- **Version consistency script** — `npm run validate:versions` checks `package.json` matches `constants.ts`
- **`npm run check:all`** — comprehensive validation including ESI endpoint and version checks
- Coverage and npm download badges in README
- `.editorconfig`, `.nvmrc`, `CONTRIBUTING.md`, `SECURITY.md`
- ClientRegistry test coverage for all 35 client types

### Fixed

- **POST body format** for asset and contact endpoints — request body was incorrectly structured
- **POST body format** for `/universe/ids` and `/universe/names` — same issue
- **Circuit breaker** now treats HTTP 420/429 rate-limit responses as failures
- **configManager** uses `require.resolve` instead of `process.cwd()` fallback for reliable path resolution
- **User-Agent version** — ESI requests were sending `esi.ts/3.4.0` instead of current version
- **Compatibility date** — updated from `2025-12-16` to `2026-05-19` (Equinox)
- TypeScript badge in README updated from 5.0+ to 6.0+

### Removed

- `src/TODO` — fully completed roadmap
- `jest.improved.config.cjs` — dead config matching zero test files
- `docs/` — generated TypeDoc output removed from git tracking (CI builds as artifact)
- Unused `getHeaders` test helper

### Changed

- `package.json`: added `keywords`, `homepage`, `bugs` URLs, `files` includes README/LICENSE/CHANGELOG
- Moved `docs/architecture.md` to `guides/ARCHITECTURE.md`
- Updated `guides/TESTING.md` and `guides/DOCUMENTATION.md` to current state
- Test coverage raised from 75% to 91%+

### Dependencies

- `@typescript-eslint/eslint-plugin`: 7.18.0 → 8.x
- `@typescript-eslint/parser`: 7.18.0 → 8.x
- `@types/node`: 18.x → 26.x
- `@commitlint/cli`: 19.x → 21.x
- `eslint-config-prettier`: 9.x → 10.x
- `lint-staged`: 16.x → 17.x
- `jest-junit`: 16.x → 17.x
- GitHub Actions: checkout v4→v7, setup-node v4→v6, upload-artifact v4→v7, codeql-action v3→v4, gh-pages v3→v4, action-gh-release v1→v3

## [4.1.1] - 2026-06-08

### Changed

- **TypeScript 5.9 → 6.0** — upgraded to TypeScript 6.0.3, the last version before the Go-based TS7 compiler
- `tsconfig.json`: added explicit `moduleResolution: "bundler"` (TS6 changed the default from `node` to `bundler`)
- `tsconfig.json`: added explicit `rootDir: "./src"` (TS6 requires this when emitting)
- `tsconfig.json`: removed `esModuleInterop: true` (always-on in TS6)

## [4.1.0] - 2026-06-08

### Added

- **Equinox ESI compliance** — new endpoints and types for the [Equinox expansion](https://developers.eveonline.com/blog/equinox-on-esi-structures-sovereignty-and-access-lists) (compatibility date 2026-05-19)
- **`SovereigntyClient.getSovereigntySystems()`** — combined sovereignty systems route with separate ADM indices (`military_index`, `industry_index`, `strategic_index`), occupancy data, and anchored structures in a single response
- **`SkyhooksClient`** — new domain client with `getSovereigntyHubs()`, `getOrbitalSkyhooks()`, and `getRaidableSkyhooks()` endpoints for Upwell sovereignty structures
- **`MercenaryClient`** — new domain client with `getMercenaryDens()` and `getMercenaryTacticalOperations()` endpoints for mercenary content
- **`AccessListsClient`** — new domain client with `getAccessList(id)` for reading access list (ACL) contents including character, corporation, and alliance entries
- `TestDataFactory` methods for all new Equinox types: `createSovereigntySystem()`, `createSovereigntyHub()`, `createOrbitalSkyhook()`, `createRaidableSkyhook()`, `createMercenaryDen()`, `createMercenaryTacticalOperation()`, `createAccessListEntry()`
- TDD and BDD test coverage for all new endpoints

### Changed

- `SovereigntyClient.getSovereigntyMap()` and `getSovereigntyStructures()` marked as deprecated — use `getSovereigntySystems()` instead
- Domain client count increased from 32 to 35

### Dependencies

- `ts-jest`: 29.4.9 → 29.4.11
- `eslint-plugin-prettier`: 5.5.5 → 5.5.6

## [4.0.0] - 2026-05-15

### Breaking Changes

- **Removed `RateLimiter.getInstance()` singleton** - Create instances with `new RateLimiter()` instead
- **Removed global cache/circuit breaker functions** - `initializeETagCache()`, `getETagCache()`, `resetETagCache()`, `initializeCircuitBreaker()`, `getCircuitBreaker()`, `resetCircuitBreaker()` are no longer exported from `ApiRequestHandler`
- Each `EsiClient` and `ApiClientBuilder` now creates its own `RateLimiter`, `ETagCacheManager`, and `CircuitBreaker` instances

### Added

- **`BaseEsiClient` base class** — eliminates ~650 lines of repeated constructor/field/`withMetadata()` boilerplate across all 33 domain clients
- **`RequestDeduplicator`** — coalesces concurrent identical GET requests into a single in-flight fetch, sharing the result across all callers (enabled by default; disable with `enableRequestDeduplication: false`)
- **`EsiDiagnostics` API** — `client.diagnostics` accessor for cache/circuit-breaker stats, moved out of the main `EsiClient` API surface
- **`fetchPages()` async generator** — memory-efficient page-by-page iteration over paginated ESI responses
- **Request timeouts** — `config.timeout` now wired to `AbortController` (default 30s); previously the field existed but was never connected to `fetch()` calls
- **`EsiError` retry helpers** — `isTimeout()`, `retryable` getter, and `isRetryable()` guard for smarter consumer retry logic
- **`RateLimiterConfig`** — `minDelayMs` and `decelerationThreshold` exposed via `EsiClientConfig` for consumer-tunable rate limiting
- TypeScript declaration files (`.d.ts`) now emitted with builds
- `exports` field in `package.json` for modern Node.js module resolution
- `engines` field specifying Node.js >= 18.0.0
- `publishConfig` with public access for scoped package
- `RateLimiter`, `ETagCacheManager`, and `CircuitBreaker` classes exported from main index
- `ApiClientBuilder.setRateLimiter()`, `.setCache()`, `.setCircuitBreaker()` builder methods
- `validateBaseUrl()` for SSRF protection — validates ESI host allowlist and HTTPS
- `unsafeAllowCustomHost` config option to bypass base URL validation
- URL sanitization in `EsiError` — sensitive query params (`token`, `access_token`, `api_key`) are redacted
- Path parameters encoded with `encodeURIComponent()` for defense-in-depth
- URL assertions in all client unit tests — every test now verifies the correct endpoint URL
- Endpoint definition contract tests — 1800+ tests validating path templates, params, methods
- Test coverage for `RequestDeduplicator`, `EsiDiagnostics`, `AsyncPaginationIterator`, and extended `EsiError` tests
- `CHANGELOG.md` following Keep a Changelog format
- Changelog validation step in release workflow

### Fixed

- `.d.ts` files not generated during build (`declaration: true` added to `tsconfig.json`)
- Release pipeline CNAME placeholder removed from GitHub Pages deployment
- `ContractsClient.ts` test file renamed to `.test.ts` so Jest actually runs it

### Changed

- `RateLimiter` constructor is now public
- Cache, rate limiter, and circuit breaker are instance-based per client (no global shared state)
- `ApiClientBuilder.build()` auto-creates a `RateLimiter` if none was explicitly set
- `api-responses.ts` (1366 lines) split into 29 domain-specific type files with barrel re-export for backward compatibility
- `RateLimiter` uses `logWarn` instead of `console.warn` for consistent observability
- Reduced allocations and deduplicated fetch/sleep logic across core modules

## [3.4.0] - 2026-04-29

### Added

- ESI response header best practices documentation
- Dogma test coverage (10 TDD + 9 BDD tests)
- Gated authenticated integration tests (32 tests across 14 endpoint groups)
- EVE SSO token creator for local integration testing
- Search endpoint `categories` query parameter

### Fixed

- 3 industry endpoint paths (`corporation` -> `corporations`) for mining routes
- Pagination middleware bypass: pages 2+ now route through request pipeline
- Consolidated duplicate alliance contact endpoints
