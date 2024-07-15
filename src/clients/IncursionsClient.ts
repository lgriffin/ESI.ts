import { IncursionsApi } from '../api/incursions/getIncursions';

export class IncursionsClient {
    private incursionsApi: IncursionsApi;

    constructor(incursionsApi: IncursionsApi) {
        this.incursionsApi = incursionsApi;
    }

    async getIncursions(): Promise<any> {
        return await this.incursionsApi.getIncursions();
    }
}
