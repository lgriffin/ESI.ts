import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterFittingApi {
    constructor(private client: ApiClient) {}

    async createFitting(characterId: number, fittingData: object): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/fittings`, 'POST', JSON.stringify(fittingData), true);
    }
}
