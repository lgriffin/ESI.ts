# Rate Limiting

ESI.ts automatically manages rate limiting using per-group token buckets extracted from the ESI OpenAPI spec at build time.

## How It Works

ESI defines 36 rate limit groups (e.g., `market-order`, `char-notification`, `universe-type`). Each group gets its own independent token bucket. A burst of market requests won't starve unrelated endpoints.

Rate limiting works **out of the box** with no configuration.

## Multi-Character Apps

For applications managing multiple EVE characters, enable per-user bucketing:

```typescript
const client = new EsiClient({
  rateLimiterConfig: {
    userKeyExtractor: (headers) => headers['authorization'] ?? 'anon',
  },
});
```

## Monitoring

```typescript
const limiter = client.getRateLimiter();

// Worst-case across all groups
const status = limiter.getStatus();
console.log(status.remaining, status.limit, status.group);

// Specific group
const marketStatus = limiter.getGroupStatus('market-order');
console.log(marketStatus?.remaining);

// All active groups
const all = limiter.getAllGroupStatuses();
for (const [group, info] of all) {
  console.log(`${group}: ${info.remaining}/${info.limit}`);
}

// Check if a group is blocked (429'd)
console.log(limiter.isBlocked('char-notification'));
```

## Error Limit Tracking

ESI tracks error counts per-IP. When your error rate gets too high, ESI returns `420 Error Limited`. The rate limiter automatically tracks these headers and throttles requests before hitting the error limit.
