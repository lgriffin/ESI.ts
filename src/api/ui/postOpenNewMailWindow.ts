import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostOpenNewMailWindowApi {
    constructor(private client: ApiClient) {}

    async openNewMailWindow(body: object): Promise<any> {
        return handleRequest(this.client, 'ui/openwindow/newmail', 'POST', JSON.stringify(body), true);
    }
}
