import { RouteApi } from '../api/route/getRoute';

export class RouteClient {
    private routeApi: RouteApi;

    constructor(routeApi: RouteApi) {
        this.routeApi = routeApi;
    }

    async getRoute(origin: number, destination: number): Promise<any> {
        return await this.routeApi.getRoute(origin, destination);
    }
}
