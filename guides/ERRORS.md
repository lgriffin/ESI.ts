# Errors

**Implements:** ARCH-07 (typed public errors with guards), DOC-01 (one canonical errors reference). Requirement text lives in [CHARTER.md](CHARTER.md), Part 2.

What the library throws, how to tell the cases apart, which ones are worth retrying, and what the pipeline does before an error reaches you. Where the pipeline stages sit is described in [ARCHITECTURE.md](ARCHITECTURE.md); this guide is about the values that come out of it.

---

## Hierarchy

```
Error
├── EsiError                      statusCode · url (sanitised) · requestId · retryable
│   ├── TimeoutError              + timeoutMs
│   └── EsiValidationError        + validationError · direction
├── CircuitOpenError              endpoint · failures · retryAfterMs        (not an EsiError)
├── AuthError                                                               (token manager, SSO)
│   ├── SsoError                  statusCode · errorCode · errorDescription
│   ├── TokenRevokedError         characterId?
│   ├── TokenDecodeError
│   └── CharacterNotFoundError    characterId
├── SdeError                                                                (offline SDE module)
│   ├── SdeDatabaseError          cause
│   ├── SdeValidationError        validationError · entityType · entityId?
│   └── SdeVersionMismatchError   expected · actual
└── Error with a [CODE] prefix    plumbing and configuration faults, see below
```

Every field listed is `readonly`. Every class sets `name` to its own class name, so `err.name` survives serialisation even where `instanceof` does not.

### `EsiError`

Raised for any HTTP-level failure, and the base of the two request-scoped subclasses. Source: `src/core/util/error.ts`.

| Member             | Type                  | Meaning                                                                                    |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------ |
| `statusCode`       | `number`              | HTTP status. `0` when no status exists (timeout, validation, safe-mode wrap).              |
| `message`          | `string`              | Status text, with remediation appended for 401 and 403.                                    |
| `url`              | `string \| undefined` | Request URL passed through `sanitizeUrl`. Absent on rate-limiter and safe-mode errors.     |
| `requestId`        | `string \| undefined` | The `X-Esi-Request-Id` response header, when ESI sent one. Quote it when reporting to CCP. |
| `retryable`        | `boolean` (getter)    | `true` for status `0`, `420`, `429`, `502`, `503`, `504`.                                  |
| `isRateLimited()`  | method                | `statusCode` is `420` or `429`.                                                            |
| `isNotFound()`     | method                | `statusCode` is `404`.                                                                     |
| `isUnauthorized()` | method                | `statusCode` is `401`.                                                                     |
| `isForbidden()`    | method                | `statusCode` is `403`.                                                                     |
| `isServerError()`  | method                | `statusCode` is `500` or above.                                                            |
| `isTimeout()`      | method                | `statusCode` is `0`. Also true for validation errors; prefer the `isTimeout` guard.        |

### `TimeoutError extends EsiError`

Raised when the `AbortController` timer fires before `fetch` settles. `statusCode` is `0`, `timeoutMs` is the limit that expired, and the message reads `Request timed out after <n>ms`. The default limit is 30 000 ms, set with the `timeout` option on `EsiClient` or `ApiClient.setTimeout()`.

### `EsiValidationError extends EsiError`

Raised when a body fails its Zod schema. See [RUNTIME-VALIDATION.md](RUNTIME-VALIDATION.md) for when validation runs.

| Field             | Type                      | Meaning                                                                                  |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `validationError` | `unknown`                 | The `ZodError` from `safeParse`. Typed `unknown` so Zod is not in the public signature.  |
| `direction`       | `'request' \| 'response'` | `request` for `requestSchema` failures (opt-in `validateRequest`), otherwise `response`. |
| `statusCode`      | `0`                       | Always `0`, which makes `.retryable` report `true`. See the caution below.               |

### `CircuitOpenError`

Raised by the circuit breaker before the request is sent, when the breaker for that endpoint is open or its half-open probe slot is taken. It extends `Error`, not `EsiError`, so `isEsiError` returns `false` for it.

| Field          | Type     | Meaning                                                |
| -------------- | -------- | ------------------------------------------------------ |
| `endpoint`     | `string` | The breaker key, which is the resolved request path.   |
| `failures`     | `number` | Consecutive failures recorded when the breaker opened. |
| `retryAfterMs` | `number` | Time until the breaker will admit a half-open probe.   |

The breaker is off unless `enableCircuitBreaker` is set. Its thresholds are covered in [ARCHITECTURE.md](ARCHITECTURE.md).

