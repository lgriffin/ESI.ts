# Errors

**Implements:** ARCH-07 (typed public errors with guards), DOC-01 (one canonical errors reference). Requirement text lives in [CHARTER.md](CHARTER.md), Part 2.

What the library throws, how to tell the cases apart, which ones are worth retrying, and what the pipeline does before an error reaches you. Where the pipeline stages sit is described in [ARCHITECTURE.md](ARCHITECTURE.md); this guide is about the values that come out of it.

---

## Hierarchy

```
Error
├── EsiError                      statusCode · url (sanitised) · requestId · retryable
│   ├── TimeoutError              + timeoutMs
│   ├── EsiNetworkError           + cause
│   ├── EsiValidationError        + validationError · direction
│   ├── CircuitOpenError          + endpoint · failures · retryAfterMs
│   └── EsiFaultError             + code · cause                            (raised by the library, not ESI)
│       ├── EsiConfigurationError   VALIDATION_ERROR · NO_AUTH_TOKEN · CONFIGURATION_ERROR
│       ├── EsiParseError           JSON_PARSE_ERROR
│       ├── EsiPaginationError      PAGINATION_INCOMPLETE
│       └── EsiTokenRefreshError    TOKEN_REFRESH_FAILED
├── AuthError                                                               (token manager, SSO)
│   ├── SsoError                  statusCode · errorCode · errorDescription
│   ├── TokenRevokedError         characterId?
│   ├── TokenDecodeError
│   └── CharacterNotFoundError    characterId
├── SdeError                                                                (offline SDE module)
│   ├── SdeDatabaseError          cause
│   ├── SdeValidationError        validationError · entityType · entityId?
│   └── SdeVersionMismatchError   expected · actual
```

Every failure the request pipeline raises is an `EsiError`, so `isEsiError(err)` is true for all of them and safe mode keeps each one's class. The auth and SDE families are raised outside the pipeline and keep their own bases.

Every field listed is `readonly`. Every class sets `name` to its own class name, so `err.name` survives serialisation even where `instanceof` does not.

### `EsiError`

Raised for any HTTP-level failure, and the base of every other class the request pipeline raises. Source: `src/core/util/error.ts`.

| Member             | Type                  | Meaning                                                                                                                           |
| ------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `statusCode`       | `number`              | HTTP status. `0` when no status exists (timeout, network, validation, circuit, fault).                                            |
| `message`          | `string`              | Status text (`HTTP <status>` when neither the client nor the server names the status), with remediation appended for 401 and 403. |
| `url`              | `string \| undefined` | Request URL passed through `sanitizeUrl`. Absent on rate-limiter, circuit and configuration errors.                               |
| `requestId`        | `string \| undefined` | The `X-Esi-Request-Id` response header, when ESI sent one. Quote it when reporting to CCP.                                        |
| `retryable`        | `boolean` (getter)    | `true` for `420`, `429`, `502`, `503`, `504`, timeouts and network failures. Subclasses that cannot succeed on retry override it. |
| `isRateLimited()`  | method                | `statusCode` is `420` or `429`.                                                                                                   |
| `isNotFound()`     | method                | `statusCode` is `404`.                                                                                                            |
| `isUnauthorized()` | method                | `statusCode` is `401`.                                                                                                            |
| `isForbidden()`    | method                | `statusCode` is `403`.                                                                                                            |
| `isServerError()`  | method                | `statusCode` is `500` or above.                                                                                                   |
| `isTimeout()`      | method                | `true` for a `TimeoutError`, `false` for every other subclass. Prefer the `isTimeout` guard.                                      |

### `TimeoutError extends EsiError`

Raised when the `AbortController` timer fires before the response has fully arrived: before the headers, or while the body is still being read. `statusCode` is `0`, `timeoutMs` is the limit that expired, and the message reads `Request timed out after <n>ms`. The default limit is 30 000 ms, set with the `timeout` option on `EsiClient` or `ApiClient.setTimeout()`.

### `EsiValidationError extends EsiError`

Raised when a body fails its Zod schema. See [RUNTIME-VALIDATION.md](RUNTIME-VALIDATION.md) for when validation runs.

