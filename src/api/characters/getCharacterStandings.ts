import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterStandingsApi {
    constructor(private client: ApiClient) {}

    async getCharacterStandings(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/standings`, 'GET', undefined, true);
    }
}
