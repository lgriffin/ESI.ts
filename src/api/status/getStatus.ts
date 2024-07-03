// src/api/status/getStatus.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class StatusApi {
    constructor(private client: ApiClient) {}

    async getStatus(): Promise<StatusResponse> {
        return handleRequest(this.client, 'status') as Promise<StatusResponse>;
    }
}

// This is helpful for testing and for direct access
export type StatusResponse = {
    players: {
        online: number;
    };
    start_time: string;
    server_version: string;
};
