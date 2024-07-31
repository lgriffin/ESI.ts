import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCharacterContactLabels {
    constructor(private client: ApiClient) {}

    async getLabels(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contacts/labels`, 'GET', undefined, true);
    }
}
