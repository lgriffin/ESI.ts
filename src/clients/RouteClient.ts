import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { routeEndpoints } from '../core/endpoints/routeEndpoints';

export class RouteClient {
    private api: ReturnType<typeof createClient<typeof routeEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, routeEndpoints);
    }

    async getRoute(origin: number, destination: number): Promise<number[]> {
        return this.api.getRoute(origin, destination);
    }
}
