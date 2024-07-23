import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostFleetSquadApi {
    constructor(private client: ApiClient) {}

    async createFleetSquad(fleetId: number, wingId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/wings/${wingId}/squads/`, 'POST', undefined, true);
    }
}
