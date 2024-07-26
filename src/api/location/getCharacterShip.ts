import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterShipApi {
    constructor(private client: ApiClient) {}

    async getCharacterShip(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/ship`);
    }
}
