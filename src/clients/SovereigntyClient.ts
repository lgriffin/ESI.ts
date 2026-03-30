import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { sovereigntyEndpoints } from '../core/endpoints/sovereigntyEndpoints';
import { SovereigntyCampaign, SovereigntyMap, SovereigntyStructure } from '../types/api-responses';

export class SovereigntyClient {
    private api: ReturnType<typeof createClient<typeof sovereigntyEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof sovereigntyEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, sovereigntyEndpoints);
    }

    /**
     * Retrieves all active sovereignty campaigns, including command node contests and station freeports.
     *
     * @returns A list of active sovereignty campaigns
     */
    async getSovereigntyCampaigns(): Promise<SovereigntyCampaign[]> {
        return this.api.getSovereigntyCampaigns();
    }

    /**
     * Retrieves the sovereignty ownership map showing which alliance holds each solar system.
     *
     * @returns A list of solar systems and their sovereignty holders
     */
    async getSovereigntyMap(): Promise<SovereigntyMap[]> {
        return this.api.getSovereigntyMap();
    }

    /**
     * Retrieves all sovereignty structures (TCUs, IHubs) and their vulnerability windows.
     *
     * @returns A list of sovereignty structures with their reinforcement and vulnerability details
     */
    async getSovereigntyStructures(): Promise<SovereigntyStructure[]> {
        return this.api.getSovereigntyStructures();
    }

    withMetadata(): WithMetadata<Omit<SovereigntyClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, sovereigntyEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<SovereigntyClient, 'withMetadata'>>;
    }
}
