// src/api/dogma/getDynamicItemInfo.ts
import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DogmaDynamicItemApi {
    constructor(private client: ApiClient) {}

    async getDynamicItemInfo(typeId: number, itemId: number): Promise<any> {
        return handleRequest(this.client, `dogma/dynamic/items/${typeId}/${itemId}`);
    }
}
