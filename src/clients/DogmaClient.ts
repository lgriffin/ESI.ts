import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { dogmaEndpoints } from '../core/endpoints/dogmaEndpoints';
import { DogmaAttribute, DogmaEffect, DogmaDynamicItem } from '../types/api-responses';

export class DogmaClient {
    private api: ReturnType<typeof createClient<typeof dogmaEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, dogmaEndpoints);
    }

    async getAttributes(): Promise<number[]> {
        return this.api.getAttributes();
    }

    async getAttributeById(attributeId: number): Promise<DogmaAttribute> {
        return this.api.getAttributeById(attributeId);
    }

    async getDynamicItemInfo(typeId: number, itemId: number): Promise<DogmaDynamicItem> {
        return this.api.getDynamicItemInfo(typeId, itemId);
    }

    async getEffects(): Promise<number[]> {
        return this.api.getEffects();
    }

    async getEffectById(effectId: number): Promise<DogmaEffect> {
        return this.api.getEffectById(effectId);
    }
}
