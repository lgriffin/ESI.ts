import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { statusEndpoints } from '../core/endpoints/statusEndpoints';
import { ServerStatus } from '../types/api-responses';

export class StatusClient {
    private api: ReturnType<typeof createClient<typeof statusEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof statusEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, statusEndpoints);
    }

    /**
     * Retrieves the current Tranquility server status, including player count and server version.
     *
     * @returns The current server status information
     */
    async getStatus(): Promise<ServerStatus> {
        return this.api.getStatus();
    }

    withMetadata(): WithMetadata<Omit<StatusClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, statusEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<StatusClient, 'withMetadata'>>;
    }
}
