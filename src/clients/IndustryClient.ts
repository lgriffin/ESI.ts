import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { industryEndpoints } from '../core/endpoints/industryEndpoints';
import {
  IndustryJob,
  MiningLedgerEntry,
  IndustryFacility,
  IndustrySystem,
  MoonExtractionTimer,
  MiningObserver,
  MiningObserverEntry,
} from '../types/api-responses';

export class IndustryClient {
  private api: ReturnType<typeof createClient<typeof industryEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof industryEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, industryEndpoints);
  }

  /**
   * Retrieves all industry jobs for a character, including manufacturing, research, and invention.
   *
   * @param characterId - The ID of the character
   * @returns An array of the character's industry jobs
   * @requires Authentication
   */
  getCharacterIndustryJobs(characterId: number): Promise<IndustryJob[]> {
    return this.api.getCharacterIndustryJobs(characterId) as Promise<
      IndustryJob[]
    >;
  }

  /**
   * Retrieves a character's personal mining ledger, showing ore mined per day.
   *
   * @param characterId - The ID of the character
   * @returns An array of mining ledger entries
   * @requires Authentication
   */
  getCharacterMiningLedger(characterId: number): Promise<MiningLedgerEntry[]> {
    return this.api.getCharacterMiningLedger(characterId) as Promise<
      MiningLedgerEntry[]
    >;
  }

  /**
   * Retrieves moon extraction timers for a corporation's refineries.
   *
   * @param corporationId - The ID of the corporation
   * @returns An array of moon extraction timers
   * @requires Authentication
   */
  getMoonExtractionTimers(
    corporationId: number,
  ): Promise<MoonExtractionTimer[]> {
    return this.api.getMoonExtractionTimers(corporationId) as Promise<
      MoonExtractionTimer[]
    >;
  }

  /**
   * Retrieves the list of mining observers (e.g., refineries) owned by a corporation.
   *
   * @param corporationId - The ID of the corporation
   * @returns An array of mining observers
   * @requires Authentication
   */
  getCorporationMiningObservers(
    corporationId: number,
  ): Promise<MiningObserver[]> {
    return this.api.getCorporationMiningObservers(corporationId) as Promise<
      MiningObserver[]
    >;
  }

  /**
   * Retrieves mining activity recorded by a specific corporation mining observer.
   *
   * @param corporationId - The ID of the corporation
   * @param observerId - The ID of the mining observer
   * @returns An array of mining activity entries for the observer
   * @requires Authentication
   */
  getCorporationMiningObserver(
    corporationId: number,
    observerId: number,
  ): Promise<MiningObserverEntry[]> {
    return this.api.getCorporationMiningObserver(
      corporationId,
      observerId,
    ) as Promise<MiningObserverEntry[]>;
  }

  /**
   * Retrieves all industry jobs for a corporation, including manufacturing, research, and invention.
   *
   * @param corporationId - The ID of the corporation
   * @returns An array of the corporation's industry jobs
   * @requires Authentication
   */
  getCorporationIndustryJobs(corporationId: number): Promise<IndustryJob[]> {
    return this.api.getCorporationIndustryJobs(corporationId) as Promise<
      IndustryJob[]
    >;
  }

  /**
   * Retrieves a list of all publicly available industry facilities in the universe.
   *
   * @returns An array of industry facilities
   */
  getIndustryFacilities(): Promise<IndustryFacility[]> {
    return this.api.getIndustryFacilities() as Promise<IndustryFacility[]>;
  }

  /**
   * Retrieves cost indices for solar systems with industry activity, used to calculate job installation fees.
   *
   * @returns An array of industry system cost indices
   */
  getIndustrySystems(): Promise<IndustrySystem[]> {
    return this.api.getIndustrySystems() as Promise<IndustrySystem[]>;
  }

  withMetadata(): WithMetadata<Omit<IndustryClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, industryEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<IndustryClient, 'withMetadata'>
    >;
  }
}
