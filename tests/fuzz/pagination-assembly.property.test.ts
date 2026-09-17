/**
 * Pagination assembly: properties of the offset and cursor walks, driven
 * through real domain clients against a fake ESI at the fetch seam.
 *
 * Offset, eager (`getMarketOrders`, public; `getCharacterAssets`, authenticated)
 *   For any page count, any per-page transient failures within the retry
 *   budget (503 or a dropped connection), and any X-Pages value reported by
 *   pages after the first, the call resolves with pages 1..N in order, each
 *   exactly once, stopping before the first empty page after page 1
 *   (guides/PAGINATION.md: X-Pages is read from page 1; the walk stops at an
 *   empty page). Each page is requested once plus once per failure. A repeat
 *   call inside the spec TTL, and one after it that ESI answers with 304,
 *   return the same complete array.
 *
 * Offset, eager, a page that exhausts its retries
 *   The call rejects, or resolves with every page. It never resolves with a
 *   prefix of the dataset.
 *
 * Offset, `fetchAll*`
 *   For any page count, concurrency, per-page transient failures and any
 *   order in which responses arrive (fast-check scheduler), the result is
 *   pages 1..N in page order, each exactly once. No early stop on an empty
 *   page.
 *
 * Cursor, `fetchAllCursorPages`
 *   For any sequence of distinct opaque tokens ending in an empty page or a
 *   page without an `after` token, the walk requests each token once, in
 *   order, and returns every item once.
 */
import fetchMock from 'jest-fetch-mock';
import * as fc from 'fast-check';

import type { ApiClient } from '../../src/core/ApiClient';
import {
  FakeReply,
  FakeRequest,
  createFakeEsiApiClient,
  installFakeEsi,
  shutdownApiClient,
  useFakeClock,
} from './support/fakeEsi';
import { Pipeline, mutantPipeline, requirePipeline } from './support/pipeline';
import { describeProperty, invariant } from './support/property';

fetchMock.enableMocks();

// ── Resources the fake ESI serves ───────────────────────────────────────

const REGION_ID = 10000002;
const CHARACTER_ID = 90000001;

interface Resource {
  name: string;
  path: string;
  accessToken: string | undefined;
  specTtlMs: number;
  item: (id: number) => Record<string, unknown>;
  idOf: (item: unknown) => number;
  eager: (p: Pipeline, api: ApiClient) => Promise<unknown[]>;
}

const marketOrder = (id: number) => ({
  order_id: id,
  type_id: 34,
  location_id: 60003760,
  volume_total: 10,
  volume_remain: 5,
  min_volume: 1,
  price: 5.5,
  is_buy_order: false,
  system_id: 30000142,
  duration: 90,
  issued: '2026-09-01T00:00:00Z',
  range: 'region',
});

const RESOURCES: Resource[] = [
  {
    name: 'market orders (public)',
    path: `/markets/${REGION_ID}/orders/`,
    accessToken: undefined,
    specTtlMs: 300_000,
    item: marketOrder,
    idOf: (item) => (item as { order_id: number }).order_id,
    eager: (p, api) => new p.MarketClient(api).getMarketOrders(REGION_ID),
  },
  {
    name: 'character assets (authenticated)',
    path: `/characters/${CHARACTER_ID}/assets/`,
    accessToken: 'fuzz-token-character-a',
    specTtlMs: 3_600_000,
    item: (id) => ({
      item_id: id,
      type_id: 34,
      quantity: 1,
      location_id: 60003760,
      location_type: 'station',
      location_flag: 'Hangar',
      is_singleton: false,
    }),
    idOf: (item) => (item as { item_id: number }).item_id,
    eager: (p, api) => new p.AssetsClient(api).getCharacterAssets(CHARACTER_ID),
  },
];

// Counter-examples print a resource by name rather than as its closures.
for (const resource of RESOURCES) {
  Object.defineProperty(resource, fc.toStringMethod, {
    value: () => resource.name,
  });
}
const resourceArb = fc.constantFrom(...RESOURCES);

interface PageSpec {
  size: number;
  /** X-Pages this page reports; page 1 always reports the true count. */
  xPages: number | null;
  /** Failed attempts before this page is served. */
  failures: number;
  failure: 'status' | 'network';
}

function itemIds(pageIndex: number, size: number): number[] {
  return Array.from({ length: size }, (_, i) => (pageIndex + 1) * 1000 + i);
}

