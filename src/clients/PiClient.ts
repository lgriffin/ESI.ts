import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { piEndpoints } from '../core/endpoints/piEndpoints';
import { PlanetaryColony, CustomsOffice } from '../types/api-responses';

export class PiClient {
    private api: ReturnType<typeof createClient<typeof piEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, piEndpoints);
    }

    async getColonies(characterId: number): Promise<PlanetaryColony[]> {
        return this.api.getColonies(characterId);
    }

    async getColonyLayout(characterId: number, planetId: number): Promise<any> {
        return this.api.getColonyLayout(characterId, planetId);
    }

    async getCorporationCustomsOffices(corporationId: number): Promise<CustomsOffice[]> {
        return this.api.getCorporationCustomsOffices(corporationId);
    }

    async getSchematicInformation(schematicId: number): Promise<any> {
        return this.api.getSchematicInformation(schematicId);
    }
}
