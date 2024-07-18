import { ApiClient } from '../core/ApiClient';
import { RouteApi } from '../api/route/getRoute';

export class RouteClient {
    private routeApi: RouteApi;

    constructor(client: ApiClient) {
        this.routeApi = new RouteApi(client);
    }

    async getRoute(origin: number, destination: number): Promise<any> {
        return await this.routeApi.getRoute(origin, destination);
    }
}