/** A fake ESI serving `pages` of `resource`, with scripted failures. */
function pagedServer(resource: Resource, pages: PageSpec[]) {
  const attempts = pages.map(() => 0);
  const unexpected: string[] = [];
  const reply = (request: FakeRequest): FakeReply => {
    const page = Number(request.url.searchParams.get('page') ?? '1');
    if (
      request.url.pathname !== resource.path ||
      !(page >= 1 && page <= pages.length)
    ) {
      unexpected.push(`${request.method} ${request.url.toString()}`);
      return { status: 404, body: { error: 'not found' } };
    }
    const spec = pages[page - 1]!;
    attempts[page - 1]++;
    if (attempts[page - 1]! <= spec.failures) {
      return spec.failure === 'network'
        ? { networkError: true }
        : { status: 503, body: { error: 'fake outage' } };
    }
    const etag = `"page-${page}"`;
    if (request.headers['if-none-match'] === etag) {
      return { status: 304, headers: { etag } };
    }
    return {
      status: 200,
      headers: {
        etag,
        'x-pages': String(
          page === 1 ? pages.length : (spec.xPages ?? pages.length),
        ),
      },
      body: itemIds(page - 1, spec.size).map(resource.item),
    };
  };
  return { reply, attempts, unexpected };
}

function assertSameIds(
  actual: unknown[],
  expected: number[],
  idOf: (item: unknown) => number,
  label: string,
): void {
  const ids = actual.map(idOf);
  const same =
    ids.length === expected.length && ids.every((id, i) => id === expected[i]);
  invariant(
    same,
    `${label}: got ${ids.length} items [${ids.join(', ')}], expected ${expected.length} items [${expected.join(', ')}]`,
  );
}

// ── Generators ──────────────────────────────────────────────────────────

const pageArb = (
  maxFailures: number,
  minSize: number,
): fc.Arbitrary<PageSpec> =>
  fc.record({
    size: fc.integer({ min: minSize, max: 3 }),
    xPages: fc.option(fc.integer({ min: 1, max: 200 }), { freq: 2 }),
    failures: fc.oneof(
      { arbitrary: fc.constant(0), weight: 2 },
      { arbitrary: fc.integer({ min: 0, max: maxFailures }), weight: 1 },
    ),
    failure: fc.constantFrom('status' as const, 'network' as const),
  });

/** Mostly short walks; sometimes a long one without failures. */
const pagesArb = (minSize: number): fc.Arbitrary<PageSpec[]> =>
  fc.oneof(
    {
      arbitrary: fc.array(pageArb(3, minSize), { minLength: 1, maxLength: 12 }),
      weight: 5,
    },
    {
      arbitrary: fc.array(pageArb(0, 1), { minLength: 40, maxLength: 120 }),
      weight: 1,
    },
  );

// ── Properties ──────────────────────────────────────────────────────────

function eagerProperty(p: Pipeline) {
  return fc.asyncProperty(
    resourceArb,
    fc.oneof(
      { arbitrary: pagesArb(1), weight: 3 },
      { arbitrary: pagesArb(0), weight: 1 },
    ),
    (resource, pages) => runEager(p, resource, pages),
  );
}

async function runEager(
  p: Pipeline,
  resource: Resource,
  pages: PageSpec[],
): Promise<void> {
  const server = pagedServer(resource, pages);
  installFakeEsi(server.reply);
  const { clock, restore } = useFakeClock();
  const api = createFakeEsiApiClient(p, resource.accessToken);
  try {
    const stop = pages.findIndex((page, i) => i >= 1 && page.size === 0);
    const walked = stop === -1 ? pages.length : stop + 1;
    const kept = stop === -1 ? pages : pages.slice(0, stop);
    const expected = kept.flatMap((page, i) => itemIds(i, page.size));

    const first = await resource.eager(p, api);
    assertSameIds(
      first,
      expected,
      resource.idOf,
      `${resource.name}, first call`,
    );
    pages.forEach((page, i) => {
      const want = i < walked ? page.failures + 1 : 0;
      invariant(
        server.attempts[i] === want,
        `${resource.name}: page ${i + 1} was requested ${server.attempts[i]} times, expected ${want}`,
      );
    });

    const repeat = await resource.eager(p, api);
    assertSameIds(
      repeat,
      expected,
      resource.idOf,
      `${resource.name}, repeat call inside the spec TTL`,
    );

    clock.now += resource.specTtlMs + 1000;
    const revalidated = await resource.eager(p, api);
    assertSameIds(
      revalidated,
      expected,
      resource.idOf,
      `${resource.name}, call after the TTL answered by 304`,
    );

    invariant(
      server.unexpected.length === 0,
      `unexpected requests: ${server.unexpected.join('; ')}`,
    );
  } finally {
    restore();
    shutdownApiClient(api);
  }
}

