# Pagination

**Implements:** `DES-08` (Partial), `DOC-01` — requirement text and status in [CHARTER.md](CHARTER.md).

How ESI.ts turns a multi-page ESI resource into data: the eager default, the `stream*` and `fetchAll*` helpers, cursor-paginated routes, the batch helpers, and what each one does when a page fails. Where the code falls short of `DES-08`, this guide says so rather than describing the intent.

---

## Choosing a mode

| You want                               | Use                                       | Requests                        | Memory           | If a page fails                          |
| -------------------------------------- | ----------------------------------------- | ------------------------------- | ---------------- | ---------------------------------------- |
| The whole dataset, simplest call       | The domain method, e.g. `getMarketOrders` | Sequential                      | Whole dataset    | Throws                                   |
| Process page by page, or stop early    | `stream*`, e.g. `streamMarketOrders`      | Sequential, on demand           | One page         | Throws from the loop at that page        |
| The whole dataset, faster              | `fetchAll*`, e.g. `fetchAllMarketOrders`  | Parallel waves, default 8       | Whole dataset    | Rejects; no partial result               |
| A cursor-paginated route               | The domain method plus `after` token      | One per call                    | One page         | Throws                                   |
| Every page of a cursor route           | `fetchAllCursorPages`                     | Sequential                      | Whole dataset    | Rejects; no partial result               |
| Many IDs against a non-paginated route | `client.batch`                            | Parallel, default 20            | Whole result map | Never rejects; failures collected by key |
| A bulk POST larger than ESI accepts    | `client.batchPost`                        | Sequential chunks, default 1000 | Whole result     | Rejects on the first failing chunk       |

A walk can also be incomplete without any page failing: page 1 reports more than 1000 pages, or a page after the first comes back empty because the collection shrank. What happens then is the client's `incompletePages` option. Left at its default, `'truncate'`, the walk returns what it has and logs a warning naming the option, as every 12.x release has. Set to `'throw'`, it throws `EsiPaginationError` carrying the reason and the items fetched so far. The default becomes `'throw'` in a future major release; see [Incomplete walks](#incomplete-walks).

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
import { EsiClient, createConsoleLogger } from '@lgriffin/esi.ts';

const log = createConsoleLogger('info');

const client = new EsiClient({ clientId: 'my-app' });

const orders = await client.market.getMarketOrders(10000002);

const { data, meta } = await client.market
  .withMetadata()
  .getMarketOrders(10000002);
