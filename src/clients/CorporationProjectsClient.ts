import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { corporationProjectEndpoints } from '../core/endpoints/corporationProjectEndpoints';
import {
  CorporationProject,
  CorporationProjectContribution,
  CorporationProjectContributorsListing,
  CorporationProjectsListing,
} from '../types/api-responses';

export class CorporationProjectsClient extends BaseEsiClient<
  typeof corporationProjectEndpoints
> {
  constructor(client: ApiClient) {
    super(client, corporationProjectEndpoints);
  }

  /**
   * Retrieves one page of a corporation's projects.
   *
   * The list is cursor paginated: pass `cursor.after` from one page as
   * `after` to read the next. Tokens are opaque; an empty `projects` array
   * marks the end of the list.
   *
   * @param corporationId - The ID of the corporation
   * @param before - Optional cursor token to read records before
   * @param after - Optional cursor token to read records after
   * @returns A page of projects and its cursor
   * @requires Authentication
   */
  getCorporationProjects(
    corporationId: number,
    before?: string,
    after?: string,
  ): Promise<CorporationProjectsListing> {
    return this.api.getCorporationProjects(corporationId, before, after);
  }

  /**
   * Retrieves details of a specific corporation project.
   *
   * @param corporationId - The ID of the corporation
   * @param projectId - The project's UUID
   * @returns The corporation project details
   * @requires Authentication
   */
  getCorporationProject(
    corporationId: number,
    projectId: string,
  ): Promise<CorporationProject> {
    return this.api.getCorporationProject(corporationId, projectId);
  }

  /**
   * Retrieves a character's contribution to a specific corporation project.
   *
   * @param corporationId - The ID of the corporation
   * @param projectId - The project's UUID
   * @param characterId - The ID of the character
   * @returns The character's contribution details
   * @requires Authentication
   */
  getCorporationProjectContribution(
    corporationId: number,
    projectId: string,
    characterId: number,
  ): Promise<CorporationProjectContribution> {
    return this.api.getCorporationProjectContribution(
      corporationId,
      projectId,
      characterId,
    );
  }

  /**
   * Retrieves one page of the contributors to a corporation project.
   *
   * Cursor paginated in the same way as {@link getCorporationProjects}.
   *
   * @param corporationId - The ID of the corporation
   * @param projectId - The project's UUID
   * @param before - Optional cursor token to read records before
   * @param after - Optional cursor token to read records after
   * @returns A page of contributors and its cursor
   * @requires Authentication
   */
  getCorporationProjectContributors(
    corporationId: number,
    projectId: string,
    before?: string,
    after?: string,
  ): Promise<CorporationProjectContributorsListing> {
    return this.api.getCorporationProjectContributors(
      corporationId,
      projectId,
      before,
      after,
    );
  }
}
