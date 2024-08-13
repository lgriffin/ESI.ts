import { GetStatusApi } from '../api/status/getStatus';
import { ApiClient } from '../core/ApiClient';

export class StatusClient {
    private getStatusApi: GetStatusApi;

    constructor(client: ApiClient) {
        this.getStatusApi = new GetStatusApi(client);
    }

    async getStatus(): Promise<any> {
        return await this.getStatusApi.getStatus();
    }
}



/* This is what we had in case we want to go more granular later again
return {
            players: response.players,
            start_time: response.start_time,
            server_version: response.server_version,
        };
*/