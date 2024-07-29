import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostOpenMarketDetailsWindowApi {
    constructor(private client: ApiClient) {}

    async openMarketDetailsWindow(body: object): Promise<any> {
        return handleRequest(this.client, 'ui/openwindow/marketdetails', 'POST', JSON.stringify(body), true);
    }
}