log.info(`${data.length} orders across ${meta.pages ?? 1} pages`);
```

What happens:

1. **Page 1 takes the full request path** described in [ARCHITECTURE.md](ARCHITECTURE.md): spec-aware cache check, deduplication, retry, conditional request with `If-None-Match`, status handling. A single-page response is cached here; page 1 of a multi-page response is not cached on its own.
2. **If `x-pages` is greater than 1**, pages 2 to N are fetched one after another. Each page goes through the retry strategy (with the real HTTP method), request interceptors, circuit breaker, rate limiter and timeout. Pages 2 to N are not deduplicated and are sent without `If-None-Match`.
3. **An incomplete walk follows `incompletePages`.** By default the walk stops at the first empty page and never goes past page 1000, logging a warning that names the option. With `incompletePages: 'throw'` a count above 1000 is refused after page 1 and an empty page rejects; both throw `EsiPaginationError` (`page-cap`, `empty-page`) carrying the items fetched so far. See [Incomplete walks](#incomplete-walks).
4. **The concatenated array is cached** under the page-1 URL (scoped to the access token on an authenticated endpoint) with page 1's ETag, validated once against the endpoint's `responseSchema`, and passed through response interceptors. If a page exhausts its retries, nothing is cached, so the retried call fetches page 1 again rather than revalidating it alone.
5. **Metadata comes from page 1.** `meta.pages` is the `x-pages` value; `meta.etag` is page 1's ETag.
6. **Page 1's `x-pages` is authoritative.** The `x-pages` header on pages 2 to N is not read, so a count that grows mid-walk is not followed; a count that shrinks shows up as an empty page, which ends the walk (or, with `incompletePages: 'throw'`, rejects with `EsiPaginationError`, `empty-page`), or as a page that no longer exists, which rejects with that page's `EsiError`. The fault catalogue pins each (`x-pages-grows-between-pages`, `x-pages-shrinks-to-empty-page`, `x-pages-shrinks-to-empty-page-refused`, `empty-page-mid-run`, `x-pages-shrinks-to-missing-page`; see [TESTING.md](TESTING.md#fault-injection)). The BDD specification states it, and the page-1000 cap, as exclusion Rules in `0052-response-headers.feature`.

A later call that is inside the spec TTL, or that gets a 304 on page 1, is answered from the cached array without fetching pages 2 to N.

---

## Offset: `stream*`

`stream*` methods return an `AsyncGenerator<PageResult<T>>`. Each `PageResult` is `{ data: T[]; page: number; totalPages: number }`. The next page is not requested until the loop asks for it, so `break` stops all further requests.

```typescript
for await (const page of client.market.streamMarketOrders(10000002)) {
  for (const order of page.data) {
    if (order.is_buy_order && order.price > 1_000_000) {
      log.info(`${order.type_id} @ ${order.price}`);
    }
  }
  if (page.page >= 3) break;
}
```

Semantics:

- `totalPages` is read once, from page 1, and capped at 1000, the limit every pagination path applies to the count ESI reports ([security model](SECURITY-MODEL.md) P8). By default a larger count is walked to page 1000 and logs a warning; with `incompletePages: 'throw'` it throws `EsiPaginationError` (`page-cap`) before page 1 is yielded, and its `partial` holds page 1.
- Pages are fetched sequentially and validated individually against the endpoint's `responseSchema` when `validateResponse` is on.
- Iteration ends after `totalPages`, so never past page 1000, or earlier at the first empty page, with a warning. With `incompletePages: 'throw'` that empty page throws `EsiPaginationError` (`empty-page`) from the loop instead. You already hold the pages before it, so `partial` is empty and `itemCount` counts the items yielded.
- A failed page throws from the `for await` at that page. Pages already yielded have been delivered; nothing is rolled back.

Try it: `npm run example:streaming`.

## Offset: `fetchAll*`

`fetchAll*` methods return `Promise<T[]>` like the eager call, but fetch pages 2 to N in parallel waves. The last parameter is an optional `concurrency`, default 8.

```typescript
const assets = await client.assets.fetchAllCharacterAssets(characterId, 4);
const types = await client.market.fetchAllMarketTypes(10000002);
```

Semantics:

- Page 1 is fetched first to learn `x-pages`, capped at 1000 as for `stream*`; with `incompletePages: 'throw'` a larger count rejects with `EsiPaginationError` (`page-cap`) with no further request. The remaining pages are split into waves of `concurrency` and each wave runs with `Promise.all`; the next wave starts when the slowest page of the current one settles.
- Result order matches page order.
- Each page is validated individually when `validateResponse` is on.
- By default there is no early stop on an empty page: the walk goes on and the empty page contributes nothing, with a warning. With `incompletePages: 'throw'` it rejects with `EsiPaginationError` (`empty-page`) once its wave settles; `partial` holds the pages before the first empty one, in page order, even when later pages of the same wave carried items.
- If any page fails after its retries, the whole call rejects with that page's error. Pages already fetched are discarded.

Concurrency does not bypass rate limiting. Every page still passes the rate limiter, and a 420 or 429 blocks the whole group, so in-flight pages wait together. Pick `concurrency` against the endpoint's rate-limit group rather than raising it for speed. The limiter is described in [ARCHITECTURE.md](ARCHITECTURE.md).

## Naming and the escape hatches

Every client with paginated endpoints pairs its eager method with `stream*` and `fetchAll*` wrappers. The wrapper name is usually the eager name with `get` replaced (`getCharacterWalletJournal` → `streamCharacterWalletJournal`, `fetchAllCharacterWalletJournal`). Some wrappers drop the domain prefix inside their own client (`AllianceClient.fetchAllCorporations`). The API report at `etc/esi.ts.api.md` is the authoritative list.

For an endpoint without a wrapper, `BaseEsiClient` exposes both primitives. They take the endpoint's key in the definition map and the same arguments the eager method passes to it:

```typescript
import type { MarketOrder } from '@lgriffin/esi.ts';
import { createConsoleLogger } from '@lgriffin/esi.ts';

const log = createConsoleLogger('info');

