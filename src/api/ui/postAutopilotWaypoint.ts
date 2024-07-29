import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostAutopilotWaypointApi {
    constructor(private client: ApiClient) {}

    async setAutopilotWaypoint(body: object): Promise<any> {
        return handleRequest(this.client, 'ui/autopilot/waypoint', 'POST', JSON.stringify(body), true);
    }
}
