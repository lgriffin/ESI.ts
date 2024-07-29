import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterMailHeadersApi {
    constructor(private client: ApiClient) {}

    async getCharacterMailHeaders(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/`, 'GET', undefined, true);
    }
}
