import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
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
import { PageResult } from '../core/pagination/AsyncPaginationIterator';

export class IndustryClient extends BaseEsiClient<typeof industryEndpoints> {
  constructor(client: ApiClient) {
    super(client, industryEndpoints);
  }

  /**
   * Retrieves all industry jobs for a character, including manufacturing, research, and invention.
   *
   * @param characterId - The ID of the character
   * @returns An array of the character's industry jobs
   * @requires Authentication
   */
  getCharacterIndustryJobs(characterId: number): Promise<IndustryJob[]> {
    return this.api.getCharacterIndustryJobs(characterId);
  }

  /**
   * Retrieves a character's personal mining ledger, showing ore mined per day.
   *
   * @param characterId - The ID of the character
   * @returns An array of mining ledger entries
   * @requires Authentication
   */
  getCharacterMiningLedger(characterId: number): Promise<MiningLedgerEntry[]> {
    return this.api.getCharacterMiningLedger(characterId);
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
    return this.api.getMoonExtractionTimers(corporationId);
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
    return this.api.getCorporationMiningObservers(corporationId);
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
    return this.api.getCorporationMiningObserver(corporationId, observerId);
  }

  /**
   * Retrieves all industry jobs for a corporation, including manufacturing, research, and invention.
   *
   * @param corporationId - The ID of the corporation
   * @returns An array of the corporation's industry jobs
   * @requires Authentication
   */
  getCorporationIndustryJobs(corporationId: number): Promise<IndustryJob[]> {
    return this.api.getCorporationIndustryJobs(corporationId);
  }

  /**
   * Retrieves a list of all publicly available industry facilities in the universe.
   *
   * @returns An array of industry facilities
   */
  getIndustryFacilities(): Promise<IndustryFacility[]> {
    return this.api.getIndustryFacilities();
  }

  /**
   * Retrieves cost indices for solar systems with industry activity, used to calculate job installation fees.
   *
   * @returns An array of industry system cost indices
   */
  getIndustrySystems(): Promise<IndustrySystem[]> {
    return this.api.getIndustrySystems();
  }

  fetchAllCharacterIndustryJobs(
    characterId: number,
    concurrency?: number,
  ): Promise<IndustryJob[]> {
    return this.fetchAllEndpoint<IndustryJob>(
      'getCharacterIndustryJobs',
      [characterId],
      concurrency,
    );
  }

  fetchAllCharacterMiningLedger(
    characterId: number,
    concurrency?: number,
  ): Promise<MiningLedgerEntry[]> {
    return this.fetchAllEndpoint<MiningLedgerEntry>(
      'getCharacterMiningLedger',
      [characterId],
      concurrency,
    );
  }

  fetchAllCorporationIndustryJobs(
    corporationId: number,
    concurrency?: number,
  ): Promise<IndustryJob[]> {
    return this.fetchAllEndpoint<IndustryJob>(
      'getCorporationIndustryJobs',
      [corporationId],
      concurrency,
    );
  }

  fetchAllMoonExtractionTimers(
    corporationId: number,
    concurrency?: number,
  ): Promise<MoonExtractionTimer[]> {
    return this.fetchAllEndpoint<MoonExtractionTimer>(
      'getMoonExtractionTimers',
      [corporationId],
      concurrency,
    );
  }

  fetchAllCorporationMiningObservers(
    corporationId: number,
    concurrency?: number,
  ): Promise<MiningObserver[]> {
    return this.fetchAllEndpoint<MiningObserver>(
      'getCorporationMiningObservers',
      [corporationId],
      concurrency,
    );
  }

  fetchAllCorporationMiningObserver(
    corporationId: number,
    observerId: number,
    concurrency?: number,
  ): Promise<MiningObserverEntry[]> {
    return this.fetchAllEndpoint<MiningObserverEntry>(
      'getCorporationMiningObserver',
      [corporationId, observerId],
      concurrency,
    );
  }

  fetchAllIndustryFacilities(
    concurrency?: number,
  ): Promise<IndustryFacility[]> {
    return this.fetchAllEndpoint<IndustryFacility>(
      'getIndustryFacilities',
      [],
      concurrency,
    );
  }

  fetchAllIndustrySystems(concurrency?: number): Promise<IndustrySystem[]> {
    return this.fetchAllEndpoint<IndustrySystem>(
      'getIndustrySystems',
      [],
      concurrency,
    );
  }

  streamCharacterIndustryJobs(
    characterId: number,
  ): AsyncGenerator<PageResult<IndustryJob>, void, undefined> {
    return this.streamEndpoint<IndustryJob>(
      'getCharacterIndustryJobs',
      characterId,
    );
  }

  streamCharacterMiningLedger(
    characterId: number,
  ): AsyncGenerator<PageResult<MiningLedgerEntry>, void, undefined> {
    return this.streamEndpoint<MiningLedgerEntry>(
      'getCharacterMiningLedger',
      characterId,
    );
  }

  streamCorporationIndustryJobs(
    corporationId: number,
  ): AsyncGenerator<PageResult<IndustryJob>, void, undefined> {
    return this.streamEndpoint<IndustryJob>(
      'getCorporationIndustryJobs',
      corporationId,
    );
  }

  streamMoonExtractionTimers(
    corporationId: number,
  ): AsyncGenerator<PageResult<MoonExtractionTimer>, void, undefined> {
    return this.streamEndpoint<MoonExtractionTimer>(
      'getMoonExtractionTimers',
      corporationId,
    );
  }

  streamCorporationMiningObservers(
    corporationId: number,
  ): AsyncGenerator<PageResult<MiningObserver>, void, undefined> {
    return this.streamEndpoint<MiningObserver>(
      'getCorporationMiningObservers',
      corporationId,
    );
  }

  streamCorporationMiningObserver(
    corporationId: number,
    observerId: number,
  ): AsyncGenerator<PageResult<MiningObserverEntry>, void, undefined> {
    return this.streamEndpoint<MiningObserverEntry>(
      'getCorporationMiningObserver',
      corporationId,
      observerId,
    );
  }

  streamIndustryFacilities(): AsyncGenerator<
    PageResult<IndustryFacility>,
    void,
    undefined
  > {
    return this.streamEndpoint<IndustryFacility>('getIndustryFacilities');
  }

  streamIndustrySystems(): AsyncGenerator<
    PageResult<IndustrySystem>,
    void,
    undefined
  > {
    return this.streamEndpoint<IndustrySystem>('getIndustrySystems');
  }
}
