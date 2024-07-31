import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getAllianceContacts {
    constructor(private client: ApiClient) {}

    async getAllianceContacts(allianceId: number): Promise<any> {
        return handleRequest(this.client, `alliances/${allianceId}/contacts`, 'GET', undefined, true);
    }
}
