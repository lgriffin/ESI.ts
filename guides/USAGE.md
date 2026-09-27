# Using the Client

**Implements:** `ARCH-08` · `DOC-01` · `DOC-05`. See [CHARTER.md](CHARTER.md) Part 2 and Part 7.

This guide covers the consumer surface as it ships in 10.x: how to construct a client and configure it, which domain clients exist, and the everyday features on top of them. The last section lists what the 11.0.0 release changes.

The README gives the one-minute tour. Deeper topics have their own guides:

- [ARCHITECTURE.md](ARCHITECTURE.md): how a call travels through the pipeline.
- [AUTHENTICATION.md](AUTHENTICATION.md): tokens, SSO and the token manager.
- [PAGINATION.md](PAGINATION.md): offset and cursor paging, `stream*` and `fetchAll*`.
- [ERRORS.md](ERRORS.md): error classes and safe mode.
- [RUNTIME-VALIDATION.md](RUNTIME-VALIDATION.md): Zod schemas.
- [LOGGING.md](LOGGING.md): loggers and levels.

---

## 1. Construction

Three surfaces build a client. All three pass their configuration through `configureApiClient()`, so each gets the same middleware defaults: cache, request deduplication, rate limiter, retry, tenant and user agent.

| Surface                               | Use it when                                            | Domain clients                                                 |
| ------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| `new EsiClient(config?)`              | You want everything; each domain is built on first use | All 39, as lazy getters                                        |
| `new EsiClientBuilder()…build()`      | You want a named subset (`CustomEsiClient`)            | The ones you add; the rest are `undefined`                     |
| `EsiApiFactory.createClient(type, …)` | You want one domain client on its own                  | Any of the 39; the nine named factories are deprecated (below) |

`ApiClientBuilder` is also exported. It is the low-level builder the domain clients share, and it does not call `configureApiClient`. Prefer the three surfaces above.

```typescript
import { EsiClientBuilder } from '@lgriffin/esi.ts';

const trader = new EsiClientBuilder()
  .addClients(['market', 'universe', 'characters'])
  .withClientId('my-trading-bot')
  .withAccessToken('your-token')
  .build();

const prices = await trader.market?.getMarketPrices();
const system = await trader.universe?.getSystemById(30000142);
```

```typescript
import { EsiApiFactory, type MarketClient } from '@lgriffin/esi.ts';

const marketClient = EsiApiFactory.createClient('market', {
  clientId: 'price-checker',
}) as MarketClient;
const prices = await marketClient.getMarketPrices();
```

**Deprecated in 11.0.0:** `EsiApiFactory`'s nine named methods (`createMarketClient`, `createWalletClient` and the rest) and `EsiTokenManager.createClient`. They still work; removal is 12.0.0 at the earliest. Use `createEsi()` from `@lgriffin/esi.ts/client` and `esi.public` or `esi.as(identity)` ([MULTI-CHARACTER.md](MULTI-CHARACTER.md)), or `EsiApiFactory.createClient(type)` to stay on the legacy clients.

Call `shutdown()` when you are done with a client. It stops the cache sweep timer and the circuit-breaker cleanup timer, so a script can exit. It is synchronous.

```typescript runnable
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
try {
  const status = await client.status.getStatus();
  console.log(status.server_version);
} finally {
  client.shutdown();
}
```

## 2. Configuration

Every option is optional. The defaults below are what `EsiClient` applies.

