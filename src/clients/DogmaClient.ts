// src/clients/DogmaClient.ts
import { ApiClient } from '../core/ApiClient';
import { DogmaAttributesApi } from '../api/dogma/getDogmaAttributes';
import { DogmaAttributeByIdApi } from '../api/dogma/getDogmaAttributeById';
import { DogmaDynamicItemApi } from '../api/dogma/getDogmaDynamicItemAttributes';
import { DogmaEffectsApi } from '../api/dogma/getDogmaEffects';
import { DogmaEffectByIdApi } from '../api/dogma/getDogmaEffectById';

export class DogmaClient {
    private dogmaAttributesApi: DogmaAttributesApi;
    private dogmaAttributeByIdApi: DogmaAttributeByIdApi;
    private dogmaDynamicItemApi: DogmaDynamicItemApi;
    private dogmaEffectsApi: DogmaEffectsApi;
    private dogmaEffectByIdApi: DogmaEffectByIdApi;

    constructor(client: ApiClient) {
        this.dogmaAttributesApi = new DogmaAttributesApi(client);
        this.dogmaAttributeByIdApi = new DogmaAttributeByIdApi(client);
        this.dogmaDynamicItemApi = new DogmaDynamicItemApi(client);
        this.dogmaEffectsApi = new DogmaEffectsApi(client);
        this.dogmaEffectByIdApi = new DogmaEffectByIdApi(client);
    }

    async getAttributes(): Promise<any> {
        return await this.dogmaAttributesApi.getAttributes();
    }

    async getAttributeById(attributeId: number): Promise<any> {
        return await this.dogmaAttributeByIdApi.getAttributeById(attributeId);
    }

    async getDynamicItemInfo(typeId: number, itemId: number): Promise<any> {
        return await this.dogmaDynamicItemApi.getDynamicItemInfo(typeId, itemId);
    }

    async getEffects(): Promise<any> {
        return await this.dogmaEffectsApi.getEffects();
    }

    async getEffectById(effectId: number): Promise<any> {
        return await this.dogmaEffectByIdApi.getEffectById(effectId);
    }
}
