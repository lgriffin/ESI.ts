import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostOpenInformationWindowApi {
    constructor(private client: ApiClient) {}

    async openInformationWindow(body: object): Promise<any> {
        return handleRequest(this.client, 'ui/openwindow/information', 'POST', JSON.stringify(body), true);
    }
}
