# Strategy: Observable/Streaming API and WebSocket/SSE Support

## 1. Observable / Streaming API

### Motivation

ESI endpoints like market orders, killmails, and universe types return large paginated datasets. The current `PaginationHandler` eagerly fetches all pages before returning, which means:

- Memory pressure: all pages held in memory simultaneously
- Latency: consumer waits for the slowest page before processing begins
- No backpressure: consumer cannot control fetch rate

An async iterator / streaming API lets consumers process pages as they arrive, reducing memory footprint and time-to-first-result.

### Current Foundation

`AsyncPaginationIterator.ts` already provides `fetchPages<T>()` — an `async function*` generator that yields `PageResult<T>` objects. This is the foundation, but it's not exposed through the domain client API.

```typescript
// Already exists in src/core/pagination/AsyncPaginationIterator.ts
export async function* fetchPages<T>(
  fetcher: (page: number) => Promise<{ data: T[]; totalPages: number }>,
): AsyncGenerator<PageResult<T>> { ... }
```

### Design

**Phase 1 (v5.x): Stream option on paginated endpoints**

Add an optional `stream` parameter to paginated endpoint calls:

```typescript
// Eager (current behavior, default)
const allOrders = await client.market.getMarketOrders(regionId);

// Streaming (new)
for await (const page of client.market.getMarketOrders(regionId, { stream: true })) {
  processPage(page.data); // PageResult<MarketOrder>
  console.log(`Page ${page.page}/${page.totalPages}`);
}
```

Implementation requires:
1. Add `stream?: boolean` to endpoint call options in `createClient.ts`
2. When `stream: true`, return the `AsyncGenerator` from `fetchPages()` instead of collecting all pages
3. Update `WithMetadata<T>` type to handle the streaming return type
4. The `EndpointDefinition` needs a `paginated: boolean` flag (most already have implicit pagination via `x-pages` header)

**Phase 2 (v6.x): RxJS-compatible observable adapter**

```typescript
import { from } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';

const orders$ = from(client.market.getMarketOrders(regionId, { stream: true }));
orders$.pipe(
  mergeMap(page => page.data),
  take(100),
).subscribe(order => console.log(order));
```

Since `AsyncGenerator` is natively convertible to Observable via `from()`, Phase 2 may only require a thin adapter and documentation.

### Effort Estimate

- Phase 1: ~2-3 days (endpoint option threading, type changes, tests)
- Phase 2: ~1 day (adapter + docs, optional rxjs peer dependency)

### Dependencies

- None for Phase 1 (uses existing `AsyncPaginationIterator`)
- `rxjs` as optional peer dependency for Phase 2

### Risks

- Breaking change if default behavior changes (mitigated by opt-in `stream: true`)
- Type complexity: `WithMetadata<T>` overloads get complex when return type varies
- Pagination retry: currently `PaginationHandler` has its own retry; streaming would need to propagate errors to the consumer

---

## 2. WebSocket / SSE Support

### Motivation

Some ESI consumers want real-time updates for market data, killmails, or sovereignty changes. Currently, consumers must poll endpoints on a timer, which wastes API tokens and misses events between polls.

### Current State

ESI does **not** provide WebSocket or Server-Sent Events endpoints as of 2026. All data access is via REST. However:

- The killmail stream has historically been available via third-party WebSocket relays (e.g., zKillboard's WebSocket)
- Market data changes on a ~5-minute cache timer per endpoint
- Some consumers build their own polling loops with ESI's cache headers

### Design

**Phase 1 (v5.x): Polling facade with smart intervals**

Provide a `watch()` utility that wraps polling with ESI-aware intervals:

```typescript
const watcher = client.market.watch(regionId, typeId, {
  intervalMs: 300_000, // 5 min, aligned with ESI cache TTL
  onUpdate: (newOrders, previousOrders) => {
    const diff = computeDiff(newOrders, previousOrders);
    handleChanges(diff);
  },
  onError: (error) => console.error(error),
});

// Later
watcher.stop();
```

Implementation:
1. `PollingWatcher<T>` class: wraps `setInterval` + endpoint call
2. Uses spec-aware cache TTLs to suggest minimum polling intervals
3. Deduplication: only fires `onUpdate` when data actually changed (deep compare or ETag-based)
4. Respects rate limits: backs off when rate limited
5. Returns `AsyncIterable<T>` as alternative to callback API

**Phase 2 (future): Native EventSource/WebSocket when CCP adds support**

If CCP adds SSE or WebSocket endpoints:
1. `EventSourceClient` wrapping native `EventSource` with reconnection
2. `WebSocketClient` wrapping `WebSocket` with heartbeat/reconnection
3. Unified `subscribe()` API that auto-selects transport (WebSocket > SSE > polling)

### Effort Estimate

- Phase 1: ~3-4 days (PollingWatcher, change detection, tests, rate limit integration)
- Phase 2: Unknown timeline (depends on CCP adding endpoints)

### Dependencies

- Phase 1: None (uses existing ESI.ts infrastructure)
- Phase 2: Would need `ws` package for Node.js WebSocket client (browsers have native)

### Risks

- Polling facade may give false sense of "real-time" — consumers need to understand the latency
- Memory leaks if watchers aren't properly stopped
- Rate limit exhaustion if too many watchers are active
- Phase 2 is entirely speculative — CCP has not announced WebSocket/SSE plans
