# Caching

ESI.ts implements a three-tier caching system that minimizes API calls while keeping data fresh.

## How It Works

```
Request
  │
  ▼
┌─────────────────┐
│ Tier 1: Spec TTL │  ← Zero HTTP calls. Data can't have changed yet.
│ (x-cached-seconds)│
└────────┬────────┘
         │ TTL expired
         ▼
┌─────────────────┐
│ Tier 2: ETag    │  ← Conditional GET (If-None-Match). Minimal bandwidth.
│ (304 Not Modified)│
└────────┬────────┘
         │ Data changed
         ▼
┌─────────────────┐
│ Tier 3: Full    │  ← Fresh data fetched and cached.
│ Request          │
└─────────────────┘
```

### Tier 1: Spec-Aware TTL

126 of 195 endpoints have `x-cache-age` in the ESI OpenAPI spec. Within this window, repeated GET requests return cached data with **zero HTTP calls** — not even a conditional GET.

```typescript
const client = new EsiClient();

// First call — fetches from ESI
const alliances = await client.alliance.getAlliances();

// Second call within 3600s — returns cached data, zero HTTP calls
const same = await client.alliance.getAlliances();
```

### Tier 2: ETag Conditional GET

After the spec TTL expires, the client sends the cached ETag via `If-None-Match`. If the data hasn't changed, ESI returns `304 Not Modified` and the cached data is reused — saving bandwidth and parse time.

### Tier 3: Stale-on-Error

When ESI returns a 5xx error and cached data exists, the client returns stale cached data instead of throwing. This keeps your application functional during ESI outages.

## Configuration

ETag caching is **on by default**. Customize or disable it:

```typescript
const client = new EsiClient({
  enableETagCache: true, // default: true
  etagCacheConfig: {
    maxEntries: 1000, // max cached responses (default: 1000)
    defaultTtl: 300000, // fallback TTL in ms (default: 5 min)
    cleanupInterval: 60000, // expired entry cleanup (default: 1 min)
  },
});

// Disable caching entirely
const uncachedClient = new EsiClient({ enableETagCache: false });
```

## Cache Operations

```typescript
// Check cache stats
const stats = client.getCacheStats();
console.log(`${stats.totalEntries}/${stats.maxEntries} entries cached`);

// Update config at runtime
client.updateCacheConfig({ maxEntries: 2000 });

// Clear all cached data
client.clearCache();
```

## Write-Through Invalidation

POST, PUT, and DELETE requests automatically invalidate related GET caches. When you create a fitting, the cached fittings list is invalidated so the next read fetches fresh data.

## Cache Metadata

Use `withMetadata()` to see whether a response was served from cache:

```typescript
const meta = client.alliance.withMetadata();
const result = await meta.getAllianceById(99000001);

console.log(result.meta.fromCache); // true if served from cache
console.log(result.meta.cacheHitType); // 'spec-ttl' | 'etag-304' | 'stale-on-error'
```
