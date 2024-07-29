import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PutFleetMemberApi {
    constructor(private client: ApiClient) {}

    async moveFleetMember(fleetId: number, memberId: number, body: object): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/members/${memberId}/`, 'PUT', JSON.stringify(body),true);
    }
}
