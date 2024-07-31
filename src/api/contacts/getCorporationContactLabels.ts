import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCorporationContactLabels {
    constructor(private client: ApiClient) {}

    async getLabels(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/contacts/labels`, 'GET', undefined, true);
    }
}
