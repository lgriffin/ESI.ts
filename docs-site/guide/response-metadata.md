# Response Metadata

Use `withMetadata()` on any domain client to get response headers, cache status, rate limit info, and timing alongside the data.

## Basic Usage

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

## Metadata Fields

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

## Combining with Safe Mode

You can chain `withMetadata()` and `withSafeMode()`:

```typescript
const safeMetaClient = client.market.withSafeMode();
const result = await safeMetaClient.getMarketPrices();

if (result.ok) {
  console.log(result.data);
  console.log(result.meta.responseTimeMs);
}
```

## Deprecation Warnings

When ESI marks an endpoint as deprecated, the `warning` field in metadata will contain the deprecation notice. Monitor this to prepare for endpoint removal.
