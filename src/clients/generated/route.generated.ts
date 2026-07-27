/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { routeEndpoints } from '../../core/endpoints/routeEndpoints';

export class GeneratedRouteClient extends BaseEsiClient<typeof routeEndpoints> {
  constructor(client: ApiClient) {
    super(client, routeEndpoints);
  }

  /**
   * POST getRoute
   */
  getRoute(...args: Parameters<(typeof this.api)['getRoute']>): Promise<unknown> {
    return this.api.getRoute(...args) as Promise<unknown>;
  }
}