```typescript
const configured = new EsiClient({
  clientId: 'my-app', // Sent as X-User-Agent when userAgent is unset (default: 'esi-client')
  userAgent: 'my-app/1.0 (you@example.com)', // X-User-Agent, and prefixed to User-Agent (default: none)
  accessToken: 'your-token', // EVE SSO access token (default: ESI_ACCESS_TOKEN)
  onTokenRefresh: async () => newToken, // Called once on a 401, then the request is retried
  baseUrl: 'https://esi.evetech.net', // HTTPS and an allowlisted host, or construction fails (SEC-01)
  tenant: 'singularity', // X-Tenant: tranquility or singularity (default: none, so ESI serves Tranquility)
  datasource: 'tranquility', // Legacy datasource query parameter (default: ESI_DATASOURCE, else none)
  compatibilityDate: '2026-08-18', // X-Compatibility-Date (default: the library's COMPATIBILITY_DATE)
  language: 'en', // Accept-Language: en, de, fr, ja, ru, zh, ko, es (default: none)
  timeout: 30000, // Per-request timeout in ms, including reading the body (default: 30000)
  retryConfig: {
    maxRetries: 3, // Transient errors only: 0 (network), 420, 429, 502, 503, 504 (default: 3)
    baseDelayMs: 1000, // First backoff, with 0.75x to 1.25x jitter (default: 1000)
    maxDelayMs: 30000, // Backoff cap (default: 30000)
    retryMutations: false, // Retry POST/PUT/DELETE too (default: false)
  },
  retryStrategy: customRetryStrategy, // Replace the retry strategy entirely (IRetryStrategy)
  enableETagCache: true, // Spec-TTL + ETag cache (default: true)
  etagCacheConfig: {
    maxEntries: 1000, // default: 1000
    defaultTtl: 300000, // Used when neither the spec nor Cache-Control gives a TTL (default: 5 min)
    cleanupInterval: 60000, // Expired-entry sweep (default: 1 min)
  },
  enableRequestDeduplication: true, // Coalesce identical in-flight GETs (default: true)
  enableCircuitBreaker: false, // Opt in (default: false); circuitBreakerConfig is ignored unless true
  circuitBreakerConfig: {
    keyStrategy: 'resolved', // 'resolved' (per URL) or 'template' (per route) (default: 'resolved')
  },
  validateResponse: true, // Zod-validate every response that has a schema (default: true)
  validateRequest: false, // Zod-validate request bodies before sending (default: false)
  logLevel: 'warn', // Level for the default pino logger (default: ESI_LOG_LEVEL, else 'warn')
});
```

`rateLimiterConfig`, `requestInterceptors`, `responseInterceptors`, `logger` and `unsafeAllowCustomHost` are covered in [ARCHITECTURE.md](ARCHITECTURE.md) and [LOGGING.md](LOGGING.md). After construction, `setAccessToken`, `setTokenProvider`, `updateCacheConfig`, `resetCircuitBreaker` and the interceptor methods change a live client.

### Environment variables

| Variable           | Read by                    | Default                   |
| ------------------ | -------------------------- | ------------------------- |
| `ESI_ACCESS_TOKEN` | `accessToken`              | none                      |
| `ESI_CLIENT_ID`    | `clientId`                 | `esi-client`              |
| `ESI_BASE_URL`     | `baseUrl`                  | `https://esi.evetech.net` |
| `ESI_DATASOURCE`   | `datasource`               | none                      |
| `ESI_LOG_LEVEL`    | the default logger's level | `warn`                    |

An explicit option always wins over its variable.

## 3. Domain clients

Every domain is a property on `EsiClient`. Auth is **Yes** when every method needs a token, **Some** when a subset does, and **No** when none does. The token is attached only to calls whose endpoint declares scopes.