| Field             | Type                      | Meaning                                                                                         |
| ----------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `validationError` | `unknown`                 | The `ZodError` from `safeParse`. Typed `unknown` so Zod is not in the public signature.         |
| `direction`       | `'request' \| 'response'` | `request` for `requestSchema` failures (opt-in `validateRequest`), otherwise `response`.        |
| `statusCode`      | `0`                       | Always `0`. `.retryable` and `isTimeout()` are `false`: the same request returns the same body. |

### `EsiNetworkError extends EsiError`

Raised when a request fails below HTTP for a reason other than the timeout: a refused connection, a failed DNS lookup, TLS, or a reset before the headers or part way through the body. `statusCode` is `0`, `.retryable` is `true`, the message reads `Network request failed: <reason>`, and the underlying error is on `cause`. `isTimeout()` is `false`; a timeout is a `TimeoutError`.

### `CircuitOpenError extends EsiError`

Raised by the circuit breaker before the request is sent, when the breaker for that endpoint is open or its half-open probe slot is taken. `statusCode` is `0` and `.retryable` is `false`: the client never retries it, and the caller should wait `retryAfterMs`. `url` is not set; `endpoint` names the breaker key.

| Field          | Type     | Meaning                                                |
| -------------- | -------- | ------------------------------------------------------ |
| `endpoint`     | `string` | The breaker key, which is the resolved request path.   |
| `failures`     | `number` | Consecutive failures recorded when the breaker opened. |
| `retryAfterMs` | `number` | Time until the breaker will admit a half-open probe.   |

The breaker is off unless `enableCircuitBreaker` is set. Its thresholds are covered in [ARCHITECTURE.md](ARCHITECTURE.md).

### `EsiFaultError extends EsiError`

The base of the failures the library raises itself rather than ESI. `statusCode` is `0`, `.retryable` and `isTimeout()` are `false`, `code` is one of the `EsiFaultCode` values below, and the message starts with `[<code>] `. `cause` holds the error that led to it, where there was one. An `EsiFaultError` with code `ESIJS_ERROR` wraps anything unexpected that reached the pipeline's final catch (a throwing interceptor, for example); the original is on `cause`.

