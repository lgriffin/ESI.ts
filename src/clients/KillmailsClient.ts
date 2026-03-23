import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { killmailEndpoints } from '../core/endpoints/killmailEndpoints';
import { KillmailSummary, Killmail } from '../types/api-responses';

export class KillmailsClient {
    private api: ReturnType<typeof createClient<typeof killmailEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, killmailEndpoints);
    }

    async getCharacterRecentKillmails(characterId: number): Promise<KillmailSummary[]> {
        return this.api.getCharacterRecentKillmails(characterId);
    }

    async getCorporationRecentKillmails(corporationId: number): Promise<KillmailSummary[]> {
        return this.api.getCorporationRecentKillmails(corporationId);
    }

    async getKillmail(killmailId: number, killmailHash: string): Promise<Killmail> {
        return this.api.getKillmail(killmailId, killmailHash);
    }
}
