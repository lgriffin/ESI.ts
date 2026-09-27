# Logging

**Implements:** `ARCH-09`, `DOC-01` · requirement text and status in [CHARTER.md](CHARTER.md)

How ESI.ts emits log events, how it decides which logger receives them, and how to replace, route or silence that output. The library logs through one small interface, `ILogger`. The default implementation is pino at level `warn`, so an application that configures nothing sees only events that need attention.

---

## The contract

```ts
interface LogContext {
  [key: string]: unknown;
}

interface ILogger {
  fatal(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
}
```

Every call carries a human-readable message and, where the call site has something structured to say, a flat context object. The library drops empty context objects before they reach the logger, so `context` is either `undefined` or has at least one key.

An implementation must not throw. The pipeline does not guard log calls, so an exception from a logger surfaces as a failed request.

## Public exports

All from the root entry point `@lgriffin/esi.ts`.

| Export                         | Kind      | Purpose                                                                                       |
| ------------------------------ | --------- | --------------------------------------------------------------------------------------------- |
| `ILogger`, `LogContext`        | interface | The contract above                                                                            |
| `LogLevel`                     | type      | `'fatal' \| 'error' \| 'warn' \| 'info' \| 'debug' \| 'trace'`                                |
| `createDefaultLogger(level)`   | function  | A new pino-backed `ILogger`. Level: argument, then `ESI_LOG_LEVEL`, then `'warn'`             |
| `toPinoLogger(sink)`           | function  | Adapts any object with the six pino-style methods to `ILogger`                                |
| `createNoopLogger()`           | function  | An `ILogger` that discards everything                                                         |
| `setLogger(logger)`            | function  | Installs the global fallback logger                                                           |
| `getLogger()`                  | function  | Returns the global fallback logger (the pino default until `setLogger` is called)             |
| `logFatal` … `logTrace`        | functions | `(message, context?)` helpers that write to the **global** logger. Six of them, one per level |
| `EsiClientConfig.logger`       | option    | Per-client logger                                                                             |
| `EsiClientConfig.logLevel`     | option    | Per-client pino logger at a `LogLevel` or `'silent'`, used only when `logger` is not given    |
| `ApiClient.setLogger(l)`       | method    | Sets or clears (`null`) the per-client logger on an `ApiClient` you hold directly             |
| `EsiTokenManagerConfig.logger` | option    | Logger for token refresh activity; see [Token manager](#token-manager)                        |

The exported `logFatal` … `logTrace` helpers are the global-logger variants. The request pipeline uses internal per-client twins with a leading `client` argument; those are not exported.

## How a logger is resolved

Every log call inside the pipeline names the `ApiClient` it belongs to. The logger is chosen at the moment of the call, in this order:

1. **Per-client.** The logger stored on that `ApiClient`. `configureApiClient` sets it from `EsiClientConfig.logger`, or, failing that, builds a fresh pino logger from `EsiClientConfig.logLevel`. If neither option is given, the client has no logger of its own.
2. **Global.** The logger installed with `setLogger()`, if one has been installed.
3. **Default.** The module-level pino instance, level from `ESI_LOG_LEVEL` or `warn`.

`EsiClient`, `CustomEsiClient` (via `EsiClientBuilder`) and every `EsiApiFactory.create*` method all route through `configureApiClient`, so the two config options behave the same on all three construction surfaces.

Resolution happens per call, so `setLogger()` affects clients that were constructed before it, provided they have no per-client logger.

### Call sites

Every call site in the library logs through the per-client helpers in `src/core/logger/clientLog.ts`, which name the client and resolve the logger in the order above:

- The request pipeline, retry strategy, pagination handlers, circuit breaker, deduplicator, `createClient` and the domain clients.
- The rate limiter. `configureApiClient` and `ApiClientBuilder` attach the limiter they build to its client (`RateLimiter.setClient`), so every `[ESI Rate Limit]` event reaches that client's logger. A limiter you build yourself and pass to `ApiClientBuilder.setRateLimiter` is not attached, since one limiter may serve several clients; call `setClient` on it to choose.
- The ETag cache, from its first line: `configureApiClient` passes the client to the constructor, so the "initialized" line reaches the client's logger too. The client's own logger is set before any middleware is built.
- `EsiClient.batch` and `EsiClient.batchPost`, and the construction and shutdown lines of `EsiClient` and `CustomEsiClient`.

Two kinds of caller have no client to name and use the global logger by design: the standalone `batchFetch` and `batchPost` exports, and `EsiTokenManager` (see [Token manager](#token-manager)).

The mechanism is a lint rule, not a convention. `npm run lint` forbids any import of the global `loggerUtil` module inside `src/core/requestPipeline/` and `src/clients/`, by any relative path (`eslint.logger-imports.rules.cjs`, a `no-restricted-imports` block). `npm run lint:layers` carries the same block and runs with `--no-inline-config`, so an `eslint-disable` comment cannot get round it. `tests/tdd/layers/logger-imports-lint.test.ts` proves the rule fires and that both configs load it.

```ts runnable
import { EsiClient, createDefaultLogger, setLogger } from '@lgriffin/esi.ts';

// Per-client: this client's pipeline events go to its own logger.
const trading = new EsiClient({
  clientId: 'trade-bot',
  logLevel: 'debug',
});

// Global fallback: every client without a per-client logger, plus the
// standalone batch helpers and the token manager, write here.
setLogger(createDefaultLogger('info'));
```

## The default logger

`createDefaultLogger(level?)` returns `toPinoLogger(pino({ level }))`. pino writes newline-delimited JSON to standard output, one object per event, with the context keys as top-level fields beside `msg`, `level` and `time`.

| Source                        | Precedence | Notes                                                                  |
| ----------------------------- | ---------- | ---------------------------------------------------------------------- |
| `level` argument / `logLevel` | highest    | `logLevel` takes a `LogLevel` or `'silent'`                            |
| `ESI_LOG_LEVEL` env variable  | next       | Read when the logger is built. Any pino level name, including `silent` |
| `'warn'`                      | default    | Library events that need attention, nothing else                       |

Valid levels are pino's: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, plus `silent` to disable output. `silent` is accepted at runtime but is not a member of the `LogLevel` type, so use `ESI_LOG_LEVEL=silent` or `createNoopLogger()` rather than `logLevel: 'silent'`.

An unrecognised value throws from pino when the logger is built. For `ESI_LOG_LEVEL` that is at import time, because the default instance is built when the module loads (see [Known gaps](#known-gaps)).

pino is a runtime dependency. The library does not configure transports, redaction or pretty-printing on the default instance. If you want any of those, build your own pino logger and pass it through `toPinoLogger`.

## Bringing your own logger

### pino with your own options

`toPinoLogger` accepts anything with `fatal`, `error`, `warn`, `info`, `debug` and `trace` methods in pino's calling convention: `(context, message)` or `(message)`. It calls through the sink object, so pino's `this` binding is preserved and child loggers work.

```ts
import pino from 'pino';
import { EsiClient, toPinoLogger } from '@lgriffin/esi.ts';

const root = pino({
  level: 'info',
  transport: { target: 'pino-pretty' },
});

const esi = new EsiClient({
  clientId: 'my-app',
  logger: toPinoLogger(root.child({ component: 'esi' })),
});
```

### Anything else

Implement the six methods. The library passes `(message, context?)`, which already matches winston's `(message, meta)` form and `console`.

```ts
import winston from 'winston';
import { EsiClient, type ILogger } from '@lgriffin/esi.ts';

const w = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.Console()],
});

const logger: ILogger = {
  fatal: (message, context) => w.error(message, { ...context, fatal: true }),
  error: (message, context) => w.error(message, { ...context }),
  warn: (message, context) => w.warn(message, { ...context }),
  info: (message, context) => w.info(message, { ...context }),
  debug: (message, context) => w.debug(message, { ...context }),
  trace: (message, context) => w.silly(message, { ...context }),
};

const esi = new EsiClient({ clientId: 'my-app', logger });
```

A minimal console logger with a level floor:

```ts
import type { ILogger, LogContext, LogLevel } from '@lgriffin/esi.ts';

const order: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export function consoleLogger(min: LogLevel = 'warn'): ILogger {
  const at =
    (level: LogLevel) =>
    (message: string, context?: LogContext): void => {
      if (order.indexOf(level) < order.indexOf(min)) return;
      const sink =
        order.indexOf(level) >= order.indexOf('error')
          ? console.error
          : console.log;
      sink(`[esi] ${level} ${message}`, context ?? '');
    };
  return {
    fatal: at('fatal'),
    error: at('error'),
    warn: at('warn'),
    info: at('info'),
    debug: at('debug'),
    trace: at('trace'),
  };
}
```

### Token manager

`EsiTokenManager` is not an `ApiClient` and does not take part in per-client resolution. It uses `EsiTokenManagerConfig.logger` when one is given, and otherwise reads `getLogger()` at each log call, so a `setLogger()` made after the manager was built still reaches it. Its events carry the character ID in the message and no context object.

## What the library logs

Messages are for people; context keys are for queries. Filter on the context, not the message text, which is not part of the public API and may change in a minor release.

`url` values are absolute request URLs. `endpoint` is the path relative to the base URL. `templatePath` is the unresolved ESI path, such as `/markets/{region_id}/orders/`.

### Visible at the default level

| Component       | Level | Event                                                                                 | Context                                |
| --------------- | ----- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| Endpoint call   | warn  | Deprecated endpoint called, on every call (message names replacement and sunset date) | `endpoint` (method name)               |
| Domain clients  | warn  | Deprecated client method called (`AllianceClient` contacts)                           | `allianceId`                           |
| Fetch           | warn  | ESI `warning` response header received                                                | `url`, `warningCode`                   |
| Retry           | warn  | Retrying after a retryable status                                                     | `method`, `statusCode`                 |
| Status handling | warn  | 5xx served from stale cache                                                           | `status`                               |
| Status handling | warn  | Rate limited (420 or 429)                                                             | `status`                               |
| Pagination      | warn  | Offset pagination failed on a later page                                              | `url`, `endpoint`, `error`             |
| Pagination      | warn  | Empty page, pagination stopped early                                                  | `page`                                 |
| Pagination      | warn  | Cursor pagination stopped after consecutive failures                                  | `consecutiveFailures`                  |
| Circuit breaker | warn  | Circuit opened, or re-opened after a failed probe                                     | `key`, `failures`                      |
| Rate limiter    | warn  | Group blocked after 420/429; still blocked, request aborted                           | `group`, `waitMs` (blocked only)       |
| Rate limiter    | warn  | Token bucket empty, waiting                                                           | `group`                                |
| Rate limiter    | warn  | Legacy error limit low or exhausted, waiting                                          | `errorLimitRemain` / `errorLimitReset` |
| Fetch           | error | Response body is not valid JSON                                                       | `url`                                  |
| Retry           | error | Token refresh failed                                                                  | `endpoint`                             |
| Pagination      | error | Offset or cursor page fetch failed                                                    | `page`                                 |
| Status handling | error | Unexpected non-HTTP error                                                             | none                                   |
| `MetaClient`    | error | Fetching the OpenAPI YAML failed                                                      | `url`                                  |

### `info`

| Component       | Event                                                   | Context                                                                    |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| Construction    | `EsiClient` or `CustomEsiClient` initialised, shut down | `baseUrl`, `clientId` / `clients`                                          |
| Construction    | Access token updated; token provider set or removed     | none                                                                       |
| Fetch           | Every outgoing request (`Hitting endpoint`)             | `method`, `endpoint`                                                       |
| Status handling | 204 No Content; 304 served from the ETag cache          | `status`, `cacheHitType: 'etag-304'`                                       |
| Retry           | 401 received, refreshing; refreshed, retrying           | `endpoint`                                                                 |
| Pagination      | Page count discovered; each page fetched; completion    | `endpoint`, `totalPages`, `page`, `items`, `totalItems`, `pages`, `method` |
| Circuit breaker | Half-open probe allowed; closed after probe; cleanup    | `key`, `cleaned`                                                           |
| ETag cache      | Initialised; cleared; configuration updated             | `maxEntries`                                                               |
| Batch helpers ¹ | Batch fetch or batch POST started                       | `total`, `concurrency`, `chunks`, `chunkSize`                              |

### `debug`

| Component       | Event                                                 | Context                   |
| --------------- | ----------------------------------------------------- | ------------------------- |
| Cache policy    | Spec-aware cache hit (no network call)                | `method`, `templatePath`  |
| Cache policy    | Response cached with ETag                             | `method`, `etag`          |
| ETag cache      | Entry hit, expired or stored; path prefix invalidated | `url`; `count`            |
| Headers         | `If-None-Match` attached                              | `etag`                    |
| Deduplicator    | Identical in-flight GET coalesced                     | none (key in the message) |
| Batch helpers ¹ | Batch complete                                        | `succeeded`, `failed`     |
| Token manager   | Refreshed, stale refresh discarded, JWT not decoded   | none                      |

¹ To the client's logger through `EsiClient.batch` and `batchPost`; to the global or default logger through the standalone `batchFetch` and `batchPost` exports.

Nothing in the library logs at `fatal` or `trace` today. The levels exist so an `ILogger` is a complete adapter for pino.

## Silencing and capturing in tests

Three ways to silence the library, from narrowest to widest:

```ts
import { EsiClient, createNoopLogger, setLogger } from '@lgriffin/esi.ts';

// One client.
const client = new EsiClient({ clientId: 'test', logger: createNoopLogger() });

// Everything without a per-client logger, including the rate limiter.
setLogger(createNoopLogger());
```

```bash
# The default pino instance, process-wide.
ESI_LOG_LEVEL=silent npm test
```

A per-client no-op logger does not silence rate-limiter or batch-helper events. Use `setLogger` or `ESI_LOG_LEVEL` when those appear in test output.

To assert on log output, pass a recording logger. `setLogger` is global state, so restore it in `afterEach`.

```ts
import {
  EsiClient,
  getLogger,
  setLogger,
  type ILogger,
} from '@lgriffin/esi.ts';

const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
const recorder = Object.fromEntries(
  levels.map((l) => [l, jest.fn()]),
) as unknown as jest.Mocked<ILogger>;

const original = getLogger();
afterEach(() => setLogger(original));

it('warns when a request is retried', async () => {
  const client = new EsiClient({ clientId: 'test', logger: recorder });
  // … drive a retryable failure through jest-fetch-mock …
  expect(recorder.warn).toHaveBeenCalledWith(
    expect.stringContaining('retrying'),
    expect.objectContaining({ statusCode: 503 }),
  );
});
```

See [TESTING.md](TESTING.md) for the transport-seam mocking these tests should use.

## Secrets in log output

The bearer token travels only in the `Authorization` header, and no log call includes request headers, so an access token never reaches a log line. The same holds for refresh tokens in `EsiTokenManager`.

URLs are redacted at the logger boundary. Before a line reaches any logger, per-client or global, every query parameter in its message and in each top-level string context value (`url`, `endpoint`, and the rest) whose name is one `sanitizeUrl` redacts (`token`, `access_token`, `refresh_token`, `code`, `client_secret` and the others SECURITY.md lists, percent-encoded or not) has its value replaced with `%5BREDACTED%5D`, the URL-encoded `[REDACTED]` that errors carry. The rest of the line is logged exactly as written, so absolute, relative and protocol-relative URLs, several URLs separated by punctuation, and URLs `new URL` rejects are all covered. A line with nothing to redact reaches the logger unchanged. A logger that implements `isLevelEnabled` is asked first, so a disabled level costs nothing. The exported `logFatal` … `logTrace` helpers and `EsiTokenManager` redact too.

What is not redacted: nested objects inside the context, parameter names outside the list (matching is case-sensitive), and a value containing a comma or semicolon, which is redacted only up to that character. Keep credentials in headers. The full defence chain is in [SECURITY.md](SECURITY.md).

`tests/tdd/core/redactLog.test.ts` and `clientLog.test.ts` cover the boundary, and `tests/bdd/features/core/0058-logging.feature` drives a request whose URL carries a token through the real pipeline and reads the redacted form at the logger.

## Known gaps

Stated against the charter, measured against the code at the time of writing.

**ARCH-06 · Gap: logger construction at import.** `src/core/logger/DefaultLogger.ts` builds the default pino instance when the module loads, and the deprecated default export of `src/core/logger/logger.ts` builds a second one when that module loads (nothing in `src/` imports it). Consequences: pino is initialised by any import of the root entry point, an invalid `ESI_LOG_LEVEL` throws on import rather than on first use, and `package.json` cannot yet declare `"sideEffects": false`. The fix is a lazily built default. Tracked as `esi-piw` ([#268](https://github.com/lgriffin/ESI.ts/issues/268)).

**ARCH-09 · Enforced: per-client logging.** Closed by [#296](https://github.com/lgriffin/ESI.ts/issues/296) and [#265](https://github.com/lgriffin/ESI.ts/issues/265): every call site uses the per-client logger (see [Call sites](#call-sites)), and `npm run lint` holds `src/core/requestPipeline/` and `src/clients/` off the global `loggerUtil`.
