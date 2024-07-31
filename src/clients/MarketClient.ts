import { getCharacterOrders } from '../api/market/getCharacterOrders';
import { getCharacterOrderHistory } from '../api/market/getCharacterOrderHistory';
import { getCorporationOrders } from '../api/market/getCorporationOrders';
import { getCorporationOrderHistory } from '../api/market/getCorporationOrderHistory';
import { getMarketHistory } from '../api/market/getMarketHistory';
import { getMarketOrders } from '../api/market/getMarketOrders';
import { getMarketTypes } from '../api/market/getMarketTypes';
import { getMarketGroups } from '../api/market/getMarketGroups';
import { getMarketGroupInformation } from '../api/market/getMarketGroupInformation';
import { getMarketPrices } from '../api/market/getMarketPrices';
import { getMarketOrdersInStructure } from '../api/market/getMarketOrdersInStructure';
import { ApiClient } from '../core/ApiClient';

export class MarketClient {
    private getCharacterOrdersApi: getCharacterOrders;
    private getCharacterOrderHistoryApi: getCharacterOrderHistory;
    private getCorporationOrdersApi: getCorporationOrders;
    private getCorporationOrderHistoryApi: getCorporationOrderHistory;
    private getMarketHistoryApi: getMarketHistory;
    private getMarketOrdersApi: getMarketOrders;
    private getMarketTypesApi: getMarketTypes;
    private getMarketGroupsApi: getMarketGroups;
    private getMarketGroupInformationApi: getMarketGroupInformation;
    private getMarketPricesApi: getMarketPrices;
    private getMarketOrdersInStructureApi: getMarketOrdersInStructure;

    constructor(client: ApiClient) {
        this.getCharacterOrdersApi = new getCharacterOrders(client);
        this.getCharacterOrderHistoryApi = new getCharacterOrderHistory(client);
        this.getCorporationOrdersApi = new getCorporationOrders(client);
        this.getCorporationOrderHistoryApi = new getCorporationOrderHistory(client);
        this.getMarketHistoryApi = new getMarketHistory(client);
        this.getMarketOrdersApi = new getMarketOrders(client);
        this.getMarketTypesApi = new getMarketTypes(client);
        this.getMarketGroupsApi = new getMarketGroups(client);
        this.getMarketGroupInformationApi = new getMarketGroupInformation(client);
        this.getMarketPricesApi = new getMarketPrices(client);
        this.getMarketOrdersInStructureApi = new getMarketOrdersInStructure(client);
    }

    async getCharacterOrders(characterId: number): Promise<any> {
        return await this.getCharacterOrdersApi.getCharacterOrders(characterId);
    }

    async getCharacterOrderHistory(characterId: number): Promise<any> {
        return await this.getCharacterOrderHistoryApi.getCharacterOrderHistory(characterId);
    }

    async getCorporationOrders(corporationId: number): Promise<any> {
        return await this.getCorporationOrdersApi.getCorporationOrders(corporationId);
    }

    async getCorporationOrderHistory(corporationId: number): Promise<any> {
        return await this.getCorporationOrderHistoryApi.getCorporationOrderHistory(corporationId);
    }

    async getMarketHistory(regionId: number, typeId: number): Promise<any> {
        return await this.getMarketHistoryApi.getMarketHistory(regionId, typeId);
    }

    async getMarketOrders(regionId: number): Promise<any> {
        return await this.getMarketOrdersApi.getMarketOrders(regionId);
    }

    async getMarketTypes(regionId: number): Promise<any> {
        return await this.getMarketTypesApi.getMarketTypes(regionId);
    }

    async getMarketGroups(): Promise<any> {
        return await this.getMarketGroupsApi.getMarketGroups();
    }

    async getMarketGroupInformation(marketGroupId: number): Promise<any> {
        return await this.getMarketGroupInformationApi.getMarketGroupInformation(marketGroupId);
    }

    async getMarketPrices(): Promise<any> {
        return await this.getMarketPricesApi.getMarketPrices();
    }

    async getMarketOrdersInStructure(structureId: number): Promise<any> {
        return await this.getMarketOrdersInStructureApi.getMarketOrdersInStructure(structureId);
    }
}