for await (const page of client.market.streamEndpoint<number>(
  'getMarketTypes',
  10000002,
)) {
  log.info(`Page ${page.page}: ${page.data.length} type ids`);
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
| `If-None-Match` sent                      | Page 1              | Never                                  |
| 304 served from cache                     | Yes                 | Not applicable: no conditional request |
| Cache write                               | Combined array      | Never                                  |
| Stale cache served on 5xx                 | Yes                 | No                                     |
| Remediation text on 401 / 403             | Yes                 | No                                     |
| Request interceptors                      | Every page          | Every page                             |
| Response interceptors                     | Once, on the result | No                                     |
| Retry, 401 token refresh, circuit breaker | Every page          | Every page                             |
| HTTP method in the retry context          | Real method         | Real method                            |
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

`src/core/pagination/CursorPaginationHandler.ts` contains a header-token `fetchAll` that follows `after` tokens until a page comes back empty or without an `after` token, either of which completes the walk. After three consecutive page failures it rejects with the last page's error (an `EsiError` or `CircuitOpenError` as thrown, anything else as `EsiPaginationError` with reason `fetch-failed`), which carries the items fetched so far on `partial`. When it reaches its page limit (`maxPages`, default 1000) with an `after` token still set it returns the items it has with a warning, or, with `incompletePages: 'throw'`, rejects with `EsiPaginationError` (`cursor-cap`). It is not exported from the package and no client method calls it, so no consumer reaches it today. Only its `CursorTokens` type is public.

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
    onProgress: (done, total) => log.info(`${done}/${total}`),
  },
);

log.info(`${result.results.size} ok, ${result.errors.size} failed`);
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
| Page limit                   | 1000 pages | `MAX_PAGES` in `pageLimit.ts`, every path       | None                        |
| Incomplete walk              | `truncate` | `incompleteWalk.ts`, every collecting path      | `incompletePages` option    |
| Retries per page             | 3          | Client retry configuration                      | `retryConfig` on the client |

The per-page retry, backoff and circuit-breaker settings are the client's own; see [ARCHITECTURE.md](ARCHITECTURE.md). Pagination progress is logged at `info` with `page` and `totalPages` context; see [LOGGING.md](LOGGING.md). Error classes and their `.retryable` rules are in [ERRORS.md](ERRORS.md).

---

## Failure semantics

| Mode                  | A page fails after its retries with… | Caller sees                                                                 |
| --------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| Eager                 | Any `EsiError`, e.g. invalid JSON    | That error, rethrown unchanged, then subject to the call-level retry        |
| Eager                 | Any other error                      | `EsiPaginationError` (`PAGINATION_INCOMPLETE`), the page's error on `cause` |
| `stream*`             | Any error                            | Thrown from the `for await` at that page                                    |
| `fetchAll*`           | Any error                            | Promise rejects with that error                                             |
| `fetchAllCursorPages` | Any error                            | Promise rejects with that error                                             |
| `batch`               | Any error                            | Resolves; the key is in `errors`                                            |
| `batchPost`           | Any error                            | Promise rejects with that error                                             |

`EsiPaginationError` extends `EsiError` and is not retryable. Since invalid JSON is an `EsiParseError`, a page failure only becomes an `EsiPaginationError` (reason `fetch-failed`) when something outside the pipeline's own errors threw, such as a response interceptor.

### Incomplete walks

A walk that succeeds holds every page. Reaching the page count page 1 reported, at most 1000, is the only evidence of that. When a collecting path cannot reach it, the client's `incompletePages` option decides what happens:

