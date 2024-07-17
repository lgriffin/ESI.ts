import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterPublicInfoApi {
    constructor(private client: ApiClient) {}

    async getCharacterPublicInfo(characterId: number): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/`);
    }
}
