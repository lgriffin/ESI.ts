import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterMailApi {
    constructor(private client: ApiClient) {}

    async getMail(characterId: number, mailId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/${mailId}/`, 'GET', undefined, true);
    }
}
