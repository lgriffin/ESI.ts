import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { contractEndpoints } from '../core/endpoints/contractEndpoints';
import { Contract, ContractBid, ContractItem } from '../types/api-responses';
import { PageResult } from '../core/pagination/AsyncPaginationIterator';

export class ContractsClient extends BaseEsiClient<typeof contractEndpoints> {
  constructor(client: ApiClient) {
    super(client, contractEndpoints);
  }

  /**
   * Retrieve contracts issued by or assigned to a character.
   *
   * @param characterId - The ID of the character whose contracts to retrieve
   * @returns A list of contracts with type, status, and pricing information
   * @requires Authentication
   */
  getCharacterContracts(characterId: number): Promise<Contract[]> {
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
  getCharacterContractBids(
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
  getCharacterContractItems(
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
  getPublicContracts(regionId: number): Promise<Contract[]> {
    return this.api.getPublicContracts(regionId);
  }

  /**
   * Retrieve bids placed on a public auction contract.
   *
   * @param contractId - The ID of the public contract whose bids to retrieve
   * @returns A list of bids with bidder, amount, and timestamp
   */
  getPublicContractBids(contractId: number): Promise<ContractBid[]> {
    return this.api.getPublicContractBids(contractId);
  }

  /**
   * Retrieve the items included in a public contract.
   *
   * @param contractId - The ID of the public contract whose items to retrieve
   * @returns A list of items in the contract with type, quantity, and included/excluded status
   */
  getPublicContractItems(contractId: number): Promise<ContractItem[]> {
    return this.api.getPublicContractItems(contractId);
  }

  /**
   * Retrieve contracts issued by or assigned to a corporation.
   *
   * @param corporationId - The ID of the corporation whose contracts to retrieve
   * @returns A list of contracts with type, status, and pricing information
   * @requires Authentication
   */
  getCorporationContracts(corporationId: number): Promise<Contract[]> {
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
  getCorporationContractBids(
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
  getCorporationContractItems(
    corporationId: number,
    contractId: number,
  ): Promise<ContractItem[]> {
    return this.api.getCorporationContractItems(corporationId, contractId);
  }

  fetchAllPublicContracts(
    regionId: number,
    concurrency?: number,
  ): Promise<Contract[]> {
    return this.fetchAllEndpoint<Contract>(
      'getPublicContracts',
      [regionId],
      concurrency,
    );
  }

  fetchAllCharacterContracts(
    characterId: number,
    concurrency?: number,
  ): Promise<Contract[]> {
    return this.fetchAllEndpoint<Contract>(
      'getCharacterContracts',
      [characterId],
      concurrency,
    );
  }

  fetchAllCorporationContracts(
    corporationId: number,
    concurrency?: number,
  ): Promise<Contract[]> {
    return this.fetchAllEndpoint<Contract>(
      'getCorporationContracts',
      [corporationId],
      concurrency,
    );
  }

  streamPublicContracts(
    regionId: number,
  ): AsyncGenerator<PageResult<Contract>, void, undefined> {
    return this.streamEndpoint<Contract>('getPublicContracts', regionId);
  }

  streamCharacterContracts(
    characterId: number,
  ): AsyncGenerator<PageResult<Contract>, void, undefined> {
    return this.streamEndpoint<Contract>('getCharacterContracts', characterId);
  }

  streamCorporationContracts(
    corporationId: number,
  ): AsyncGenerator<PageResult<Contract>, void, undefined> {
    return this.streamEndpoint<Contract>(
      'getCorporationContracts',
      corporationId,
    );
  }
}
