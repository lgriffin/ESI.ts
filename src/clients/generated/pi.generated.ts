 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { piEndpoints } from '../../core/endpoints/piEndpoints';
import { ColonyLayoutSchema, CustomsOfficeSchema, PlanetaryColonySchema } from '../../schemas/pi';
import { SchematicInfoSchema } from '../../schemas/universe';

export class GeneratedPiClient extends BaseEsiClient<typeof piEndpoints> {
  constructor(client: ApiClient) {
    super(client, piEndpoints);
  }

  /**
   * GET getColonies
   * @requires Authentication
   */
  getColonies(characterId: number | string): Promise<(z.infer<typeof PlanetaryColonySchema>)[]> {
    return this.api.getColonies(characterId) as Promise<(z.infer<typeof PlanetaryColonySchema>)[]>;
  }

  /**
   * GET getColonyLayout
   * @requires Authentication
   */
  getColonyLayout(characterId: number | string, planetId: number | string): Promise<z.infer<typeof ColonyLayoutSchema>> {
    return this.api.getColonyLayout(characterId, planetId) as Promise<z.infer<typeof ColonyLayoutSchema>>;
  }

  /**
   * GET getCorporationCustomsOffices
   * @requires Authentication
   */
  getCorporationCustomsOffices(corporationId: number | string): Promise<(z.infer<typeof CustomsOfficeSchema>)[]> {
    return this.api.getCorporationCustomsOffices(corporationId) as Promise<(z.infer<typeof CustomsOfficeSchema>)[]>;
  }

  /**
   * GET getSchematicInformation
   */
  getSchematicInformation(schematicId: number | string): Promise<z.infer<typeof SchematicInfoSchema>> {
    return this.api.getSchematicInformation(schematicId) as Promise<z.infer<typeof SchematicInfoSchema>>;
  }
}
