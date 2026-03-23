import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { contractEndpoints } from '../core/endpoints/contractEndpoints';
import { Contract, ContractItem } from '../types/api-responses';

export class ContractsClient {
    private api: ReturnType<typeof createClient<typeof contractEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, contractEndpoints);
    }

    async getCharacterContracts(characterId: number): Promise<Contract[]> {
        return this.api.getCharacterContracts(characterId);
    }

    async getCharacterContractBids(characterId: number, contractId: number): Promise<any> {
        return this.api.getCharacterContractBids(characterId, contractId);
    }

    async getCharacterContractItems(characterId: number, contractId: number): Promise<ContractItem[]> {
        return this.api.getCharacterContractItems(characterId, contractId);
    }

    async getPublicContracts(regionId: number): Promise<Contract[]> {
        return this.api.getPublicContracts(regionId);
    }

    async getPublicContractBids(contractId: number): Promise<any> {
        return this.api.getPublicContractBids(contractId);
    }

    async getPublicContractItems(contractId: number): Promise<ContractItem[]> {
        return this.api.getPublicContractItems(contractId);
    }

    async getCorporationContracts(corporationId: number): Promise<Contract[]> {
        return this.api.getCorporationContracts(corporationId);
    }

    async getCorporationContractBids(corporationId: number, contractId: number): Promise<any> {
        return this.api.getCorporationContractBids(corporationId, contractId);
    }

    async getCorporationContractItems(corporationId: number, contractId: number): Promise<ContractItem[]> {
        return this.api.getCorporationContractItems(corporationId, contractId);
    }
}
