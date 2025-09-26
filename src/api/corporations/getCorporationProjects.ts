import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationProjectsApi {
    constructor(private client: ApiClient) {}

    async getCorporationProjects(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/projects`, 'GET', undefined, true);
    }
}
