# src/core/requestPipeline — agent notes

These modules are the stages of `handleRequest` in
[`../ApiRequestHandler.ts`](../ApiRequestHandler.ts). Every client method
reaches them through `createClient()` in
[`../endpoints/createClient.ts`](../endpoints/createClient.ts).

## Never bypass `handleRequest` in tests

A behaviour test (BDD, or a client test in `tests/tdd/`) mocks `fetch` and
lets `handleRequest` run. If you stub `handleRequest`, `createClient`, or a
client method, the retry, cache, circuit-breaker and validation code never
runs, so the test cannot catch a bug in any of them. BDD steps queue
responses through `tests/bdd/support/` (see
[`tests/bdd/AGENTS.md`](../../../tests/bdd/AGENTS.md)).

The exception is a unit test of one stage. It may call that stage's module
directly, as the tests in `tests/tdd/core/requestPipeline/` do.

## Pipeline order

Checked against `ApiRequestHandler.ts` and `fetchExecution.ts`:

1. **Spec-aware cache hit.** `trySpecAwareCacheHit` answers from the cache
   inside the TTL and sends no HTTP request.
2. **Retry.** `RetryStrategy.execute` handles backoff and refreshes the token
   on a 401.
3. **Deduplication.** Identical in-flight GETs without a body share one
   request.
4. **`executeSingleFetch`.** This stage runs `buildRequestHeaders` (auth,
   `If-None-Match`), then request middleware, the circuit-breaker check and
   the rate-limiter check. Next comes `fetch` with a timeout. Last, it
   updates the rate limiter and records the result with the circuit breaker.
5. **Status handling.** 201 returns directly. `handleEarlyStatus` handles 204
   and 304. `handleErrorResponse` throws on 4xx/5xx, or serves stale cache on
   5xx.
6. **`parseJsonBody`**, then **`cacheResponse`**.
7. **Pagination.** Cursor pagination, or offset pagination across `X-Pages`.
8. **`applyResponseInterceptors`.**

After `handleRequest` returns, `createClient` validates the body against the
endpoint's Zod `responseSchema` when response validation is enabled. A body
that fails is evicted from the cache (`evictRejectedResponse`) before the
`EsiValidationError` is thrown, because step 6 cached it first.

If you change this order, update this list in the same PR.
