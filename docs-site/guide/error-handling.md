# Error Handling

## Error Types

ESI.ts provides typed error classes and type guard functions for precise error handling.

### EsiError

The base error class for all ESI API errors:

```typescript
import { EsiError } from '@lgriffin/esi.ts';

try {
  const alliance = await client.alliance.getAllianceById(99999999);
} catch (err) {
  if (err instanceof EsiError) {
    console.log(err.statusCode); // HTTP status code
    console.log(err.message); // Error message from ESI
    console.log(err.url); // Request URL
    console.log(err.retryable); // Whether the error is retryable
  }
}
```

### Specialized Error Classes

| Class                | When Thrown                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `EsiError`           | Any ESI API error (4xx, 5xx)                                                                      |
| `TimeoutError`       | Request exceeded the configured timeout. Extends `EsiError` with `statusCode: 0` and `timeoutMs`. |
| `EsiValidationError` | Response data doesn't match the expected Zod schema. Extends `EsiError` with `validationError`.   |
| `CircuitOpenError`   | Circuit breaker is open for this endpoint. Extends `EsiError`.                                    |

## Type Guards

Type guard functions provide narrowing without `instanceof` checks:

```typescript
import {
  isEsiError,
  isNotFound,
  isUnauthorized,
  isForbidden,
  isRateLimited,
  isServerError,
  isTimeout,
  isRetryable,
  isValidationError,
  isCircuitOpen,
} from '@lgriffin/esi.ts';

try {
  await client.alliance.getAllianceById(allianceId);
} catch (err) {
  if (isNotFound(err)) {
    // 404 — entity doesn't exist
  } else if (isUnauthorized(err)) {
    // 401 — token invalid or expired
  } else if (isForbidden(err)) {
    // 403 — missing required scope
  } else if (isRateLimited(err)) {
    // 420/429 — rate limited (client retries automatically)
  } else if (isCircuitOpen(err)) {
    // Circuit breaker tripped — endpoint temporarily unavailable
  } else if (isValidationError(err)) {
    // Response didn't match Zod schema
    console.log(err.validationError);
  } else if (isTimeout(err)) {
    // Request timed out
    console.log(`Timed out after ${err.timeoutMs}ms`);
  } else if (isServerError(err)) {
    // 5xx — ESI server error
  } else if (isRetryable(err)) {
    // 502, 503, 504, 420, 429, timeout
  }
}
```

## Safe Mode

Instead of throwing exceptions, get errors as values using `withSafeMode()`:

```typescript
const safeAlliance = client.alliance.withSafeMode();

const result = await safeAlliance.getAllianceById(99000001);

if (result.ok) {
  console.log(result.data.name); // "Goonswarm Federation"
  console.log(result.meta); // Response metadata
} else {
  console.log(result.error.message);
  console.log(result.error.statusCode);
}
```

The return type is a discriminated union:

```typescript
type EsiResult<T> =
  | { ok: true; data: T; meta: EsiResponseMeta }
  | { ok: false; error: EsiError; meta?: EsiResponseMeta };
```

## HTTP Status Code Behaviors

| Status        | Behavior                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| `200`         | Returns parsed, validated data                                                  |
| `204`         | Returns `undefined` (valid for DELETE/POST actions)                             |
| `304`         | Returns cached data (ETag match — handled internally)                           |
| `401`         | If `onTokenRefresh` is set, refreshes token and retries once. Otherwise throws. |
| `420/429`     | Rate limited — retried automatically with backoff                               |
| `4xx`         | Throws `EsiError`                                                               |
| `502/503/504` | Retried automatically. If cache exists, returns stale cached data.              |
| `5xx`         | If cache exists, returns stale data. Otherwise throws.                          |
| Timeout       | Throws `TimeoutError`                                                           |
