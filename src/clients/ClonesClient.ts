import { ApiClient } from '../core/ApiClient';
import { GetClonesApi } from '../api/clones/getClones';
import { GetImplantsApi } from '../api/clones/getImplants';

export class ClonesClient {
    private getClonesApi: GetClonesApi;
    private getImplantsApi: GetImplantsApi;

    constructor(client: ApiClient) {
        this.getClonesApi = new GetClonesApi(client);
        this.getImplantsApi = new GetImplantsApi(client);
    }

    async getClones(characterId: number): Promise<any> {
        return await this.getClonesApi.getClones(characterId);
    }

    async getImplants(characterId: number): Promise<any> {
        return await this.getImplantsApi.getImplants(characterId);
    }
}
