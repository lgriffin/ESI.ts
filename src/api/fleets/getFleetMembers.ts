import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetFleetMembersApi {
    constructor(private client: ApiClient) {}

    async getFleetMembers(fleetId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/members`, 'GET', undefined, true);
    }
}
