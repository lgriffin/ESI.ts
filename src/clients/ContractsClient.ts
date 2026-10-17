import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { contractEndpoints } from '../core/endpoints/contractEndpoints';
import {
  Contract,
  ContractBid,
  ContractItem,
  PublicContract,
  PublicContractBid,
  PublicContractItem,
} from '../types/api-responses';
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
   * @returns A list of public contracts in the region. ESI sends no status
   *   or availability on these: every listed contract is public and outstanding.
   */
  getPublicContracts(regionId: number): Promise<PublicContract[]> {
    return this.api.getPublicContracts(regionId);
  }

  /**
   * Retrieve bids placed on a public auction contract.
   *
   * @param contractId - The ID of the public contract whose bids to retrieve
   * @returns A list of bids with amount and timestamp. ESI does not name the
   *   bidder on a public contract.
   */
  getPublicContractBids(contractId: number): Promise<PublicContractBid[]> {
    return this.api.getPublicContractBids(contractId);
  }

  /**
   * Retrieve the items included in a public contract.
   *
   * @param contractId - The ID of the public contract whose items to retrieve
   * @returns A list of items in the contract with type, quantity, and included/excluded
   *   status; blueprint lines also carry item ID, efficiencies and runs
   */
  getPublicContractItems(contractId: number): Promise<PublicContractItem[]> {
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
  ): Promise<PublicContract[]> {
    return this.fetchAllEndpoint<PublicContract>(
      'getPublicContracts',
      [regionId],
      concurrency,
    );
  }

  /**
   * Collect every page of bids on a public auction contract.
   *
   * @param contractId - The ID of the public contract whose bids to collect
   * @param concurrency - How many pages to request at once (default 8)
   * @returns Every bid on the contract; an empty list when ESI answers with no
   *   content because the contract expired or was accepted
   */
  fetchAllPublicContractBids(
    contractId: number,
    concurrency?: number,
  ): Promise<PublicContractBid[]> {
    return this.fetchAllEndpoint<PublicContractBid>(
      'getPublicContractBids',
      [contractId],
      concurrency,
    );
  }

  /**
   * Collect every page of items in a public contract.
   *
   * @param contractId - The ID of the public contract whose items to collect
   * @param concurrency - How many pages to request at once (default 8)
   * @returns Every item line in the contract; an empty list when ESI answers
   *   with no content because the contract expired or was accepted
   */
  fetchAllPublicContractItems(
    contractId: number,
    concurrency?: number,
  ): Promise<PublicContractItem[]> {
    return this.fetchAllEndpoint<PublicContractItem>(
      'getPublicContractItems',
      [contractId],
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
  ): AsyncGenerator<PageResult<PublicContract>, void, undefined> {
    return this.streamEndpoint<PublicContract>('getPublicContracts', regionId);
  }

  /**
   * Stream the bids on a public auction contract one page at a time.
   *
   * @param contractId - The ID of the public contract whose bids to stream
   * @returns The pages of bids; one empty page when ESI answers with no
   *   content because the contract expired or was accepted
   */
  streamPublicContractBids(
    contractId: number,
  ): AsyncGenerator<PageResult<PublicContractBid>, void, undefined> {
    return this.streamEndpoint<PublicContractBid>(
      'getPublicContractBids',
      contractId,
    );
  }

  /**
   * Stream the items in a public contract one page at a time.
   *
   * @param contractId - The ID of the public contract whose items to stream
   * @returns The pages of item lines; one empty page when ESI answers with no
   *   content because the contract expired or was accepted
   */
  streamPublicContractItems(
    contractId: number,
  ): AsyncGenerator<PageResult<PublicContractItem>, void, undefined> {
    return this.streamEndpoint<PublicContractItem>(
      'getPublicContractItems',
      contractId,
    );
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
