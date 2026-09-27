/**
 * What 0055-request-headers.feature queues and reads. Step files take the
 * status route and its payload from here rather than building them inline.
 */
export const STATUS_PATH = /\/status\/?(\?|$)/;

export const serverStatus = () => ({
  players: 23_456,
  server_version: '2987654',
  start_time: '2026-09-27T11:00:00Z',
  vip: false,
});

/** The header the request carried, by case-insensitive name. */
export function headerOf(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === wanted);
  return key === undefined ? undefined : headers[key];
}
