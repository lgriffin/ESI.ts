import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetPortraitApi {
    constructor(private client: ApiClient) {}

    async getPortrait(characterId: number): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/portrait/`, 'GET', undefined, false);
    }
}