| Domain             | Property                     | Auth | For example                                                                           |
| ------------------ | ---------------------------- | ---- | ------------------------------------------------------------------------------------- |
| Access Lists       | `client.accessLists`         | Yes  | `getAccessList(id)`                                                                   |
| Alliance           | `client.alliance`            | Some | `getAlliances()`, `getAllianceById(id)`                                               |
| Assets             | `client.assets`              | Yes  | `getCharacterAssets(id)`                                                              |
| Calendar           | `client.calendar`            | Yes  | `getCalendarEvents(id)`                                                               |
| Characters         | `client.characters`          | Some | `getCharacterPublicInfo(id)`, `getCharacterPortrait(id)`                              |
| Clones             | `client.clones`              | Yes  | `getClones(id)`                                                                       |
| Contacts           | `client.contacts`            | Yes  | `getCharacterContacts(id)`, `postCharacterContacts(id, standing, contactIds)`         |
| Contracts          | `client.contracts`           | Some | `getCharacterContracts(id)`, `getPublicContracts(regionId)`                           |
| Corp Projects      | `client.corporationProjects` | Yes  | `getCorporationProjects(corpId)`, `getCorporationProject(corpId, projectId)`          |
| Corporations       | `client.corporations`        | Some | `getCorporationInfo(id)`, `getCorporationMembers(id)`                                 |
| Cosmetics          | `client.cosmetics`           | Some | `getSkinr(id)`, `getCharacterSkinr(charId)`, `getCharacterSkinrComponents(charId)`    |
| Dogma              | `client.dogma`               | No   | `getAttributes()`, `getDynamicItemInfo(typeId, itemId)`                               |
| Factions           | `client.factions`            | Some | `getStats()`                                                                          |
| Fittings           | `client.fittings`            | Yes  | `getFittings(id)`, `createFitting(id, body)`                                          |
| Fleets             | `client.fleets`              | Yes  | `getFleetInformation(id)`, `getFleetMembers(id)`                                      |
| Freelance Jobs     | `client.freelanceJobs`       | Some | `getFreelanceJobs()`, `getFreelanceJobById(id)`                                       |
| Incursions         | `client.incursions`          | No   | `getIncursions()`                                                                     |
| Industry           | `client.industry`            | Some | `getCharacterIndustryJobs(id)`                                                        |
| Insurance          | `client.insurance`           | No   | `getInsurancePrices()`                                                                |
| Killmails          | `client.killmails`           | Some | `getKillmail(id, hash)`                                                               |
| Location           | `client.location`            | Yes  | `getCharacterLocation(id)`                                                            |
| Loyalty            | `client.loyalty`             | Some | `getLoyaltyPoints(id)`                                                                |
| Mail               | `client.mail`                | Yes  | `getCharacterMailHeaders(id)`, `sendMail(id, body)`                                   |
| Market             | `client.market`              | Some | `getMarketPrices()`, `getMarketOrders(regionId)`                                      |
| Mercenary          | `client.mercenary`           | Yes  | `getMercenaryDens(charId)`, `getMercenaryDenDetail(charId, denId)`                    |
| Meta               | `client.meta`                | No   | `getStatus()`, `getChangelog()`, `getOpenApiYaml()`                                   |
| Military Campaigns | `client.militaryCampaigns`   | Some | `getMilitaryCampaigns()`, `getMilitaryCampaign(id)`                                   |
| Paragon Hub        | `client.paragonHub`          | Some | `getPublicListings()`, `getCharacterListings(charId)`, `getAllianceListings(id)`      |
| PI                 | `client.pi`                  | Some | `getColonies(id)`                                                                     |
| Route              | `client.route`               | No   | `getRoute(origin, destination)`                                                       |
| Search             | `client.search`              | Yes  | `search(characterId, query)`                                                          |
| Skills             | `client.skills`              | Yes  | `getCharacterSkills(id)`                                                              |
| Skyhooks           | `client.skyhooks`            | Some | `getSovereigntyHubs(corpId)`, `getSkyhookDetail(corpId, id)`, `getRaidableSkyhooks()` |
| Sovereignty        | `client.sovereignty`         | No   | `getSovereigntySystems()`, `getSovereigntyCampaigns()`                                |
| Status             | `client.status`              | No   | `getStatus()`                                                                         |
| UI                 | `client.ui`                  | Yes  | `setAutopilotWaypoint(destId, addToBeginning, clear)`, `openNewMailWindow(body)`      |
| Universe           | `client.universe`            | Some | `getSystemById(id)`, `getTypeById(id)`                                                |
| Wallet             | `client.wallet`              | Yes  | `getCharacterWallet(id)`                                                              |
| Wars               | `client.wars`                | No   | `getWars()`, `getWarById(id)`                                                         |

The typed reference for every method is the TypeDoc site (`npm run docs`). The generated surface report in `etc/esi.ts.api.md` is the contract that [SEMVER.md](SEMVER.md) guards.

### Coverage of the ESI specification

The client wires 235 routes. That covers every one of the 233 operations in the vendored OpenAPI document (compatibility date 2026-08-18, `tests/contract/snapshots/esi-openapi.snapshot.json`). The two extra routes are `meta/openapi.json` and `meta/openapi.yaml`, which are the specification itself. `npm run spec:coverage` fails a pull request that leaves a spec operation unwired, and the nightly spec-drift workflow opens an issue when CCP adds one.

The ESI specification is upstream, not infallible. Live validation found places where the documented wire format is wrong, and the endpoint definitions follow what ESI actually accepts:

- `addContacts`, `editContacts` and four UI endpoints document request-body parameters that ESI reads from the query string.
- `deleteCharacterContacts` takes comma-separated contact ids as a query parameter.
- Fleet wing and squad names are capped at 10 characters, a limit the specification does not state.
- `updateMailMetadata` uses the field `read`, not `is_read`.

The recorded-payload tier replays real responses for every public route on every pull request. [TESTING.md](TESTING.md) lists the four spec mismatches the contract tests carry as known.

## 4. Responses

### Validation

Every one of the 201 GET definitions declares a Zod `responseSchema`, and validation is on by default. A body that does not match throws `EsiValidationError`. Schemas are `z.looseObject`, so a field CCP adds tomorrow passes through to your code unchanged rather than failing (posture 3 in the charter). For mutations, `validateRequest: true` checks the outgoing body against the endpoint's `requestSchema`. Endpoints that return a body without declaring a schema are tracked in [#298](https://github.com/lgriffin/ESI.ts/issues/298) (DES-02, Phase 3).

