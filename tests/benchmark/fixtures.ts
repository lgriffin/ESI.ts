/**
 * Payloads and headers the micro-benchmarks run against. Every builder is
 * deterministic (no clock, no randomness) so the base and candidate trees
 * measure byte-identical inputs.
 */

/** A character public profile: the small-object shape most endpoints return. */
export function characterInfo(characterId: number) {
  return {
    character_id: characterId,
    name: `Benchmark Pilot ${characterId}`,
    description: 'A character record sized like a typical ESI response',
    corporation_id: 1344654522,
    alliance_id: 99005338,
    bloodline_id: 4,
    race_id: 1,
    gender: 'male',
    birthday: '2003-05-06T00:00:00Z',
    security_status: 4.97,
    title: 'Benchmark Pilot',
  };
}

/**
 * One page of a region order book. ESI serves 1000 orders a page, and a Jita
 * book is ten or more of them, so this is the payload that decides whether
 * the library is usable for market tooling.
 */
export function marketOrders(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    order_id: 6_000_000_000 + i,
    type_id: 34 + (i % 50),
    location_id: 60003760 + (i % 10),
    volume_total: 1_000_000,
    volume_remain: 1000 + (i % 500),
    min_volume: 1,
    price: i % 2 === 0 ? 4 + (i % 100) / 100 : 5 + (i % 100) / 100,
    is_buy_order: i % 2 === 0,
    system_id: 30000142,
    duration: 90,
    issued: '2026-09-01T12:00:00Z',
    range: i % 3 === 0 ? 'region' : 'station',
  }));
}

/**
 * A planetary colony layout: three levels of nesting (pins, their extractor
 * heads and contents), the deepest object shape among the schemas.
 */
export function colonyLayout(pinCount: number) {
  return {
    links: Array.from({ length: pinCount - 1 }, (_, i) => ({
      source_pin_id: 1_000 + i,
      destination_pin_id: 1_001 + i,
      link_level: i % 5,
    })),
    pins: Array.from({ length: pinCount }, (_, i) => ({
      pin_id: 1_000 + i,
      type_id: 2_848,
      latitude: 1.2 + i / 100,
      longitude: 0.4 + i / 100,
      schematic_id: 121,
      extractor_details: {
        heads: Array.from({ length: 10 }, (_, h) => ({
          head_id: h,
          latitude: 1.2 + h / 1000,
          longitude: 0.4 + h / 1000,
        })),
        product_type_id: 2_267,
        cycle_time: 1_800,
        head_radius: 0.02,
        qty_per_cycle: 3_500,
      },
      factory_details: { schematic_id: 121 },
      contents: Array.from({ length: 4 }, (_, c) => ({
        type_id: 2_267 + c,
        amount: 1_000 * (c + 1),
      })),
      install_time: '2026-09-01T12:00:00Z',
      expiry_time: '2026-09-08T12:00:00Z',
      last_cycle_start: '2026-09-02T12:00:00Z',
    })),
    routes: Array.from({ length: pinCount - 1 }, (_, i) => ({
      route_id: 5_000 + i,
      source_pin_id: 1_000 + i,
      destination_pin_id: 1_001 + i,
      content_type_id: 2_267,
      quantity: 3_000,
      waypoints: [1_000 + i, 1_001 + i],
    })),
  };
}

/** The response headers ESI sends on a paginated, rate-limited GET. */
export const ESI_RESPONSE_HEADERS: Record<string, string> = {
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers':
    'Content-Type,Authorization,If-None-Match,X-User-Agent',
  'access-control-allow-methods': 'GET,HEAD,OPTIONS',
  'access-control-allow-origin': '*',
  'access-control-expose-headers':
    'Content-Type,Warning,ETag,X-Pages,X-ESI-Error-Limit-Remain,X-ESI-Error-Limit-Reset',
  'access-control-max-age': '600',
  'cache-control': 'public, max-age=300',
  'content-encoding': 'gzip',
  'content-type': 'application/json; charset=UTF-8',
  date: 'Wed, 16 Sep 2026 11:00:00 GMT',
  etag: '"9f7d0ea3c6b1f7c2a1d0e4b5f6a7c8d9e0f1a2b3"',
  expires: 'Wed, 16 Sep 2026 11:05:00 GMT',
  'last-modified': 'Wed, 16 Sep 2026 11:00:00 GMT',
  'strict-transport-security': 'max-age=31536000',
  vary: 'Accept-Encoding',
  'x-esi-error-limit-remain': '100',
  'x-esi-error-limit-reset': '42',
  'x-esi-request-id': '5c1e7b1a-4d2f-4f7e-9a3b-2c8d6e0f1a2b',
  'x-pages': '12',
  'x-ratelimit-group': 'market',
  'x-ratelimit-limit': '150/15m',
  'x-ratelimit-remaining': '148',
  'x-ratelimit-used': '2',
};
