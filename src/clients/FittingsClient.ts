import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { fittingEndpoints } from '../core/endpoints/fittingEndpoints';
import { Fitting } from '../types/api-responses';

export class FittingsClient {
    private api: ReturnType<typeof createClient<typeof fittingEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof fittingEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, fittingEndpoints);
    }

    /**
     * Retrieves all saved ship fittings for a character.
     *
     * @param characterId - The ID of the character
     * @returns An array of the character's saved fittings
     * @requires Authentication
     */
    async getFittings(characterId: number): Promise<Fitting[]> {
        return this.api.getFittings(characterId);
    }

    /**
     * Creates a new saved ship fitting for a character via POST.
     *
     * @param characterId - The ID of the character
     * @param fittingData - The fitting details including ship type and module layout
     * @returns The ID of the newly created fitting
     * @requires Authentication
     */
    async createFitting(characterId: number, fittingData: object): Promise<{ fitting_id: number }> {
        return this.api.createFitting(characterId, fittingData);
    }

    /**
     * Deletes a saved ship fitting for a character.
     *
     * @param characterId - The ID of the character
     * @param fittingId - The ID of the fitting to delete
     * @requires Authentication
     */
    async deleteFitting(characterId: number, fittingId: number): Promise<void> {
        return this.api.deleteFitting(characterId, fittingId);
    }

    withMetadata(): WithMetadata<Omit<FittingsClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, fittingEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<FittingsClient, 'withMetadata'>>;
    }
}
