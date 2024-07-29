import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostFleetWingApi {
    constructor(private client: ApiClient) {}

    async createFleetWing(fleetId: number, body: object): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/wings/`, 'POST', JSON.stringify(body),true);
    }
}
