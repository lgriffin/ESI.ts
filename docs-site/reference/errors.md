# Error Classes & Type Guards

## Error Classes

### EsiError

Base error class for all ESI API errors.

```typescript
import { EsiError } from '@lgriffin/esi.ts';
```

| Property     | Type      | Description                       |
| ------------ | --------- | --------------------------------- |
| `statusCode` | `number`  | HTTP status code (0 for timeouts) |
| `message`    | `string`  | Error message from ESI            |
| `url`        | `string`  | Request URL                       |
| `retryable`  | `boolean` | Whether the error can be retried  |

### TimeoutError

Extends `EsiError`. Thrown when a request exceeds the configured timeout.

| Property     | Type     | Description                   |
| ------------ | -------- | ----------------------------- |
| `statusCode` | `0`      | Always 0 for timeouts         |
| `timeoutMs`  | `number` | Configured timeout value      |
| `retryable`  | `true`   | Timeouts are always retryable |

### EsiValidationError

Extends `EsiError`. Thrown when response data doesn't match the Zod schema.

| Property          | Type       | Description                                 |
| ----------------- | ---------- | ------------------------------------------- |
| `validationError` | `ZodError` | The Zod validation error with issue details |

### CircuitOpenError

Extends `EsiError`. Thrown when the circuit breaker is open for the requested endpoint.

## Type Guards

All type guards accept `unknown` and return a type predicate:

```typescript
import {
  isEsiError, // err is EsiError (any ESI error)
  isNotFound, // err is EsiError & statusCode === 404
  isUnauthorized, // err is EsiError & statusCode === 401
  isForbidden, // err is EsiError & statusCode === 403
  isRateLimited, // err is EsiError & statusCode === 420 | 429
  isServerError, // err is EsiError & statusCode >= 500
  isTimeout, // err is TimeoutError
  isRetryable, // err is EsiError & retryable === true
  isValidationError, // err is EsiValidationError
  isCircuitOpen, // err is CircuitOpenError
} from '@lgriffin/esi.ts';
```

### Quick Reference

| Guard               | Status Code                      | Retryable                               |
| ------------------- | -------------------------------- | --------------------------------------- |
| `isNotFound`        | 404                              | No                                      |
| `isUnauthorized`    | 401                              | No (unless token refresh is configured) |
| `isForbidden`       | 403                              | No                                      |
| `isRateLimited`     | 420, 429                         | Yes                                     |
| `isServerError`     | 500+                             | Depends                                 |
| `isTimeout`         | 0                                | Yes                                     |
| `isRetryable`       | 420, 429, 502, 503, 504, timeout | Yes                                     |
| `isValidationError` | —                                | No                                      |
| `isCircuitOpen`     | —                                | No                                      |

## Importing from Sub-path

```typescript
import { EsiError, isNotFound, isTimeout } from '@lgriffin/esi.ts/errors';
```
