import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetMedalsApi {
    constructor(private client: ApiClient) {}

    async getMedals(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/medals/`, 'GET', undefined, true);
    }
}
