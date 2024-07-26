import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetLoyaltyPointsApi {
    constructor(private client: ApiClient) {}

    async getLoyaltyPoints(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/loyalty/points`);
    }
}
