import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { statusEndpoints } from '../core/endpoints/statusEndpoints';
import { ServerStatus } from '../types/api-responses';

export class StatusClient {
    private api: ReturnType<typeof createClient<typeof statusEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, statusEndpoints);
    }

    async getStatus(): Promise<ServerStatus> {
        return this.api.getStatus();
    }
}
