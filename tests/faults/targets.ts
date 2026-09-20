/**
 * The representative endpoints the PR run applies the whole catalogue to.
 * Each covers one shape of exchange the pipeline treats differently:
 *
 * | target                               | shape                          |
 * | ------------------------------------ | ------------------------------ |
 * | status.getStatus                     | public GET, object body        |
 * | location.getCharacterLocation        | authenticated GET              |
 * | market.getMarketOrders               | offset-paginated GET (X-Pages) |
 * | freelanceJobs.getFreelanceJobs       | cursor-paginated GET           |
 * | universe.postNamesAndCategories      | POST                           |
 *
 * The nightly run covers every endpoint definition with fuzzed payloads.
 */
import { lookupSpecTtl } from '../../src/core/requestPipeline/cachePolicy';
import { SEAM_RETRY } from '../bdd/support/transport';
import { freelanceJobsEndpoints } from '../../src/core/endpoints/freelanceJobsEndpoints';
import { locationEndpoints } from '../../src/core/endpoints/locationEndpoints';
import { marketEndpoints } from '../../src/core/endpoints/marketEndpoints';
import { statusEndpoints } from '../../src/core/endpoints/statusEndpoints';
import { universeEndpoints } from '../../src/core/endpoints/universeEndpoints';
import type { Exchange, Target } from './types';

/** Short enough that a timeout fault settles quickly on the virtual clock. */
const TIMEOUT_MS = 250;

const json = (etag?: string, extra: Record<string, string> = {}) => ({
  'content-type': 'application/json; charset=UTF-8',
  ...(etag ? { etag } : {}),
  ...extra,
});

const common = {
  retries: SEAM_RETRY.maxRetries,
  timeoutMs: TIMEOUT_MS,
} as const;

/** Page 1 of an offset-paginated URL: no `page=` parameter. */
export const PAGE_ONE = /^[^?]*(\?(?!(.*&)?page=).*)?$/;

const CHARACTER_ID = 2112625428;
const REGION_ID = 10000002;

const statusBody = () => ({
  players: 23456,
  server_version: '2890123',
  start_time: '2026-09-16T11:02:00Z',
  vip: false,
});

const locationBody = () => ({
  solar_system_id: 30000142,
  station_id: 60003760,
});

const order = (orderId: number) => ({
  order_id: orderId,
  type_id: 34,
  location_id: 60003760,
  volume_total: 1000,
  volume_remain: 250,
  min_volume: 1,
  price: 5.12,
  is_buy_order: false,
  system_id: 30000142,
  duration: 90,
  issued: '2026-09-16T11:02:00Z',
  range: 'region',
});

const jobsBody = () => ({
  freelance_jobs: [
    {
      id: 'f1a2b3c4',
      name: 'Haul tritanium to Jita',
      state: 'Active',
      last_modified: '2026-09-16T11:02:00Z',
      progress: { current: 10, desired: 100 },
    },
  ],
  cursor: { before: 'cursor-before', after: 'cursor-after' },
});

const namesBody = () => [
  { id: 30000142, name: 'Jita', category: 'solar_system' },
  { id: 60003760, name: 'Jita IV - Moon 4', category: 'station' },
];

function single(body: unknown, etag: string | undefined): Exchange {
  return {
    responses: [{ status: 200, headers: json(etag), body }],
    result: body,
  };
}

export const TARGETS: readonly Target[] = [
  {
    ...common,
    name: 'status.getStatus',
    schema: statusEndpoints.getStatus.responseSchema,
    method: 'GET',
    requiresAuth: false,
    paginated: false,
    cursor: false,
    specTtlMs: lookupSpecTtl('GET', 'status'),
    etag: '"status-v1"',
    path: '/status',
    good: () => single(statusBody(), '"status-v1"'),
    call: (c) => c.status.withMetadata().getStatus(),
  },
  {
    ...common,
    name: 'location.getCharacterLocation',
    schema: locationEndpoints.getCharacterLocation.responseSchema,
    method: 'GET',
    requiresAuth: true,
    paginated: false,
    cursor: false,
    specTtlMs: lookupSpecTtl('GET', 'characters/{characterId}/location'),
    etag: '"location-v1"',
    path: `/characters/${CHARACTER_ID}/location`,
    good: () => single(locationBody(), '"location-v1"'),
    call: (c) => c.location.withMetadata().getCharacterLocation(CHARACTER_ID),
  },
  {
    ...common,
    name: 'market.getMarketOrders',
    schema: marketEndpoints.getMarketOrders.responseSchema,
    method: 'GET',
    requiresAuth: false,
    paginated: true,
    cursor: false,
    specTtlMs: lookupSpecTtl('GET', 'markets/{regionId}/orders/'),
    etag: '"orders-v1"',
    path: `/markets/${REGION_ID}/orders/`,
    good: () => {
      const page1 = [order(1), order(2)];
      const page2 = [order(3)];
      return {
        responses: [
          {
            status: 200,
            headers: json('"orders-v1"', { 'x-pages': '2' }),
            body: page1,
            match: PAGE_ONE,
          },
          {
            status: 200,
            headers: json('"orders-v1-p2"', { 'x-pages': '2' }),
            body: page2,
            match: 'page=2',
          },
        ],
        result: [...page1, ...page2],
      };
    },
    call: (c) => c.market.withMetadata().getMarketOrders(REGION_ID),
  },
  {
    ...common,
    name: 'freelanceJobs.getFreelanceJobs',
    schema: freelanceJobsEndpoints.getFreelanceJobs.responseSchema,
    method: 'GET',
    requiresAuth: false,
    paginated: false,
    cursor: true,
    specTtlMs: lookupSpecTtl('GET', 'freelance-jobs'),
    etag: '"jobs-v1"',
    path: '/freelance-jobs?after=cursor-start',
    good: () => single(jobsBody(), '"jobs-v1"'),
    call: (c) =>
      c.freelanceJobs
        .withMetadata()
        .getFreelanceJobs(undefined, 'cursor-start'),
  },
  {
    ...common,
    name: 'universe.postNamesAndCategories',
    schema: universeEndpoints.postNamesAndCategories.responseSchema,
    method: 'POST',
    requiresAuth: false,
    paginated: false,
    cursor: false,
    specTtlMs: undefined,
    etag: undefined,
    path: '/universe/names',
    good: () => single(namesBody(), undefined),
    call: (c) =>
      c.universe.withMetadata().postNamesAndCategories([30000142, 60003760]),
  },
];
