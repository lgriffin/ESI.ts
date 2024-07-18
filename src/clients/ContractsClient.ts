import { ApiClient } from '../core/ApiClient';
import { GetCharacterContractsApi } from '../api/contracts/getCharacterContracts';
import { GetCharacterContractBidsApi } from '../api/contracts/getCharacterContractBids';
import { GetCharacterContractItemsApi } from '../api/contracts/getCharacterContractItems';
import { GetPublicContractsApi } from '../api/contracts/getPublicContracts';
import { GetPublicContractBidsApi } from '../api/contracts/getPublicContractBids';
import { GetPublicContractItemsApi } from '../api/contracts/getPublicContractItems';
import { GetCorporationContractsApi } from '../api/contracts/getCorporationContracts';
import { GetCorporationContractBidsApi } from '../api/contracts/getCorporationContractBids';
import { GetCorporationContractItemsApi } from '../api/contracts/getCorporationContractItems';

export class ContractsClient {
    private getCharacterContractsApi: GetCharacterContractsApi;
    private getCharacterContractBidsApi: GetCharacterContractBidsApi;
    private getCharacterContractItemsApi: GetCharacterContractItemsApi;
    private getPublicContractsApi: GetPublicContractsApi;
    private getPublicContractBidsApi: GetPublicContractBidsApi;
    private getPublicContractItemsApi: GetPublicContractItemsApi;
    private getCorporationContractsApi: GetCorporationContractsApi;
    private getCorporationContractBidsApi: GetCorporationContractBidsApi;
    private getCorporationContractItemsApi: GetCorporationContractItemsApi;

    constructor(client: ApiClient) {
        this.getCharacterContractsApi = new GetCharacterContractsApi(client);
        this.getCharacterContractBidsApi = new GetCharacterContractBidsApi(client);
        this.getCharacterContractItemsApi = new GetCharacterContractItemsApi(client);
        this.getPublicContractsApi = new GetPublicContractsApi(client);
        this.getPublicContractBidsApi = new GetPublicContractBidsApi(client);
        this.getPublicContractItemsApi = new GetPublicContractItemsApi(client);
        this.getCorporationContractsApi = new GetCorporationContractsApi(client);
        this.getCorporationContractBidsApi = new GetCorporationContractBidsApi(client);
        this.getCorporationContractItemsApi = new GetCorporationContractItemsApi(client);
    }

    async getCharacterContracts(characterId: number): Promise<any> {
        return await this.getCharacterContractsApi.getCharacterContracts(characterId);
    }

    async getCharacterContractBids(characterId: number, contractId: number): Promise<any> {
        return await this.getCharacterContractBidsApi.getCharacterContractBids(characterId, contractId);
    }

    async getCharacterContractItems(characterId: number, contractId: number): Promise<any> {
        return await this.getCharacterContractItemsApi.getCharacterContractItems(characterId, contractId);
    }

    async getPublicContracts(regionId: number): Promise<any> {
        return await this.getPublicContractsApi.getPublicContracts(regionId);
    }

    async getPublicContractBids(contractId: number): Promise<any> {
        return await this.getPublicContractBidsApi.getPublicContractBids(contractId);
    }

    async getPublicContractItems(contractId: number): Promise<any> {
        return await this.getPublicContractItemsApi.getPublicContractItems(contractId);
    }

    async getCorporationContracts(corporationId: number): Promise<any> {
        return await this.getCorporationContractsApi.getCorporationContracts(corporationId);
    }

    async getCorporationContractBids(corporationId: number, contractId: number): Promise<any> {
        return await this.getCorporationContractBidsApi.getCorporationContractBids(corporationId, contractId);
    }

    async getCorporationContractItems(corporationId: number, contractId: number): Promise<any> {
        return await this.getCorporationContractItemsApi.getCorporationContractItems(corporationId, contractId);
    }
}
