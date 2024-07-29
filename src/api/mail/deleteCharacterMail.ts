import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DeleteCharacterMailApi {
    constructor(private client: ApiClient) {}

    async deleteMail(characterId: number, mailId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/${mailId}/`, 'DELETE', undefined, true);
    }
}
