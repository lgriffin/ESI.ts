import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { routeEndpoints } from '../core/endpoints/routeEndpoints';

export interface RouteOptions {
    preference?: 'Shorter' | 'Safer' | 'LessSecure';
    avoid_systems?: number[];
    connections?: { from: number; to: number }[];
    security_penalty?: number;
}

export class RouteClient {
    private api: ReturnType<typeof createClient<typeof routeEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, routeEndpoints);
    }

    async getRoute(origin: number, destination: number, options?: RouteOptions): Promise<number[]> {
        const body = options ?? {};
        const result = await this.api.getRoute(origin, destination, body);
        return result.route;
    }
}
