import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { warEndpoints } from '../core/endpoints/warEndpoints';
import { War, KillmailSummary } from '../types/api-responses';

export class WarsClient {
    private api: ReturnType<typeof createClient<typeof warEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, warEndpoints);
    }

    async getWars(): Promise<number[]> {
        return this.api.getWars();
    }

    async getWarById(warId: number): Promise<War> {
        return this.api.getWarById(warId);
    }

    async getWarKillmails(warId: number): Promise<KillmailSummary[]> {
        return this.api.getWarKillmails(warId);
    }
}
