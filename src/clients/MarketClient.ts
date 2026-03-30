import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { marketEndpoints } from '../core/endpoints/marketEndpoints';
import { MarketOrder, MarketHistory } from '../types/api-responses';

export class MarketClient {
    private api: ReturnType<typeof createClient<typeof marketEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof marketEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, marketEndpoints);
    }

    /**
     * Retrieves all active market orders placed by a character.
     *
     * @param characterId - The ID of the character whose orders to fetch
     * @returns A list of the character's open market orders
     * @requires Authentication
     */
    async getCharacterOrders(characterId: number): Promise<MarketOrder[]> {
        return this.api.getCharacterOrders(characterId);
    }

    /**
     * Retrieves the history of expired and cancelled market orders for a character.
     *
     * @param characterId - The ID of the character whose order history to fetch
     * @returns A list of the character's historical market orders
     * @requires Authentication
     */
    async getCharacterOrderHistory(characterId: number): Promise<MarketOrder[]> {
        return this.api.getCharacterOrderHistory(characterId);
    }

    /**
     * Retrieves all active market orders placed by members of a corporation.
     *
     * @param corporationId - The ID of the corporation whose orders to fetch
     * @returns A list of the corporation's open market orders
     * @requires Authentication
     */
    async getCorporationOrders(corporationId: number): Promise<MarketOrder[]> {
        return this.api.getCorporationOrders(corporationId);
    }

    /**
     * Retrieves the history of expired and cancelled market orders for a corporation.
     *
     * @param corporationId - The ID of the corporation whose order history to fetch
     * @returns A list of the corporation's historical market orders
     * @requires Authentication
     */
    async getCorporationOrderHistory(corporationId: number): Promise<MarketOrder[]> {
        return this.api.getCorporationOrderHistory(corporationId);
    }

    /**
     * Retrieves the daily price and volume history for a specific item type in a region.
     *
     * @param regionId - The ID of the region to fetch market history for
     * @param typeId - The type ID of the item to get history for
     * @returns A list of daily market history entries with price and volume data
     */
    async getMarketHistory(regionId: number, typeId: number): Promise<MarketHistory[]> {
        return this.api.getMarketHistory(regionId, typeId);
    }

    /**
     * Retrieves all active market orders in a region for all item types.
     *
     * @param regionId - The ID of the region to fetch orders for
     * @returns A list of all active market orders in the region
     */
    async getMarketOrders(regionId: number): Promise<MarketOrder[]> {
        return this.api.getMarketOrders(regionId, 'all');
    }

    /**
     * Retrieves the list of type IDs that have active market orders in a region.
     *
     * @param regionId - The ID of the region to check for active types
     * @returns A list of type IDs with active orders in the region
     */
    async getMarketTypes(regionId: number): Promise<number[]> {
        return this.api.getMarketTypes(regionId);
    }

    /**
     * Retrieves the list of all market group IDs used to categorize items on the market.
     *
     * @returns A list of all market group IDs
     */
    async getMarketGroups(): Promise<number[]> {
        return this.api.getMarketGroups();
    }

    /**
     * Retrieves detailed information about a specific market group, including its name, description, and contained types.
     *
     * @param marketGroupId - The ID of the market group to look up
     * @returns The market group details including name, description, types, and optional parent group
     */
    async getMarketGroupInformation(marketGroupId: number): Promise<{ market_group_id: number; name: string; description: string; types: number[]; parent_group_id?: number }> {
        return this.api.getMarketGroupInformation(marketGroupId);
    }

    /**
     * Retrieves the global average and adjusted prices for all tradeable item types.
     *
     * @returns A list of item types with their average and adjusted market prices
     */
    async getMarketPrices(): Promise<{ type_id: number; average_price?: number; adjusted_price?: number }[]> {
        return this.api.getMarketPrices();
    }

    /**
     * Retrieves all active market orders listed in a specific player-owned structure.
     *
     * @param structureId - The ID of the structure to fetch orders for
     * @returns A list of active market orders in the structure
     */
    async getMarketOrdersInStructure(structureId: number): Promise<MarketOrder[]> {
        return this.api.getMarketOrdersInStructure(structureId);
    }

    withMetadata(): WithMetadata<Omit<MarketClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, marketEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<MarketClient, 'withMetadata'>>;
    }
}
