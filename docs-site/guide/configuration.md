# Configuration

## Basic Configuration

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient({
  clientId: 'my-app', // User-Agent identifier (default: 'esi-client')
  accessToken: 'your-token', // EVE SSO token for authenticated endpoints
  timeout: 30000, // Request timeout in ms (default: 30000)
});
```

## Full Configuration Reference

```typescript
const client = new EsiClient({
  // Identity
  clientId: 'my-app', // User-Agent identifier
  baseUrl: 'https://esi.evetech.net', // ESI base URL

  // Authentication
  accessToken: 'your-token', // EVE SSO access token
  onTokenRefresh: async () => newToken, // Auto-refresh on 401

  // Localization
  language: 'en', // en, de, fr, ja, ru, zh, ko, es
  compatibilityDate: '2024-01-01', // ESI compatibility date header

  // Timeouts & Retry
  timeout: 30000,
  retryConfig: {
    maxRetries: 3, // Max retry attempts (default: 3)
    baseDelayMs: 1000, // Initial backoff delay
    maxDelayMs: 30000, // Maximum backoff delay
    retryMutations: false, // Retry POST/PUT/DELETE (default: false)
  },
  retryStrategy: customRetryStrategy, // Injectable IRetryStrategy

  // Caching
  enableETagCache: true, // ETag caching (default: true)
  etagCacheConfig: {
    maxEntries: 1000, // Max cached responses
    defaultTtl: 300000, // Fallback TTL in ms (5 min)
    cleanupInterval: 60000, // Cleanup interval (1 min)
  },

  // Validation
  validateResponse: true, // Zod-validate GET responses (default: true)
  validateRequest: false, // Zod-validate POST/PUT/DELETE bodies (opt-in)

  // Circuit Breaker
  enableCircuitBreaker: false, // Opt-in
  circuitBreakerConfig: {
    keyStrategy: 'resolved', // 'resolved' (per-URL) or 'template' (per-route)
    cleanupIntervalMs: 300000, // Stale circuit cleanup (5 min)
  },

  // Rate Limiting
  rateLimiterConfig: {
    userKeyExtractor: (headers) =>
      // Per-user bucketing for multi-char apps
      headers['authorization'] ?? 'anon',
  },

  // Request Deduplication
  enableRequestDeduplication: true, // Coalesce identical in-flight GETs (default: true)

  // Interceptors
  requestInterceptors: [myRequestInterceptor],
  responseInterceptors: [myResponseInterceptor],

  // Advanced
  unsafeAllowCustomHost: false, // Allow non-ESI base URLs
});
```

## Runtime Updates

Several settings can be changed after construction:

```typescript
// Update auth token
client.setAccessToken('new-token');

// Set or remove token provider
client.setTokenProvider(myRefreshFunction);
client.setTokenProvider(undefined); // disable auto-refresh

// Add interceptors (returns unsubscribe function)
const unsub = client.addRequestInterceptor(myInterceptor);
unsub(); // remove it later

// Update cache config
client.updateCacheConfig({ maxEntries: 2000 });

// Clear cache
client.clearCache();

// Reset circuit breaker for a specific endpoint
client.resetCircuitBreaker('GET:/v1/markets/{region_id}/orders/');
// Or reset all
client.resetCircuitBreaker();
```

## Environment Variables

These are read automatically when no explicit config is provided:

| Variable           | Description                                 | Default                   |
| ------------------ | ------------------------------------------- | ------------------------- |
| `ESI_ACCESS_TOKEN` | EVE SSO access token                        | none                      |
| `ESI_CLIENT_ID`    | User-Agent identifier                       | `esi-client`              |
| `ESI_BASE_URL`     | ESI API base URL                            | `https://esi.evetech.net` |
| `ESI_DATASOURCE`   | Server: `tranquility` or `singularity`      | `tranquility`             |
| `ESI_LOG_LEVEL`    | Log level: `error`, `warn`, `info`, `debug` | `warn`                    |

## Diagnostics

```typescript
// Cache stats
const stats = client.getCacheStats();
console.log(`${stats.totalEntries}/${stats.maxEntries} cached`);

// Circuit breaker stats
const cbStats = client.getCircuitBreakerStats();
for (const [endpoint, state] of Object.entries(cbStats)) {
  console.log(`${endpoint}: ${state.state}`);
}

// Full diagnostics
const diag = client.diagnostics;
```

## Shutdown

Always call `shutdown()` when you're done to clean up timers and caches:

```typescript
await client.shutdown();
```
