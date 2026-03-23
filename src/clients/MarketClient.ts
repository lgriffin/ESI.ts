import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { marketEndpoints } from '../core/endpoints/marketEndpoints';
import { MarketOrder, MarketHistory } from '../types/api-responses';

export class MarketClient {
    private api: ReturnType<typeof createClient<typeof marketEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, marketEndpoints);
    }

    async getCharacterOrders(characterId: number): Promise<MarketOrder[]> {
        return this.api.getCharacterOrders(characterId);
    }

    async getCharacterOrderHistory(characterId: number): Promise<MarketOrder[]> {
        return this.api.getCharacterOrderHistory(characterId);
    }

    async getCorporationOrders(corporationId: number): Promise<MarketOrder[]> {
        return this.api.getCorporationOrders(corporationId);
    }

    async getCorporationOrderHistory(corporationId: number): Promise<MarketOrder[]> {
        return this.api.getCorporationOrderHistory(corporationId);
    }

    async getMarketHistory(regionId: number, typeId: number): Promise<MarketHistory[]> {
        return this.api.getMarketHistory(regionId, typeId);
    }

    async getMarketOrders(regionId: number): Promise<MarketOrder[]> {
        return this.api.getMarketOrders(regionId, 'all');
    }

    async getMarketTypes(regionId: number): Promise<number[]> {
        return this.api.getMarketTypes(regionId);
    }

    async getMarketGroups(): Promise<number[]> {
        return this.api.getMarketGroups();
    }

    async getMarketGroupInformation(marketGroupId: number): Promise<{ market_group_id: number; name: string; description: string; types: number[]; parent_group_id?: number }> {
        return this.api.getMarketGroupInformation(marketGroupId);
    }

    async getMarketPrices(): Promise<{ type_id: number; average_price?: number; adjusted_price?: number }[]> {
        return this.api.getMarketPrices();
    }

    async getMarketOrdersInStructure(structureId: number): Promise<MarketOrder[]> {
        return this.api.getMarketOrdersInStructure(structureId);
    }
}