### Auth family

Raised by `EveSsoClient` and `EsiTokenManager`, not by the request pipeline directly. Source: `src/auth/errors.ts`.

| Class                    | Fields                                         | Raised when                                                                                                                                              |
| ------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthError`              | —                                              | Base class; not thrown on its own.                                                                                                                       |
| `SsoError`               | `statusCode`, `errorCode`, `errorDescription?` | EVE SSO answered a token or revoke call with non-2xx. `errorCode` is the OAuth2 `error` field or `unknown`. `isRetryable()` is true for `429` and `5xx`. |
| `TokenRevokedError`      | `characterId?`                                 | SSO returned `invalid_grant`, or the manager already recorded the revocation. Re-login is the only fix.                                                  |
| `TokenDecodeError`       | —                                              | An access token could not be decoded into the JWT claims the manager needs.                                                                              |
| `CharacterNotFoundError` | `characterId`                                  | No token is stored for the character.                                                                                                                    |

`SsoError.isRetryable()` is a method; `EsiError.retryable` is a getter. The two families were written at different times and have not been aligned.

### SDE family

Raised by the offline Static Data Export module, which shares no code with the HTTP pipeline. Exported from `@lgriffin/esi.ts/sde` only. Source: `src/sde/errors.ts`.

| Class                     | Fields                                       | Raised when                                               |
| ------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `SdeError`                | —                                            | Base class.                                               |
| `SdeDatabaseError`        | `cause`                                      | The underlying database call failed.                      |
| `SdeValidationError`      | `validationError`, `entityType`, `entityId?` | A stored row failed its schema.                           |
| `SdeVersionMismatchError` | `expected`, `actual`                         | The loaded SDE build is not the one the caller asked for. |

---

## Type guards and where to import them

Every guard takes `unknown` and narrows. They are `instanceof` checks, so a guard only matches errors created by the same copy of the package; a duplicated dependency in `node_modules` breaks them.

| Guard                  | Narrows to                | True when                            | `.` (root) | `./errors` | `./sde` |
| ---------------------- | ------------------------- | ------------------------------------ | :--------: | :--------: | :-----: |
| `isEsiError`           | `EsiError`                | any `EsiError` or subclass           |     ●      |     ●      |    ·    |
| `isNotFound`           | `EsiError`                | status `404`                         |     ●      |     ●      |    ·    |
| `isUnauthorized`       | `EsiError`                | status `401`                         |     ●      |     ●      |    ·    |
| `isForbidden`          | `EsiError`                | status `403`                         |     ●      |     ●      |    ·    |
| `isRateLimited`        | `EsiError`                | status `420` or `429`                |     ●      |     ●      |    ·    |
| `isServerError`        | `EsiError`                | status `>= 500`                      |     ●      |     ●      |    ·    |
| `isTimeout`            | `TimeoutError`            | `instanceof TimeoutError`            |     ●      |     ●      |    ·    |
| `isRetryable`          | `EsiError`                | `.retryable` is `true`               |     ●      |     ●      |    ·    |
| `isValidationError`    | `EsiValidationError`      | `instanceof EsiValidationError`      |     ●      |     ●      |    ·    |
| `isCircuitOpen`        | `CircuitOpenError`        | `instanceof CircuitOpenError`        |     ●      |   **·**    |    ·    |
| `isAuthError`          | `AuthError`               | any auth-family error                |     ●      |     ●      |    ·    |
| `isSsoError`           | `SsoError`                | `instanceof SsoError`                |     ●      |     ●      |    ·    |
| `isTokenRevoked`       | `TokenRevokedError`       | `instanceof TokenRevokedError`       |     ●      |     ●      |    ·    |
| `isCharacterNotFound`  | `CharacterNotFoundError`  | `instanceof CharacterNotFoundError`  |     ●      |     ●      |    ·    |
| `isSdeError`           | `SdeError`                | any SDE-family error                 |     ·      |     ·      |    ●    |
| `isSdeDatabaseError`   | `SdeDatabaseError`        | `instanceof SdeDatabaseError`        |     ·      |     ·      |    ●    |
| `isSdeValidationError` | `SdeValidationError`      | `instanceof SdeValidationError`      |     ·      |     ·      |    ●    |
| `isSdeVersionMismatch` | `SdeVersionMismatchError` | `instanceof SdeVersionMismatchError` |     ·      |     ·      |    ●    |

All the classes follow the same pattern as their guards, with one addition: `CircuitOpenError` itself is exported from `./errors`. `sanitizeUrl` and the `ValidationDirection` type are exported from both `.` and `./errors`.

> **Known gap (ARCH-07).** `isCircuitOpen` is exported from the root but not from `@lgriffin/esi.ts/errors`. Until it is, import the guard from the root, or test `err instanceof CircuitOpenError` with the class from `./errors`. Tracked as bead `esi-gyh`.

```typescript
import {
  EsiError,
  isNotFound,
  CircuitOpenError,
} from '@lgriffin/esi.ts/errors';
import { isCircuitOpen } from '@lgriffin/esi.ts';
```

---

## Retryability

`.retryable` and `isRetryable` describe the status code only. Whether the library actually retries also depends on the HTTP method and the retry configuration.

| Condition                         | `.retryable` | Retried by `RetryStrategy`                                 |
| --------------------------------- | :----------: | ---------------------------------------------------------- |
| `TimeoutError` (status `0`)       |     yes      | yes, for GET or when `retryMutations` is set               |
| `420`, `429`                      |     yes      | yes, for GET or when `retryMutations` is set               |
| `502`, `503`, `504`               |     yes      | yes, for GET or when `retryMutations` is set               |
| `500` and other `5xx`             |      no      | no; a cached copy is served instead where one exists       |
| `401` with a token provider       |      no      | refreshed once, then the request is replayed               |
| `304` with no cached body         |      no      | no                                                         |
| other `4xx`                       |      no      | no                                                         |
| `CircuitOpenError`                |     n/a      | never; rethrown immediately so the breaker is not hammered |
| `EsiValidationError`              |   **yes**    | no; validation runs after the retry loop has returned      |
| network failure (DNS, reset, TLS) |     yes      | yes, for GET or when `retryMutations` is set               |

The defaults set by `EsiClient` are three retries, 1 s base delay and a 30 s cap, with exponential backoff and 0.75–1.25× jitter. `retryAttempts: n` changes only the count; `retryConfig` replaces the whole object; `retryStrategy` replaces the implementation. A `RetryStrategy` constructed by hand with no config performs zero retries.

`POST`, `PUT` and `DELETE` are not retried unless `retryConfig.retryMutations` is `true`, because a retried mutation can apply twice.

> **Caution.** `EsiValidationError` has `statusCode` `0`, so `isRetryable(err)` and `err.retryable` return `true` for it, and `err.isTimeout()` returns `true` as well. Retrying a validation failure returns the same body. Test `isValidationError` before `isRetryable` in your own handling, and use the `isTimeout` guard rather than the method.

A network failure that is not a timeout arrives as an `EsiError` with `statusCode` `0` and the message `Network request failed: <reason>`; the underlying error is on `err.cause`. Like a timeout, it is retryable, so `err.isTimeout()` also returns `true` for it; use the `isTimeout` guard, which matches only `TimeoutError`, to tell the two apart.

---

## The 401 refresh path

Configure a token provider with `onTokenRefresh` on `EsiClient`, `ApiClient.setTokenProvider()`, or `EsiTokenManager.createClient()`, which wires `tokenProviderFor(characterId)` for you.

1. A request to an endpoint whose definition has `requiresAuth: true` returns `401`.
2. `RetryStrategy` sees an `EsiError` with status `401`, a provider, and no refresh yet in this call. It calls the provider.
3. Concurrent refreshes on the same `ApiClient` share one in-flight promise, so a burst of 401s triggers one SSO call.
4. The new token replaces the stored one and the request is replayed. The refresh does not consume a retry attempt.
5. If the replay returns `401` again, that error is thrown. There is one refresh per call.

If the provider throws, what you receive depends on what it threw:

| Provider throws                                             | You receive                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `EsiError` or `CircuitOpenError`                            | that error, unchanged                                                   |
| anything else, including `TokenRevokedError` and `SsoError` | plain `Error`: `[TOKEN_REFRESH_FAILED] Token refresh failed: <message>` |

The second row means the auth-family class does not survive the retry strategy. Match on the message, or call `tokenManager.getToken(characterId)` yourself before the request to see the typed error.

Without a provider, or on an endpoint without `requiresAuth`, a `401` is thrown straight away.

---

## Status handling before an error is thrown

Some statuses never become errors, and some errors carry extra text.

| Response                   | Outcome                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `201`                      | Returned with the parsed body, or `undefined` if the body is not JSON.                                                                |
| `204`                      | Returned as `undefined`.                                                                                                              |
| `304`, cached body present | Cached body returned; metadata `cacheHitType: 'etag-304'`.                                                                            |
| `304`, no cached body      | `EsiError(304, 'Not Modified — no cached data available')`. Happens only if the cache was cleared between request and response.       |
| `5xx`, cached copy present | Stale body returned instead of an error; metadata `stale: true`, `cacheHitType: 'stale-on-error'`, original status kept. Not retried. |
| `5xx`, no cached copy      | `EsiError` with the status; retried if `502`, `503` or `504`.                                                                         |
| `420`, `429`               | `EsiError`, logged as a warning; the rate limiter blocks the group before the next call.                                              |
| `401`                      | `EsiError` with remediation appended (below).                                                                                         |
| `403`                      | `EsiError` with remediation appended (below).                                                                                         |

A stale response is only possible for a GET whose earlier success carried an `ETag`, since only those are cached. Use `withMetadata()` to see `meta.stale`.

The remediation text is appended to the status message on the main request path:

- **401:** `Unauthorized — the access token was missing, expired, or lacks the required ESI scope. Fix: verify ESI_ACCESS_TOKEN, or configure onTokenRefresh for automatic refresh on 401`
- **403:** `Forbidden — your access token does not have the OAuth scopes required for this endpoint. Check the scopes on your EVE SSO application`

Page requests made by the pagination handlers carry the plain status text without remediation.

The rate limiter can also raise an `EsiError(429, "Rate limit group '<group>' still blocked for <n>s")` without sending anything, when a group stays blocked beyond its wait budget. It has no `url` and is retryable.

---

## Plumbing and configuration faults

Some failures are raised as plain `Error` instances whose message starts with a bracketed code. They are not `EsiError`s, no guard matches them, and none is retried. This is the inconsistency registered against ARCH-07 in the charter gap register.

| Code                    | Raised by                         | Message begins                                                                                                                                                                                                     |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VALIDATION_ERROR`      | client construction               | `Invalid base URL`, `Base URL must use HTTPS protocol`, `Base URL host '<h>' is not in the allowlist`                                                                                                              |
| `VALIDATION_ERROR`      | path and query parameter building | `Path parameter '<p>' must not be empty` / `contains invalid characters` / `must be a finite number`; `Query parameter '<p>' must not be null or undefined` / `must be a finite number` / `exceeds maximum length` |
| `NO_AUTH_TOKEN`         | header building                   | `Authorization header is required for this endpoint but no access token is configured`                                                                                                                             |
| `CONFIGURATION_ERROR`   | dependency resolution             | `No rate limiter configured on ApiClient`                                                                                                                                                                          |
| `JSON_PARSE_ERROR`      | body parsing                      | `Invalid JSON response: <parser message>`                                                                                                                                                                          |
| `PAGINATION_INCOMPLETE` | offset pagination                 | `Pagination incomplete for <url>: <message>`                                                                                                                                                                       |
| `TOKEN_REFRESH_FAILED`  | retry strategy                    | `Token refresh failed: <message>`                                                                                                                                                                                  |
| `ESIJS_ERROR`           | the pipeline's final catch        | the original message                                                                                                                                                                                               |

