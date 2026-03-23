import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { locationEndpoints } from '../core/endpoints/locationEndpoints';
import { CharacterLocation, CharacterOnline, CharacterShip } from '../types/api-responses';

export class LocationClient {
    private api: ReturnType<typeof createClient<typeof locationEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, locationEndpoints);
    }

    async getCharacterLocation(characterId: number): Promise<CharacterLocation> {
        return this.api.getCharacterLocation(characterId);
    }

    async getCharacterOnline(characterId: number): Promise<CharacterOnline> {
        return this.api.getCharacterOnline(characterId);
    }

    async getCharacterShip(characterId: number): Promise<CharacterShip> {
        return this.api.getCharacterShip(characterId);
    }
}