function exhaustedPageProperty(p: Pipeline) {
  return fc.asyncProperty(
    resourceArb,
    fc
      .integer({ min: 2, max: 6 })
      .chain((n) => fc.tuple(fc.constant(n), fc.integer({ min: 2, max: n }))),
    (resource, [n, victim]) => runExhausted(p, resource, n, victim),
  );
}

async function runExhausted(
  p: Pipeline,
  resource: Resource,
  n: number,
  victim: number,
): Promise<void> {
  const pages: PageSpec[] = Array.from({ length: n }, (_, i) => ({
    size: 2,
    xPages: null,
    // The retry budget is 3, so 4 failures exhaust the page's own retries.
    failures: i + 1 === victim ? 4 : 0,
    failure: 'status',
  }));
  const server = pagedServer(resource, pages);
  installFakeEsi(server.reply);
  const api = createFakeEsiApiClient(p, resource.accessToken);
  try {
    const expected = pages.flatMap((page, i) => itemIds(i, page.size));
    let result: unknown[] | undefined;
    try {
      result = await resource.eager(p, api);
    } catch (error) {
      invariant(
        typeof (error as { statusCode?: unknown }).statusCode === 'number',
        `${resource.name}: page ${victim} of ${n} exhausted its retries and the call rejected with a non-ESI error: ${String(error)}`,
      );
      return;
    }
    assertSameIds(
      result,
      expected,
      resource.idOf,
      `${resource.name}: page ${victim} of ${n} exhausted its retries and the call resolved`,
    );
  } finally {
    shutdownApiClient(api);
  }
}

function fetchAllProperty(p: Pipeline) {
  return fc.asyncProperty(
    fc.scheduler(),
    pagesArb(0),
    fc.integer({ min: 1, max: 8 }),
    async (s, pages, concurrency) => {
      const resource = RESOURCES[0]!;
      const server = pagedServer(resource, pages);
      installFakeEsi((request) => {
        const reply = server.reply(request);
        return s.schedule(
          Promise.resolve(reply),
          `${request.url.search || 'page 1'}`,
        );
      });
      const api = createFakeEsiApiClient(p, undefined);
      try {
        const expected = pages.flatMap((page, i) => itemIds(i, page.size));
        const result = await s.waitFor(
          new p.MarketClient(api).fetchAllMarketOrders(REGION_ID, concurrency),
        );
        assertSameIds(
          result,
          expected,
          resource.idOf,
          `fetchAllMarketOrders(concurrency ${concurrency})`,
        );
        pages.forEach((page, i) => {
          invariant(
            server.attempts[i] === page.failures + 1,
            `fetchAll: page ${i + 1} was requested ${server.attempts[i]} times, expected ${page.failures + 1}`,
          );
        });
      } finally {
        shutdownApiClient(api);
      }
    },
  );
}

interface CursorPageSpec {
  size: number;
  failures: number;
}

const tokenArb = fc.stringMatching(/^[A-Za-z0-9+/=_ %&-]{1,24}$/);