Two further plain errors carry no code: `No token provider configured`, from calling `ApiClient.refreshToken()` directly without a provider, and `At least one client type must be specified`, from building an empty `EsiClientBuilder`.

Faults raised inside a request (`NO_AUTH_TOKEN`, `CONFIGURATION_ERROR`, `JSON_PARSE_ERROR`, `PAGINATION_INCOMPLETE`) pass through that final catch, which wraps every non-`EsiError` again. The message you receive is therefore `[ESIJS_ERROR] [NO_AUTH_TOKEN] Authorization header is required …`. Match the inner code anywhere in the message rather than at the start:

```typescript
function faultCode(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;
  const codes = [...err.message.matchAll(/\[([A-Z_]+)\]/g)].map((m) => m[1]);
  return codes.find((c) => c !== 'ESIJS_ERROR') ?? codes[0];
}
```

A page failure during offset pagination that is itself an `EsiError` or `CircuitOpenError` is rethrown as that error; only other failures become `PAGINATION_INCOMPLETE`. Cursor and streaming failure semantics are covered in [PAGINATION.md](PAGINATION.md).

---

## `sanitizeUrl`

Every `EsiError` passes its URL through `sanitizeUrl` in the constructor, and `EsiValidationError` sanitises the URL in its message too. The function is exported so you can apply the same rule to your own logs.

