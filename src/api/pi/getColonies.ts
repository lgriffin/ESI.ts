import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetColoniesApi {
    constructor(private client: ApiClient) {}

    async getColonies(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/planets`);
    }
}