| Class                   | `code`                                                     | Raised when                                                                                                              |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `EsiConfigurationError` | `VALIDATION_ERROR`, `NO_AUTH_TOKEN`, `CONFIGURATION_ERROR` | The client's setup or a call's arguments are wrong. See [Configuration faults](#configuration-faults).                   |
| `EsiParseError`         | `JSON_PARSE_ERROR`                                         | A response body is not the JSON it should be. `url` is the request URL; the parser's error is on `cause`.                |
| `EsiPaginationError`    | `PAGINATION_INCOMPLETE`                                    | A page walk stopped on a failure that is not itself an `EsiError`. The page's error is on `cause`; the URL is sanitised. |
| `EsiTokenRefreshError`  | `TOKEN_REFRESH_FAILED`                                     | The token provider threw during a 401 refresh. What it threw (a `TokenRevokedError`, an `SsoError`) is on `cause`.       |

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

`SdeDataProvider.fromDirectory` and `fromZip` also throw a plain `SdeError` when the call needs `js-yaml` or `adm-zip`, the optional peer dependencies of `./sde`, and it is not installed. The message names the package and its `npm install` command.

---

## Type guards and where to import them

Every guard takes `unknown` and narrows. They are `instanceof` checks, so a guard only matches errors created by the same copy of the package; a duplicated dependency in `node_modules` breaks them. The root entry and `./errors` export the same classes and guards, so an error thrown by the client matches a guard or class imported from either. The CommonJS and ES module builds are separate copies, though: a guard loaded with `require` does not match an error thrown by a client loaded with `import`, or the other way round.

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
| `isCircuitOpen`        | `CircuitOpenError`        | `instanceof CircuitOpenError`        |     ●      |     ●      |    ·    |
| `isNetworkError`       | `EsiNetworkError`         | `instanceof EsiNetworkError`         |     ●      |     ●      |    ·    |
| `isFaultError`         | `EsiFaultError`           | any library fault                    |     ●      |     ●      |    ·    |
| `isConfigurationError` | `EsiConfigurationError`   | `instanceof EsiConfigurationError`   |     ●      |     ●      |    ·    |
| `isParseError`         | `EsiParseError`           | `instanceof EsiParseError`           |     ●      |     ●      |    ·    |
| `isPaginationError`    | `EsiPaginationError`      | `instanceof EsiPaginationError`      |     ●      |     ●      |    ·    |
| `isTokenRefreshError`  | `EsiTokenRefreshError`    | `instanceof EsiTokenRefreshError`    |     ●      |     ●      |    ·    |
| `isAuthError`          | `AuthError`               | any auth-family error                |     ●      |     ●      |    ·    |
| `isSsoError`           | `SsoError`                | `instanceof SsoError`                |     ●      |     ●      |    ·    |
| `isTokenRevoked`       | `TokenRevokedError`       | `instanceof TokenRevokedError`       |     ●      |     ●      |    ·    |
| `isCharacterNotFound`  | `CharacterNotFoundError`  | `instanceof CharacterNotFoundError`  |     ●      |     ●      |    ·    |
| `isSdeError`           | `SdeError`                | any SDE-family error                 |     ·      |     ·      |    ●    |
| `isSdeDatabaseError`   | `SdeDatabaseError`        | `instanceof SdeDatabaseError`        |     ·      |     ·      |    ●    |
| `isSdeValidationError` | `SdeValidationError`      | `instanceof SdeValidationError`      |     ·      |     ·      |    ●    |
| `isSdeVersionMismatch` | `SdeVersionMismatchError` | `instanceof SdeVersionMismatchError` |     ·      |     ·      |    ●    |

All the classes follow the same pattern as their guards. `sanitizeUrl` and the `ValidationDirection` and `EsiFaultCode` types are exported from both `.` and `./errors`. A test (`tests/tdd/core/errorsEntryParity.test.ts`) fails if the root exports an error class or guard that `./errors` does not.

```typescript
import { EsiError, isNotFound, isCircuitOpen } from '@lgriffin/esi.ts/errors';
```

---

## Retryability

`.retryable` and `isRetryable` describe the status code only. Whether the library actually retries also depends on the HTTP method and the retry configuration.

| Condition                           | `.retryable` | Retried by `RetryStrategy`                                 |
| ----------------------------------- | :----------: | ---------------------------------------------------------- |
| `TimeoutError` (status `0`)         |     yes      | yes, for GET or when `retryMutations` is set               |
| `420`, `429`                        |     yes      | yes, for GET or when `retryMutations` is set               |
| `502`, `503`, `504`                 |     yes      | yes, for GET or when `retryMutations` is set               |
| `500` and other `5xx`               |      no      | no; a cached copy is served instead where one exists       |
| `401` with a token provider         |      no      | refreshed once, then the request is replayed               |
| `304` with no cached body           |      no      | no                                                         |
| other `4xx`                         |      no      | no                                                         |
| `CircuitOpenError`                  |      no      | never; rethrown immediately so the breaker is not hammered |
| `EsiValidationError`                |      no      | no; validation runs after the retry loop has returned      |
| `EsiNetworkError` (DNS, reset, TLS) |     yes      | yes, for GET or when `retryMutations` is set               |
| `EsiFaultError` and subclasses      |      no      | no                                                         |

The defaults set by `EsiClient` are three retries, 1 s base delay and a 30 s cap, with exponential backoff and 0.75–1.25× jitter. `retryAttempts: n` changes only the count; `retryConfig` replaces the whole object; `retryStrategy` replaces the implementation. A `RetryStrategy` constructed by hand with no config performs zero retries.

`POST`, `PUT` and `DELETE` are not retried unless `retryConfig.retryMutations` is `true`, because a retried mutation can apply twice.

Before 11.0.0, `.retryable` was `true` for every status-`0` error, including `EsiValidationError` and anything safe mode converted, and `isTimeout()` was `true` for them too. Both now follow the class: only `TimeoutError` and `EsiNetworkError` among the status-`0` classes are retryable, and only `TimeoutError` reports `isTimeout()`.

---

## The 401 refresh path

Configure a token provider with `onTokenRefresh` on `EsiClient`, `ApiClient.setTokenProvider()`, or `EsiTokenManager.createClient()`, which wires `tokenProviderFor(characterId)` for you.

1. A request to an endpoint whose definition has `requiresAuth: true` returns `401`.
2. `RetryStrategy` sees an `EsiError` with status `401`, a provider, and no refresh yet in this call. It calls the provider.
3. Concurrent refreshes on the same `ApiClient` share one in-flight promise, so a burst of 401s triggers one SSO call.
4. The new token replaces the stored one and the request is replayed. The refresh does not consume a retry attempt.
5. If the replay returns `401` again, that error is thrown. There is one refresh per call.

If the provider throws, what you receive depends on what it threw:

| Provider throws                                             | You receive                                                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| an `EsiError`, including `CircuitOpenError`                 | that error, unchanged                                                                                      |
| anything else, including `TokenRevokedError` and `SsoError` | `EsiTokenRefreshError` (`[TOKEN_REFRESH_FAILED] Token refresh failed: <message>`), the original on `cause` |

To act on a revoked token, test the cause:

```typescript
import { isTokenRefreshError, isTokenRevoked } from '@lgriffin/esi.ts/errors';

function needsLogin(err: unknown): boolean {
  return isTokenRefreshError(err) && isTokenRevoked(err.cause);
}
```

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

A stale response is only possible for a GET whose earlier success carried an `ETag`, since only those are cached, and only while that entry is kept: one hour past its freshness TTL, or the cache's `defaultTtl` when the response gave no TTL (see [ARCHITECTURE.md](ARCHITECTURE.md#4-caching)). Use `withMetadata()` to see `meta.stale`.

The remediation text is appended to the status message on the main request path:

- **401:** `Unauthorized — the access token was missing, expired, or lacks the required ESI scope. Fix: verify ESI_ACCESS_TOKEN, or configure onTokenRefresh for automatic refresh on 401`
- **403:** `Forbidden — your access token does not have the OAuth scopes required for this endpoint. Check the scopes on your EVE SSO application`

Page requests made by the pagination handlers carry the plain status text without remediation.

When the response body is ESI's `{ "error": "<reason>" }`, the reason follows the status text on both paths, capped at 200 characters: `Forbidden: token is expired — your access token does not have …`. Any other body adds nothing.

The rate limiter can also raise an `EsiError(429, "Rate limit group '<group>' still blocked for <n>s")` without sending anything, when a group stays blocked beyond its wait budget. It has no `url` and is retryable.

---

## Configuration faults

`EsiConfigurationError` covers a client that is set up wrong or called with bad arguments. None is retried, and none reaches ESI.

| Code                  | Raised by                         | Message begins                                                                                                                                                                                                     |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VALIDATION_ERROR`    | client construction               | `Invalid base URL`, `Base URL must use HTTPS protocol`, `Base URL host '<h>' is not in the allowlist`                                                                                                              |
| `VALIDATION_ERROR`    | path and query parameter building | `Path parameter '<p>' must not be empty` / `contains invalid characters` / `must be a finite number`; `Query parameter '<p>' must not be null or undefined` / `must be a finite number` / `exceeds maximum length` |
| `NO_AUTH_TOKEN`       | header building                   | `Authorization header is required for this endpoint but no access token is configured`                                                                                                                             |
| `CONFIGURATION_ERROR` | dependency resolution             | `No rate limiter configured on ApiClient`                                                                                                                                                                          |

Each message starts with its code once, `[NO_AUTH_TOKEN] Authorization header is required …`. Before 11.0.0 these were plain `Error`s, and a fault raised inside a request was wrapped a second time as `[ESIJS_ERROR] [NO_AUTH_TOKEN] …`; the pipeline now passes every `EsiError` through unchanged. Branch on the class or on `code`, not the message:

```typescript
import { isConfigurationError } from '@lgriffin/esi.ts/errors';

function isMissingToken(err: unknown): boolean {
  return isConfigurationError(err) && err.code === 'NO_AUTH_TOKEN';
}
```

A 200 with an empty body is an `EsiParseError` on every endpoint except two. `getPublicContractItems` and `getPublicContractBids` resolve with `[]` when ESI sends no content: a 204, or a 200 with `Content-Length: 0`. ESI answers that way for a public contract that has expired or been accepted.

Two plain errors carry no code: `No token provider configured`, from calling `ApiClient.refreshToken()` directly without a provider, and `At least one client type must be specified`, from building an empty `EsiClientBuilder`. Both are raised outside a request.

A page failure during offset pagination that is itself an `EsiError` is rethrown as that error; only other failures become an `EsiPaginationError`. Cursor and streaming failure semantics are covered in [PAGINATION.md](PAGINATION.md).

---

## `sanitizeUrl`

Every `EsiError` passes its URL through `sanitizeUrl` in the constructor, and `EsiValidationError` sanitises the URL in its message too. The function is exported so you can apply the same rule to your own logs.

```typescript runnable
import { sanitizeUrl } from '@lgriffin/esi.ts/errors';

sanitizeUrl('https://esi.evetech.net/latest/x/?token=abc&page=2');
// 'https://esi.evetech.net/latest/x/?token=%5BREDACTED%5D&page=2'
```

- The value of each of these query parameters is replaced with `[REDACTED]` (URL-encoded in the output): `token`, `access_token`, `api_key`, `refresh_token`, `client_secret`, `code`, `key`, `secret`, `auth`, `password`, `bearer`. Matching is exact and case-sensitive.
- A string that `new URL()` cannot parse keeps everything before `?` and replaces the query with `?[params-redacted]`.
- `undefined` and the empty string are returned unchanged.

Every class in the hierarchy is an `EsiError`, so every `url` field is sanitised; `EsiPaginationError` sanitises the URL in its message as well. ESI.ts sends tokens in the `Authorization` header rather than the query string, so this matters only for URLs you construct yourself. The runtime controls behind this are listed in [SECURITY.md](SECURITY.md).

---

## Safe mode

`withSafeMode()` on any domain client returns the same methods, resolving to a discriminated union instead of throwing:

```typescript
import type { EsiError, EsiResponseMeta } from '@lgriffin/esi.ts';

type EsiResult<T> =
  | { ok: true; data: T; meta: EsiResponseMeta }
  | { ok: false; error: EsiError; meta?: EsiResponseMeta };
```

```typescript runnable
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

Every failure is delivered as the `EsiError` the throwing API would have raised, with its class intact: a `CircuitOpenError` keeps `retryAfterMs`, an `EsiConfigurationError` keeps its `code`. Anything that is not an `EsiError` arrives as an `EsiFaultError` with code `ESIJS_ERROR` and the original on `cause`. `meta` is not populated on failure in the current implementation.

On a value already typed `EsiError`, prefer the instance methods (`result.error.isNotFound()`) or `instanceof` with the class. The guards take `unknown`, so they narrow here as well: `isCircuitOpen(result.error)` narrows to `CircuitOpenError`.

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
  isConfigurationError,
  isTokenRefreshError,
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
  } else if (isTokenRefreshError(err)) {
    // The provider could not refresh; err.cause says why (isTokenRevoked: log in again).
  } else if (isConfigurationError(err)) {
    // A bug in the calling code or its setup; err.code says which.
  } else if (isRetryable(err)) {
    // 502/503/504 or a network failure that outlasted the retry budget.
  } else if (isEsiError(err)) {
    // Any other failure; log err.statusCode, err.url, err.requestId.
  } else {
    // Not from the client.
    throw err;
  }
}
```

By the time an error reaches this block, the client has already retried what it considers retryable. Retrying again in application code multiplies the backoff; prefer raising `retryConfig.maxRetries` if the default budget is too small.

Log output for the same failures is described in [LOGGING.md](LOGGING.md). Tests for this behaviour sit under `tests/tdd/core/` and the resilience features in `tests/bdd/`; see [TESTING.md](TESTING.md).
