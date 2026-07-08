# ESI.ts

[![npm version](https://badge.fury.io/js/%40lgriffin%2Fesi.ts.svg)](https://badge.fury.io/js/%40lgriffin%2Fesi.ts)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0%2B-blue)](https://www.typescriptlang.org/)
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![PR Validation](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/pr-validation.yml)
[![Coverage](https://img.shields.io/badge/coverage-65%25%2B-brightgreen)](https://github.com/lgriffin/ESI.ts)
[![npm downloads](https://img.shields.io/npm/dm/%40lgriffin/esi.ts)](https://www.npmjs.com/package/@lgriffin/esi.ts)

A production-grade TypeScript client for the [EVE Online ESI API](https://esi.evetech.net/), built on the **OpenAPI 3.1 spec**, with runtime validation, intelligent caching, and full endpoint coverage.

**v7.0.0** — Fully migrated from the deprecated Swagger 2.0 spec to OpenAPI 3.1 (`/meta/openapi.json`). All generated types, cache TTLs, scopes, and rate limit groups are now sourced from a single OpenAPI fetch. See [esi-issues#1490](https://github.com/esi/esi-issues/issues/1490) for the deprecation notice.

**208 endpoint definitions — 194 from the public ESI OpenAPI spec, plus 14 for newer EVE features (Equinox sovereignty, orbital skyhooks, mercenary dens, access lists, freelance jobs). All 206 exercisable endpoints validated against live Tranquility on 2026-07-08.**

## Why ESI.ts vs. OpenAPI-Generated Clients?

Tools like `openapi-typescript` or `openapi-generator` can produce a typed client from the ESI OpenAPI spec in minutes. They're a reasonable starting point — but they stop at type generation. ESI.ts is a purpose-built SDK that handles the problems you hit _after_ the types compile.

### What generators give you

- TypeScript interfaces from the OpenAPI spec
- Basic request/response typing
- A thin HTTP wrapper

### What ESI.ts gives you on top of that

| Capability                      | openapi-typescript                                                                                                  | ESI.ts                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime response validation** | None — types are erased at compile time. If CCP changes a field, you get silent data corruption.                    | Every GET response is validated at runtime via [Zod](https://zod.dev/) schemas — all 173 GET endpoints have schemas. Schema mismatches throw `EsiValidationError` immediately.                          |
| **Intelligent caching**         | None — you build your own.                                                                                          | Three-tier: spec-aware TTL (zero HTTP calls within ESI's `x-cached-seconds` window), ETag conditional GETs, stale-on-error fallback on 5xx. Write operations auto-invalidate related GET caches.        |
| **Rate limiting**               | None — you build your own.                                                                                          | 36 per-group token buckets extracted from the ESI spec at build time. Market requests can't starve wallet requests. Optional per-user bucketing for multi-character apps.                               |
| **Pagination**                  | Manual — you write the page loop.                                                                                   | Automatic offset pagination, cursor-based pagination (Equinox-era endpoints), and streaming `AsyncGenerator` pagination for memory-efficient processing of large datasets.                              |
| **Retry & resilience**          | None.                                                                                                               | Exponential backoff with jitter, circuit breaker (closed/open/half-open), automatic 401 token refresh with concurrent coalescing.                                                                       |
| **Wire format correctness**     | Generates from spec, but ESI's spec has inconsistencies (query params documented as body, missing required fields). | Every endpoint tested against live ESI. Wire format bugs (query params vs. body, field naming) are caught and fixed — see the contacts and UI endpoint fixes in v6.1.0.                                 |
| **Batch operations**            | None.                                                                                                               | `batch()` with bounded concurrency for GET fan-out, `batchPost()` with auto-chunking for large POST payloads.                                                                                           |
| **Domain knowledge**            | None — generic HTTP client.                                                                                         | 35 domain clients with typed methods, JSDoc documentation, and input validation (e.g., fleet wing/squad names are capped at 10 characters before hitting the API).                                      |
| **Testing**                     | Whatever you write.                                                                                                 | 121+ test suites, 3,800+ tests across 9 tiers including property-based fuzzing (fast-check), deep contract tests against live OpenAPI spec, and consumer type tests (tsd). 43 runnable example scripts. |

### The real problem with generated clients

The ESI OpenAPI spec is not a perfect source of truth. During live endpoint validation against the OpenAPI 3.1 spec, we discovered:

- `addContacts`, `editContacts`, and 4 UI endpoints document parameters as request body when ESI actually expects query parameters
- `deleteCharacterContacts` expects comma-separated contact IDs as a query param, not a JSON body
- Fleet wing/squad names have a 10-character limit not documented in the spec
- The `updateMailMetadata` endpoint uses the field name `read`, not `is_read`

A generated client faithfully reproduces these spec bugs. ESI.ts fixes them.

## Installation

```bash
npm install @lgriffin/esi.ts
```

### Building from Source

```bash
git clone https://github.com/lgriffin/ESI.ts.git
cd ESI.ts
npm install        # installs dependencies and compiles (via the prepare script)
```

If you've already installed and just need to recompile:

```bash
npm run build
```

Verify everything works:

```bash
npm run example:status   # quick smoke test — checks ESI is reachable
npm test                 # run the full test suite (121 suites, 3,224 tests)
```

## Quick Start

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Public data — no auth required
const alliances = await client.alliance.getAlliances();
const character = await client.characters.getCharacterPublicInfo(1689391488);
const system = await client.universe.getSystemById(30000142);
const prices = await client.market.getMarketPrices();

// Authenticated data — token read from ESI_ACCESS_TOKEN env var
const authedClient = new EsiClient();
const assets = await authedClient.assets.getCharacterAssets(characterId);
const wallet = await authedClient.wallet.getCharacterWallet(characterId);

// Clean up when done
await client.shutdown();
```

## Configuration

```typescript
const client = new EsiClient({
  clientId: 'my-app', // User-Agent identifier (default: 'esi-client')
  accessToken: 'your-token', // EVE SSO token for authenticated endpoints
  baseUrl: 'https://esi.evetech.net', // ESI base URL (default)
  onTokenRefresh: async () => newToken, // Auto-refresh on 401 (optional)
  language: 'en', // Accept-Language header: en, de, fr, ja, ru, zh, ko, es (default: none)
  timeout: 30000, // Request timeout in ms (default: 30000)
  retryConfig: {
    maxRetries: 3, // Max retry attempts for transient errors (default: 0)
    baseDelayMs: 1000, // Initial backoff delay (default: 1000)
    maxDelayMs: 30000, // Maximum backoff delay (default: 30000)
    retryMutations: false, // Retry POST/PUT/DELETE (default: false, GET only)
  },
  enableETagCache: true, // ETag caching (default: true)
  etagCacheConfig: {
    maxEntries: 1000, // Max cached responses (default: 1000)
    defaultTtl: 300000, // Fallback TTL in ms (default: 5 min)
    cleanupInterval: 60000, // Expired entry cleanup interval (default: 1 min)
  },
  validateResponse: true, // Runtime Zod validation of ESI responses (default: true)
});
```

Retry is disabled by default (`maxRetries: 0`). When enabled, transient errors (502, 503, 504, timeout, rate limit) are retried with exponential backoff and jitter. The circuit breaker is respected — requests are not retried when the circuit is open.

The access token can be updated at runtime:

```typescript
client.setAccessToken('new-token');
```

## Authentication

Many ESI endpoints require an EVE SSO access token. There are three ways to provide one:

### 1. Environment variable (recommended)

Set `ESI_ACCESS_TOKEN` in your environment or a `.env` file. The client reads it automatically — no token in source code.

```bash
# Copy the example and fill in your token
cp .env.example .env
```

```env
ESI_ACCESS_TOKEN=your-eve-sso-access-token
ESI_CLIENT_ID=my-app-name
```

If you use a `.env` loader like [dotenv](https://www.npmjs.com/package/dotenv), load it before creating the client:

```typescript
import 'dotenv/config';
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
// Token is picked up from process.env.ESI_ACCESS_TOKEN
```

### 2. Constructor parameter

Pass the token directly (useful for apps that manage tokens themselves):

```typescript
const client = new EsiClient({ accessToken: token });
```

### 3. Runtime update

Set or refresh the token after construction:

```typescript
client.setAccessToken(newToken);
```

### Getting an EVE SSO token

1. Register an application at [EVE Developers](https://developers.eveonline.com/)
2. Set a callback URL and select the ESI scopes your app needs
3. Implement the [OAuth2 flow](https://docs.esi.evetech.net/docs/sso/) to obtain an access token
4. Access tokens expire — use the refresh token to get new ones

### Automatic Token Refresh

EVE SSO access tokens expire after 20 minutes. Instead of manually tracking expiry, you can provide a refresh callback — the client will automatically call it on 401, update the token, and retry the request:

```typescript
const client = new EsiClient({
  accessToken: initialToken,
  onTokenRefresh: async () => {
    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: myRefreshToken,
        client_id: myClientId,
      }),
    });
    const { access_token } = await response.json();
    return access_token;
  },
});

// Requests now auto-refresh on 401 — no manual token management needed
const location = await client.location.getCharacterLocation(characterId);
```

The token provider can also be set or changed at runtime:

```typescript
client.setTokenProvider(myRefreshFunction);
client.setTokenProvider(undefined); // disable auto-refresh
```

Key behaviors:

- Only retries **once** per request — if the refreshed token also gets a 401, the error is thrown
- **Concurrent coalescing** — if multiple requests hit 401 simultaneously, only one refresh call is made
- If the refresh callback throws (e.g., refresh token revoked), a `TOKEN_REFRESH_FAILED` error is raised
- Without a token provider, 401 errors throw immediately as before

### Environment variables reference

| Variable           | Description                                  | Default                   |
| ------------------ | -------------------------------------------- | ------------------------- |
| `ESI_ACCESS_TOKEN` | EVE SSO access token                         | none                      |
| `ESI_CLIENT_ID`    | User-Agent identifier                        | `esi-client`              |
| `ESI_BASE_URL`     | ESI API base URL                             | `https://esi.evetech.net` |
| `ESI_LOG_LEVEL`    | Log level (`error`, `warn`, `info`, `debug`) | `warn`                    |

## Available APIs

All clients are accessed as properties on the `EsiClient` instance. Authenticated endpoints require an access token.

| Client         | Property               | Auth | Examples                                                                         |
| -------------- | ---------------------- | ---- | -------------------------------------------------------------------------------- |
| Alliance       | `client.alliance`      | Some | `getAlliances()`, `getAllianceById(id)`                                          |
| Assets         | `client.assets`        | Yes  | `getCharacterAssets(id)`                                                         |
| Calendar       | `client.calendar`      | Yes  | `getCalendarEvents(id)`                                                          |
| Characters     | `client.characters`    | Some | `getCharacterPublicInfo(id)`, `getCharacterPortrait(id)`                         |
| Clones         | `client.clones`        | Yes  | `getCharacterClones(id)`                                                         |
| Contacts       | `client.contacts`      | Yes  | `getCharacterContacts(id)`, `postCharacterContacts(id, standing, contactIds)`    |
| Contracts      | `client.contracts`     | Yes  | `getCharacterContracts(id)`                                                      |
| Corporations   | `client.corporations`  | Some | `getCorporationInfo(id)`, `getCorporationMembers(id)`                            |
| Dogma          | `client.dogma`         | No   | `getDogmaAttributes()`, `getDynamicItemInfo(typeId, itemId)`                     |
| Factions       | `client.factions`      | Some | `getFactionWarStats()`                                                           |
| Fittings       | `client.fittings`      | Yes  | `getFittings(id)`, `createFitting(id, body)`                                     |
| Fleets         | `client.fleets`        | Yes  | `getFleetInformation(id)`, `getFleetMembers(id)`                                 |
| Incursions     | `client.incursions`    | No   | `getIncursions()`                                                                |
| Industry       | `client.industry`      | Some | `getCharacterIndustryJobs(id)`                                                   |
| Insurance      | `client.insurance`     | No   | `getInsurancePrices()`                                                           |
| Killmails      | `client.killmails`     | Some | `getKillmail(id, hash)`                                                          |
| Location       | `client.location`      | Yes  | `getCharacterLocation(id)`                                                       |
| Loyalty        | `client.loyalty`       | Yes  | `getCharacterLoyaltyPoints(id)`                                                  |
| Mail           | `client.mail`          | Yes  | `getCharacterMail(id)`, `sendMail(id, body)`                                     |
| Market         | `client.market`        | Some | `getMarketPrices()`, `getMarketOrders(regionId)`                                 |
| PI             | `client.pi`            | Yes  | `getCharacterPlanets(id)`                                                        |
| Route          | `client.route`         | No   | `getRoute(origin, destination)`                                                  |
| Search         | `client.search`        | Some | `search(characterId, query)`                                                     |
| Skills         | `client.skills`        | Yes  | `getCharacterSkills(id)`                                                         |
| Sovereignty    | `client.sovereignty`   | No   | `getSovereigntySystems()`, `getSovereigntyMap()`                                 |
| Skyhooks       | `client.skyhooks`      | No   | `getSovereigntyHubs()`, `getRaidableSkyhooks()`                                  |
| Mercenary      | `client.mercenary`     | No   | `getMercenaryDens()`, `getMercenaryTacticalOperations()`                         |
| Access Lists   | `client.accessLists`   | Yes  | `getAccessList(id)`                                                              |
| Status         | `client.status`        | No   | `getStatus()`                                                                    |
| UI             | `client.ui`            | Yes  | `setAutopilotWaypoint(destId, addToBeginning, clear)`, `openNewMailWindow(body)` |
| Universe       | `client.universe`      | Some | `getSystemById(id)`, `getTypeById(id)`                                           |
| Wallet         | `client.wallet`        | Yes  | `getCharacterWallet(id)`                                                         |
| Wars           | `client.wars`          | No   | `getWars()`, `getWarById(id)`                                                    |
| Freelance Jobs | `client.freelanceJobs` | Some | `getFreelanceJobs()`, `getFreelanceJobById(id)`                                  |
| Meta           | `client.meta`          | No   | `getOpenApiJson()`, `getOpenApiYaml()`                                           |

## Runtime Response Validation

ESI.ts validates API responses at runtime using [Zod](https://zod.dev/) schemas. All GET endpoints have schemas — these are the endpoints that return data your application consumes, where a silent shape change from CCP would cause bugs. POST/PUT/DELETE mutations typically return `204 No Content` (no body to validate) or simple confirmation values, so schemas are omitted where there is nothing meaningful to validate.

Validation is **on by default**. Extra fields from ESI are preserved via `z.looseObject()` passthrough mode, so new fields added by CCP won't break your application — they flow through to your code untouched.

```typescript
import {
  EsiClient,
  EsiValidationError,
  isValidationError,
  schemas,
} from '@lgriffin/esi.ts';

const client = new EsiClient();

// Validation happens automatically on every request
const character = await client.characters.getCharacterPublicInfo(12345);

// Disable validation globally if needed
const rawClient = new EsiClient({ validateResponse: false });

// Use schemas directly for your own validation
const result = schemas.CharacterInfoSchema.safeParse(someData);
if (result.success) {
  console.log(result.data.name);
}
```

See [guides/RUNTIME-VALIDATION.md](guides/RUNTIME-VALIDATION.md) for the full guide on schemas, error handling, and extending schemas.

## Caching

ETag caching is enabled by default. The client automatically:

1. Stores ETag and response data on GET requests
2. Sends `If-None-Match` on subsequent requests
3. Returns cached data on `304 Not Modified`
4. Parses `Cache-Control: max-age` from ESI for per-endpoint TTL
5. Serves stale cached data when ESI returns 5xx errors
6. Invalidates related GET caches when POST/PUT/DELETE requests are made

```typescript
// Cache stats
const stats = client.getCacheStats();
console.log(`${stats.totalEntries}/${stats.maxEntries} entries cached`);

// Manual cache operations
client.clearCache();
client.updateCacheConfig({ maxEntries: 2000 });

// Disable caching entirely
const uncachedClient = new EsiClient({ enableETagCache: false });
```

### Spec-Aware Cache TTLs

The library reads `x-cache-age` from the ESI OpenAPI spec (126 of 195 endpoints). Within the TTL window, repeated GET requests return cached data with **zero HTTP calls** — not even a conditional GET.

This layers on top of ETag caching in three tiers:

1. **Spec TTL** — data can't have changed yet, return cached data immediately
2. **ETag conditional GET** — data might have changed, send `If-None-Match` to check
3. **Full request** — no cache entry, fetch fresh data

```typescript
const client = new EsiClient();

// First call — fetches from ESI
const alliances = await client.alliance.getAlliances();

// Second call within the next 3600s — returns cached data, zero HTTP calls
const same = await client.alliance.getAlliances();
```

## Batch Requests

Fetch data for multiple IDs with bounded concurrency using `batch()`, or chunk large POST payloads with `batchPost()`:

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Fetch 500 type details with at most 10 concurrent requests
const result = await client.batch(
  typeIds,
  (id) => client.universe.getTypeById(id),
  {
    concurrency: 10,
    onProgress: (done, total) => console.log(`${done}/${total}`),
  },
);

// result.results: Map<number, T> — successful responses
// result.errors: Map<number, Error> — failed requests
console.log(`${result.results.size} succeeded, ${result.errors.size} failed`);
```

For POST endpoints that accept arrays (e.g., `postUniverseNames` with a 1000-ID limit), `batchPost` auto-chunks and concatenates:

```typescript
const allNames = await client.batchPost(
  largeIdArray,
  (chunk) => client.universe.postUniverseNames(chunk),
  1000, // chunk size
);
```

## Streaming Pagination

For large paginated endpoints (market orders, contracts, assets), streaming yields one page at a time via `AsyncGenerator` instead of eagerly fetching all pages into memory:

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Stream all market orders in The Forge, page by page
for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(
    `Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
  );

  // Process each order as it arrives
  for (const order of page.data) {
    if (order.is_buy_order && order.price > 1_000_000) {
      console.log(`High-value buy: ${order.type_id} @ ${order.price} ISK`);
    }
  }

  // Early termination — stops fetching remaining pages
  if (page.page >= 3) break;
}
```

Available streaming methods:

- **MarketClient** — `streamMarketOrders`, `streamMarketTypes`, `streamCharacterOrderHistory`, `streamCorporationOrders`, `streamCorporationOrderHistory`, `streamMarketOrdersInStructure`
- **ContractsClient** — `streamPublicContracts`, `streamCharacterContracts`, `streamCorporationContracts`
- **WalletClient** — `streamCharacterWalletJournal`, `streamCorporationWalletJournal`, `streamCharacterWalletTransactions`
- **AssetsClient** — `streamCharacterAssets`, `streamCorporationAssets`
- **KillmailsClient** — `streamCharacterRecentKillmails`, `streamCorporationRecentKillmails`

Try it: `npm run example:streaming`

## Cursor-based Pagination

Newer ESI routes (Freelance Jobs, and future routes) use cursor-based pagination with opaque `before`/`after` tokens in the response body. See the [ESI blog post](https://developers.eveonline.com/blog/changing-pagination-turning-a-new-page) for background.

```typescript
import { EsiClient, fetchAllCursorPages } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Fetch first page — returns { cursor: { before, after }, freelance_jobs: [...] }
const page = await client.freelanceJobs.getFreelanceJobs();
console.log(page.freelance_jobs); // job records
console.log(page.cursor.after); // opaque token for next page

// Fetch next page using the cursor
const nextPage = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  page.cursor.after,
);

// Auto-fetch all pages in one call
const allJobs = await fetchAllCursorPages(
  (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
  (response) => response.freelance_jobs,
  (response) => response.cursor,
);

// Authenticated endpoints — character/corporation freelance jobs
const authedClient = new EsiClient({ accessToken: 'your-token' });
const myJobs =
  await authedClient.freelanceJobs.getCharacterFreelanceJobs(characterId);
const corpJobs =
  await authedClient.freelanceJobs.getCorporationFreelanceJobs(corporationId);
```

**Polling for changes** — cursor tokens persist across sessions, so you can save the last `after` token and poll later to get only records that changed:

```typescript
// After initial scan, save the final cursor
let savedCursor = lastPage.cursor.after;

// Later: check for updates (hours, days, or weeks later)
const updates = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  savedCursor,
);
if (updates.freelance_jobs.length > 0) {
  // Process changed records — duplicates are expected for modified records
  savedCursor = updates.cursor.after;
}
```

Key points:

- Cursor tokens are **opaque strings** — never parse or validate them
- An **empty result array** signals the end of the dataset (not a short page)
- **Duplicates across pages** are expected when records are modified between requests
- Existing offset-based routes (`getMarketOrders`, etc.) are unchanged

## Generated Types

The library includes TypeScript interfaces generated directly from the ESI OpenAPI 3.1 spec, available as the `EsiSpec` namespace. These are guaranteed to match the live spec and complement the hand-written types:

```typescript
import { EsiSpec } from '@lgriffin/esi.ts';

// Generated type — uses OpenAPI schema names (v7.0.0+)
const order: EsiSpec.MarketsRegionIdOrdersGet = {
  order_id: 123,
  type_id: 34,
  price: 5.5,
  volume_remain: 1000,
  volume_total: 5000,
  is_buy_order: false,
  // ...
};
```

To regenerate types from the latest ESI spec:

```bash
npm run generate:types    # fetches OpenAPI spec, generates 161 interfaces + cache TTL map + rate limit groups + scope map
npm run validate:esi      # reports type drift between hand-written and generated types
```

## ESI Scopes

The library includes a generated scope-to-endpoint mapping extracted from the ESI OpenAPI spec. Use it to check which OAuth scopes an endpoint requires before making a request:

```typescript
import { esiEndpointScopes, EsiScope } from '@lgriffin/esi.ts';

// Look up scopes for a specific endpoint
const walletScopes = esiEndpointScopes['GET:characters/{character_id}/wallet'];
// → ['esi-wallet.read_character_wallet.v1']

// Check if an endpoint requires auth
const isPublic = !esiEndpointScopes['GET:universe/types/{type_id}'];
// → true (public endpoint, no scopes needed)

// Type-safe scope values
const scope: EsiScope = 'esi-assets.read_assets.v1';
```

## Error Handling

API errors throw `EsiError` with `statusCode`, `message`, and `url` properties:

```typescript
import {
  EsiError,
  TimeoutError,
  EsiValidationError,
  isTimeout,
  isRetryable,
  isValidationError,
} from '@lgriffin/esi.ts';

try {
  const alliance = await client.alliance.getAllianceById(99999999);
  console.log('Alliance:', alliance.name);
} catch (err) {
  if (isValidationError(err)) {
    console.log('Response validation failed:', err.validationError);
  } else if (isTimeout(err)) {
    console.log(`Request timed out after ${err.timeoutMs}ms`);
  } else if (err instanceof EsiError) {
    console.log(`ESI error ${err.statusCode}: ${err.message}`);
    console.log(`Retryable: ${err.retryable}`);
  }
}
```

- **204 No Content** — returns `undefined` (valid for DELETE/POST actions)
- **304 Not Modified** — handled internally, returns cached data
- **4xx/5xx** — throws `EsiError`
- **5xx with cache** — returns stale cached data instead of throwing
- **Timeout** — throws `TimeoutError` (extends `EsiError` with `statusCode: 0` and `timeoutMs`)
- **Retryable errors** — `EsiError.retryable` returns `true` for 502, 503, 504, 420, 429, and timeouts
- **Validation errors** — throws `EsiValidationError` (extends `EsiError`) when response data doesn't match the expected Zod schema

## Response Metadata

Use `withMetadata()` to get response headers, cache status, rate limit info, and timing alongside the data:

```typescript
const metaClient = client.alliance.withMetadata();
const result = await metaClient.getAllianceById(99000001);

console.log(result.data.name); // "Goonswarm Federation"
console.log(result.meta.fromCache); // true if served from cache
console.log(result.meta.cacheHitType); // 'spec-ttl' | 'etag-304' | 'stale-on-error'
console.log(result.meta.responseTimeMs); // milliseconds
console.log(result.meta.rateLimit); // { remaining, limit, used, group }
console.log(result.meta.requestId); // ESI request ID for debugging
```

The `meta` object includes:

| Field            | Type                     | Description                                       |
| ---------------- | ------------------------ | ------------------------------------------------- |
| `headers`        | `Record<string, string>` | Raw response headers                              |
| `fromCache`      | `boolean`                | Whether data was served from cache                |
| `stale`          | `boolean`                | Whether cached data is stale (5xx fallback)       |
| `cacheHitType`   | `string?`                | `'spec-ttl'`, `'etag-304'`, or `'stale-on-error'` |
| `rateLimit`      | `RateLimitMeta?`         | Rate limit status from ESI headers                |
| `responseTimeMs` | `number?`                | Request duration in milliseconds                  |
| `requestId`      | `string?`                | ESI request ID                                    |
| `warning`        | `object?`                | ESI deprecation warning                           |

## Rate Limiting

ESI.ts automatically manages rate limiting using ESI's per-group token bucket system. The 36 rate limit groups from the ESI OpenAPI spec are extracted at build time, so each group (e.g., `market-order`, `char-notification`) gets its own independent bucket. A burst of market requests won't starve unrelated endpoints.

Rate limiting works out of the box with no configuration. For multi-character applications, enable per-user bucketing:

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient({
  rateLimiterConfig: {
    userKeyExtractor: (headers) => headers['authorization'] ?? 'anon',
  },
});
```

Monitor rate limit status per group:

```typescript
const limiter = client.getRateLimiter();

// Worst-case across all groups (backward-compatible)
const status = limiter.getStatus();
console.log(status.remaining, status.limit, status.group);

// Specific group
const marketStatus = limiter.getGroupStatus('market-order');
console.log(marketStatus?.remaining); // tokens remaining in this group

// All active groups
const all = limiter.getAllGroupStatuses();
for (const [group, info] of all) {
  console.log(`${group}: ${info.remaining}/${info.limit}`);
}

// Check if a specific group is blocked
console.log(limiter.isBlocked('char-notification')); // true if 429'd
```

## Lightweight Clients

If you only need a subset of APIs, use `CustomEsiClient` or `EsiClientBuilder` to load only what you need:

```typescript
import { EsiClientBuilder } from '@lgriffin/esi.ts';

const client = new EsiClientBuilder()
  .addClients(['market', 'universe', 'characters'])
  .withClientId('my-trading-bot')
  .withAccessToken('your-token')
  .build();

const prices = await client.market?.getMarketPrices();
const system = await client.universe?.getSystemById(30000142);
```

Or create standalone single-API clients:

```typescript
import { EsiApiFactory } from '@lgriffin/esi.ts';

const marketClient = EsiApiFactory.createMarketClient({
  clientId: 'price-checker',
});
const prices = await marketClient.getMarketPrices();
```

## Endpoint Coverage

All 208 endpoint definitions have been validated against live Tranquility using the **OpenAPI 3.1 spec** — 194 from the public ESI spec plus 14 for newer EVE features. 206 endpoints are exercisable (2 mercenary den endpoints await CCP deployment). Full output is captured in [`openapi.output.md`](openapi.output.md).

| Category                    | Endpoints | Method                                             |
| --------------------------- | --------- | -------------------------------------------------- |
| Public GETs                 | 78        | 43 runnable example scripts with captured output   |
| Authenticated GETs          | 72        | Example scripts + live testing with EVE SSO tokens |
| Contacts (POST/PUT/DELETE)  | 3         | Live create/edit/delete lifecycle                  |
| Fittings (POST/DELETE)      | 2         | Live create/delete lifecycle                       |
| Mail (POST/PUT/DELETE)      | 5         | Live send/label/metadata/delete lifecycle          |
| UI (POST)                   | 5         | Live testing with EVE client running               |
| Calendar (PUT)              | 1         | Live RSVP to event                                 |
| Fleet (GET/POST/PUT/DELETE) | 14        | Live fleet with fleet commander + squad members    |
| Assets POST                 | 3         | Live asset location/name queries                   |
| CSPA (POST)                 | 1         | Live charge cost calculation                       |
| Dogma dynamic (GET)         | 1         | Live mutaplasmid (Abyssal) item query              |
| Universe POST helpers       | 3         | Live name resolution and affiliation               |
| Freelance Jobs (GET)        | 4         | Live queries (graceful 404 for no active jobs)     |

## Examples

43 runnable examples are in the `examples/` directory.

### Public Endpoints (no auth needed)

```bash
npm run example:status       # Server status — quickest smoke test
npm run example:character    # Character public info, portrait, corporation
npm run example:universe     # Solar system, constellation, region, station
npm run example:market       # Average prices + Tritanium price history
npm run example:alliance     # Alliance info + member corporations
npm run example:route        # Jita-to-Amarr route with system names
npm run example:wars         # Recent wars with aggressor/defender details
npm run example:sovereignty  # Nullsec sovereignty map + active campaigns
npm run example:industry     # Industry facilities, cost indices, insurance
npm run example:incursions   # Active incursions + faction warfare stats
npm run example:dogma        # Item type details + dogma attributes
npm run example:contracts    # Public region contracts + auction bids/items
npm run example:rate-limiting      # Rate limiter & pagination demonstration
npm run example:cursor-pagination  # Freelance Jobs with cursor pagination
npm run example:streaming          # Streaming pagination for large datasets
npm run example:token-refresh      # Automatic token refresh on 401
npm run example:universe-encyclopedia  # Ancestries, bloodlines, races, celestials
npm run example:dogma-meta-sov         # Dogma effects, sovereignty, meta endpoint
npm run example:faction-details        # Faction warfare leaderboards and stats
```

### Authenticated Endpoints (require ESI_ACCESS_TOKEN)

```bash
npm run example                    # Full character profile assembly
npm run example:wallet       # Wallet balance, journal, transactions
npm run example:skills       # Trained skills, queue, attributes
npm run example:assets       # Asset inventory with bulk name lookup
npm run example:killmails    # Recent killmails + full details
npm run example:fleet        # Fleet info, members, wing/squad structure
npm run example:mail         # Inbox headers, labels, mailing lists
npm run example:location     # Current system, online status, ship
npm run example:fittings     # Saved fittings + clone state + implants
npm run example:contacts     # Contact list with standings + labels
npm run example:character-details  # Blueprints, roles, standings, medals
npm run example:corporation-details  # Corp members, divisions, structures
npm run example:calendar-search      # Calendar events + character search
npm run example:loyalty-pi           # Loyalty points + planetary interaction
npm run example:industry-mining      # Industry jobs + mining ledger
npm run example:market-orders        # Character/corp market orders
npm run example:corp-contracts-wallet # Corp contracts, contacts, wallets
```

### Write Operations (require specific scopes + caution)

```bash
npm run example:write-ops          # Contacts, fittings, mail, UI lifecycle tests
npm run example:universe-posts     # Name resolution + character affiliation (public)
npm run example:freelance-jobs     # Freelance job queries
```

### Parallel Requests

```typescript
const [character, portrait, corp] = await Promise.all([
  client.characters.getCharacterPublicInfo(characterId),
  client.characters.getCharacterPortrait(characterId),
  client.corporations.getCorporationInfo(corporationId),
]);

console.log(`${character.name} [${corp.ticker}]`);
```

### Market Analysis

```typescript
const [orders, history] = await Promise.all([
  client.market.getMarketOrders(regionId),
  client.market.getMarketHistory(regionId, typeId),
]);

const buyOrders = orders.filter((o) => o.is_buy_order);
const sellOrders = orders.filter((o) => !o.is_buy_order);

console.log(`Best buy: ${Math.max(...buyOrders.map((o) => o.price))}`);
console.log(`Best sell: ${Math.min(...sellOrders.map((o) => o.price))}`);
```

## Resource Management

Always call `shutdown()` when you're done to clean up cache timers:

```typescript
const client = new EsiClient();
try {
  const status = await client.status.getStatus();
  console.log(status.server_version);
} finally {
  await client.shutdown();
}
```

## Testing

ESI.ts has a comprehensive multi-tier testing strategy:

| Tier                       | Tests            | Purpose                                                            |
| -------------------------- | ---------------- | ------------------------------------------------------------------ |
| **TDD unit tests**         | 81 files         | Every client method, endpoint path, query param, and body format   |
| **BDD scenario tests**     | 40 feature files | Behavioral specifications in Gherkin (Given/When/Then)             |
| **Mocked integration**     | Full suite       | Cross-layer request flow with jest-fetch-mock                      |
| **Live smoke tests**       | 43 examples      | Every endpoint against live Tranquility                            |
| **ESI spec contract**      | 15 tests         | Endpoint definitions validated against live OpenAPI spec           |
| **Deep contract tests**    | 8 categories     | Path params, query params, body, auth, schemas, pagination vs spec |
| **Property-based fuzzing** | 601 tests        | fast-check fuzzing of validation, URL construction, Zod schemas    |
| **Type-level tests**       | tsd              | Consumer API type correctness via tsd                              |
| **Gated auth tests**       | 33 tests         | Authenticated endpoints with real tokens                           |

```bash
npm test          # Unit + BDD tests (121 suites, 3,224 tests)
npm run coverage  # Tests with coverage report (thresholds enforced)
npm run bdd       # BDD scenario tests only
npm run contract  # Contract tests (skipped without ESI_LIVE_TESTS=true)
npm run fuzz      # Property-based fuzz tests (601 tests)
npm run test:types # tsd consumer type tests
```

Coverage thresholds are enforced in CI: branches 50%, functions 50%, lines 65%, statements 65%.

See [guides/TESTING.md](guides/TESTING.md) for the full testing guide, and [guides/ARCHITECTURE.md](guides/ARCHITECTURE.md) for architecture diagrams.

## Development

### Prerequisites

- Node.js 18+
- npm

### Code Quality Tools

The project uses a comprehensive suite of static analysis and code quality tools:

| Tool                                                                                 | Purpose                                                 | Command                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------ |
| [ESLint](https://eslint.org/)                                                        | Linting with TypeScript, security, and code smell rules | `npm run lint`                 |
| [Prettier](https://prettier.io/)                                                     | Code formatting                                         | `npm run format:check`         |
| [knip](https://knip.dev/)                                                            | Dead code and unused export detection                   | `npm run knip`                 |
| [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security) | Security anti-pattern detection                         | Integrated into `npm run lint` |
| [eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs)        | Cognitive complexity and code smell detection           | Integrated into `npm run lint` |
| [husky](https://typicode.github.io/husky/)                                           | Git pre-commit hooks                                    | Automatic on commit            |
| [lint-staged](https://github.com/lint-staged/lint-staged)                            | Run linters on staged files only                        | Automatic on commit            |
| [Redocly CLI](https://redocly.com/docs/cli/)                                         | OpenAPI spec validation and linting                     | `npm run validate:spec`        |

### Available Scripts

```bash
# Development
npm run build              # Compile TypeScript
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without modifying

# Testing
npm test                   # Unit tests (121 suites, 3,224 tests)
npm run test:all           # Unit + BDD + integration + fuzz + type tests
npm run coverage           # Tests with coverage report (thresholds enforced)
npm run bdd                # BDD scenario tests
npm run contract:live      # Deep contract tests against live ESI spec
npm run fuzz               # Property-based fuzz tests (fast-check)
npm run test:types         # Consumer type tests (tsd)
npm run mock:esi           # Start Prism mock ESI server on port 4010

# Static Analysis
npm run knip               # Detect dead code and unused exports
npm run validate:esi       # Validate endpoints against live ESI OpenAPI spec
npm run validate:spec      # Lint ESI OpenAPI spec with Redocly (structural + best practices)
npm run validate           # Run all checks: lint, format, build, coverage, knip
npm run generate:types     # Regenerate TypeScript interfaces from ESI OpenAPI spec

# Documentation
npm run docs               # Generate TypeDoc API documentation
npm run docs:serve         # Serve docs locally on port 8080
```

### ESI Endpoint Validation

To verify that the codebase endpoint definitions match the live ESI OpenAPI spec:

```bash
npm run validate:esi
```

This fetches the ESI OpenAPI spec and reports:

- Endpoints in the codebase that are no longer in the ESI spec
- Endpoints in the ESI spec that the codebase doesn't cover
- HTTP method mismatches between codebase and spec

### Pre-commit Hooks

The project uses husky with lint-staged to run ESLint and Prettier on staged files before each commit. This is set up automatically when you run `npm install`.

### CI/CD

Every pull request runs the full validation suite:

- ESLint (with security and sonarjs plugins)
- Prettier formatting check
- TypeScript compilation
- Generated types staleness check (regenerates from live ESI OpenAPI spec and verifies no diff)
- Unit tests across Node.js 18, 20, and 22
- BDD scenario tests
- Coverage threshold enforcement (branches: 50%, functions: 50%, lines: 65%, statements: 65%)
- Dead code detection via knip
- npm security audit

See [.github/workflows/README.md](.github/workflows/README.md) for full workflow details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Run `npm run validate` to check everything passes
5. Open a Pull Request

## License

GPL-3.0-or-later - see the [LICENSE](LICENSE) file for details.

---

**o7**
