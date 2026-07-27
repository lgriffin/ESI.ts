 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { accessListEndpoints } from '../../core/endpoints/accessListEndpoints';
import { AccessListSchema } from '../../schemas/access-lists';

export class GeneratedAccessListClient extends BaseEsiClient<typeof accessListEndpoints> {
  constructor(client: ApiClient) {
    super(client, accessListEndpoints);
  }

  /**
   * GET getAccessList
   * @requires Authentication
   */
  getAccessList(accessListId: number | string): Promise<z.infer<typeof AccessListSchema>> {
    return this.api.getAccessList(accessListId) as Promise<z.infer<typeof AccessListSchema>>;
  }
}