```typescript
import { sanitizeUrl } from '@lgriffin/esi.ts/errors';

sanitizeUrl('https://esi.evetech.net/latest/x/?token=abc&page=2');
// 'https://esi.evetech.net/latest/x/?token=%5BREDACTED%5D&page=2'
```

- The value of each of these query parameters is replaced with `[REDACTED]` (URL-encoded in the output): `token`, `access_token`, `api_key`, `refresh_token`, `client_secret`, `code`, `key`, `secret`, `auth`, `password`, `bearer`. Matching is exact and case-sensitive.
- A string that `new URL()` cannot parse keeps everything before `?` and replaces the query with `?[params-redacted]`.
- `undefined` and the empty string are returned unchanged.

Plain `[CODE]` errors are not sanitised. `PAGINATION_INCOMPLETE` includes the request URL in its message. ESI.ts sends tokens in the `Authorization` header rather than the query string, so this matters only for URLs you construct yourself. The runtime controls behind this are listed in [SECURITY.md](SECURITY.md).

---

## Safe mode

`withSafeMode()` on any domain client returns the same methods, resolving to a discriminated union instead of throwing:

```typescript
type EsiResult<T> =
  | { ok: true; data: T; meta: EsiResponseMeta }
  | { ok: false; error: EsiError; meta?: EsiResponseMeta };
```

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const esi = new EsiClient({ clientId: 'my-app' });