function cursorProperty(p: Pipeline) {
  return fc.asyncProperty(
    fc.array(
      fc.record({
        size: fc.integer({ min: 1, max: 3 }),
        failures: fc.integer({ min: 0, max: 3 }),
      }),
      {
        minLength: 0,
        maxLength: 8,
      },
    ),
    fc.constantFrom('empty page' as const, 'no after token' as const),
    fc.uniqueArray(tokenArb, { minLength: 9, maxLength: 9 }),
    async (pageSpecs: CursorPageSpec[], ending, tokens) => {
      // Page i is served for token i-1 (page 0 for no token). Page i carries
      // token i as its `after`, except where the walk ends.
      const pages =
        ending === 'empty page' || pageSpecs.length === 0
          ? [...pageSpecs, { size: 0, failures: 0 }]
          : pageSpecs;
      const attempts = pages.map(() => 0);
      const served: string[] = [];
      installFakeEsi((request) => {
        const after = request.url.searchParams.get('after');
        const index = after === null ? 0 : tokens.indexOf(after) + 1;
        if (
          request.url.pathname !== '/freelance-jobs' ||
          index < 0 ||
          (index === 0 && after !== null) ||
          index >= pages.length
        ) {
          served.push(`unexpected ${request.url.toString()}`);
          return { status: 404, body: { error: 'unknown cursor' } };
        }
        attempts[index]++;
        const spec = pages[index]!;
        if (attempts[index]! <= spec.failures)
          return { status: 503, body: { error: 'fake outage' } };
        served.push(after ?? '(start)');
        const last = index === pages.length - 1;
        return {
          status: 200,
          body: {
            freelance_jobs: itemIds(index, spec.size).map((id) => ({
              id: `job-${id}`,
              name: `Job ${id}`,
              state: 'active',
              last_modified: '2026-09-01T00:00:00Z',
              progress: { current: 0, desired: 1 },
            })),
            cursor: last
              ? { before: tokens[index] }
              : { before: `b${index}`, after: tokens[index] },
          },
        };
      });
      const api = createFakeEsiApiClient(p, undefined);
      try {
        const jobs = new p.FreelanceJobsClient(api);
        const items = await p.fetchAllCursorPages(
          (before, after) => jobs.getFreelanceJobs(before, after),
          (response) => response.freelance_jobs,
          (response) => response.cursor ?? {},
        );
        const expectedTokens = pages.map((_, i) =>
          i === 0 ? '(start)' : tokens[i - 1]!,
        );
        invariant(
          served.length === expectedTokens.length &&
            served.every((t, i) => t === expectedTokens[i]),
          `cursor walk requested [${served.join(' | ')}], expected [${expectedTokens.join(' | ')}]`,
        );
        const expectedIds = pages.flatMap((page, i) => itemIds(i, page.size));
        assertSameIds(
          items,
          expectedIds,
          (item) => Number((item as { id: string }).id.slice(4)),
          'fetchAllCursorPages',
        );
      } finally {
        shutdownApiClient(api);
      }
    },
  );
}

// ── Registration, with the known-bad pipelines each property must reject ──

const dropsLastPage = mutantPipeline(() => {
  jest.doMock('../../src/core/pagination/PaginationHandler', () => {
    const actual = jest.requireActual<
      typeof import('../../src/core/pagination/PaginationHandler')
    >('../../src/core/pagination/PaginationHandler');
    class DropsLastPage extends actual.PaginationHandler {
      static override fetchRemainingPages(
        ...args: Parameters<typeof actual.PaginationHandler.fetchRemainingPages>
      ) {
        args[5] = args[5] - 1;
        return actual.PaginationHandler.fetchRemainingPages(...args);
      }
    }
    return { ...actual, PaginationHandler: DropsLastPage };
  });
});

const truncatesOnPageFailure = mutantPipeline(() => {
  jest.doMock('../../src/core/pagination/PaginationHandler', () => {
    const actual = jest.requireActual<
      typeof import('../../src/core/pagination/PaginationHandler')
    >('../../src/core/pagination/PaginationHandler');
    class Truncates extends actual.PaginationHandler {
      static override async fetchRemainingPages(
        ...args: Parameters<typeof actual.PaginationHandler.fetchRemainingPages>
      ) {
        try {
          return await actual.PaginationHandler.fetchRemainingPages(...args);
        } catch {
          return args[4];
        }
      }
    }
    return { ...actual, PaginationHandler: Truncates };
  });
});

const fetchAllInArrivalOrder = mutantPipeline(() => {
  jest.doMock('../../src/core/pagination/AsyncPaginationIterator', () => {
    const actual = jest.requireActual<
      typeof import('../../src/core/pagination/AsyncPaginationIterator')
    >('../../src/core/pagination/AsyncPaginationIterator');
    const { handleSinglePageRequest } = jest.requireActual<
      typeof import('../../src/core/ApiRequestHandler')
    >('../../src/core/ApiRequestHandler');
    const toArray = (body: unknown): unknown[] =>
      Array.isArray(body) ? body : [];
    return {
      ...actual,
      fetchAllPages: async (
        client: ApiClient,
        endpoint: string,
        method: string,
        requiresAuth = false,
        body?: unknown,
        templatePath?: string,
      ) => {
        const first = await handleSinglePageRequest(
          client,
          endpoint,
          method,
          body,
          requiresAuth,
          templatePath,
        );
        const total = parseInt(first.headers['x-pages'] || '1', 10);
        const result = [...toArray(first.body)];
        await Promise.all(
          Array.from({ length: total - 1 }, (_, i) => i + 2).map(
            async (page) => {
              const r = await handleSinglePageRequest(
                client,
                `${endpoint}&page=${page}`,
                method,
                body,
                requiresAuth,
                templatePath,
              );
              result.push(...toArray(r.body));
            },
          ),
        );
        return result;
      },
    };
  });
});

