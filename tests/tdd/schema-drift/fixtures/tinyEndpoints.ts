import { z } from 'zod';

/** A project schema that requires `station_id`, which the tiny spec lacks. */
export const ProjectSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  station_id: z.number(),
  progress: z.looseObject({
    current: z.number(),
    desired: z.number(),
  }),
});

export const StatusSchema = z.looseObject({
  players: z.number(),
  vip: z.boolean().optional(),
});

/** Endpoint definitions written the way src/core/endpoints writes them. */
export const tinyEndpoints = {
  getCorporationProjects: {
    path: 'corporations/{corporationId}/projects',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(ProjectSchema),
  },
  getCorporationProject: {
    path: 'corporations/{corporationId}/projects/{projectId}/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId'],
    responseSchema: ProjectSchema,
  },
  getStatus: {
    path: 'status/',
    method: 'GET',
    requiresAuth: false,
    responseSchema: StatusSchema,
  },
} as const;
