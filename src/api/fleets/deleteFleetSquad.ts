import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DeleteFleetSquadApi {
    constructor(private client: ApiClient) {}

    async deleteFleetSquad(fleetId: number, squadId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/squads/${squadId}/`, 'DELETE', undefined, true);
    }
}
