import { ApiClient } from '../core/ApiClient';
import { handleRequest } from '../core/ApiRequestHandler';

export class StatusClient {
    constructor(private client: ApiClient) {}

    async getStatus(): Promise<{ players: number; start_time: string; server_version: string }> {
        const response = await handleRequest(this.client, 'status');
        return {
            players: response.players,
            start_time: response.start_time,
            server_version: response.server_version,
        };
    }
}
