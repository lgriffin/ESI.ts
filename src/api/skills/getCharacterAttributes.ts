import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterAttributesApi {
    constructor(private client: ApiClient) {}

    async getCharacterAttributes(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/attributes`);
    }
}