const result = await esi.characters
  .withSafeMode()
  .getCharacterPublicInfo(2112625428);

if (result.ok) {
  console.log(result.data.name, result.meta.fromCache);
} else if (result.error.isNotFound()) {
  console.log('No such character');
} else {
  console.error(result.error.statusCode, result.error.message);
}
```

Every failure is delivered as an `EsiError`. Anything else is converted to `new EsiError(0, message)` first, which has consequences:

- A `CircuitOpenError` arrives as a status-`0` `EsiError`. `isCircuitOpen` is `false` and `retryAfterMs` is lost.
- Plain `[CODE]` faults arrive as status-`0` `EsiError`s with the prefixed message.
- Because the status is `0`, every converted error reports `.retryable === true`.
- `meta` is not populated on failure in the current implementation.

Subclasses that already extend `EsiError` (`TimeoutError`, `EsiValidationError`) are passed through with their type intact.

On a value already typed `EsiError`, prefer the instance methods (`result.error.isNotFound()`) to the guards. The guards narrow to `EsiError`, so TypeScript treats their `false` branch as `never`. If you need to distinguish breaker trips or configuration faults, use the throwing API.

---

## Recommended handling

Order matters: test the specific cases before the broad ones, and test `isValidationError` before `isRetryable`.

```typescript
import {
  EsiClient,
  isCircuitOpen,
  isValidationError,
  isTimeout,
  isRateLimited,
  isNotFound,
  isUnauthorized,
  isForbidden,
  isRetryable,
  isEsiError,
} from '@lgriffin/esi.ts';

const esi = new EsiClient({ clientId: 'my-app' });

try {
  const orders = await esi.market.getMarketOrders(10000002);
  // …
} catch (err) {
  if (isCircuitOpen(err)) {
    // Breaker tripped; back off for err.retryAfterMs.
  } else if (isValidationError(err)) {
    // ESI changed shape. err.direction, err.validationError; report it, do not retry.
  } else if (isTimeout(err)) {
    // Already retried by the client; err.timeoutMs.
  } else if (isRateLimited(err)) {
    // Already retried; the limiter is blocking the group.
  } else if (isNotFound(err)) {
    // Expected for deleted or hidden entities.
  } else if (isUnauthorized(err) || isForbidden(err)) {
    // Token or scope problem; the message says which.
  } else if (isRetryable(err)) {
    // 502/503/504 that outlasted the retry budget.
  } else if (isEsiError(err)) {
    // Any other HTTP failure; log err.statusCode, err.url, err.requestId.
  } else {
    // Plain [CODE] fault or unexpected error; see faultCode() above.
    throw err;
  }
}
```

By the time an error reaches this block, the client has already retried what it considers retryable. Retrying again in application code multiplies the backoff; prefer raising `retryConfig.maxRetries` if the default budget is too small.

Log output for the same failures is described in [LOGGING.md](LOGGING.md). Tests for this behaviour sit under `tests/tdd/core/` and the resilience features in `tests/bdd/`; see [TESTING.md](TESTING.md).
