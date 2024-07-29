import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PutFleetSquadApi {
    constructor(private client: ApiClient) {}

    async renameFleetSquad(fleetId: number, squadId: number, body: object): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/squads/${squadId}/`, 'PUT', JSON.stringify(body),true);
    }
}
