import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { statusEndpoints } from '../core/endpoints/statusEndpoints';
import { ServerStatus } from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class StatusClient extends BaseEsiClient<typeof statusEndpoints> {
  constructor(client: ApiClient) {
    super(client, statusEndpoints);
  }

  /**
   * Retrieves the current Tranquility server status, including player count and server version.
   *
   * @returns The current server status information
   */
  getStatus(): Promise<ServerStatus> {
    return this.api.getStatus();
  }
}
