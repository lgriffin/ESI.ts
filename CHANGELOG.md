# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
