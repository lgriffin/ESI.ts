import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostFleetInvitationApi {
    constructor(private client: ApiClient) {}

    async createFleetInvitation(fleetId: number, body: object): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/members/`, 'POST', JSON.stringify(body));
    }
}
