import { ApiClient } from '../core/ApiClient';
import { GetClonesApi } from '../api/clones/getClones';
import { GetImplantsApi } from '../api/clones/getImplants';
import { PostJumpCloneActivationApi } from '../api/clones/postJumpCloneActivation';

export class ClonesClient {
    private getClonesApi: GetClonesApi;
    private getImplantsApi: GetImplantsApi;
    private postJumpCloneActivationApi: PostJumpCloneActivationApi;

    constructor(client: ApiClient) {
        this.getClonesApi = new GetClonesApi(client);
        this.getImplantsApi = new GetImplantsApi(client);
        this.postJumpCloneActivationApi = new PostJumpCloneActivationApi(client);
    }

    async getClones(characterId: number): Promise<any> {
        return await this.getClonesApi.getClones(characterId);
    }

    async getImplants(characterId: number): Promise<any> {
        return await this.getImplantsApi.getImplants(characterId);
    }

    async activateJumpClone(characterId: number, jumpCloneId: number): Promise<any> {
        return await this.postJumpCloneActivationApi.activateJumpClone(characterId, jumpCloneId);
    }
}
