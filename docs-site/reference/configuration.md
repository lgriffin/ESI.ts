# Configuration Reference

Complete reference for `EsiClientConfig` — all options accepted by `new EsiClient(config)`.

## Identity

| Option              | Type                             | Default                                       | Description                                             |
| ------------------- | -------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `clientId`          | `string`                         | `'esi-client'` or `ESI_CLIENT_ID`             | User-Agent identifier sent with every request           |
| `baseUrl`           | `string`                         | `'https://esi.evetech.net'` or `ESI_BASE_URL` | ESI API base URL                                        |
| `datasource`        | `'tranquility' \| 'singularity'` | `'tranquility'` or `ESI_DATASOURCE`           | EVE server to query                                     |
| `language`          | `string`                         | none                                          | Accept-Language header (en, de, fr, ja, ru, zh, ko, es) |
| `compatibilityDate` | `string`                         | none                                          | ESI compatibility date header                           |

## Authentication

| Option           | Type                    | Default            | Description                              |
| ---------------- | ----------------------- | ------------------ | ---------------------------------------- |
| `accessToken`    | `string`                | `ESI_ACCESS_TOKEN` | EVE SSO access token                     |
| `onTokenRefresh` | `() => Promise<string>` | none               | Callback for automatic 401 token refresh |

## Timeouts & Retry

| Option                       | Type             | Default  | Description                                          |
| ---------------------------- | ---------------- | -------- | ---------------------------------------------------- |
| `timeout`                    | `number`         | `30000`  | Request timeout in milliseconds                      |
| `retryAttempts`              | `number`         | `3`      | Shorthand for `retryConfig.maxRetries`               |
| `retryConfig.maxRetries`     | `number`         | `3`      | Maximum retry attempts for transient errors          |
| `retryConfig.baseDelayMs`    | `number`         | `1000`   | Initial backoff delay in ms                          |
| `retryConfig.maxDelayMs`     | `number`         | `30000`  | Maximum backoff delay in ms                          |
| `retryConfig.retryMutations` | `boolean`        | `false`  | Whether to retry POST/PUT/DELETE (default: GET only) |
| `retryStrategy`              | `IRetryStrategy` | built-in | Injectable custom retry strategy                     |

## Caching

| Option                            | Type      | Default  | Description                            |
| --------------------------------- | --------- | -------- | -------------------------------------- |
| `enableETagCache`                 | `boolean` | `true`   | Enable ETag-based caching              |
| `etagCacheConfig.maxEntries`      | `number`  | `1000`   | Maximum cached responses               |
| `etagCacheConfig.defaultTtl`      | `number`  | `300000` | Fallback TTL in ms (5 min)             |
| `etagCacheConfig.cleanupInterval` | `number`  | `60000`  | Expired entry cleanup interval (1 min) |

## Validation

| Option             | Type      | Default | Description                                 |
| ------------------ | --------- | ------- | ------------------------------------------- |
| `validateResponse` | `boolean` | `true`  | Zod-validate GET responses at runtime       |
| `validateRequest`  | `boolean` | `false` | Zod-validate POST/PUT/DELETE request bodies |

## Circuit Breaker

| Option                                   | Type                       | Default      | Description                         |
| ---------------------------------------- | -------------------------- | ------------ | ----------------------------------- |
| `enableCircuitBreaker`                   | `boolean`                  | `false`      | Enable per-endpoint circuit breaker |
| `circuitBreakerConfig.keyStrategy`       | `'resolved' \| 'template'` | `'resolved'` | Per-URL vs per-route circuit keying |
| `circuitBreakerConfig.cleanupIntervalMs` | `number`                   | `300000`     | Stale circuit cleanup interval      |

## Rate Limiting

| Option                               | Type                  | Default | Description                                 |
| ------------------------------------ | --------------------- | ------- | ------------------------------------------- |
| `rateLimiterConfig.userKeyExtractor` | `(headers) => string` | none    | Per-user bucketing for multi-character apps |

## Deduplication

| Option                       | Type      | Default | Description                               |
| ---------------------------- | --------- | ------- | ----------------------------------------- |
| `enableRequestDeduplication` | `boolean` | `true`  | Coalesce identical in-flight GET requests |

## Interceptors

| Option                 | Type                    | Default | Description                   |
| ---------------------- | ----------------------- | ------- | ----------------------------- |
| `requestInterceptors`  | `RequestInterceptor[]`  | `[]`    | Request middleware functions  |
| `responseInterceptors` | `ResponseInterceptor[]` | `[]`    | Response middleware functions |

## Advanced

| Option                  | Type      | Default | Description                                        |
| ----------------------- | --------- | ------- | -------------------------------------------------- |
| `unsafeAllowCustomHost` | `boolean` | `false` | Allow non-ESI base URLs (disables host validation) |
