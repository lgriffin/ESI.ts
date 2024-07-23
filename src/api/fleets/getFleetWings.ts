import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetFleetWingsApi {
    constructor(private client: ApiClient) {}

    async getFleetWings(fleetId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/wings/`);
    }
}
