import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterFittingsApi {
    constructor(private client: ApiClient) {}

    async getFittings(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/fittings`);
    }
}
