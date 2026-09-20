# Advanced Pattern Examples

## Response Metadata

Get detailed metadata alongside API responses:

```typescript
const metaClient = client.alliance.withMetadata();
const result = await metaClient.getAllianceById(99000001);

console.log(result.data.name);
console.log(`From cache: ${result.meta.fromCache}`);
console.log(`Cache type: ${result.meta.cacheHitType}`);
console.log(`Response time: ${result.meta.responseTimeMs}ms`);
console.log(
  `Rate limit: ${result.meta.rateLimit?.remaining}/${result.meta.rateLimit?.limit}`,
);
```

## Safe Mode (Error-as-Value)

```typescript
const safeClient = client.alliance.withSafeMode();

const result = await safeClient.getAllianceById(99999999);
if (result.ok) {
  console.log(`Found: ${result.data.name}`);
} else {
  console.log(`Error ${result.error.statusCode}: ${result.error.message}`);
}
```

## Batch Operations

```typescript
// Fetch multiple types with bounded concurrency
const typeIds = [34, 35, 36, 37, 38, 39, 40]; // Minerals
const result = await client.batch(
  typeIds,
  (id) => client.universe.getTypeById(id),
  {
    concurrency: 5,
    onProgress: (done, total) => console.log(`${done}/${total}`),
  },
);

for (const [id, type] of result.results) {
  console.log(`${type.name}: ${type.description?.slice(0, 50)}`);
}

// Bulk name resolution with auto-chunking
const names = await client.batchPost(
  largeIdArray,
  (chunk) => client.universe.postUniverseNames(chunk),
  1000,
);
```

## Streaming Pagination

```typescript
// Process market orders page by page
for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(`Page ${page.page}/${page.totalPages}`);

  for (const order of page.data) {
    // Process each order as it arrives
  }

  // Early termination
  if (page.page >= 5) break;
}
```

## Cursor-Based Pagination

```typescript
import { fetchAllCursorPages } from '@lgriffin/esi.ts';

// Auto-fetch all pages
const allJobs = await fetchAllCursorPages(
  (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
  (response) => response.freelance_jobs,
  (response) => response.cursor,
);

// Polling for changes with saved cursor
let savedCursor = lastPage.cursor.after;
const updates = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  savedCursor,
);
```

## Automatic Token Refresh

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

// All requests auto-refresh on 401
const location = await client.location.getCharacterLocation(characterId);
```

## Rate Limiter Monitoring

```typescript
const limiter = client.getRateLimiter();

// Check all active groups
const all = limiter.getAllGroupStatuses();
for (const [group, info] of all) {
  console.log(`${group}: ${info.remaining}/${info.limit}`);
}

// Check if a specific group is blocked
if (limiter.isBlocked('market-order')) {
  console.log('Market rate limit hit — waiting for reset');
}
```

## Lightweight Client Builder

```typescript
import { EsiClientBuilder } from '@lgriffin/esi.ts';

// Load only the clients you need
const client = new EsiClientBuilder()
  .addClients(['market', 'universe'])
  .withClientId('price-bot')
  .build();

const prices = await client.market?.getMarketPrices();
```

## Interceptors

```typescript
// Add request logging
client.addRequestInterceptor(async (ctx) => {
  console.log(`→ ${ctx.method} ${ctx.url}`);
  return ctx;
});

// Add response metrics
client.addResponseInterceptor(async (ctx) => {
  console.log(`← ${ctx.status} (${ctx.durationMs}ms)`);
  return ctx;
});
```
