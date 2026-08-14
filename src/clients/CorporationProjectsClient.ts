import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { corporationProjectEndpoints } from '../core/endpoints/corporationProjectEndpoints';
import {
  CorporationProject,
  CorporationProjectContribution,
  CorporationProjectContributor,
} from '../types/api-responses';

export class CorporationProjectsClient extends BaseEsiClient<
  typeof corporationProjectEndpoints
> {
  constructor(client: ApiClient) {
    super(client, corporationProjectEndpoints);
  }

  /**
   * Retrieves a list of projects for a corporation.
   *
   * @param corporationId - The ID of the corporation
   * @returns An array of corporation projects
   * @requires Authentication
   */
  getCorporationProjects(corporationId: number): Promise<CorporationProject[]> {
    return this.api.getCorporationProjects(corporationId);
  }

  /**
   * Retrieves details of a specific corporation project.
   *
   * @param corporationId - The ID of the corporation
   * @param projectId - The ID of the project
   * @returns The corporation project details
   * @requires Authentication
   */
  getCorporationProject(
    corporationId: number,
    projectId: number,
  ): Promise<CorporationProject> {
    return this.api.getCorporationProject(corporationId, projectId);
  }

  /**
   * Retrieves a character's contribution to a specific corporation project.
   *
   * @param corporationId - The ID of the corporation
   * @param projectId - The ID of the project
   * @param characterId - The ID of the character
   * @returns The character's contribution details
   * @requires Authentication
   */
  getCorporationProjectContribution(
    corporationId: number,
    projectId: number,
    characterId: number,
  ): Promise<CorporationProjectContribution> {
    return this.api.getCorporationProjectContribution(
      corporationId,
      projectId,
      characterId,
    );
  }

  /**
   * Retrieves a list of contributors to a specific corporation project.
   *
   * @param corporationId - The ID of the corporation
   * @param projectId - The ID of the project
   * @returns An array of project contributors
   * @requires Authentication
   */
  getCorporationProjectContributors(
    corporationId: number,
    projectId: number,
  ): Promise<CorporationProjectContributor[]> {
    return this.api.getCorporationProjectContributors(corporationId, projectId);
  }
}
