import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetNpcCorporationsApi {
    constructor(private client: ApiClient) {}

    async getNpcCorporations(): Promise<any> {
        return handleRequest(this.client, 'corporations/npccorps', 'GET', undefined, false);
    }
}
