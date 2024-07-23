import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UpdateFleetApi {
    constructor(private client: ApiClient) {}

    async updateFleet(fleetId: number, body: object): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}`, 'PUT', JSON.stringify(body));
    }
}
