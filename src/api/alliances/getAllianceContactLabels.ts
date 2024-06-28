import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/requestHandler';


export class AllianceContactLabelsApi {
    constructor(private client: ApiClient) {}

    async getAllianceContactLabels(allianceId: number): Promise<object[]> {
        return handleRequest(this.client, `alliances/${allianceId}/contacts/labels`);
    }
}