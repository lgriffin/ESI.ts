 
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { industryEndpoints } from '../../core/endpoints/industryEndpoints';
import { IndustryFacilitySchema, IndustryJobSchema, IndustrySystemSchema, MiningLedgerEntrySchema, MiningObserverEntrySchema, MiningObserverSchema, MoonExtractionTimerSchema } from '../../schemas/industry';

export class GeneratedIndustryClient extends BaseEsiClient<typeof industryEndpoints> {
  constructor(client: ApiClient) {
    super(client, industryEndpoints);
  }

  /**
   * GET getCharacterIndustryJobs
   * @requires Authentication
   */
  getCharacterIndustryJobs(characterId: number | string): Promise<(z.infer<typeof IndustryJobSchema>)[]> {
    return this.api.getCharacterIndustryJobs(characterId) as Promise<(z.infer<typeof IndustryJobSchema>)[]>;
  }

  /**
   * GET getCharacterMiningLedger
   * @requires Authentication
   */
  getCharacterMiningLedger(characterId: number | string): Promise<(z.infer<typeof MiningLedgerEntrySchema>)[]> {
    return this.api.getCharacterMiningLedger(characterId) as Promise<(z.infer<typeof MiningLedgerEntrySchema>)[]>;
  }

  /**
   * GET getCorporationIndustryJobs
   * @requires Authentication
   */
  getCorporationIndustryJobs(corporationId: number | string): Promise<(z.infer<typeof IndustryJobSchema>)[]> {
    return this.api.getCorporationIndustryJobs(corporationId) as Promise<(z.infer<typeof IndustryJobSchema>)[]>;
  }

  /**
   * GET getMoonExtractionTimers
   * @requires Authentication
   */
  getMoonExtractionTimers(corporationId: number | string): Promise<(z.infer<typeof MoonExtractionTimerSchema>)[]> {
    return this.api.getMoonExtractionTimers(corporationId) as Promise<(z.infer<typeof MoonExtractionTimerSchema>)[]>;
  }

  /**
   * GET getCorporationMiningObservers
   * @requires Authentication
   */
  getCorporationMiningObservers(corporationId: number | string): Promise<(z.infer<typeof MiningObserverSchema>)[]> {
    return this.api.getCorporationMiningObservers(corporationId) as Promise<(z.infer<typeof MiningObserverSchema>)[]>;
  }

  /**
   * GET getCorporationMiningObserver
   * @requires Authentication
   */
  getCorporationMiningObserver(corporationId: number | string, observerId: number | string): Promise<(z.infer<typeof MiningObserverEntrySchema>)[]> {
    return this.api.getCorporationMiningObserver(corporationId, observerId) as Promise<(z.infer<typeof MiningObserverEntrySchema>)[]>;
  }

  /**
   * GET getIndustryFacilities
   */
  getIndustryFacilities(): Promise<(z.infer<typeof IndustryFacilitySchema>)[]> {
    return this.api.getIndustryFacilities() as Promise<(z.infer<typeof IndustryFacilitySchema>)[]>;
  }

  /**
   * GET getIndustrySystems
   */
  getIndustrySystems(): Promise<(z.infer<typeof IndustrySystemSchema>)[]> {
    return this.api.getIndustrySystems() as Promise<(z.infer<typeof IndustrySystemSchema>)[]>;
  }
}
