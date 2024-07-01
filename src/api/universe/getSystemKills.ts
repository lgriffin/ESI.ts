import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseSystemKillsApi {
    constructor(private client: ApiClient) {}

    async getSystemKills(): Promise<object[]> {
        return handleRequest(this.client, `universe/system_kills`);
    }
}
