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
| `EsiClientConfig.logLevel`     | option    | Per-client pino logger at this level, used only when `logger` is not given                    |
| `ApiClient.setLogger(l)`       | method    | Sets or clears (`null`) the per-client logger on an `ApiClient` you hold directly             |
| `EsiTokenManagerConfig.logger` | option    | Logger for token refresh activity; see [Token manager](#token-manager)                        |

The exported `logFatal` … `logTrace` helpers are the global-logger variants. The request pipeline uses internal per-client twins with a leading `client` argument; those are not exported.

## How a logger is resolved

Every log call inside the pipeline names the `ApiClient` it belongs to. The logger is chosen at the moment of the call, in this order:

1. **Per-client.** The logger stored on that `ApiClient`. `configureApiClient` sets it from `EsiClientConfig.logger`, or, failing that, builds a fresh pino logger from `EsiClientConfig.logLevel`. If neither option is given, the client has no logger of its own.
2. **Global.** The logger installed with `setLogger()`, if one has been installed.
3. **Default.** The module-level pino instance, level from `ESI_LOG_LEVEL` or `warn`.

`EsiClient`, `CustomEsiClient` (via `EsiClientBuilder`) and every `EsiApiFactory.create*` method all route through `configureApiClient`, so the two config options behave the same on all three construction surfaces.

Resolution happens per call, so `setLogger()` affects clients that were constructed before it, provided they have no per-client logger. Two exceptions:

- A few call sites have no client handle and pass none: the rate limiter (every `[ESI Rate Limit]` event) and the batch helpers. Those events skip step 1 and go to the global or default logger. See [Known gaps](#known-gaps).
- The ETag cache logs its "initialized" line from its constructor, before it is attached to a client, so that one line also goes to the global or default logger.

```ts
import { EsiClient, createDefaultLogger, setLogger } from '@lgriffin/esi.ts';

// Per-client: this client's pipeline events go to its own logger.
const trading = new EsiClient({
  clientId: 'trade-bot',
  logLevel: 'debug',
});

// Global fallback: every client without a per-client logger, plus the
// rate limiter and batch helpers, write here.
setLogger(createDefaultLogger('info'));
```

## The default logger

`createDefaultLogger(level?)` returns `toPinoLogger(pino({ level }))`. pino writes newline-delimited JSON to standard output, one object per event, with the context keys as top-level fields beside `msg`, `level` and `time`.

| Source                        | Precedence | Notes                                                                  |
| ----------------------------- | ---------- | ---------------------------------------------------------------------- |
| `level` argument / `logLevel` | highest    | Typed as `LogLevel`                                                    |
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

`EsiTokenManager` is not an `ApiClient` and does not take part in per-call resolution. It takes `EsiTokenManagerConfig.logger` and otherwise captures `getLogger()` **once, at construction**. Call `setLogger()` before creating the manager, or pass the logger explicitly. Its events carry the character ID in the message and no context object.

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
| Rate limiter ¹  | warn  | Group blocked after 420/429; still blocked, request aborted                           | `group`, `waitMs` (blocked only)       |
| Rate limiter ¹  | warn  | Token bucket empty, waiting                                                           | `group`                                |
| Rate limiter ¹  | warn  | Legacy error limit low or exhausted, waiting                                          | `errorLimitRemain` / `errorLimitReset` |
| Fetch           | error | Response body is not valid JSON                                                       | `url`                                  |
| Retry           | error | Token refresh failed                                                                  | `endpoint`                             |
| Pagination      | error | Offset or cursor page fetch failed                                                    | `page`                                 |
| Status handling | error | Unexpected non-HTTP error                                                             | none                                   |
| `MetaClient`    | error | Fetching the OpenAPI YAML failed                                                      | `url`                                  |

¹ Written to the global or default logger, never the per-client logger.

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
| ETag cache      | Initialised ¹; cleared; configuration updated           | `maxEntries`                                                               |
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

URLs are a different matter. Errors pass their URL through `sanitizeUrl`, which redacts sensitive query parameters. Log messages and the `url` context field carry the request URL **as built**, after request interceptors have run, without that redaction. ESI itself takes no credentials in the query string, so this is safe for the library's own requests. If a request interceptor adds a secret to the query string, that secret will appear in `info` and `warn` output. Keep credentials in headers. The full defence chain is in [SECURITY.md](SECURITY.md).

## Known gaps

Stated against the charter, measured against the code at the time of writing.

**ARCH-06 · Gap: logger construction at import.** `src/core/logger/DefaultLogger.ts` builds the default pino instance when the module loads, and the deprecated default export of `src/core/logger/logger.ts` builds a second one when that module loads (nothing in `src/` imports it). Consequences: pino is initialised by any import of the root entry point, an invalid `ESI_LOG_LEVEL` throws on import rather than on first use, and `package.json` cannot yet declare `"sideEffects": false`. The fix is a lazily built default. Tracked as `esi-piw` ([#268](https://github.com/lgriffin/ESI.ts/issues/268)).

**ARCH-09 · Partial: per-client logging.** The request pipeline under `src/core/requestPipeline/`, the retry strategy, pagination handlers, circuit breaker, ETag cache, deduplicator and `createClient` all log through the per-client path; none of them imports the global `loggerUtil`. What remains:

- The rate limiter and the batch helpers pass no client, so their events land on the global or default logger. Per-client routing needs the rate limiter to hold a client handle, as the circuit breaker and cache already do.
- `EsiClient`, `EsiClientBuilder` and `EsiTokenManager` read `getLogger()` directly as their fallback. The effective result matches the resolver, but it is a second code path.
- The grep gate on global-logger imports inside `requestPipeline/` is not yet in CI. Tracked as `esi-772` ([#265](https://github.com/lgriffin/ESI.ts/issues/265)).
