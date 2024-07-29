import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PutCharacterMailApi {
    constructor(private client: ApiClient) {}

    async updateMailMetadata(characterId: number, mailId: number, body: object): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/${mailId}/`, 'PUT', JSON.stringify(body), true);
    }
}
