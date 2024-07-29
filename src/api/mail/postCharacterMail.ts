import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterMailApi {
    constructor(private client: ApiClient) {}

    async sendMail(characterId: number, body: object): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/`, 'POST', JSON.stringify(body), true);
    }
}
