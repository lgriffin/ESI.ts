import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DeleteFleetWingApi {
    constructor(private client: ApiClient) {}

    async deleteFleetWing(fleetId: number, wingId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/wings/${wingId}/`, 'DELETE');
    }
}