```typescript
import { EsiClient, isValidationError, schemas } from '@lgriffin/esi.ts';

const strict = new EsiClient();
try {
  const character = await strict.characters.getCharacterPublicInfo(12345);
  console.log(character.name);
} catch (err) {
  if (isValidationError(err)) console.log(err.message);
}

// The same schemas are exported for your own data
const result = schemas.CharacterInfoSchema.safeParse(someData);
if (result.success) console.log(result.data.name);
```

See [RUNTIME-VALIDATION.md](RUNTIME-VALIDATION.md).

### Response metadata

`withMetadata()` returns a view of a domain client whose methods resolve `{ data, meta }`:

```typescript
const withMeta = client.alliance.withMetadata();
const { data, meta } = await withMeta.getAllianceById(99000001);

console.log(data.name);
console.log(meta.fromCache, meta.cacheHitType); // 'spec-ttl' | 'etag-304' | 'stale-on-error'
console.log(meta.rateLimit); // { remaining, limit, used, group }
console.log(meta.requestId); // ESI request id, for CCP support
```

| Field             | Type                     | Meaning                                         |
| ----------------- | ------------------------ | ----------------------------------------------- |
| `headers`         | `Record<string, string>` | Raw response headers                            |
| `fromCache`       | `boolean`                | Served from the cache                           |
| `stale`           | `boolean`                | A cached body served because ESI returned a 5xx |
| `cacheHitType`    | string, optional         | `spec-ttl`, `etag-304` or `stale-on-error`      |
| `rateLimit`       | object, optional         | `remaining`, `limit`, `used`, `group`           |
| `responseTimeMs`  | number, optional         | Request duration                                |
| `requestId`       | string, optional         | `x-esi-request-id`                              |
| `date`            | string, optional         | The `Date` header                               |
| `contentLanguage` | string, optional         | The `Content-Language` header                   |
| `warning`         | object, optional         | ESI's deprecation `warning` header, parsed      |

`withSafeMode()` is the same idea for errors: methods resolve a result envelope instead of throwing. See [ERRORS.md](ERRORS.md).

### Text and empty responses

- `meta.getOpenApiYaml()` goes through the full pipeline (cache, rate limiter, retry) and resolves the YAML document as a string.
- ESI answers some calls with a 200 and no body. `getPublicContractItems` and `getPublicContractBids` resolve `[]` in that case, because an expired public contract has no items. Every other endpoint rejects an empty body with `JSON_PARSE_ERROR`, so a fault is never silently turned into "no data".

## 5. Caching, rate limiting and resilience

These are on by default and need no configuration. [ARCHITECTURE.md](ARCHITECTURE.md) is the canonical description, and this is the summary a consumer needs:

- **Cache.** A GET inside the TTL generated from the spec is answered with no HTTP call. An older entry is revalidated with `If-None-Match`. A 5xx with a cached copy serves the stale body and marks `meta.stale`. A successful write invalidates the cached reads under the same path. Cache keys hash the `Authorization` header, so two tokens never share an entry. `client.getCacheStats()` and `client.clearCache()` inspect and reset it.
- **Rate limiting.** There is one token bucket per ESI rate-limit group: 46 groups, generated from the spec. The limiter adopts the `x-ratelimit-*` headers, honours `Retry-After`, and blocks only the affected group on a 420 or 429. Multi-character applications can bucket per token with `rateLimiterConfig.userKeyExtractor`. Its return value is held in memory as a bucket key, so derive it from a digest or a character id, never the raw `Authorization` header.
- **Retry.** Exponential backoff with jitter on 0, 420, 429, 502, 503 and 504, up to three retries. A 401 triggers one token refresh when a provider exists. Mutations are not retried unless `retryMutations` is set.
- **Deduplication.** Identical in-flight GETs from the same identity share one request.
- **Circuit breaker.** Off by default. When enabled it opens after five consecutive failures, rejects with `CircuitOpenError` for 30 seconds, then lets one probe through.

```typescript
import { createHash } from 'node:crypto';

const multiCharacter = new EsiClient({
  rateLimiterConfig: {
    // The key is kept in memory as a bucket name, so never return the token itself
    userKeyExtractor: (headers) => {
      const auth = headers['Authorization'];
      return auth
        ? createHash('sha256').update(auth).digest('hex').slice(0, 16)
        : 'anon';
    },
  },
});
```

## 6. Batching and pagination

`batch()` fans out GETs with bounded concurrency (default 20) and returns successes and failures separately. `batchPost()` chunks a large POST payload (default 1000 ids a chunk) and concatenates the results.

