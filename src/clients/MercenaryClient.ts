import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { mercenaryEndpoints } from '../core/endpoints/mercenaryEndpoints';
import {
  MercenaryDen,
  MercenaryTacticalOperation,
} from '../types/api-responses';

export class MercenaryClient extends BaseEsiClient<typeof mercenaryEndpoints> {
  constructor(client: ApiClient) {
    super(client, mercenaryEndpoints);
  }

  /**
   * Retrieves all mercenary dens with their development and anarchy parameters.
   *
   * @returns A list of mercenary dens
   */
  getMercenaryDens(): Promise<MercenaryDen[]> {
    return this.api.getMercenaryDens() as Promise<MercenaryDen[]>;
  }

  /**
   * Retrieves all mercenary tactical operations (MTOs) spawned from mercenary dens.
   *
   * @returns A list of mercenary tactical operations
   */
  getMercenaryTacticalOperations(): Promise<MercenaryTacticalOperation[]> {
    return this.api.getMercenaryTacticalOperations() as Promise<
      MercenaryTacticalOperation[]
    >;
  }
}
