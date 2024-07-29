import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetPublicContractsApi {
    constructor(private client: ApiClient) {}

    async getPublicContracts(regionId: number): Promise<any> {
        return handleRequest(this.client, `contracts/public/${regionId}`, 'GET', undefined, false);
    }
}
