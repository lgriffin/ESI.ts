# Many characters, one runtime

**Implements:** `ARCH-08` · `SEC-02` · `DES-01`. See [CHARTER.md](CHARTER.md) Part 2 and Part 6. **Specification:** `tests/bdd/features/core/0056-shared-runtime.feature`.

An application that acts for more than one character (a corporation tool, a market bot, an alliance auth service) has one relationship with ESI, not one per character. ESI meters every request by the calling IP, and the error budget that a 420 exhausts is the application's, not a character's. `@lgriffin/esi.ts/client` is built around that fact: one runtime, and a view over it for each identity.

```ts
import { createEsi } from '@lgriffin/esi.ts/client';

const esi = createEsi({ userAgent: 'fleet-tool/2.1 (ops@example.com)' });

const status = await esi.public.status.get();
const wallet = await esi
  .as(tokens.identity(characterId))
  .character(characterId)
  .wallet.get();
```

The rest of this guide explains each part of that, how it relates to `EsiClient` and `EsiTokenManager.createClient`, and how to move over.

## The runtime

`createEsi(options)` builds one request pipeline: rate limiter, error budget, circuit breaker (when enabled), in-flight deduplicator, ETag cache and transport. Every view hands its requests to that one pipeline. The options are the pipeline options `EsiClient` takes, with two differences:

- **`userAgent` is required.** CCP asks every caller to identify itself, so a misbehaving application can be contacted rather than blocked. The legacy client left it optional for compatibility; the new surface refuses to construct without one, at construction rather than on every request, and refuses a value that is not a legal header value for the same reason (`0055-request-headers.feature`).
- **There is no token option.** Tokens belong to identities, below. The runtime itself never holds one.

```ts
import { createEsi } from '@lgriffin/esi.ts/client';

const esi = createEsi({
  userAgent: 'fleet-tool/2.1 (ops@example.com)',
  tenant: 'singularity',
  enableCircuitBreaker: true,
  retryConfig: { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30_000 },
  logLevel: 'info',
});
```

The runtime is frozen: it has no setters, so nothing about it changes after construction. Build a second runtime for a second tenant or a second application identity.

## The public view

`esi.public` reaches every operation that needs no SSO scope, arranged by resource:

```ts
const status = await esi.public.status.get();
const alliance = await esi.public.alliance(99000001).get();
for await (const order of esi.public
  .market(regionId)
  .orders.get({ order_type: 'sell' })) {
  // one order at a time, every page followed
}
```

Its type is `PublicScopeTree`, generated from the ESI OpenAPI document with the authenticated operations left out. A call that needs a scope does not compile:

```ts
// @ts-expect-error the wallet needs esi-wallet.read_character_wallet.v1
esi.public.character(characterId).wallet.get();
```