```typescript
const result = await client.batch(
  typeIds,
  (id) => client.universe.getTypeById(id),
  {
    concurrency: 10,
    onProgress: (done, total) => console.log(`${done}/${total}`),
  },
);
console.log(`${result.results.size} succeeded, ${result.errors.size} failed`);

const names = await client.batchPost(
  largeIdArray,
  (chunk) => client.universe.postNamesAndCategories(chunk),
  1000,
);
```

A paginated method comes in three forms:

- The plain method fetches every page and returns one array.
- The `stream*` form yields one validated page at a time, and stops fetching when you `break`. There are 73 of these across 19 clients.
- The `fetchAll*` form fetches the remaining pages concurrently, eight at a time.

Cursor routes, such as Freelance Jobs, page with opaque `before` and `after` tokens through `fetchAllCursorPages`.

```typescript
for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(
    `Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
  );
  if (page.page >= 3) break;
}
```

See [PAGINATION.md](PAGINATION.md) for failure behaviour and the cursor semantics.

## 7. Generated types and scopes

The `EsiSpec` namespace holds the TypeScript interfaces generated from the specification. `esiEndpointScopes` maps each route to the SSO scopes it needs, and `EsiScope` is the union of every scope name. CI fails when either one goes stale against the vendored specification.

```typescript
import { EsiSpec, esiEndpointScopes, type EsiScope } from '@lgriffin/esi.ts';

const order: Pick<EsiSpec.MarketsRegionIdOrdersGet, 'order_id' | 'price'> = {
  order_id: 123,
  price: 5.5,
};

const walletScopes = esiEndpointScopes['GET:characters/{character_id}/wallet'];
// ['esi-wallet.read_character_wallet.v1']
const scope: EsiScope = 'esi-assets.read_assets.v1';
```

## 8. Examples

`examples/` holds 56 scripts. Every one is type-checked on each pull request that touches it, and nightly. The public ones also run against live ESI every night (`nightly-examples.yml`), and a failure opens one issue per example. Each has an npm script:

```bash
# Public (no token)
npm run example:status          # quickest smoke test
npm run example:market          # average prices and Tritanium history
npm run example:streaming       # stream* over a large region
npm run example:cursor-pagination
npm run example:rate-limiting
npm run example:retry-timeout-metadata

# Authenticated (ESI_ACCESS_TOKEN with the scopes the script names)
npm run example                 # full character profile
npm run example:wallet
npm run example:token-manager   # SSO login, storage and refresh
npm run example:multi-character # several characters' wallets through one runtime
npm run example:public-vs-authenticated # the type split, with a @ts-expect-error line
npm run example:write-ops       # contacts, fittings, mail and UI round trips; use a test character

# Static data (needs sde-data/, see the SDE guide)
npm run example:sde-basic
```

`grep '"example' package.json` lists all of them.

## 9. What 11.0.0 changes

11.0.0 is in progress. [ROADMAP.md](ROADMAP.md) has the order of work and the release gate. For a consumer:

- **Node 22 becomes the floor.** `engines.node` is `>=22.12.0` (the first 22.x that loads an ES module through `require()` without a flag), and CI tests Node 22.12, the latest 22 and 24 only. 10.x stays the line for Node 18 and 20, which are end of life. To upgrade, move the runtime (and any `.nvmrc`, Docker base image or CI `node-version`) to Node 22.12 or later before installing 11.x; on Node 18 or 20, keep `"@lgriffin/esi.ts": "^10.0.0"`. No code change is needed for the Node floor itself.
- **A new client beside the old one (on master).** `createEsi()` from `@lgriffin/esi.ts/client` builds one shared runtime, holding the rate limiter, error budget, cache and transport. `esi.public` is a typed view in which an authenticated call does not compile. `esi.as(identity)` is an immutable per-character view over the same runtime. The runtime requires a user agent. [MULTI-CHARACTER.md](MULTI-CHARACTER.md) is the guide; `createMockTransport()` in `./testing` answers its requests in your own tests ([TESTING.md](TESTING.md#testing-your-application)).
- **Nothing on this page is removed in 11.0.** `EsiApiFactory`'s nine named methods and `EsiTokenManager.createClient` are `@deprecated`, pointing at `createEsi()` and `esi.as(identity)`; `EsiApiFactory.createClient(type)` is not deprecated. Removal waits for 12.0.0 at the earliest, per [SEMVER.md](SEMVER.md).
- **Already on master and in the 11.0.0 release notes:**
  - The default compatibility date is 2026-08-18.
  - Several schemas now match what ESI sends: raidable skyhooks, military campaigns, and `meta.getChangelog`, which returns `{ changelog }`.
  - A path parameter of `.` or `..` is rejected.
