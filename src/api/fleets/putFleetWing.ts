import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PutFleetWingApi {
    constructor(private client: ApiClient) {}

    async renameFleetWing(fleetId: number, wingId: number, name: string): Promise<any> {
        const body = JSON.stringify({ name });
        return handleRequest(this.client, `fleets/${fleetId}/wings/${wingId}/`, 'PUT', body, true);
    }
}
