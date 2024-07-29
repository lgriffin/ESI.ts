import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterMailLabelsApi {
    constructor(private client: ApiClient) {}

    async createMailLabel(characterId: number, body: object): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/labels/`, 'POST', JSON.stringify(body), true);
    }
}
