 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { contractEndpoints } from '../../core/endpoints/contractEndpoints';
import { ContractBidSchema, ContractItemSchema, ContractSchema } from '../../schemas/contracts';

export class GeneratedContractClient extends BaseEsiClient<typeof contractEndpoints> {
  constructor(client: ApiClient) {
    super(client, contractEndpoints);
  }

  /**
   * GET getCharacterContracts
   * @requires Authentication
   */
  getCharacterContracts(characterId: number | string): Promise<(z.infer<typeof ContractSchema>)[]> {
    return this.api.getCharacterContracts(characterId) as Promise<(z.infer<typeof ContractSchema>)[]>;
  }

  /**
   * GET getCharacterContractBids
   * @requires Authentication
   */
  getCharacterContractBids(characterId: number | string, contractId: number | string): Promise<(z.infer<typeof ContractBidSchema>)[]> {
    return this.api.getCharacterContractBids(characterId, contractId) as Promise<(z.infer<typeof ContractBidSchema>)[]>;
  }

  /**
   * GET getCharacterContractItems
   * @requires Authentication
   */
  getCharacterContractItems(characterId: number | string, contractId: number | string): Promise<(z.infer<typeof ContractItemSchema>)[]> {
    return this.api.getCharacterContractItems(characterId, contractId) as Promise<(z.infer<typeof ContractItemSchema>)[]>;
  }

  /**
   * GET getCorporationContracts
   * @requires Authentication
   */
  getCorporationContracts(corporationId: number | string): Promise<(z.infer<typeof ContractSchema>)[]> {
    return this.api.getCorporationContracts(corporationId) as Promise<(z.infer<typeof ContractSchema>)[]>;
  }

  /**
   * GET getCorporationContractBids
   * @requires Authentication
   */
  getCorporationContractBids(corporationId: number | string, contractId: number | string): Promise<(z.infer<typeof ContractBidSchema>)[]> {
    return this.api.getCorporationContractBids(corporationId, contractId) as Promise<(z.infer<typeof ContractBidSchema>)[]>;
  }

  /**
   * GET getCorporationContractItems
   * @requires Authentication
   */
  getCorporationContractItems(corporationId: number | string, contractId: number | string): Promise<(z.infer<typeof ContractItemSchema>)[]> {
    return this.api.getCorporationContractItems(corporationId, contractId) as Promise<(z.infer<typeof ContractItemSchema>)[]>;
  }

  /**
   * GET getPublicContracts
   */
  getPublicContracts(regionId: number | string): Promise<(z.infer<typeof ContractSchema>)[]> {
    return this.api.getPublicContracts(regionId) as Promise<(z.infer<typeof ContractSchema>)[]>;
  }

  /**
   * GET getPublicContractBids
   */
  getPublicContractBids(contractId: number | string): Promise<(z.infer<typeof ContractBidSchema>)[]> {
    return this.api.getPublicContractBids(contractId) as Promise<(z.infer<typeof ContractBidSchema>)[]>;
  }

  /**
   * GET getPublicContractItems
   */
  getPublicContractItems(contractId: number | string): Promise<(z.infer<typeof ContractItemSchema>)[]> {
    return this.api.getPublicContractItems(contractId) as Promise<(z.infer<typeof ContractItemSchema>)[]>;
  }
}
