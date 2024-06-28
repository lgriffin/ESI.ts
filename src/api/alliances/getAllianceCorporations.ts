import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/requestHandler';

export class AllianceCorporationsApi {
    constructor(private client: ApiClient) {}

    async getAllianceCorporations(allianceId: number): Promise<object> {
        return await handleRequest(this.client, `alliances/${allianceId}/corporations/`);
    }
}