const cursorSkipsLastPage = (): Pipeline => {
  const real = requirePipeline();
  return {
    ...real,
    fetchAllCursorPages: (async (fetcher, getItems, getCursor) => {
      const all: unknown[] = [];
      let after: string | undefined;
      for (;;) {
        const response = await fetcher(undefined, after);
        const cursor = getCursor(response);
        if (!cursor.after) break;
        all.push(...getItems(response));
        after = cursor.after;
      }
      return all;
    }) as typeof real.fetchAllCursorPages,
  };
};

const cursorRefetchesFirstPage = (): Pipeline => {
  const real = requirePipeline();
  return {
    ...real,
    fetchAllCursorPages: (async (fetcher, getItems, getCursor) => {
      const first = await fetcher(undefined, undefined);
      const rest = await real.fetchAllCursorPages(fetcher, getItems, getCursor);
      return getCursor(first).after ? [...getItems(first), ...rest] : rest;
    }) as typeof real.fetchAllCursorPages,
  };
};

describeProperty<Pipeline>({
  name: 'eager offset pagination returns every page once, in order',
  file: __filename,
  subject: requirePipeline,
  mutants: {
    'drops the last page': dropsLastPage,
  },
  property: eagerProperty,
  // Each run walks up to 120 pages three times through the full pipeline.
  prRuns: 60,
  vacuityRuns: 60,
  timeoutMs: 120_000,
});

describeProperty<Pipeline>({
  name: 'eager offset pagination never resolves with a prefix when a page exhausts its retries',
  file: __filename,
  subject: requirePipeline,
  mutants: {
    'returns the pages fetched so far when a page fails':
      truncatesOnPageFailure,
  },
  property: exhaustedPageProperty,
  timeoutMs: 120_000,
});

describeProperty<Pipeline>({
  name: 'fetchAll offset pagination returns pages in page order for any arrival order',
  file: __filename,
  subject: requirePipeline,
  mutants: {
    'assembles pages in arrival order': fetchAllInArrivalOrder,
    'drops the last page': mutantPipeline(() => {
      jest.doMock('../../src/core/pagination/AsyncPaginationIterator', () => {
        const actual = jest.requireActual<
          typeof import('../../src/core/pagination/AsyncPaginationIterator')
        >('../../src/core/pagination/AsyncPaginationIterator');
        return {
          ...actual,
          fetchAllPages: async (
            ...args: Parameters<typeof actual.fetchAllPages>
          ) => {
            const all = await actual.fetchAllPages(...args);
            return all.length > 0 ? all.slice(0, -1) : all;
          },
        };
      });
    }),
  },
  property: fetchAllProperty,
  prRuns: 60,
  vacuityRuns: 60,
  timeoutMs: 120_000,
});

describeProperty<Pipeline>({
  name: 'cursor pagination requests each token once and returns every item once',
  file: __filename,
  subject: requirePipeline,
  mutants: {
    'drops the page without an after token': cursorSkipsLastPage,
    'requests the first page twice': cursorRefetchesFirstPage,
  },
  property: cursorProperty,
  timeoutMs: 120_000,
});

// ── Shrunk counter-examples, kept as named examples (tests/fuzz/AGENTS.md) ──

describe('pagination counter-examples', () => {
  const page = (size: number): PageSpec => ({
    size,
    xPages: null,
    failures: 0,
    failure: 'status',
  });

  it('esi-l38.1: a repeat authenticated paginated call inside the TTL returns every page', async () => {
    // Shrunk from seed -82969071: the combined array was cached under the
    // unauthenticated key, so the token-scoped lookup found page 1 alone.
    await expect(
      runEager(requirePipeline(), RESOURCES[1]!, [page(0), page(1)]),
    ).resolves.toBeUndefined();
  });

  it('a page that exhausts its retries does not leave page 1 to be revalidated alone', async () => {
    // Shrunk from seed -1942222520: page 1 was cached before page 2 failed,
    // the retried call got a 304 for page 1 and resolved with page 1 only.
    await expect(
      runExhausted(requirePipeline(), RESOURCES[0]!, 2, 2),
    ).resolves.toBeUndefined();
  });
});
