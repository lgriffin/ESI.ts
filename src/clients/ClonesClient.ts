import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { cloneEndpoints } from '../core/endpoints/cloneEndpoints';
import { CloneInfo } from '../types/api-responses';

export class ClonesClient {
    private api: ReturnType<typeof createClient<typeof cloneEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, cloneEndpoints);
    }

    async getClones(characterId: number): Promise<CloneInfo> {
        return this.api.getClones(characterId);
    }

    async getImplants(characterId: number): Promise<number[]> {
        return this.api.getImplants(characterId);
    }
}