That is the answer to [#183](https://github.com/lgriffin/ESI.ts/issues/183): the split between public and authenticated is a type, so a missing token is a compile error, not a 401 in production. The runtime guards the same line for a caller who casts past the type: an authenticated operation forced through the public view is rejected with `NO_AUTH_TOKEN` before any request is sent.

The public view sends no `Authorization` header, whatever tokens the runtime's other views hold. A public request is never attributed to a character.

## Identities and `as()`

`esi.as(identity)` returns a view over the same runtime that sends as one identity. Its type is `ScopeTree`, the full tree, so every operation is there. The view is immutable: it holds the identity it was built with, and the same `Identity` object gets the same view back, so `esi.as(identity)` in a request handler costs nothing after the first call.

An identity is anything with these members:

```ts
interface Identity {
  readonly characterId?: number;
  accessToken(): Promise<string>;
  refreshAccessToken?(): Promise<string>;
}
```

Before each authenticated request the view calls `accessToken()`, so a holder that knows its token is about to expire can refresh first. When ESI answers 401, the view calls `refreshAccessToken()` and retries once; an identity without it cannot refresh, and the 401 is the caller's answer after a single request.

Three ways to get one:

**From `EsiTokenManager`.** The manager holds one refresh token per character and keeps the access token fresh. `tokens.identity(characterId)` hands out the stored token, refreshing it first when it is inside the refresh skew, and refreshes through SSO after a 401. Nothing is looked up until a request needs it, so an unknown character fails at the request, not when the identity is made.

```ts
const view = esi.as(tokens.identity(characterId));
const balance = await view.character(characterId).wallet.get();
```

**From a raw access token.** For a script that was handed a token, or a token another system keeps fresh:

```ts
import { identityFromToken } from '@lgriffin/esi.ts/client';

const view = esi.as(identityFromToken(token));
```

It cannot refresh. When the token expires, calls fail with a 401 and the caller makes a new identity.

**From a `TokenProvider`.** The same function the legacy `onTokenRefresh` option takes: it returns the current token, refreshing first when it knows the old one has expired. The view asks it before each request, before each page of a paginated operation, and again after a 401.

```ts
import { identityFromProvider } from '@lgriffin/esi.ts/client';

const view = esi.as(identityFromProvider(myRefreshFunction, { characterId }));
```

`characterId` on an identity is for diagnostics: the cache keys itself by the character the token names, not by this field.

## What the views share

Everything but the token. One request through any view moves the same rate-limit window, spends the same error budget, and counts against the same circuit. An endpoint that opens its circuit through one character's view is rejected, without a request, through the public view and every other view until the reset timeout passes.

The ETag cache is shared too, in two ways:

- **Public entries are shared across views.** The server status fetched through one character's view is served to the public view, and to every other view, from the cache for as long as the spec TTL says it is fresh.
- **Authenticated entries are kept apart by identity.** Two characters in one corporation ask the same corporation wallet URL and get answers scoped to their own roles, so each identity has its own entry. The key carries the character the token names, read from the SSO token's `sub` claim, so a token refresh keeps the character's entries and its ETags: the first request under the new token is a conditional request answered by a 304, not a full download. A token that names no character is keyed by a hash of the token instead. The token itself never appears in a key ([SECURITY.md](SECURITY.md), Cache isolation).

The in-flight deduplicator draws the same line: identical public GETs from two views share one request; identical authenticated GETs share one only when they are for the same character.

When an application is done with a runtime, `esi.shutdown()` stops the cache's and circuit breaker's cleanup timers and drops the in-flight table, once for the runtime rather than once per view. The timers never keep a process alive on their own, so a script that forgets it still exits; the call is for an application that replaces a runtime and wants nothing of the old one left running. Calling it twice is harmless, and a view still answers afterwards.

## Revoked tokens, scheduled refresh and concurrency

With a token manager, a character whose refresh token SSO has revoked throws `TokenRevokedError` from `accessToken()`, so the call fails before any request. Catch it with `isTokenRevoked` from `@lgriffin/esi.ts/errors`, remove the character and send them through login again.

`tokens.refreshAll()` on a schedule keeps every stored token fresh so that no request has to wait on SSO. It is unchanged by the runtime; a view picks up the refreshed token at its next request, because it asks the identity each time.

Concurrent requests through one view are safe. A refresh coalesces: two requests that hit 401 at the same time cause one SSO call, and both retry with its result. Concurrent requests through views for different characters are independent, apart from the shared budgets above.

## Moving from `EsiTokenManager.createClient`

`tokens.createClient(id)` builds a complete `EsiClient` per character, each with its own rate limiter, error budget and cache. It still works and nothing about it changes in 11.0. To move an application to one runtime:

| Before                                                        | After                                                             |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| `const client = await tokens.createClient(id, { userAgent })` | `const esi = createEsi({ userAgent })`, once                      |
| `client.wallet.getCharacterWallet(id)`                        | `esi.as(tokens.identity(id)).character(id).wallet.get()`          |
| `client.status.getStatus()`                                   | `esi.public.status.get()`                                         |
| `client.market.streamRegionOrders(regionId)`                  | `for await (const o of esi.public.market(regionId).orders.get())` |
| `client.shutdown()` per character                             | `esi.shutdown()`, once                                            |

Two differences to know before switching:

- **The operations are the generated ones.** They follow the ESI OpenAPI document exactly: resource-shaped names (`character(id).wallet.get()` rather than `wallet.getCharacterWallet(id)`), spec-typed responses, and every paginated operation returned as an `AsyncIterable` that follows the pages. They are not validated by the hand-written Zod schemas; `PipelineTransport` returns the body typed from the spec. Runtime validation for the generated operations is Phase 3 of [ROADMAP.md](ROADMAP.md).
- **A view is not an `EsiClient`.** It has no `withMetadata()`, `withSafeMode()` or `getCacheStats()`, and `shutdown()` is on the runtime, not the view. Diagnostics for the runtime are on the roadmap with the rest of Phase 4.

`examples/multi-character.ts` shows several characters' wallets through one runtime, and `examples/public-vs-authenticated.ts` shows the type split with the `@ts-expect-error` line.
