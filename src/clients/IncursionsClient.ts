import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { incursionEndpoints } from '../core/endpoints/incursionEndpoints';
import { Incursion } from '../types/api-responses';

export class IncursionsClient {
    private api: ReturnType<typeof createClient<typeof incursionEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, incursionEndpoints);
    }

    async getIncursions(): Promise<Incursion[]> {
        return this.api.getIncursions();
    }
}
