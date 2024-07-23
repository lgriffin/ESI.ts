import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterFleetInfoApi {
    constructor(private client: ApiClient) {}

    async getCharacterFleetInfo(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/fleet`);
    }
}
