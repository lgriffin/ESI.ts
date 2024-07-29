import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostFleetSquadApi {
    constructor(private client: ApiClient) {}
 // @todo check back on this one to see why undefinied and not handling any inputs
    async createFleetSquad(fleetId: number, wingId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/wings/${wingId}/squads/`, 'POST', undefined, true);
    }
}
