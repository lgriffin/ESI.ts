// src/api/status/getStatus.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequestBody } from '../../core/ApiRequestHandler';

export class GetStatusApi {
    constructor(private client: ApiClient) {}

    async getStatus(): Promise<any> {
        return handleRequestBody(this.client, 'status', 'GET',undefined,false);
    }
}
