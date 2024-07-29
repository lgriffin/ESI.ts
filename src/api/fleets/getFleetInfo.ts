import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetFleetInfoApi {
    constructor(private client: ApiClient) {}

    async getFleetInfo(fleetId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}`, 'GET', undefined, true);
    }
}
