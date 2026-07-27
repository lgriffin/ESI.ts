/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { metaEndpoints } from '../../core/endpoints/metaEndpoints';

export class GeneratedMetaClient extends BaseEsiClient<typeof metaEndpoints> {
  constructor(client: ApiClient) {
    super(client, metaEndpoints);
  }

  /**
   * GET getOpenApiJson
   */
  getOpenApiJson(): Promise<unknown> {
    return this.api.getOpenApiJson() as Promise<unknown>;
  }
}
