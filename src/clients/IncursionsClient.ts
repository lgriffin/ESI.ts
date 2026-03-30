import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { incursionEndpoints } from '../core/endpoints/incursionEndpoints';
import { Incursion } from '../types/api-responses';

export class IncursionsClient {
    private api: ReturnType<typeof createClient<typeof incursionEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof incursionEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, incursionEndpoints);
    }

    /**
     * Retrieves all currently active incursions, including their staging systems and influence levels.
     *
     * @returns An array of active incursions
     */
    async getIncursions(): Promise<Incursion[]> {
        return this.api.getIncursions();
    }

    withMetadata(): WithMetadata<Omit<IncursionsClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, incursionEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<IncursionsClient, 'withMetadata'>>;
    }
}
