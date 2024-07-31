// src/api/status/getStatus.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetStatusApi {
    constructor(private client: ApiClient) {}

    async getStatus(): Promise<any> {
        return handleRequest(this.client, 'status', 'GET',undefined,false);
    }
}
