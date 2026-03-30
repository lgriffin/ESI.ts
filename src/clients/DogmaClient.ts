import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { dogmaEndpoints } from '../core/endpoints/dogmaEndpoints';
import { DogmaAttribute, DogmaEffect, DogmaDynamicItem } from '../types/api-responses';

export class DogmaClient {
    private api: ReturnType<typeof createClient<typeof dogmaEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof dogmaEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, dogmaEndpoints);
    }

    /**
     * Retrieves a list of all dogma attribute IDs.
     *
     * @returns An array of dogma attribute IDs
     */
    async getAttributes(): Promise<number[]> {
        return this.api.getAttributes();
    }

    /**
     * Retrieves detailed information about a specific dogma attribute.
     *
     * @param attributeId - The ID of the dogma attribute to look up
     * @returns Detailed information about the dogma attribute
     */
    async getAttributeById(attributeId: number): Promise<DogmaAttribute> {
        return this.api.getAttributeById(attributeId);
    }

    /**
     * Retrieves the dynamic dogma information for a specific mutated item, including its modified attributes.
     *
     * @param typeId - The type ID of the item
     * @param itemId - The item ID of the specific dynamic item
     * @returns Dynamic dogma information for the mutated item
     */
    async getDynamicItemInfo(typeId: number, itemId: number): Promise<DogmaDynamicItem> {
        return this.api.getDynamicItemInfo(typeId, itemId);
    }

    /**
     * Retrieves a list of all dogma effect IDs.
     *
     * @returns An array of dogma effect IDs
     */
    async getEffects(): Promise<number[]> {
        return this.api.getEffects();
    }

    /**
     * Retrieves detailed information about a specific dogma effect.
     *
     * @param effectId - The ID of the dogma effect to look up
     * @returns Detailed information about the dogma effect
     */
    async getEffectById(effectId: number): Promise<DogmaEffect> {
        return this.api.getEffectById(effectId);
    }

    withMetadata(): WithMetadata<Omit<DogmaClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, dogmaEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<DogmaClient, 'withMetadata'>>;
    }
}
