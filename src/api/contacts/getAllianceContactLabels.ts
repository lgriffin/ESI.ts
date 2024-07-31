import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getAllianceContactLabels {
    constructor(private client: ApiClient) {}

    async getAllianceContactLabels(allianceId: number): Promise<any> {
        return handleRequest(this.client, `alliances/${allianceId}/contacts/labels`, 'GET', undefined, true);
    }
}
