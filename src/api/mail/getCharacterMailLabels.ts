import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterMailLabelsApi {
    constructor(private client: ApiClient) {}

    async getMailLabels(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/labels/`, 'GET', undefined, true);
    }
}
