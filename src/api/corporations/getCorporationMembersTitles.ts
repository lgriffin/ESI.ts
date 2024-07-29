import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationMembersTitlesApi {
    constructor(private client: ApiClient) {}

    async getCorporationMembersTitles(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/members/titles`, 'GET', undefined, true);
    }
}
