import { ApiClient } from '../core/ApiClient';
import { IncursionsApi } from '../api/incursions/getIncursions';

export class IncursionsClient {
    private incursionsApi: IncursionsApi;

    constructor(client: ApiClient) {
        this.incursionsApi = new IncursionsApi(client);
    }

    async getIncursions(): Promise<any> {
        return await this.incursionsApi.getIncursions();
    }
}
