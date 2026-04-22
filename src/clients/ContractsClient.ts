import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { contractEndpoints } from '../core/endpoints/contractEndpoints';
import { Contract, ContractBid, ContractItem } from '../types/api-responses';

export class ContractsClient {
  private api: ReturnType<typeof createClient<typeof contractEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof contractEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, contractEndpoints);
  }

  /**
   * Retrieve contracts issued by or assigned to a character.
   *
   * @param characterId - The ID of the character whose contracts to retrieve
   * @returns A list of contracts with type, status, and pricing information
   * @requires Authentication
   */
  async getCharacterContracts(characterId: number): Promise<Contract[]> {
    return this.api.getCharacterContracts(characterId);
  }

  /**
   * Retrieve bids placed on an auction contract owned by a character.
   *
   * @param characterId - The ID of the character who owns the contract
   * @param contractId - The ID of the contract whose bids to retrieve
   * @returns A list of bids with bidder, amount, and timestamp
   * @requires Authentication
   */
  async getCharacterContractBids(
    characterId: number,
    contractId: number,
  ): Promise<ContractBid[]> {
    return this.api.getCharacterContractBids(characterId, contractId);
  }

  /**
   * Retrieve the items included in a contract owned by a character.
   *
   * @param characterId - The ID of the character who owns the contract
   * @param contractId - The ID of the contract whose items to retrieve
   * @returns A list of items in the contract with type, quantity, and included/excluded status
   * @requires Authentication
   */
  async getCharacterContractItems(
    characterId: number,
    contractId: number,
  ): Promise<ContractItem[]> {
    return this.api.getCharacterContractItems(characterId, contractId);
  }

  /**
   * Retrieve publicly available contracts in a specific region.
   *
   * @param regionId - The ID of the region whose public contracts to retrieve
   * @returns A list of public contracts in the region
   */
  async getPublicContracts(regionId: number): Promise<Contract[]> {
    return this.api.getPublicContracts(regionId);
  }

  /**
   * Retrieve bids placed on a public auction contract.
   *
   * @param contractId - The ID of the public contract whose bids to retrieve
   * @returns A list of bids with bidder, amount, and timestamp
   */
  async getPublicContractBids(contractId: number): Promise<ContractBid[]> {
    return this.api.getPublicContractBids(contractId);
  }

  /**
   * Retrieve the items included in a public contract.
   *
   * @param contractId - The ID of the public contract whose items to retrieve
   * @returns A list of items in the contract with type, quantity, and included/excluded status
   */
  async getPublicContractItems(contractId: number): Promise<ContractItem[]> {
    return this.api.getPublicContractItems(contractId);
  }

  /**
   * Retrieve contracts issued by or assigned to a corporation.
   *
   * @param corporationId - The ID of the corporation whose contracts to retrieve
   * @returns A list of contracts with type, status, and pricing information
   * @requires Authentication
   */
  async getCorporationContracts(corporationId: number): Promise<Contract[]> {
    return this.api.getCorporationContracts(corporationId);
  }

  /**
   * Retrieve bids placed on an auction contract owned by a corporation.
   *
   * @param corporationId - The ID of the corporation that owns the contract
   * @param contractId - The ID of the contract whose bids to retrieve
   * @returns A list of bids with bidder, amount, and timestamp
   * @requires Authentication
   */
  async getCorporationContractBids(
    corporationId: number,
    contractId: number,
  ): Promise<ContractBid[]> {
    return this.api.getCorporationContractBids(corporationId, contractId);
  }

  /**
   * Retrieve the items included in a contract owned by a corporation.
   *
   * @param corporationId - The ID of the corporation that owns the contract
   * @param contractId - The ID of the contract whose items to retrieve
   * @returns A list of items in the contract with type, quantity, and included/excluded status
   * @requires Authentication
   */
  async getCorporationContractItems(
    corporationId: number,
    contractId: number,
  ): Promise<ContractItem[]> {
    return this.api.getCorporationContractItems(corporationId, contractId);
  }

  withMetadata(): WithMetadata<Omit<ContractsClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, contractEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<ContractsClient, 'withMetadata'>
    >;
  }
}
