# Jitaspace Integration Mapping: ESI.ts as ESI Client

This document maps how `@lgriffin/esi.ts` could replace or wrap `@jitaspace/esi-client` in the [jitaspace](https://github.com/joaomlneto/jitaspace) monorepo, a Next.js 16 EVE Online companion app at jita.space.

---

## Executive Summary

Jitaspace uses a **Kubb-generated ESI client** with a custom axios-based HTTP transport that handles per-user per-group rate limiting, compatibility date injection, and JWT-based user bucketing. ESI.ts is a **hand-crafted typed client** with ETag caching, spec-aware cache TTLs, retry with backoff, circuit breaker, and request deduplication.

The two libraries are complementary: ESI.ts has stronger infrastructure (caching, retry, circuit breaker) while jitaspace's client has richer rate limiting (per-user, per-group, 35 sliding-window buckets) and a React Query integration layer that ESI.ts lacks entirely.

**Integration strategy**: ESI.ts as the HTTP transport layer underneath jitaspace's React Query hooks, replacing the Kubb-generated fetch functions and custom axios client.

---

## Architecture Comparison

| Concern | jitaspace (`@jitaspace/esi-client`) | ESI.ts (`@lgriffin/esi.ts`) |
|---------|--------------------------------------|------------------------------|
| **Code generation** | Kubb v4.38 from OpenAPI spec; regenerated at `postinstall` | Hand-written clients + spec-generated types |
| **HTTP client** | Custom axios wrapper (488 lines) | Native `fetch` with `AbortController` timeout |
| **Types** | Kubb `pluginTs` — full path-derived names | 128 hand-written + 148 spec-generated (`EsiSpec` namespace) |
| **React Query** | Kubb `pluginReactQuery` — hooks + infinite queries | None — fetch-only, returns Promises |
| **Zod schemas** | Kubb `pluginZod` — runtime validation | None |
| **Rate limiting** | Per-user, per-group, 35 sliding-window buckets (`@tanstack/pacer-lite`) | Single global bucket from response headers |
| **ETag caching** | None | Full ETag cache with `If-None-Match` / 304 handling |
| **Spec-aware cache** | None | Per-endpoint TTLs from ESI `x-cached-seconds` |
| **Retry** | None (relies on React Query's 3-attempt default) | Exponential backoff with jitter, configurable |
| **Circuit breaker** | None | Configurable per-endpoint circuit breaker |
| **Request dedup** | None | In-flight request deduplication |
| **Timeout** | Not explicitly handled | `TimeoutError` with per-request override |
| **Batch** | `p-limit` in background jobs | `batchFetch` / `batchPost` with bounded concurrency |
| **Pagination** | Kubb infinite query overrides + manual `x-pages` | `fetchPages` async generator + cursor pagination |
| **Auth** | External (Zustand store → `Authorization` header) | `accessToken` config + `onTokenRefresh` callback |
| **Compatibility date** | Extracted from spec at build time, injected per-request | Not handled |
| **User-Agent** | `X-User-Agent` header injection | `clientId` → User-Agent header |
| **Accept-Language** | Configurable, defaults to `"en"` | Not configurable |

---

## Jitaspace Package Dependency Graph (ESI-related)

```
apps/web (Next.js 16)
  └── @jitaspace/hooks (100+ React hooks)
        ├── @jitaspace/esi-client (Kubb-generated)
        │     ├── Generated fetch functions
        │     ├── Generated React Query hooks
        │     ├── Generated TypeScript types
        │     ├── Generated Zod schemas
        │     ├── Custom axios client (rate limiting, headers)
        │     └── Rate limit engine (@tanstack/pacer-lite)
        ├── @jitaspace/esi-metadata (scopes, ID ranges)
        ├── @jitaspace/auth-utils (token decode/verify)
        └── @jitaspace/sde-client (static data)

@jitaspace/background-jobs
  └── @jitaspace/esi-client (fetch functions only, no hooks)
```

---

## Integration Points

### 1. Replace `@jitaspace/esi-client` Fetch Functions

**What jitaspace has**: ~200 Kubb-generated standalone functions like `getAlliances()`, `getCharactersCharacterId(characterId, headers)`. Each returns `Promise<{ data, status, headers }>` (full response, not just body).

**What ESI.ts has**: 35 domain clients with ~200 methods like `client.alliance.getAlliances()`. Normal calls return the body directly; `withMetadata()` returns `{ data, meta }`.

**Mapping**: Direct 1:1 mapping exists for all endpoints. Method name conventions differ:

| jitaspace (Kubb) | ESI.ts | Notes |
|-------------------|--------|-------|
| `getAlliances()` | `client.alliance.getAlliances()` | Same |
| `getCharactersCharacterId(id, {}, headers)` | `client.characters.getCharacterPublicInfo(id)` | Friendlier name |
| `getCharactersCharacterIdAssets(id, {page}, headers)` | `client.assets.getCharacterAssets(id)` | ESI.ts auto-paginates |
| `getCharactersCharacterIdWallet(id, {}, headers)` | `client.wallet.getCharacterWallet(id)` | Same |
| `getUniverseTypesTypeId(typeId)` | `client.universe.getTypeById(typeId)` | Same |
| `postUniverseNames(ids)` | `client.universe.postNamesAndCategories(ids)` | Same |

**Gap — Full response access**: Jitaspace's hooks read raw response headers (`x-pages`, `x-ratelimit-*`, `x-esi-error-limit-*`). ESI.ts's `withMetadata()` exposes `meta.headers` (all headers), `meta.rateLimit` (parsed), and page count is handled internally by the paginator.

**Action required**:
- Create an **adapter layer** that maps ESI.ts `withMetadata()` responses to the `{ data, status, headers }` shape jitaspace expects, OR refactor hooks to consume `EsiResponse<T>` directly.
- Ensure all ~200 endpoints are covered. ESI.ts has some endpoints jitaspace's spec may not (freelance jobs, skyhooks, mercenary dens) and vice versa.

### 2. Replace the Custom Axios Client

**What jitaspace has** (`src/client.ts`, 488 lines):
- Per-user rate limiting: Decodes JWT from Authorization header to extract `applicationId:characterId` for per-user buckets
- Per-group rate limiting: 35 ESI rate limit groups with sliding windows
- `Retry-After` handling on 429s
- `X-Compatibility-Date` header injection (from build-time spec metadata)
- `X-User-Agent` header injection
- `Accept-Language` header injection

**What ESI.ts has**:
- Single global rate limiter tracking `x-ratelimit-*` headers
- Retry with exponential backoff on 429/502/503/504/timeout
- `Authorization: Bearer` header injection from configured token
- Request deduplication
- Circuit breaker

**Gap analysis**:

| Feature | jitaspace | ESI.ts | Gap |
|---------|-----------|--------|-----|
| Per-user rate limiting | Yes (JWT decode → user bucket) | No (global) | **Major gap** — ESI.ts would need per-user bucketing for multi-character apps |
| Per-group rate limiting | Yes (35 groups from spec) | Partial (reads group header, single counter) | **Major gap** — ESI.ts has one counter, not 35 |
| Retry-After on 429 | Yes (blocks group/user) | Yes (via retry loop) | Covered |
| Compatibility date | Yes (from build-time spec) | No | **Minor gap** — add as header in request interceptor |
| Accept-Language | Yes (configurable) | No | **Minor gap** — add to config |
| User-Agent | `X-User-Agent` | `User-Agent` via `clientId` | Different header name; ESI accepts both |

**Action required**:
- **Option A (Wrap)**: Use ESI.ts's `addRequestInterceptor()` to inject compatibility date, accept-language, and user-agent headers. Keep jitaspace's rate limiter as a middleware layer wrapping ESI.ts calls.
- **Option B (Extend)**: Extend ESI.ts's `RateLimiter` to support per-user, per-group sliding windows. This is a significant enhancement.
- **Recommended**: Option A for initial integration; Option B as a follow-up ESI.ts enhancement.

### 3. React Query Hook Layer

**What jitaspace has**: Kubb generates React Query hooks for every endpoint:
- `useGetCharactersCharacterId(id)` — standard query
- `useGetCharactersCharacterIdAssetsInfinite(id)` — infinite query for paginated endpoints
- Suspense variants available

Then `@jitaspace/hooks` wraps these with auth and scope checking:
```typescript
// Pattern: hooks compose esi-client hooks + auth
const { accessToken, authHeaders } = useAccessToken({
  characterId,
  scopes: ["esi-wallet.read_character_wallet.v1"],
});
return useGetCharactersCharacterIdWalletJournal(
  characterId, {}, { ...authHeaders },
  { query: { enabled: accessToken !== null } }
);
```

**What ESI.ts has**: No React integration. Returns `Promise<T>` from domain client methods.

**Gap**: This is the **largest integration gap**. Options:

| Approach | Effort | Disruption |
|----------|--------|------------|
| **A. Wrapper hooks package** | Medium | Low — create `@jitaspace/esi-hooks` that wraps ESI.ts calls in `useQuery`/`useMutation`. Jitaspace's `@jitaspace/hooks` switches from generated hooks to these. | 
| **B. ESI.ts React Query plugin** | High | Low — add an optional `@lgriffin/esi.ts-react-query` package that exports hooks and query key factories for all 35 clients. Jitaspace consumes directly. |
| **C. Direct `useQuery` in jitaspace hooks** | Low | Medium — remove Kubb query hooks entirely; each hook in `@jitaspace/hooks` calls ESI.ts directly inside `useQuery`. |

**Recommended**: Approach C for initial integration — it's the least amount of new code and jitaspace's hooks layer already adds auth/scope logic on top of the generated hooks. Example migration:

```typescript
// Before (Kubb-generated hook)
import { useGetCharactersCharacterIdWallet } from "@jitaspace/esi-client";

export function useCharacterWallet(characterId: number) {
  const { accessToken, authHeaders } = useAccessToken({ characterId, scopes: [...] });
  return useGetCharactersCharacterIdWallet(characterId, {}, authHeaders, {
    query: { enabled: accessToken !== null },
  });
}

// After (ESI.ts + direct useQuery)
import { useQuery } from "@tanstack/react-query";
import { useEsiClient } from "./useEsiClient"; // shared hook returning configured EsiClient

export function useCharacterWallet(characterId: number) {
  const { client, isReady } = useEsiClient({ characterId, scopes: [...] });
  return useQuery({
    queryKey: ["esi", "wallet", characterId],
    queryFn: () => client.wallet.getCharacterWallet(characterId),
    enabled: isReady,
  });
}
```

### 4. Authentication Integration

**What jitaspace has**: Custom EVE SSO OAuth2 (PKCE + Iron-sealed cookies):
1. Multi-character Zustand store (`Record<number, CharacterSsoSession>`)
2. `useAccessToken({ characterId, scopes })` hook checks stored JWT `scp` claim
3. Token passed as `{ Authorization: "Bearer ..." }` header to ESI client functions
4. Token refresh via server action → sealed refresh token → EVE SSO → new access token
5. Auto-refresh timer fires 30s before token expiry

**What ESI.ts has**:
- Single `accessToken` per client instance
- `onTokenRefresh` callback with concurrent coalescing
- `setAccessToken()` for runtime updates

**Gap — Multi-character**: ESI.ts has one token per client. Jitaspace has N characters with N tokens.

**Action required**:
- **Option A**: Create one `EsiClient` per character. Store in a `Map<number, EsiClient>`. Each gets its own token and refresh callback. Pro: clean separation. Con: N cache instances, N circuit breakers.
- **Option B**: Create a shared `EsiClient` and swap the token before each request via a request interceptor. Pro: shared infrastructure. Con: race conditions with concurrent requests for different characters.
- **Option C**: Create one unauthenticated `EsiClient` for public endpoints (shared cache/circuit breaker) and per-character instances for authenticated calls. Pro: best of both worlds.
- **Recommended**: Option C — matches how jitaspace already separates public vs. authenticated flows.

### 5. Caching (ESI.ts Advantage)

**What jitaspace has**: No HTTP-level caching. Relies on React Query's `staleTime: 0` default. Every window focus or component mount refetches.

**What ESI.ts adds**:
- **ETag cache**: Stores responses keyed by URL. On repeat requests, sends `If-None-Match` → 304 saves bandwidth.
- **Spec-aware cache**: Per-endpoint TTLs from ESI's `x-cached-seconds`. Short-circuits requests entirely when data is within the cache window. Status endpoint: 30s. Alliance info: 3600s. Market orders: 300s.
- **Write invalidation**: Cache entries for related endpoints are cleared on POST/PUT/DELETE.

**Impact**: Significant reduction in ESI requests. Most universe data (types, systems, regions) has 1-hour+ TTLs. Jitaspace currently re-fetches these on every component mount.

**Action required**: None — this is a drop-in improvement. May want to tune `maxEntries` higher for jitaspace's scale (100k+ entity lookups).

### 6. Background Jobs

**What jitaspace has**: `@jitaspace/background-jobs` scrapes 20+ public ESI endpoints via Trigger.dev, using the same Kubb-generated fetch functions (not hooks). Uses `p-limit` for concurrency.

**What ESI.ts has**: `batchFetch` with bounded concurrency (default 20), progress callbacks, and error collection.

**Migration**: Straightforward — replace Kubb function calls with ESI.ts client calls. `batchFetch` replaces the `p-limit` pattern:

```typescript
// Before
import pLimit from "p-limit";
import { getAlliances } from "@jitaspace/esi-client";
const limit = pLimit(20);
const results = await Promise.all(ids.map(id => limit(() => getAlliances())));

// After
import { EsiClient, batchFetch } from "@lgriffin/esi.ts";
const client = new EsiClient();
const { results, errors } = await batchFetch(ids, id => client.alliance.getAllianceById(id));
```

### 7. Type Mapping

**Jitaspace types** (Kubb-generated): Path-derived names like `GetCharactersCharacterIdQueryResponse`, `GetUniverseTypesTypeIdQueryResponse`.

**ESI.ts types** (hand-written): Domain names like `CharacterInfo`, `TypeInfo`, `MarketOrder`.

**ESI.ts also exports**: `EsiSpec` namespace with ~148 spec-generated types matching a similar naming convention to Kubb's output.

**Migration**: Jitaspace code that references Kubb type names would need to switch to ESI.ts names. A type alias file could ease the transition:

```typescript
// compat-types.ts — temporary bridge
export type { CharacterInfo as GetCharactersCharacterIdQueryResponse } from "@lgriffin/esi.ts";
export type { TypeInfo as GetUniverseTypesTypeIdQueryResponse } from "@lgriffin/esi.ts";
// ... etc
```

### 8. ESI Metadata / Scopes

**What jitaspace has** (`@jitaspace/esi-metadata`):
- `ESIScope` type — union of 72 scope strings
- `endpointScopes` — mapping of ~170 paths to required scopes
- ID range tuples for entity type inference

**What ESI.ts has**:
- Endpoint definitions include `requiresAuth: true/false` but no scope information
- No scope-to-endpoint mapping
- No ID range utilities

**Gap**: ESI.ts does not track ESI scopes. Jitaspace's `useAccessToken` hook checks the JWT's `scp` claim against required scopes before enabling queries.

**Action required**:
- Keep `@jitaspace/esi-metadata` as-is — it's independent of the ESI client
- OR absorb scope data into ESI.ts endpoint definitions (enhancement)

---

## Gaps in ESI.ts That Block Integration

| # | Gap | Severity | Effort | Notes |
|---|-----|----------|--------|-------|
| 1 | No React Query hooks | High | Medium | Largest gap. Approach C (direct `useQuery`) is viable without ESI.ts changes |
| 2 | Single-user auth model | High | Low | Solved by per-character client instances (Option C above) |
| 3 | No per-user/per-group rate limiting | Medium | High | Keep jitaspace's rate limiter as a wrapper initially |
| 4 | No `Accept-Language` config | Low | Trivial | Add to `EsiClientConfig` or use request interceptor |
| 5 | No `X-Compatibility-Date` header | Low | Trivial | Add via request interceptor |
| 6 | No Zod runtime validation | Low | N/A | Jitaspace trusts ESI responses; Zod schemas are generated but lightly used |
| 7 | No ESI scope metadata | Low | Low | Keep `@jitaspace/esi-metadata` package |
| 8 | No `x-esi-error-limit-*` tracking for UI | Low | Trivial | Available via `withMetadata().meta.headers` |

---

## Gaps in Jitaspace That ESI.ts Fills

| # | Gap | Impact |
|---|-----|--------|
| 1 | No ETag caching | Every request hits ESI; ESI.ts would eliminate redundant fetches |
| 2 | No spec-aware cache | Universe/static data re-fetched constantly; ESI.ts short-circuits within TTL |
| 3 | No retry with backoff | Transient 502/503/504 errors surface to users; ESI.ts retries transparently |
| 4 | No circuit breaker | Cascading failures when ESI is degraded; ESI.ts stops sending to failing endpoints |
| 5 | No request deduplication | Concurrent identical requests (e.g., multiple components loading same character) each hit ESI; ESI.ts deduplicates in-flight |
| 6 | No typed timeout errors | Timeout errors are generic; ESI.ts provides `TimeoutError` with `timeoutMs` |
| 7 | No stale-on-error | When ESI errors, users see errors; ESI.ts serves stale cache data with a warning |

---

## Recommended Integration Phases

### Phase 1: Side-by-Side (Low Risk)

Add ESI.ts as a dependency alongside `@jitaspace/esi-client`. Use it for:
- Background jobs (replace Kubb fetch functions with ESI.ts `batchFetch`)
- Server-side `generateMetadata()` calls (benefit from spec-aware caching)
- New hooks that don't yet exist in jitaspace

**Changes**: Add `@lgriffin/esi.ts` to `packages/hooks/package.json` and `packages/background-jobs/package.json`. Create a shared `createEsiClient()` factory that configures retry, caching, and circuit breaker.

**No breaking changes**. Existing hooks continue using Kubb-generated functions.

### Phase 2: Hook Migration (Medium Risk)

Migrate `@jitaspace/hooks` from Kubb-generated React Query hooks to direct `useQuery` wrapping ESI.ts calls.

**Order**: Start with simple public endpoints (status, universe, alliances) where no auth is needed. Then authenticated endpoints (wallet, assets, skills). Finally, paginated/infinite endpoints (assets, contacts, mail).

**Key deliverable**: A `useEsiClient()` hook that:
1. Reads from the Zustand auth store for the selected character
2. Creates/caches an `EsiClient` instance per character
3. Wires `onTokenRefresh` to the existing server action
4. Returns `{ client, isReady }` for use in `useQuery.enabled`

### Phase 3: Remove Kubb (High Risk)

Once all hooks are migrated, remove `@jitaspace/esi-client` (the Kubb package) entirely.

**Prerequisites**:
- All ~100 hooks migrated and tested
- Background jobs migrated
- Server-side metadata calls migrated
- Rate limiting either moved to ESI.ts or kept as a middleware wrapper
- Zod schemas replaced with ESI.ts types (or dropped)

### Phase 4: Enhance ESI.ts (Optional)

Based on integration learnings, enhance ESI.ts:
- Per-user, per-group rate limiting (port jitaspace's rate limiter engine)
- `Accept-Language` configuration
- ESI scope metadata
- Optional React Query hook package

---

## Endpoint Coverage Comparison

ESI.ts covers **~200 methods across 35 clients**. Jitaspace's Kubb client generates functions for every ESI endpoint in the OpenAPI spec.

### ESI.ts Endpoints NOT in Typical Kubb Output

| Endpoint | ESI.ts Client | Notes |
|----------|---------------|-------|
| `freelance-jobs/*` | `FreelanceJobsClient` | New ESI endpoints (cursor-paginated) |
| `sovereignty/hubs` | `SkyhooksClient` | New ESI endpoints |
| `sovereignty/skyhooks/*` | `SkyhooksClient` | New ESI endpoints |
| `mercenary/dens` | `MercenaryClient` | New ESI endpoints |
| `mercenary/operations` | `MercenaryClient` | New ESI endpoints |
| `access-lists/{id}` | `AccessListsClient` | New ESI endpoint |

These may or may not be in jitaspace's generated client depending on their OpenAPI spec version and `compatibility_date`.

### Jitaspace Endpoints That May Not Be in ESI.ts

Kubb generates from the full OpenAPI spec, so any endpoint in the spec gets a function. ESI.ts hand-writes clients, so newer or less common endpoints might be missing. A full audit against the current spec would be needed to confirm 100% coverage.

---

## Data Flow After Integration

### Client-Side (Authenticated)

```
React Component
  └── @jitaspace/hooks (useCharacterWallet, etc.)
        ├── useEsiClient({ characterId, scopes }) — new shared hook
        │     ├── Zustand auth store → accessToken
        │     ├── Creates/caches EsiClient per character
        │     └── Wires onTokenRefresh to server action
        └── useQuery({ queryFn: () => client.wallet.getCharacterWallet(id) })
              └── EsiClient
                    ├── ETag cache (If-None-Match → 304)
                    ├── Spec-aware cache (short-circuit within TTL)
                    ├── Request deduplication
                    ├── Retry with exponential backoff
                    ├── Circuit breaker
                    └── fetch → https://esi.evetech.net/...
```

### Server-Side (Public / Background Jobs)

```
Trigger.dev job / generateMetadata()
  └── Shared EsiClient (no auth)
        ├── batchFetch(ids, fetcher) — replaces p-limit
        ├── ETag cache + spec-aware cache
        ├── Retry + circuit breaker
        └── fetch → ESI
              └── Prisma upsert (background jobs only)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ESI.ts missing an endpoint jitaspace uses | Medium | Low | Audit against OpenAPI spec; add missing endpoints |
| Type name differences cause widespread refactoring | Medium | Medium | Create compat type alias file for transition period |
| Per-character client instances cause memory pressure | Low | Medium | Share cache and circuit breaker across instances |
| React Query integration is awkward without hooks | Low | Medium | `useQuery` wrapping is standard React Query usage |
| Jitaspace's per-group rate limiter is hard to replicate | Medium | High | Keep as middleware wrapper in Phase 1-2; port to ESI.ts in Phase 4 |
| Spec-aware cache causes stale data in fast-changing endpoints | Low | Low | Cache respects ESI's own `x-cached-seconds` values |

---

## Quick Reference: Method Name Mapping (Top 30)

| jitaspace (Kubb) | ESI.ts | Domain |
|-------------------|--------|--------|
| `getAlliances` | `alliance.getAlliances` | Alliance |
| `getAlliancesAllianceId` | `alliance.getAllianceById` | Alliance |
| `getCharactersCharacterId` | `characters.getCharacterPublicInfo` | Character |
| `getCharactersCharacterIdAssets` | `assets.getCharacterAssets` | Assets |
| `getCharactersCharacterIdBlueprints` | `characters.getCharacterBlueprints` | Character |
| `getCharactersCharacterIdCalendar` | `calendar.getCalendarEvents` | Calendar |
| `getCharactersCharacterIdClones` | `clones.getClones` | Clones |
| `getCharactersCharacterIdContacts` | `contacts.getCharacterContacts` | Contacts |
| `getCharactersCharacterIdContracts` | `contracts.getCharacterContracts` | Contracts |
| `getCharactersCharacterIdFittings` | `fittings.getFittings` | Fittings |
| `getCharactersCharacterIdFleet` | `fleet.getCharacterFleetInfo` | Fleet |
| `getCharactersCharacterIdIndustryJobs` | `industry.getCharacterIndustryJobs` | Industry |
| `getCharactersCharacterIdKillmailsRecent` | `killmails.getCharacterRecentKillmails` | Killmails |
| `getCharactersCharacterIdLocation` | `location.getCharacterLocation` | Location |
| `getCharactersCharacterIdMail` | `mail.getMailHeaders` | Mail |
| `getCharactersCharacterIdOnline` | `location.getCharacterOnline` | Location |
| `getCharactersCharacterIdOrders` | `market.getCharacterOrders` | Market |
| `getCharactersCharacterIdPlanets` | `pi.getColonies` | PI |
| `getCharactersCharacterIdShip` | `location.getCharacterShip` | Location |
| `getCharactersCharacterIdSkills` | `skills.getCharacterSkills` | Skills |
| `getCharactersCharacterIdSkillqueue` | `skills.getCharacterSkillQueue` | Skills |
| `getCharactersCharacterIdWallet` | `wallet.getCharacterWallet` | Wallet |
| `getCharactersCharacterIdWalletJournal` | `wallet.getCharacterWalletJournal` | Wallet |
| `getCorporationsCorporationId` | `corporations.getCorporationInfo` | Corp |
| `getMarketsRegionIdOrders` | `market.getMarketOrders` | Market |
| `getMarketsPrices` | `market.getMarketPrices` | Market |
| `getStatus` | `status.getStatus` | Status |
| `getUniverseSystemsSystemId` | `universe.getSystemById` | Universe |
| `getUniverseTypesTypeId` | `universe.getTypeById` | Universe |
| `postUniverseNames` | `universe.postNamesAndCategories` | Universe |
