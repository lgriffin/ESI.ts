/**
 * Response bodies that pass the generated schemas (src/adapters/
 * responseSchemas.generated.ts), for tests of the generated operations that
 * are not about validation, so they hold whether or not a runtime sets
 * `validateResponse: true`.
 */

export const STATUS = {
  players: 1,
  server_version: '1',
  start_time: '2026-10-16T11:00:00Z',
  vip: false,
} as const;

export const marketOrder = (order_id: number) => ({
  duration: 90,
  is_buy_order: false,
  issued: '2026-10-16T11:00:00Z',
  location_id: 60003760,
  min_volume: 1,
  order_id,
  price: 5.5,
  range: 'region',
  system_id: 30000142,
  type_id: 34,
  volume_remain: 10,
  volume_total: 10,
});

export const asset = (item_id: number) => ({
  is_singleton: false,
  item_id,
  location_flag: 'Hangar',
  location_id: 60003760,
  location_type: 'station',
  quantity: 1,
  type_id: 34,
});

export const killmail = (killmail_id: number) => ({
  attackers: [
    {
      damage_done: 100,
      final_blow: true,
      security_status: 0.5,
      ship_type_id: 587,
    },
  ],
  killmail_id,
  killmail_time: '2026-10-16T11:00:00Z',
  solar_system_id: 30000142,
  victim: { damage_taken: 100, ship_type_id: 670 },
});

/** A copy of `body` without `key`: a body that breaks its generated schema. */
export function without<T extends object, K extends keyof T>(
  body: T,
  key: K,
): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(body).filter(([name]) => name !== key),
  ) as Omit<T, K>;
}
