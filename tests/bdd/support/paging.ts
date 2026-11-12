/**
 * Page walks for 0073-page-walks.feature: the market orders of The Forge
 * served as numbered pages at the seam, collected through the three entry
 * points a domain client has, and the corporation projects walked by the
 * cursor pagination handler.
 */
import type { EsiClient } from '../../../src/EsiClient';
import { ApiClient } from '../../../src/core/ApiClient';
import { configureApiClient } from '../../../src/core/configureApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  CursorPaginationHandler,
  type CursorPageFetcher,
} from '../../../src/core/pagination/CursorPaginationHandler';
import type { IncompletePagesMode } from '../../../src/core/pagination/pageLimit';
import { recordingLogger, type RecordingLogger } from './logging';
import { incompletePagesWarningsIn } from './paging-helpers';
import { createSeamClient, queueResponse } from './transport';
import type { World } from './world';

export const PAGED_REGION_ID = 10000002;
const ORDERS_PAGE_ONE = /orders\/\?order_type=all$/;
export const ORDERS_PATH = `markets/${PAGED_REGION_ID}/orders/?order_type=all`;

/** Order `index` of page `page`: unique ids, ascending in page order. */
export const pagedOrder = (page: number, index: number) => ({
  order_id: 7000000000 + page * 100 + index,
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

/** A client over the seam in the given incompletePages mode, logging to a recorder. */
export function pagingClient(world: World, mode: IncompletePagesMode): void {
  const logger = recordingLogger();
  world.client = createSeamClient({ incompletePages: mode, logger });
  world.values.pagingLogger = logger;
}

export function pagingLogger(world: World): RecordingLogger {
  return world.values.pagingLogger as RecordingLogger;
}

/**
 * The market orders as `sizes.length` pages, page n holding `sizes[n - 1]`
 * orders, each page matched by its own `page=` value. Page 1 reports
 * `reported` pages, as written (default: every page queued).
 */
export function queueOrderPages(
  world: World,
  sizes: number[],
  reported: string = String(sizes.length),
): void {
  world.values.pageSizes = sizes;
  sizes.forEach((size, i) => {
    const page = i + 1;
    queueResponse({
      match: page === 1 ? ORDERS_PAGE_ONE : new RegExp(`[?&]page=${page}$`),
      headers: { 'x-pages': reported },
      body: Array.from({ length: size }, (_, j) => pagedOrder(page, j)),
    });
  });
}

/** The orders of pages `from` to `to` of the queued walk, in page order. */
export function ordersOfPages(world: World, from: number, to: number) {
  const sizes = world.values.pageSizes as number[];
  const orders: unknown[] = [];
  for (let page = from; page <= to; page++) {
    for (let j = 0; j < sizes[page - 1]!; j++) orders.push(pagedOrder(page, j));
  }
  return orders;
}

/** Every market order of The Forge, through one collecting entry point. */
export async function walkMarketOrders(
  client: EsiClient,
  entryPoint: string,
): Promise<unknown[]> {
  switch (entryPoint) {
    case 'eager':
      return client.market.getMarketOrders(PAGED_REGION_ID);
    case 'fetch-all':
      return client.market.fetchAllMarketOrders(PAGED_REGION_ID);
    case 'stream': {
      const orders: unknown[] = [];
      for await (const page of client.market.streamMarketOrders(
        PAGED_REGION_ID,
      )) {
        orders.push(...page.data);
      }
      return orders;
    }
    default:
      throw new Error(`No entry point named ${entryPoint}`);
  }
}

/** The warnings the paging logger received that name incompletePages. */
export function incompletePagesWarnings(world: World) {
  return incompletePagesWarningsIn(pagingLogger(world));
}

// ── The cursor walk

export const PROJECTS_PATH = 'corporations/98000001/projects';

/** An ApiClient for the cursor handler: no retries, rate limiter in test mode. */
export function cursorClient(mode?: IncompletePagesMode): ApiClient {
  const api = new ApiClient(
    'bdd-page-walks',
    'https://esi.evetech.net',
    'bdd-access-token',
  );
  configureApiClient(api, {
    retryConfig: { maxRetries: 0 },
    logLevel: 'error',
    incompletePages: mode,
  });
  const limiter = new RateLimiter({ minDelayMs: 0 });
  limiter.setTestMode(true);
  api.setRateLimiter(limiter);
  return api;
}

export const firstProject = { id: 'project-1-0' };

/** Walks the corporation projects on from a first page of one project. */
export function walkProjects(
  api: ApiClient,
  after: string,
  pageFetch?: CursorPageFetcher,
): Promise<unknown[]> {
  return CursorPaginationHandler.fetchAll(
    api,
    PROJECTS_PATH,
    'GET',
    true,
    [firstProject],
    { before: null, after },
    undefined,
    { maxPages: 3 },
    pageFetch,
  );
}
