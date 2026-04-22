import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { freelanceJobsEndpoints } from '../core/endpoints/freelanceJobsEndpoints';
import {
  FreelanceJobsListing,
  FreelanceJobDetail,
  CharacterFreelanceJobsListing,
  FreelanceJobParticipation,
  CorporationFreelanceJobsListing,
  FreelanceJobParticipant,
} from '../types/api-responses';

export class FreelanceJobsClient {
  private api: ReturnType<typeof createClient<typeof freelanceJobsEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<
    typeof createClient<typeof freelanceJobsEndpoints>
  >;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, freelanceJobsEndpoints);
  }

  /**
   * Retrieves a paginated listing of all publicly available freelance jobs.
   *
   * @param before - Optional cursor token for fetching the previous page of results
   * @param after - Optional cursor token for fetching the next page of results
   * @returns A listing of freelance jobs with cursor pagination metadata
   */
  getFreelanceJobs(
    before?: string,
    after?: string,
  ): Promise<FreelanceJobsListing> {
    return this.api.getFreelanceJobs(
      before,
      after,
    ) as Promise<FreelanceJobsListing>;
  }

  /**
   * Retrieves detailed information about a specific freelance job.
   *
   * @param jobId - The unique identifier of the freelance job
   * @returns Detailed information about the freelance job
   */
  getFreelanceJobById(jobId: string): Promise<FreelanceJobDetail> {
    return this.api.getFreelanceJobById(jobId) as Promise<FreelanceJobDetail>;
  }

  /**
   * Retrieves a paginated listing of freelance jobs associated with a specific character.
   *
   * @param characterId - The ID of the character
   * @param before - Optional cursor token for fetching the previous page of results
   * @param after - Optional cursor token for fetching the next page of results
   * @returns A listing of the character's freelance jobs with cursor pagination metadata
   * @requires Authentication
   */
  getCharacterFreelanceJobs(
    characterId: number,
    before?: string,
    after?: string,
  ): Promise<CharacterFreelanceJobsListing> {
    return this.api.getCharacterFreelanceJobs(
      characterId,
      before,
      after,
    ) as Promise<CharacterFreelanceJobsListing>;
  }

  /**
   * Retrieves a character's participation details for a specific freelance job.
   *
   * @param characterId - The ID of the character
   * @param jobId - The unique identifier of the freelance job
   * @returns The character's participation details for the job
   * @requires Authentication
   */
  getCharacterFreelanceJobParticipation(
    characterId: number,
    jobId: string,
  ): Promise<FreelanceJobParticipation> {
    return this.api.getCharacterFreelanceJobParticipation(
      characterId,
      jobId,
    ) as Promise<FreelanceJobParticipation>;
  }

  /**
   * Retrieves a paginated listing of freelance jobs associated with a specific corporation.
   *
   * @param corporationId - The ID of the corporation
   * @param before - Optional cursor token for fetching the previous page of results
   * @param after - Optional cursor token for fetching the next page of results
   * @returns A listing of the corporation's freelance jobs with cursor pagination metadata
   * @requires Authentication
   */
  getCorporationFreelanceJobs(
    corporationId: number,
    before?: string,
    after?: string,
  ): Promise<CorporationFreelanceJobsListing> {
    return this.api.getCorporationFreelanceJobs(
      corporationId,
      before,
      after,
    ) as Promise<CorporationFreelanceJobsListing>;
  }

  /**
   * Retrieves the list of participants from a corporation in a specific freelance job.
   *
   * @param corporationId - The ID of the corporation
   * @param jobId - The unique identifier of the freelance job
   * @returns An array of participants from the corporation in the job
   * @requires Authentication
   */
  getCorporationFreelanceJobParticipants(
    corporationId: number,
    jobId: string,
  ): Promise<FreelanceJobParticipant[]> {
    return this.api.getCorporationFreelanceJobParticipants(
      corporationId,
      jobId,
    ) as Promise<FreelanceJobParticipant[]>;
  }

  withMetadata(): WithMetadata<Omit<FreelanceJobsClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, freelanceJobsEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<FreelanceJobsClient, 'withMetadata'>
    >;
  }
}
