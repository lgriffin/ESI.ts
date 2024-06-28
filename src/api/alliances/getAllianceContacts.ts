import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/requestHandler';

export class AllianceContactsApi {
    constructor(private client: ApiClient) {}

    async getAllianceContacts(allianceId: number): Promise<object[]> {
        return handleRequest(this.client, `alliances/${allianceId}/contacts`);
    }
}
