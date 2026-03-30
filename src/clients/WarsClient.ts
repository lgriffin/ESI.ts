import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { warEndpoints } from '../core/endpoints/warEndpoints';
import { War, KillmailSummary } from '../types/api-responses';

export class WarsClient {
    private api: ReturnType<typeof createClient<typeof warEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof warEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, warEndpoints);
    }

    /**
     * Retrieves a list of all war IDs, ordered by war ID descending.
     *
     * @returns A list of war IDs
     */
    async getWars(): Promise<number[]> {
        return this.api.getWars();
    }

    /**
     * Retrieves detailed information about a specific war, including aggressors, defenders, and status.
     *
     * @param warId - The ID of the war
     * @returns Detailed war information
     */
    async getWarById(warId: number): Promise<War> {
        return this.api.getWarById(warId);
    }

    /**
     * Retrieves the killmail summaries associated with a specific war.
     *
     * @param warId - The ID of the war
     * @returns A list of killmail summaries for the war
     */
    async getWarKillmails(warId: number): Promise<KillmailSummary[]> {
        return this.api.getWarKillmails(warId);
    }

    withMetadata(): WithMetadata<Omit<WarsClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, warEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<WarsClient, 'withMetadata'>>;
    }
}
