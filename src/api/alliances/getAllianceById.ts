import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class AllianceByIdApi {
    constructor(private client: ApiClient) {}

    async getAllianceById(allianceId: number): Promise<object> {
        return await handleRequest(this.client, `alliances/${allianceId}/`);
    }
}
