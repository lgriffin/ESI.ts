/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { freelanceJobsEndpoints } from '../../core/endpoints/freelanceJobsEndpoints';
import { CharacterFreelanceJobsListingSchema, CorporationFreelanceJobsListingSchema, FreelanceJobDetailSchema, FreelanceJobParticipantSchema, FreelanceJobParticipationSchema, FreelanceJobsListingSchema } from '../../schemas/freelance-jobs';

export class GeneratedFreelanceJobsClient extends BaseEsiClient<typeof freelanceJobsEndpoints> {
  constructor(client: ApiClient) {
    super(client, freelanceJobsEndpoints);
  }

  /**
   * GET getFreelanceJobs
   */
  getFreelanceJobs(before?: string | number | boolean, after?: string | number | boolean): Promise<z.infer<typeof FreelanceJobsListingSchema>> {
    return this.api.getFreelanceJobs(before, after) as Promise<z.infer<typeof FreelanceJobsListingSchema>>;
  }

  /**
   * GET getFreelanceJobById
   */
  getFreelanceJobById(jobId: number | string): Promise<z.infer<typeof FreelanceJobDetailSchema>> {
    return this.api.getFreelanceJobById(jobId) as Promise<z.infer<typeof FreelanceJobDetailSchema>>;
  }

  /**
   * GET getCharacterFreelanceJobs
   * @requires Authentication
   */
  getCharacterFreelanceJobs(characterId: number | string, before?: string | number | boolean, after?: string | number | boolean): Promise<z.infer<typeof CharacterFreelanceJobsListingSchema>> {
    return this.api.getCharacterFreelanceJobs(characterId, before, after) as Promise<z.infer<typeof CharacterFreelanceJobsListingSchema>>;
  }

  /**
   * GET getCharacterFreelanceJobParticipation
   * @requires Authentication
   */
  getCharacterFreelanceJobParticipation(characterId: number | string, jobId: number | string): Promise<z.infer<typeof FreelanceJobParticipationSchema>> {
    return this.api.getCharacterFreelanceJobParticipation(characterId, jobId) as Promise<z.infer<typeof FreelanceJobParticipationSchema>>;
  }

  /**
   * GET getCorporationFreelanceJobs
   * @requires Authentication
   */
  getCorporationFreelanceJobs(corporationId: number | string, before?: string | number | boolean, after?: string | number | boolean): Promise<z.infer<typeof CorporationFreelanceJobsListingSchema>> {
    return this.api.getCorporationFreelanceJobs(corporationId, before, after) as Promise<z.infer<typeof CorporationFreelanceJobsListingSchema>>;
  }

  /**
   * GET getCorporationFreelanceJobParticipants
   * @requires Authentication
   */
  getCorporationFreelanceJobParticipants(corporationId: number | string, jobId: number | string): Promise<(z.infer<typeof FreelanceJobParticipantSchema>)[]> {
    return this.api.getCorporationFreelanceJobParticipants(corporationId, jobId) as Promise<(z.infer<typeof FreelanceJobParticipantSchema>)[]>;
  }
}
