 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { allianceEndpoints } from '../../core/endpoints/allianceEndpoints';
import { AllianceIconSchema, AllianceInfoSchema } from '../../schemas/alliance';

export class GeneratedAllianceClient extends BaseEsiClient<typeof allianceEndpoints> {
  constructor(client: ApiClient) {
    super(client, allianceEndpoints);
  }

  /**
   * GET getAllianceById
   */
  getAllianceById(allianceId: number | string): Promise<z.infer<typeof AllianceInfoSchema>> {
    return this.api.getAllianceById(allianceId) as Promise<z.infer<typeof AllianceInfoSchema>>;
  }

  /**
   * GET getCorporations
   */
  getCorporations(allianceId: number | string): Promise<number[]> {
    return this.api.getCorporations(allianceId) as Promise<number[]>;
  }

  /**
   * GET getIcons
   */
  getIcons(allianceId: number | string): Promise<z.infer<typeof AllianceIconSchema>> {
    return this.api.getIcons(allianceId) as Promise<z.infer<typeof AllianceIconSchema>>;
  }

  /**
   * GET getAlliances
   */
  getAlliances(): Promise<number[]> {
    return this.api.getAlliances() as Promise<number[]>;
  }
}
