/**
 * What ESI's server status endpoint sends back in 0034-status.feature, and
 * where. Step files queue these; they do not build payloads or URLs
 * themselves.
 */
import { queueResponse } from './transport';

export const STATUS_PATH = /\/status\/?(\?.*)?$/;

export const SERVER_VERSION = '2115629';
export const START_TIME = '2024-01-15T11:05:00Z';

export const statusFixtures = {
  /** `GET /status`: the four fields the spec marks required. */
  status: (players: number, vip = false) => ({
    players,
    server_version: SERVER_VERSION,
    start_time: START_TIME,
    vip,
  }),
};

/** Queue one server status response reporting `players` and the VIP flag. */
export function queueStatus(players: number, vip = false): void {
  queueResponse({
    match: STATUS_PATH,
    body: statusFixtures.status(players, vip),
  });
}