- **`'truncate'`, the default in 12.x.** The walk returns the pages it has, exactly as earlier releases did, and logs one `warn` line that names the option, with `reason`, `endpoint`, `reportedPages`, `fetchedPages` and `itemCount` as context ([LOGGING.md](LOGGING.md)).
- **`'throw'`, opt-in.** The walk throws `EsiPaginationError`. The `reason` says why and `partial` holds the items fetched so far; the fields are listed in [ERRORS.md](ERRORS.md#incomplete-pagination).

**The default becomes `'throw'` in a future major release.** Opt in now so that release changes nothing for you, on either construction surface:

```typescript
import { createEsi } from '@lgriffin/esi.ts/client';
import { EsiClient } from '@lgriffin/esi.ts';

const esi = createEsi({
  userAgent: 'my-app/1.0 (me@example.com)',
  incompletePages: 'throw',
});

// The legacy surface takes the same option on EsiClientConfig.
const legacy = new EsiClient({ clientId: 'my-app', incompletePages: 'throw' });
```

`esi` and `legacy` are ready to use; every view `esi.as(identity)` hands out shares the runtime's setting.

| `reason`       | When                                                                        | Paths                              | Default (`truncate`)                                       | Requests made under `throw`                      |
| -------------- | --------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `page-cap`     | Page 1 reports more than 1000 pages                                         | Eager, `stream*`, `fetchAll*`      | Walks pages 1 to 1000, warns                               | Page 1 only                                      |
| `empty-page`   | A page after the first, up to and including the last reported, has no items | Eager, `stream*`, `fetchAll*`      | Eager and `stream*` stop there; `fetchAll*` goes on; warns | Up to the empty page (its wave, for `fetchAll*`) |
| `cursor-cap`   | The cursor handler reaches `maxPages` with an `after` token still set       | `CursorPaginationHandler.fetchAll` | Returns the pages fetched, warns                           | `maxPages - 1` after the first page              |
| `fetch-failed` | A page fails with an error that is not itself an `EsiError`                 | Eager, `CursorPaginationHandler`   | Throws, in both modes                                      | Up to the failing page                           |

Three decisions follow from how ESI pages:

- **Exactly the reported count is complete.** `X-Pages: 1000` walks 1000 pages and resolves in either mode. Under `throw`, a count above it is refused after page 1 rather than walked to page 1000: no ESI resource comes near the limit, so such a count is a misreport, and 999 more requests would spend the error budget only to end in an error.
- **An empty last page is incomplete too**, under `throw`. ESI derives `X-Pages` from the item count, so in one snapshot every reported page holds at least one item. An empty page means the collection shrank during the walk, and the items after the removed ones moved onto pages already read, so some were skipped. That holds for the last page as much as for a middle one, and matches what ESI does for a page that no longer exists: a 404, which already rejects. A single page with no items (`X-Pages: 1`, or no header) is an empty collection and resolves with `[]`.
- **On a cursor route, an empty page is complete.** ESI marks the end of a cursor dataset with an empty page, so it ends the walk successfully even when that page still carries an `after` token. Only the page limit, reached with a token in hand, is incomplete.

Under `throw`, recovering is the caller's choice. `empty-page` means the collection moved, so the same call a moment later usually succeeds; `partial` is usable when a possibly incomplete list is acceptable:

```typescript
import { EsiClient, isPaginationError } from '@lgriffin/esi.ts';
import type { MarketOrder } from '@lgriffin/esi.ts';

const esi = new EsiClient({ clientId: 'my-app', incompletePages: 'throw' });

async function ordersOrWhatArrived(regionId: number): Promise<MarketOrder[]> {
  try {
    return await esi.market.getMarketOrders(regionId);
  } catch (err) {
    if (isPaginationError(err) && err.reason === 'empty-page') {
      // The collection moved mid-walk: try once more, then settle for what
      // arrived, knowing it may miss items.
      const partial = err.partial as MarketOrder[];
      return esi.market.getMarketOrders(regionId).catch(() => partial);
    }
    throw err;
  }
}
```

---

## Known gaps

`DES-08` requires pagination helpers to propagate the caller's HTTP method into the retry context and to surface partial results as an error rather than truncate silently. The row below is where the default still falls short. It was confirmed against the source at the time of writing.

| #   | Gap                                                                                                                                                  | Consumer impact                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Under the default `incompletePages: 'truncate'`, the 1000-page cap, an empty page and the cursor page limit end a walk with a warning, not an error. | A truncated dataset looks complete unless the caller reads the log. Set `incompletePages: 'throw'`; the default flips in a future major. |

The two gaps [#269](https://github.com/lgriffin/ESI.ts/issues/269) tracked are closed: `stream*` and `fetchAll*` pass the endpoint's method to the retry strategy, so a mutation is not retried unless `retryMutations` is set, and the cursor `fetchAll` rejects after three failed pages instead of truncating. With `incompletePages: 'throw'`, the 1000-page cap, an empty page and the cursor page limit each throw `EsiPaginationError` ([Incomplete walks](#incomplete-walks)). All are rules tagged `@DES-08` in `tests/bdd/features/core/0051-resilience.feature`.
