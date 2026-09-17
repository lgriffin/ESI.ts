# ESI.ts

[![npm version](https://badge.fury.io/js/%40lgriffin%2Fesi.ts.svg)](https://badge.fury.io/js/%40lgriffin%2Fesi.ts)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue)](https://www.typescriptlang.org/)
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-95%25%2B-brightgreen)](https://github.com/lgriffin/ESI.ts)
[![npm downloads](https://img.shields.io/npm/dm/%40lgriffin/esi.ts)](https://www.npmjs.com/package/@lgriffin/esi.ts)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/lgriffin/ESI.ts/badge)](https://scorecard.dev/viewer/?uri=github.com/lgriffin/ESI.ts)

A production-grade TypeScript client for the [EVE Online ESI API](https://esi.evetech.net/), built on the **OpenAPI 3.1 spec**, with runtime validation, intelligent caching, and full endpoint coverage.

**[Documentation Site](https://lgriffin.github.io/ESI.ts/)** — guides, API reference, interactive endpoint explorer, and runnable examples.

**v9.5.2** — Supply chain security hardening: all GitHub Actions pinned by SHA, npm publish with SLSA provenance attestations, least-privilege workflow permissions, script injection prevention, and ETag cache cross-tenant isolation.

**v9.5.0** — Adds 12 new ESI endpoints: CosmeticsClient (SKINR licenses, components, design lookup), ParagonHubClient (marketplace listings with cursor pagination), plus detail endpoints for Mercenary Dens, Tactical Operations, Skyhooks, and Sovereignty Hubs.

**235 endpoint definitions — 206 from the public ESI OpenAPI spec, plus 29 for newer EVE features (Equinox sovereignty, orbital skyhooks, mercenary dens, access lists, freelance jobs, military campaigns, corporation projects, SKINR cosmetics, Paragon Hub marketplace). All exercisable endpoints validated against live Tranquility.**

## Why ESI.ts vs. OpenAPI-Generated Clients?

Tools like `openapi-typescript` or `openapi-generator` can produce a typed client from the ESI OpenAPI spec in minutes. They're a reasonable starting point — but they stop at type generation. ESI.ts is a purpose-built SDK that handles the problems you hit _after_ the types compile.

### What generators give you

- TypeScript interfaces from the OpenAPI spec
- Basic request/response typing
- A thin HTTP wrapper

### What ESI.ts gives you on top of that

| Capability                      | openapi-typescript                                                                                                  | ESI.ts                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime response validation** | None — types are erased at compile time. If CCP changes a field, you get silent data corruption.                    | Every GET response is validated at runtime via [Zod](https://zod.dev/) schemas — all 200 GET endpoints have schemas. Schema mismatches throw `EsiValidationError` immediately.                                                    |
| **Intelligent caching**         | None — you build your own.                                                                                          | Three-tier: spec-aware TTL (zero HTTP calls within ESI's `x-cached-seconds` window), ETag conditional GETs, stale-on-error fallback on 5xx. Write operations auto-invalidate related GET caches.                                  |
| **Rate limiting**               | None — you build your own.                                                                                          | 36 per-group token buckets extracted from the ESI spec at build time. Market requests can't starve wallet requests. Optional per-user bucketing for multi-character apps.                                                         |
| **Pagination**                  | Manual — you write the page loop.                                                                                   | Automatic offset pagination, cursor-based pagination (Equinox-era endpoints), and streaming `AsyncGenerator` pagination for memory-efficient processing of large datasets.                                                        |
| **Retry & resilience**          | None.                                                                                                               | Exponential backoff with jitter, circuit breaker (closed/open/half-open), automatic 401 token refresh with concurrent coalescing.                                                                                                 |
| **Wire format correctness**     | Generates from spec, but ESI's spec has inconsistencies (query params documented as body, missing required fields). | Every endpoint tested against live ESI. Wire format bugs (query params vs. body, field naming) are caught and fixed — see the contacts and UI endpoint fixes in v6.1.0.                                                           |
| **Batch operations**            | None.                                                                                                               | `batch()` with bounded concurrency for GET fan-out, `batchPost()` with auto-chunking for large POST payloads.                                                                                                                     |
| **Domain knowledge**            | None — generic HTTP client.                                                                                         | 39 domain clients with typed methods, JSDoc documentation, and input validation (e.g., fleet wing/squad names are capped at 10 characters before hitting the API).                                                                |
| **Streaming pagination**        | None.                                                                                                               | 21 domain clients with 73+ `stream*` methods via `AsyncGenerator` — process large datasets page-by-page without loading everything into memory.                                                                                   |
| **Testing**                     | Whatever you write.                                                                                                 | 171 test suites, 4,957 tests across 9 tiers including property-based fuzzing (fast-check), mutation testing (Stryker), deep contract tests against live OpenAPI spec, and consumer type tests (tsd). 52 runnable example scripts. |

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

Requires Node.js 18 or later. TypeScript projects need TypeScript 5.4 or later, with ES module or CommonJS code under `node16`, `nodenext` or `bundler` module resolution; the consumer contract checks each of those against the published tarball.

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
npm test                 # run the full test suite (171 suites, 4,957 tests)
```

## Sub-path Exports

ESI.ts provides sub-path exports for targeted imports, reducing bundle size when you only need specific parts of the library:

```typescript
// Zod schemas for runtime validation
import { MarketOrderSchema } from '@lgriffin/esi.ts/schemas';

// Error classes and type guards
import { EsiError, isRetryable } from '@lgriffin/esi.ts/errors';

// Test utilities
import { TestDataFactory } from '@lgriffin/esi.ts/testing';
```

## Static Data Export (SDE) Module

ESI.ts includes a standalone module for querying CCP's EVE Online Static Data Export — 102 YAML files loaded into in-memory Maps with 109 typed interfaces, Zod validation, and ~97 query methods. No database, no external services.

Reading SDE files needs two optional peer dependencies, which `npm install @lgriffin/esi.ts` does not install:

```bash
npm install js-yaml    # SdeDataProvider.fromDirectory and fromZip (parses the YAML)
npm install adm-zip    # SdeDataProvider.fromZip (reads the ZIP archive)
```

`@lgriffin/esi.ts/sde` loads without them, and `MemorySdeProvider` never needs them. A method that needs one that is missing throws an `SdeError` naming the package and the install command.

```typescript
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

const sde = SdeDataProvider.fromDirectory('./sde-data');

const tritanium = sde.getType(34);
console.log(tritanium?.name); // "Tritanium"

const jita = sde.getSolarSystem(30000142);
const minerals = sde.getTypesByGroup(18);
const caldari = sde.getFaction(500001);

sde.close();
```

Download SDE data with: `npx ts-node scripts/sde-ingest.ts --output sde-data`

| Document                                           | Description                                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [SDE README](src/sde/README.md)                    | Module overview, quick start, full API reference (~97 methods), entity coverage table         |
| [Architecture](src/sde/docs/ARCHITECTURE.md)       | C4 diagrams (context, container, component), data flow sequence, ER diagram, design decisions |
| [Usage Guide](src/sde/docs/USAGE.md)               | Provider patterns, query examples, error handling                                             |
| [Developer Guide](src/sde/docs/DEVELOPER_GUIDE.md) | Project structure, new entity checklist, field normalization, testing patterns                |
| [API Contracts](src/sde/docs/API_CONTRACTS.md)     | Complete method reference for all IStaticDataProvider methods                                 |

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

## Guides

The README orients; the guides are canonical. Each one opens with the [engineering charter](guides/CHARTER.md) requirements it implements.

| Guide                                              | Covers                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [Architecture](guides/ARCHITECTURE.md)             | Layers, request path, caching, retry, rate limiting, circuit breaker, interceptors  |
| [Design rules](guides/DESIGN-RULES.md)             | Naming and schema conventions, adding an endpoint, adding a client, generated files |
| [Errors](guides/ERRORS.md)                         | Error classes, type guards, retryability, token refresh, safe mode                  |
| [Logging](guides/LOGGING.md)                       | `ILogger`, per-client loggers, pino, `ESI_LOG_LEVEL`, silencing in tests            |
| [Pagination](guides/PAGINATION.md)                 | Offset and cursor pagination, `stream*`, `fetchAll*`, batch helpers                 |
| [Runtime validation](guides/RUNTIME-VALIDATION.md) | Zod response and request validation                                                 |
| [Security](guides/SECURITY.md)                     | Runtime defences and supply-chain controls ([policy](SECURITY.md))                  |
| [Testing](guides/TESTING.md)                       | Test tiers, coverage, EARS specification                                            |
| [Mutation testing](guides/MUTATION-TESTING.md)     | Stryker configuration and scores                                                    |
| [Quality gates](guides/QUALITY-GATES.md)           | What runs at commit, push, PR, nightly and release; every workflow and script       |
| [Release](guides/RELEASE.md)                       | Cutting a release, changelog, provenance, signatures, supported versions            |
| [Semantic versioning](guides/SEMVER.md)            | What is public, major/minor/patch decisions, breaking-change commits, merge buttons |
| [OKF bundle](guides/OKF.md)                        | The generated Open Knowledge Format catalogue of ESI                                |
| [Documentation](guides/DOCUMENTATION.md)           | Documentation surfaces and the TypeDoc reference                                    |
| [Beads](guides/BEADS.md)                           | Issue tracking workflow                                                             |

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
    maxRetries: 3, // Max retry attempts for transient errors (default: 3)
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
  validateRequest: false, // Opt-in request body Zod validation for POST/PUT/DELETE (default: false)
  retryStrategy: customRetryStrategy, // Injectable IRetryStrategy (default: built-in exponential backoff)
  enableCircuitBreaker: false, // Opt-in circuit breaker (default: false); circuitBreakerConfig is ignored unless true
  circuitBreakerConfig: {
    keyStrategy: 'resolved', // CB keying: 'resolved' (per-URL) or 'template' (per-route) (default: 'resolved')
    cleanupIntervalMs: 3600000, // Stale circuit cleanup interval (default: disabled)
  },
});
```

Retry is enabled by default (`maxRetries: 3`). Transient errors (502, 503, 504, timeout, rate limit) are retried with exponential backoff and jitter. The circuit breaker is respected — requests are not retried when the circuit is open. Set `maxRetries: 0` to disable retry.

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

### Token Manager (multi-character, persistent)

The refresh callback above is the low-level hook. For applications that hold tokens for one or many characters, `EsiTokenManager` does the whole lifecycle: the SSO code exchange, persistence through a pluggable storage adapter, proactive refresh ahead of expiry, coalescing of concurrent refreshes, persistence of the rotated refresh token, revocation tracking, and bulk refresh with a concurrency cap.

```typescript
import {
  EsiTokenManager,
  FileTokenStorage,
  generateState,
} from '@lgriffin/esi.ts';

const tokens = new EsiTokenManager({
  clientId: process.env.ESI_SSO_CLIENT_ID!,
  clientSecret: process.env.ESI_SSO_CLIENT_SECRET, // omit for a public (PKCE) client
  callbackUrl: 'https://my-app.example/callback',
  storage: new FileTokenStorage('./tokens.json'), // or MemoryTokenStorage, or your own
});

// 1. Send the player to SSO
const state = generateState();
const loginUrl = tokens.getAuthorizationUrl({
  scopes: ['esi-wallet.read_character_wallet.v1'],
  state,
});

// 2. On the callback, exchange the code. The character id, name and scopes
//    are decoded from the token; you never have to say who just logged in.
const stored = await tokens.addCharacter(codeFromCallback);
console.log(`Added ${stored.characterName} (${stored.characterId})`);

// 3. Get a client bound to that character. Its token is refreshed before
//    expiry, and again on a 401, through the manager.
const client = await tokens.createClient(stored.characterId);
const wallet = await client.wallet.getCharacterWallet(stored.characterId);

// Or just the access token, for use elsewhere
const accessToken = await tokens.getToken(stored.characterId);
```

Public clients (desktop and CLI tools that cannot keep a secret) use PKCE:

```typescript
import { generatePkcePair } from '@lgriffin/esi.ts';

const pkce = generatePkcePair();
const loginUrl = tokens.getAuthorizationUrl({
  scopes,
  state,
  codeChallenge: pkce.codeChallenge,
});
// ...later, on the callback:
await tokens.addCharacter(code, { codeVerifier: pkce.codeVerifier });
```

#### Bulk refresh

Applications holding many characters (corporation tools, alliance services) refresh in bulk. Per-character failures never reject the call; each character gets its own result. The one exception is a storage adapter that cannot list tokens, which rejects with the storage error.

```typescript
const results = await tokens.refreshAll({
  concurrency: 5, // simultaneous SSO requests (default 5)
  expiringWithinMs: 5 * 60_000, // only tokens expiring in the next 5 minutes; omit for all
});

for (const r of results) {
  switch (r.status) {
    case 'refreshed':
      break;
    case 'skipped':
      break; // not stale, or the run was aborted
    case 'revoked':
      console.log(`${r.characterId} must log in again`);
      break;
    case 'failed':
      if (r.retryable) scheduleRetry(r.characterId);
      break;
  }
}
```

#### Storage adapters

`ITokenStorage` is four async methods keyed by character id: `get`, `set`, `delete`, `list`. Two adapters ship with the library:

| Adapter              | Use for                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `MemoryTokenStorage` | Tests, CLIs that log in every run, a cache in front of a durable store |
| `FileTokenStorage`   | Single-process apps; atomic temp-file-and-rename writes, `0600` mode   |

Implement the interface over Redis, Postgres, or a keychain for anything else. One rule matters: `set` must be durable before it resolves, because the manager persists the rotated refresh token before returning the new access token, and SSO invalidates the previous one.

Key behaviors:

- **One token per character** — re-authorizing replaces the stored token rather than accumulating a second one; a warning is logged if the new consent drops scopes
- **Proactive refresh** — `getToken` refreshes when the token is inside `refreshSkewMs` of expiry (default 60 s), so requests are never sent with a token about to fail
- **Coalescing** — concurrent refreshes for the same character share one SSO call, which matters because SSO rotates the refresh token on every use
- **Revocation tracking** — an `invalid_grant` from SSO marks the character revoked; later calls throw `TokenRevokedError` locally instead of hitting SSO again
- **Hooks** — `onRefresh`, `onRefreshError`, and `onRevoked` for logging, metrics, or prompting a re-login
- **No JWT signature verification** — tokens are trusted because they arrive directly from SSO over TLS; do not use `decodeAccessToken` to authenticate tokens presented by third parties
- **Single process per store** — two processes sharing one `FileTokenStorage` would each rotate refresh tokens the other cannot see

### Environment variables reference

| Variable           | Description                                  | Default                   |
| ------------------ | -------------------------------------------- | ------------------------- |
| `ESI_ACCESS_TOKEN` | EVE SSO access token                         | none                      |
| `ESI_CLIENT_ID`    | User-Agent identifier                        | `esi-client`              |
| `ESI_BASE_URL`     | ESI API base URL                             | `https://esi.evetech.net` |
| `ESI_LOG_LEVEL`    | Log level (`error`, `warn`, `info`, `debug`) | `warn`                    |

## Available APIs

All clients are accessed as properties on the `EsiClient` instance. Authenticated endpoints require an access token.

| Client             | Property                     | Auth | Examples                                                                              |
| ------------------ | ---------------------------- | ---- | ------------------------------------------------------------------------------------- |
| Alliance           | `client.alliance`            | Some | `getAlliances()`, `getAllianceById(id)`                                               |
| Assets             | `client.assets`              | Yes  | `getCharacterAssets(id)`                                                              |
| Calendar           | `client.calendar`            | Yes  | `getCalendarEvents(id)`                                                               |
| Characters         | `client.characters`          | Some | `getCharacterPublicInfo(id)`, `getCharacterPortrait(id)`                              |
| Clones             | `client.clones`              | Yes  | `getCharacterClones(id)`                                                              |
| Contacts           | `client.contacts`            | Yes  | `getCharacterContacts(id)`, `postCharacterContacts(id, standing, contactIds)`         |
| Contracts          | `client.contracts`           | Yes  | `getCharacterContracts(id)`                                                           |
| Corp Projects      | `client.corporationProjects` | Yes  | `getCorporationProjects(corpId)`, `getCorporationProject(corpId, projectId)`          |
| Corporations       | `client.corporations`        | Some | `getCorporationInfo(id)`, `getCorporationMembers(id)`                                 |
| Dogma              | `client.dogma`               | No   | `getDogmaAttributes()`, `getDynamicItemInfo(typeId, itemId)`                          |
| Factions           | `client.factions`            | Some | `getFactionWarStats()`                                                                |
| Fittings           | `client.fittings`            | Yes  | `getFittings(id)`, `createFitting(id, body)`                                          |
| Fleets             | `client.fleets`              | Yes  | `getFleetInformation(id)`, `getFleetMembers(id)`                                      |
| Incursions         | `client.incursions`          | No   | `getIncursions()`                                                                     |
| Industry           | `client.industry`            | Some | `getCharacterIndustryJobs(id)`                                                        |
| Insurance          | `client.insurance`           | No   | `getInsurancePrices()`                                                                |
| Killmails          | `client.killmails`           | Some | `getKillmail(id, hash)`                                                               |
| Location           | `client.location`            | Yes  | `getCharacterLocation(id)`                                                            |
| Loyalty            | `client.loyalty`             | Yes  | `getCharacterLoyaltyPoints(id)`                                                       |
| Mail               | `client.mail`                | Yes  | `getCharacterMail(id)`, `sendMail(id, body)`                                          |
| Market             | `client.market`              | Some | `getMarketPrices()`, `getMarketOrders(regionId)`                                      |
| Military Campaigns | `client.militaryCampaigns`   | Some | `getMilitaryCampaigns()`, `getMilitaryCampaignById(id)`                               |
| PI                 | `client.pi`                  | Yes  | `getCharacterPlanets(id)`                                                             |
| Route              | `client.route`               | No   | `getRoute(origin, destination)`                                                       |
| Search             | `client.search`              | Some | `search(characterId, query)`                                                          |
| Skills             | `client.skills`              | Yes  | `getCharacterSkills(id)`                                                              |
| Sovereignty        | `client.sovereignty`         | No   | `getSovereigntySystems()`, `getSovereigntyMap()`                                      |
| Skyhooks           | `client.skyhooks`            | Some | `getSovereigntyHubs(corpId)`, `getSkyhookDetail(corpId, id)`, `getRaidableSkyhooks()` |
| Mercenary          | `client.mercenary`           | Yes  | `getMercenaryDens(charId)`, `getMercenaryDenDetail(charId, denId)`                    |
| Cosmetics          | `client.cosmetics`           | Some | `getSkinr(id)`, `getCharacterSkinr(charId)`, `getCharacterSkinrComponents(charId)`    |
| Paragon Hub        | `client.paragonHub`          | Some | `getPublicListings()`, `getCharacterListings(charId)`, `getAllianceListings(id)`      |
| Access Lists       | `client.accessLists`         | Yes  | `getAccessList(id)`                                                                   |
| Status             | `client.status`              | No   | `getStatus()`                                                                         |
| UI                 | `client.ui`                  | Yes  | `setAutopilotWaypoint(destId, addToBeginning, clear)`, `openNewMailWindow(body)`      |
| Universe           | `client.universe`            | Some | `getSystemById(id)`, `getTypeById(id)`                                                |
| Wallet             | `client.wallet`              | Yes  | `getCharacterWallet(id)`                                                              |
| Wars               | `client.wars`                | No   | `getWars()`, `getWarById(id)`                                                         |
| Freelance Jobs     | `client.freelanceJobs`       | Some | `getFreelanceJobs()`, `getFreelanceJobById(id)`                                       |
| Meta               | `client.meta`                | No   | `getOpenApiJson()`, `getOpenApiYaml()`                                                |

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

### Request Body Validation

For POST/PUT/DELETE endpoints, opt-in request body validation ensures outgoing payloads match the endpoint's `requestSchema` before the request is sent:

```typescript
// Opt-in request body validation for POST/PUT/DELETE
const client = new EsiClient({ validateRequest: true });

// Throws EsiValidationError if the request body doesn't match the endpoint's requestSchema
await client.mail.sendMail(characterId, {
  recipients: [{ recipient_id: 12345, recipient_type: 'character' }],
  subject: 'Hello',
  body: 'Message body',
});
```

See [guides/RUNTIME-VALIDATION.md](guides/RUNTIME-VALIDATION.md) for the full guide on schemas, error handling, and extending schemas.

## Caching

ETag caching is on by default and works in three tiers: a GET inside the spec-defined TTL is answered from cache with no HTTP call, an older entry is revalidated with `If-None-Match`, and a 5xx with a cached copy serves the stale body instead of throwing. Authenticated cache entries are isolated per token.

```typescript
const client = new EsiClient({ etagCacheConfig: { maxEntries: 2000 } });
client.getCacheStats();
client.clearCache();
```

See [Caching in the architecture guide](guides/ARCHITECTURE.md#4-caching) for TTL precedence, invalidation, keys and configuration.

## Batch Requests

Fetch data for multiple IDs with bounded concurrency using `batch()`, or chunk large POST payloads with `batchPost()`:

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Fetch 500 type details with at most 10 concurrent requests (default 20)
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

For POST endpoints that accept arrays (e.g., `postNamesAndCategories` with a 1000-ID limit), `batchPost` auto-chunks and concatenates:

```typescript
const allNames = await client.batchPost(
  largeIdArray,
  (chunk) => client.universe.postNamesAndCategories(chunk),
  1000, // chunk size
);
```

## Streaming Pagination

Paginated endpoints can be consumed three ways: the plain method fetches every page and returns one array, `stream*` methods yield one validated page at a time, and `fetchAll*` methods fetch the remaining pages concurrently.

```typescript
for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(
    `Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
  );
  if (page.page >= 3) break; // stops fetching the remaining pages
}
```

Try it: `npm run example:streaming`. See [guides/PAGINATION.md](guides/PAGINATION.md) for the full method list, concurrency defaults and failure behaviour.

## Cursor-based Pagination

Newer ESI routes such as Freelance Jobs page with opaque `before` / `after` cursor tokens instead of page numbers. `fetchAllCursorPages` follows them to the end of the dataset, and a saved `after` token can be polled later for changed records.

See [guides/PAGINATION.md](guides/PAGINATION.md) for cursor semantics and examples.

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
  duration: 90,
  issued: '2026-09-01T12:00:00Z',
  location_id: 60003760,
  system_id: 30000142,
  min_volume: 1,
  range: 'region',
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

Failed calls throw `EsiError` (with `statusCode`, a sanitised `url` and `retryable`) or one of its subclasses, `TimeoutError` and `EsiValidationError`. An open circuit throws `CircuitOpenError`. Type guards such as `isRetryable`, `isTimeout`, `isValidationError` and `isCircuitOpen` narrow them, and `withSafeMode()` returns a result envelope instead of throwing.

```typescript
import { EsiError, isCircuitOpen } from '@lgriffin/esi.ts';

try {
  await client.alliance.getAllianceById(99999999);
} catch (err) {
  if (isCircuitOpen(err)) console.log(`Retry in ${err.retryAfterMs} ms`);
  else if (err instanceof EsiError) console.log(err.statusCode, err.retryable);
}
```

See [guides/ERRORS.md](guides/ERRORS.md) for the class hierarchy, retryability rules and safe mode.

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

Rate limiting is always on and needs no configuration. Each ESI rate-limit group from the OpenAPI spec gets its own bucket, the limiter learns remaining tokens from ESI's response headers, and a 420 or 429 blocks only the affected group. Multi-character applications can give each token its own buckets:

```typescript
const client = new EsiClient({
  rateLimiterConfig: {
    userKeyExtractor: (headers) => headers['Authorization'] ?? 'anon',
  },
});
```

See [Rate limiting in the architecture guide](guides/ARCHITECTURE.md#6-rate-limiting) for the throttling rules, per-endpoint overrides and monitoring. Retry, deduplication, the opt-in [circuit breaker](guides/ARCHITECTURE.md#7-circuit-breaker) and [request/response interceptors](guides/ARCHITECTURE.md#8-interceptors) are documented alongside it.

## Lightweight Clients

All three client creation patterns (`EsiClient`, `CustomEsiClient`, `EsiApiFactory`) now get identical middleware defaults (cache, request deduplication, rate limiter) thanks to `configureApiClient()`. Previously `CustomEsiClient` and `EsiApiFactory` only configured the rate limiter.

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

All 235 endpoint definitions have been validated against live Tranquility using the **OpenAPI 3.1 spec** — 206 from the public ESI spec plus 29 for newer EVE features. Full output is captured in [`openapi.output.md`](openapi.output.md).

| Category                    | Endpoints | Method                                             |
| --------------------------- | --------- | -------------------------------------------------- |
| Public GETs                 | 86        | 52 runnable example scripts with captured output   |
| Authenticated GETs          | 114       | Example scripts + live testing with EVE SSO tokens |
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

52 runnable examples are in the `examples/` directory.

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

```typescript runnable
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
try {
  const status = await client.status.getStatus();
  console.log(status.server_version);
} finally {
  await client.shutdown();
}
```

## Testing

ESI.ts has a comprehensive multi-tier testing strategy with 171 suites and 4,957 tests:

| Tier                       | Tests            | Purpose                                                            |
| -------------------------- | ---------------- | ------------------------------------------------------------------ |
| **TDD unit tests**         | 130 files        | Every client method, endpoint path, query param, and body format   |
| **BDD scenario tests**     | 41 feature files | Behavioral specifications in Gherkin (Given/When/Then)             |
| **Mocked integration**     | Full suite       | Cross-layer request flow with jest-fetch-mock                      |
| **Live smoke tests**       | 46 examples      | Every endpoint against live Tranquility                            |
| **ESI spec contract**      | 15 tests         | Endpoint definitions validated against live OpenAPI spec           |
| **Deep contract tests**    | 8 categories     | Path params, query params, body, auth, schemas, pagination vs spec |
| **Property-based fuzzing** | 601 tests        | fast-check fuzzing of validation, URL construction, Zod schemas    |
| **Mutation testing**       | Stryker          | Validates test suite kills code mutants                            |
| **Type-level tests**       | tsd              | Consumer API type correctness via tsd                              |
| **Gated auth tests**       | 33 tests         | Authenticated endpoints with real tokens                           |
| **Construction parity**    | Per-surface      | Verifies all client surfaces get identical middleware defaults     |
| **Spec-alignment**         | Type assertions  | Ensures hand-written types align with generated OpenAPI types      |

```bash
npm test          # Unit + BDD tests (171 suites, 4,957 tests)
npm run coverage  # Tests with coverage report (thresholds enforced)
npm run bdd       # BDD scenario tests only
npm run contract  # Contract tests (skipped without ESI_LIVE_TESTS=true)
npm run fuzz      # Property-based fuzz tests (601 tests)
npm run mutation  # Mutation testing (Stryker)
npm run benchmark # Performance benchmark tests
npm run test:types # tsd consumer type tests
```

Coverage: statements 98.37%, branches 95.14%, functions 96.09%, lines 98.17%. Thresholds enforced in CI: branches 80%, functions 75%, lines 90%, statements 90%.

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
npm test                   # Unit tests (171 suites, 4,957 tests)
npm run test:all           # Unit + BDD + integration + fuzz + type tests
npm run coverage           # Tests with coverage report (thresholds enforced)
npm run bdd                # BDD scenario tests
ESI_LIVE_TESTS=true npm run contract:live  # Deep contract tests against live ESI spec (fails without the variable)
npm run fuzz               # Property-based fuzz tests (fast-check)
npm run mutation           # Mutation testing (Stryker)
npm run benchmark          # Performance benchmark tests
npm run test:types         # Consumer type tests (tsd)
npm run mock:esi           # Start Prism mock ESI server on port 4010

# Static Analysis
npm run knip               # Detect dead code and unused exports
npm run validate:esi       # Validate endpoints against live ESI OpenAPI spec
npm run validate:spec      # Lint ESI OpenAPI spec with Redocly (structural + best practices)
npm run validate:auth-scopes  # Auth/scope cross-validation
npm run schema:drift       # Schema drift detection (hand-written vs OpenAPI spec)
npm run validate           # Run all checks: lint, format, build, coverage, knip
npm run generate:types     # Regenerate TypeScript interfaces from ESI OpenAPI spec
npm run generate:endpoints # Regenerate endpoint definitions from ESI OpenAPI spec
npm run generate:all       # Run all generators (types + endpoints + OKF)
npm run generate:okf       # Generate OKF knowledge bundle from ESI OpenAPI spec

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

Every push runs lint, format, build, typecheck and unit tests; pull requests to `master` run the full matrix behind a single Quality Gate check. Actions are SHA-pinned, packages publish with npm provenance, and release assets are cosign-signed.

See [guides/QUALITY-GATES.md](guides/QUALITY-GATES.md) for the gate matrix and every workflow, and [guides/SECURITY.md](guides/SECURITY.md) for the supply-chain controls.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Run `npm run validate` to check everything passes
5. Open a Pull Request

Work is tracked with [beads](https://github.com/gastownhall/beads) (`bd`). Run
`bd ready` to see available work — see [guides/BEADS.md](guides/BEADS.md) for the
full workflow.

## License

GPL-3.0-or-later - see the [LICENSE](LICENSE) file for details.

---

**o7**
