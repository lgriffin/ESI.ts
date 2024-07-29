import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class AllianceIconsApi {
    constructor(private client: ApiClient) {}

    async getAllianceIcons(allianceId: number): Promise<object> {
        return await handleRequest(this.client, `alliances/${allianceId}/icons/`, 'GET', undefined, false);
    }
}
