import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostOpenContractWindowApi {
    constructor(private client: ApiClient) {}

    async openContractWindow(body: object): Promise<any> {
        return handleRequest(this.client, 'ui/openwindow/contract', 'POST', JSON.stringify(body), true);
    }
}
