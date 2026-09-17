# Pagination

**Implements:** `DES-08` (Partial), `DOC-01` — requirement text and status in [CHARTER.md](CHARTER.md).

How ESI.ts turns a multi-page ESI resource into data: the eager default, the `stream*` and `fetchAll*` helpers, cursor-paginated routes, the batch helpers, and what each one does when a page fails. Where the code falls short of `DES-08`, this guide says so rather than describing the intent.

---

## Choosing a mode

| You want                               | Use                                       | Requests                        | Memory           | If a page fails                          |
| -------------------------------------- | ----------------------------------------- | ------------------------------- | ---------------- | ---------------------------------------- |
| The whole dataset, simplest call       | The domain method, e.g. `getMarketOrders` | Sequential                      | Whole dataset    | Throws (see [known gaps](#known-gaps))   |
| Process page by page, or stop early    | `stream*`, e.g. `streamMarketOrders`      | Sequential, on demand           | One page         | Throws from the loop at that page        |
| The whole dataset, faster              | `fetchAll*`, e.g. `fetchAllMarketOrders`  | Parallel waves, default 8       | Whole dataset    | Rejects; no partial result               |
| A cursor-paginated route               | The domain method plus `after` token      | One per call                    | One page         | Throws                                   |
| Every page of a cursor route           | `fetchAllCursorPages`                     | Sequential                      | Whole dataset    | Rejects; no partial result               |
| Many IDs against a non-paginated route | `client.batch`                            | Parallel, default 20            | Whole result map | Never rejects; failures collected by key |
| A bulk POST larger than ESI accepts    | `client.batchPost`                        | Sequential chunks, default 1000 | Whole result     | Rejects on the first failing chunk       |

---

## How ESI paginates

ESI uses two schemes.

**Offset pagination.** The response carries an `x-pages` header with the total page count. Pages are requested with `?page=N`, starting at 1. Most large collections use this: market orders, assets, wallet journals, contracts, corporation members.

**Cursor pagination.** Newer routes return opaque `before` and `after` tokens instead of page numbers. Freelance Jobs and Corporation Projects place them in the response body as `cursor: { before, after }`. An empty result array marks the end of the dataset. See the [ESI blog post](https://developers.eveonline.com/blog/changing-pagination-turning-a-new-page) for CCP's rationale.

### Declaring pagination on an endpoint

Offset pagination needs no declaration. The pipeline reacts to `x-pages` on any response, so an endpoint definition only states path, method, auth and schema. See [DESIGN-RULES.md](DESIGN-RULES.md) for the definition format.

Cursor routes are declared in one of two ways:

| Style         | Declaration                                              | Return type                                                     | Used by                                        |
| ------------- | -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Body tokens   | `queryParams: { before: 'before', after: 'after' }`      | The schema's own type, including its `cursor` field             | Freelance Jobs and Corporation Projects routes |
| Header tokens | `cursorPagination: true`; tokens in `x-cursor-*` headers | `CursorResult<T>` = `{ data: T[]; cursors: { before, after } }` | No endpoint today                              |

The header-token style exists for routes that return cursors in `x-cursor-before` and `x-cursor-after`. The generated method accepts a trailing `{ before?, after? }` argument and returns `CursorResult<T>`. Nothing follows the tokens automatically; the caller passes `cursors.after` back in.

---

## Offset: the eager default

Calling a paginated domain method returns every page as one array.

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient({ clientId: 'my-app' });

const orders = await client.market.getMarketOrders(10000002);

const { data, meta } = await client.market
  .withMetadata()
  .getMarketOrders(10000002);
console.log(`${data.length} orders across ${meta.pages ?? 1} pages`);
```

What happens:

1. **Page 1 takes the full request path** described in [ARCHITECTURE.md](ARCHITECTURE.md): spec-aware cache check, deduplication, retry, conditional request with `If-None-Match`, status handling, cache write.
2. **If `x-pages` is greater than 1**, pages 2 to N are fetched one after another. Each page goes through the retry strategy (with the real HTTP method), request interceptors, circuit breaker, rate limiter and timeout. Pages 2 to N are not deduplicated and are sent without `If-None-Match`.
3. **Pagination stops early** at the first empty page, logging a warning, and never goes past page 1000.
4. **The concatenated array is cached** under the page-1 URL (scoped to the access token on an authenticated endpoint), validated once against the endpoint's `responseSchema`, and passed through response interceptors.
5. **Metadata comes from page 1.** `meta.pages` is the `x-pages` value; `meta.etag` is page 1's ETag.

A later call that is inside the spec TTL, or that gets a 304 on page 1, is answered from the cached array without fetching pages 2 to N.

---

## Offset: `stream*`

`stream*` methods return an `AsyncGenerator<PageResult<T>>`. Each `PageResult` is `{ data: T[]; page: number; totalPages: number }`. The next page is not requested until the loop asks for it, so `break` stops all further requests.

```typescript
for await (const page of client.market.streamMarketOrders(10000002)) {
  for (const order of page.data) {
    if (order.is_buy_order && order.price > 1_000_000) {
      console.log(`${order.type_id} @ ${order.price}`);
    }
  }
  if (page.page >= 3) break;
}
```

Semantics:

- `totalPages` is read once, from page 1.
- Pages are fetched sequentially and validated individually against the endpoint's `responseSchema` when `validateResponse` is on.
- Iteration ends after `totalPages`, or earlier at the first empty page. There is no page cap.
- A failed page throws from the `for await` at that page. Pages already yielded have been delivered; nothing is rolled back.

Try it: `npm run example:streaming`.

## Offset: `fetchAll*`

`fetchAll*` methods return `Promise<T[]>` like the eager call, but fetch pages 2 to N in parallel waves. The last parameter is an optional `concurrency`, default 8.

```typescript
const assets = await client.assets.fetchAllCharacterAssets(characterId, 4);
const types = await client.market.fetchAllMarketTypes(10000002);
```

Semantics:

- Page 1 is fetched first to learn `x-pages`. The remaining pages are split into waves of `concurrency` and each wave runs with `Promise.all`; the next wave starts when the slowest page of the current one settles.
- Result order matches page order.
- Each page is validated individually when `validateResponse` is on.
- There is no page cap and no early stop on an empty page.
- If any page fails after its retries, the whole call rejects with that page's error. Pages already fetched are discarded.

Concurrency does not bypass rate limiting. Every page still passes the rate limiter, and a 420 or 429 blocks the whole group, so in-flight pages wait together. Pick `concurrency` against the endpoint's rate-limit group rather than raising it for speed. The limiter is described in [ARCHITECTURE.md](ARCHITECTURE.md).

## Naming and the escape hatches

Every client with paginated endpoints pairs its eager method with `stream*` and `fetchAll*` wrappers. The wrapper name is usually the eager name with `get` replaced (`getCharacterWalletJournal` → `streamCharacterWalletJournal`, `fetchAllCharacterWalletJournal`). Some wrappers drop the domain prefix inside their own client (`AllianceClient.fetchAllCorporations`). The API report at `etc/esi.ts.api.md` is the authoritative list.

For an endpoint without a wrapper, `BaseEsiClient` exposes both primitives. They take the endpoint's key in the definition map and the same arguments the eager method passes to it:

```typescript
import type { MarketOrder } from '@lgriffin/esi.ts';

for await (const page of client.market.streamEndpoint<number>(
  'getMarketTypes',
  10000002,
)) {
  console.log(page.page, page.data.length);
}

const orders = await client.market.fetchAllEndpoint<MarketOrder>(
  'getMarketOrders',
  [10000002, 'all'],
  8,
);
```

The underlying functions `fetchPages` and `fetchAllPages` are exported from the package root for callers holding an `ApiClient`.

## What `stream*` and `fetchAll*` skip

Both helpers fetch every page, including page 1, through a single-page path that is lighter than the eager request path.

| Behaviour                                 | Eager method        | `stream*` / `fetchAll*`                |
| ----------------------------------------- | ------------------- | -------------------------------------- |
| Spec-aware cache hit (no network)         | Page 1              | No                                     |
| Deduplication of identical in-flight GETs | Page 1              | No                                     |
| `If-None-Match` sent                      | Page 1              | Every page, if the cache holds an ETag |
| 304 served from cache                     | Yes                 | No: throws `EsiError` 304              |
| Cache write                               | Combined array      | Never                                  |
| Stale cache served on 5xx                 | Yes                 | No                                     |
| Remediation text on 401 / 403             | Yes                 | No                                     |
| Request interceptors                      | Every page          | Every page                             |
| Response interceptors                     | Once, on the result | No                                     |
| Retry, 401 token refresh, circuit breaker | Every page          | Every page                             |
| HTTP method in the retry context          | Real method         | Always `GET`                           |
| `withMetadata()` / `withSafeMode()`       | Available           | Not available                          |

---

## Cursor pagination

### Body tokens (Freelance Jobs, Corporation Projects)

Each call is one page through the full request path. Pass `after` to move forward.

```typescript
import { EsiClient, fetchAllCursorPages } from '@lgriffin/esi.ts';

const client = new EsiClient({ clientId: 'my-app' });

const first = await client.freelanceJobs.getFreelanceJobs();
const next = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  first.cursor?.after ?? undefined,
);

const allJobs = await fetchAllCursorPages(
  (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
  (response) => response.freelance_jobs,
  (response) => response.cursor ?? {},
);
```

`fetchAllCursorPages` calls the fetcher sequentially, following `after`, until a page returns no items or no `after` token. It has no page cap. A failed call rejects the whole helper and the items gathered so far are discarded.

Rules that come from ESI rather than from the library:

- Tokens are opaque. Store and pass them; never parse them.
- An empty item array is the end of the dataset, not a short page.
- Results are ordered by last modification, so a saved `after` token can be used later to fetch only records that changed.
- The same record can appear on two pages if it was modified between requests. De-duplicate by `id`.

Try it: `npm run example:cursor-pagination`.

### `CursorPaginationHandler`

`src/core/pagination/CursorPaginationHandler.ts` contains a header-token `fetchAll` that stops after three consecutive page failures and returns the items it has. It is not exported from the package and no client method calls it, so no consumer reaches this behaviour today. Only its `CursorTokens` type is public. It is listed under [known gaps](#known-gaps) because it contradicts `DES-08` and would become reachable if a `cursorPagination: true` endpoint were wired to it.

---

## Batch helpers

Batch helpers fan out over many keys or IDs. They are not pagination, but they are the other way the library issues many requests for one logical operation. Both are methods on `EsiClient` and standalone exports (`batchFetch`, `batchPost`).

### `batch`: bounded concurrent calls

```typescript
const result = await client.batch(
  typeIds,
  (id) => client.universe.getTypeById(id),
  {
    concurrency: 10,
    onProgress: (done, total) => console.log(`${done}/${total}`),
  },
);

console.log(`${result.results.size} ok, ${result.errors.size} failed`);
```

- Runs at most `concurrency` fetchers at once (default 20), starting the next as each settles.
- Never rejects. Successes land in `results: Map<K, T>`, failures in `errors: Map<K, Error>`; a non-`Error` rejection is wrapped in `Error`.
- `onProgress(completed, total)` fires after every settled call.
- Duplicate keys run twice and the later result overwrites the earlier one in the map.

### `batchPost`: chunked bulk POSTs

```typescript
const names = await client.batchPost(
  characterIds,
  (chunk) => client.universe.postNamesAndCategories(chunk),
  1000,
);
```

- Splits `ids` into chunks of `chunkSize` (default 1000) and posts them one after another.
- Concatenates chunk results in order.
- Rejects on the first failing chunk; results from earlier chunks are discarded.

---

## Defaults

| Value                        | Default    | Where it is set                                 | Override                    |
| ---------------------------- | ---------- | ----------------------------------------------- | --------------------------- |
| `fetchAll*` page concurrency | 8          | `fetchAllPages` in `AsyncPaginationIterator.ts` | `concurrency` argument      |
| `batch` concurrency          | 20         | `batchFetch` in `BatchRequestHandler.ts`        | `options.concurrency`       |
| `batchPost` chunk size       | 1000       | `batchPost` in `BatchRequestHandler.ts`         | `chunkSize` argument        |
| Eager page cap               | 1000 pages | `handleOffsetPagination`, `PaginationHandler`   | None                        |
| Eager early stop             | Empty page | `PaginationHandler` `stopOnEmptyPage`           | None from the public API    |
| Retries per page             | 3          | Client retry configuration                      | `retryConfig` on the client |

The per-page retry, backoff and circuit-breaker settings are the client's own; see [ARCHITECTURE.md](ARCHITECTURE.md). Pagination progress is logged at `info` with `page` and `totalPages` context; see [LOGGING.md](LOGGING.md). Error classes and their `.retryable` rules are in [ERRORS.md](ERRORS.md).

---

## Failure semantics

| Mode                  | A page fails after its retries with… | Caller sees                                                                |
| --------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| Eager                 | `EsiError` or `CircuitOpenError`     | That error, rethrown unchanged, then subject to the call-level retry       |
| Eager                 | Any other error, e.g. invalid JSON   | Plain `Error` whose message starts `[ESIJS_ERROR] [PAGINATION_INCOMPLETE]` |
| `stream*`             | Any error                            | Thrown from the `for await` at that page                                   |
| `fetchAll*`           | Any error                            | Promise rejects with that error                                            |
| `fetchAllCursorPages` | Any error                            | Promise rejects with that error                                            |
| `batch`               | Any error                            | Resolves; the key is in `errors`                                           |
| `batchPost`           | Any error                            | Promise rejects with that error                                            |

`PAGINATION_INCOMPLETE` is a plain `Error` with a bracketed prefix, not an `EsiError` subclass. That is the inconsistency tracked under `ARCH-07`.

---

## Known gaps

`DES-08` requires pagination helpers to propagate the caller's HTTP method into the retry context and to surface partial results as an error rather than truncate silently. The code meets neither in full. Each row below was confirmed against the source at the time of writing.

| #   | Gap                                                                                                                                                                                                                                                                               | Consumer impact                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `handleSinglePageRequest` passes `method: 'GET'` to the retry strategy whatever the endpoint's method.                                                                                                                                                                            | `streamEndpoint` or `fetchAllEndpoint` on a non-GET endpoint would retry a mutation. Every shipped wrapper targets a GET endpoint. |
| 2   | `CursorPaginationHandler.fetchAll` returns partial data after three consecutive failures.                                                                                                                                                                                         | None today: the class is internal and unused.                                                                                      |
| 3   | Eager pagination: when a later page exhausts its retries with a retryable status, the call-level retry re-runs page 1 with `If-None-Match`. A 304 is then answered from the cache, which at that moment holds page 1 alone, and the method returns page 1 as if it were complete. | Silent truncation under sustained 5xx or rate limiting, with default retry settings.                                               |
| 4   | `stream*` and `fetchAll*` send `If-None-Match` when the cache holds an ETag for the URL but cannot serve a 304.                                                                                                                                                                   | After an eager call to the same endpoint, a `stream*` or `fetchAll*` call can throw `EsiError` 304.                                |
| 5   | The eager 1000-page cap and the stop at an empty page end pagination with a log line, not an error.                                                                                                                                                                               | A dataset beyond page 1000 is truncated silently.                                                                                  |

Rows 1 and 2 are tracked as bead `esi-dwi` · [#269](https://github.com/lgriffin/ESI.ts/issues/269). The fix follows `TEST-01`: EARS rules under `tests/bdd/features/core` that fail first, then the change. See [TESTING.md](TESTING.md).
