import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class AllianceCorporationsApi {
    constructor(private client: ApiClient) {}

    async getAllianceCorporations(allianceId: number): Promise<object> {
        return await handleRequest(this.client, `alliances/${allianceId}/corporations/`, 'GET', undefined, false);
    }
}
