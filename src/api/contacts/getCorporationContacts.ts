import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCorporationContacts {
    constructor(private client: ApiClient) {}

    async getContacts(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/contacts`, 'GET', undefined, true);
    }
}
