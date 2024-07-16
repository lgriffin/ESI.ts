import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetClonesApi {
    constructor(private client: ApiClient) {}

    async getClones(characterId: number): Promise<any> {
        const endpoint = `characters/${characterId}/clones`;
        return await handleRequest(this.client, endpoint);
    }
}
