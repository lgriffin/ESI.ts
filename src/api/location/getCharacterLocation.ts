import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterLocationApi {
    constructor(private client: ApiClient) {}

    async getCharacterLocation(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/location`, 'GET', undefined, true);
    }
}
