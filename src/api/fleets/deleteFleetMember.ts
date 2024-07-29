import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DeleteFleetMemberApi {
    constructor(private client: ApiClient) {}

    async kickFleetMember(fleetId: number, memberId: number): Promise<any> {
        return handleRequest(this.client, `fleets/${fleetId}/members/${memberId}/`, 'DELETE', undefined, true);
    }
}
