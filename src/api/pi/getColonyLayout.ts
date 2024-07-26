import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetColonyLayoutApi {
    constructor(private client: ApiClient) {}

    async getColonyLayout(characterId: number, planetId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/planets/${planetId}`);
    }
}
