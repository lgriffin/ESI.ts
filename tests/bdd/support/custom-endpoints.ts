/**
 * A domain client of the application's own, for
 * 0075-custom-endpoint-maps.feature: BaseEsiClient over an endpoint map that
 * marks one route as cursor-paginated, the way an application extends the
 * library for a route it does not ship. No shipped endpoint map uses
 * `cursorPagination` today, so only such a client reaches that path.
 */
import { z } from 'zod';
import { BaseEsiClient } from '../../../src/clients/BaseEsiClient';
import type { ApiClient } from '../../../src/core/ApiClient';
import type { CursorOptions } from '../../../src/core/endpoints/createClient';
import type { EsiClient } from '../../../src/EsiClient';
import type { World } from './world';

/** The project list route alone: the exact path, with or without a query. */
export const PROJECT_LIST_PATH = /\/corporations\/98000001\/projects\/?(\?|$)/;

const projectEndpoints = {
  listProjects: {
    path: 'corporations/{corporationId}/projects',
    method: 'GET' as const,
    requiresAuth: false,
    pathParams: ['corporationId'],
    cursorPagination: true,
    responseSchema: z.array(z.looseObject({ id: z.string() })),
  },
};

export class ProjectsClient extends BaseEsiClient<typeof projectEndpoints> {
  constructor(client: ApiClient) {
    super(client, projectEndpoints);
  }

  listProjects(
    corporationId: number,
    cursor?: CursorOptions,
  ): Promise<unknown> {
    // The map is typed loosely here; the method's arguments are the path
    // parameter and the cursor, as createClient reads them.
    const call = this.api.listProjects as (
      ...args: unknown[]
    ) => Promise<unknown>;
    return call(corporationId, cursor);
  }
}

export function apiClientOf(client: EsiClient): ApiClient {
  return (client as unknown as { apiClient: ApiClient }).apiClient;
}

export function projectsClient(world: World): ProjectsClient {
  world.values.projectsClient ??= new ProjectsClient(apiClientOf(world.client));
  return world.values.projectsClient as ProjectsClient;
}

export const project = (id: string) => ({ id });
