import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { statusEndpoints } from '../core/endpoints/statusEndpoints';
import { ServerStatus } from '../types/api-responses';

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
    return this.api.getStatus() as Promise<ServerStatus>;
  }
}
