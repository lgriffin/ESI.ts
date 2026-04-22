import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const universeEndpoints = {
  getAncestries: {
    path: 'universe/ancestries',
    method: 'GET',
    requiresAuth: false,
  },
  getAsteroidBeltInfo: {
    path: 'universe/asteroid_belts/{asteroidBeltId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['asteroidBeltId'],
  },
  getBloodlines: {
    path: 'universe/bloodlines',
    method: 'GET',
    requiresAuth: false,
  },
  getCategories: {
    path: 'universe/categories',
    method: 'GET',
    requiresAuth: false,
  },
  getCategoryById: {
    path: 'universe/categories/{categoryId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['categoryId'],
  },
  getConstellations: {
    path: 'universe/constellations',
    method: 'GET',
    requiresAuth: false,
  },
  getConstellationById: {
    path: 'universe/constellations/{constellationId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['constellationId'],
  },
  getFactions: {
    path: 'universe/factions',
    method: 'GET',
    requiresAuth: false,
  },
  getGraphics: {
    path: 'universe/graphics',
    method: 'GET',
    requiresAuth: false,
  },
  getGraphicById: {
    path: 'universe/graphics/{graphicId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['graphicId'],
  },
  getItemGroups: {
    path: 'universe/groups',
    method: 'GET',
    requiresAuth: false,
  },
  getItemGroupById: {
    path: 'universe/groups/{groupId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['groupId'],
  },
  postBulkNamesToIds: {
    path: 'universe/ids',
    method: 'POST',
    requiresAuth: false,
    bodyBuilder: (ids: number[]) => ({ ids }),
  },
  getMoonById: {
    path: 'universe/moons/{moonId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['moonId'],
  },
  postNamesAndCategories: {
    path: 'universe/names',
    method: 'POST',
    requiresAuth: false,
    bodyBuilder: (ids: number[]) => ({ ids }),
  },
  getPlanetById: {
    path: 'universe/planets/{planetId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['planetId'],
  },
  getRaces: {
    path: 'universe/races',
    method: 'GET',
    requiresAuth: false,
  },
  getRegions: {
    path: 'universe/regions',
    method: 'GET',
    requiresAuth: false,
  },
  getRegionById: {
    path: 'universe/regions/{regionId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
  },
  getSchematicById: {
    path: 'universe/schematics/{schematicId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['schematicId'],
  },
  getStargateById: {
    path: 'universe/stargates/{stargateId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['stargateId'],
  },
  getStarById: {
    path: 'universe/stars/{starId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['starId'],
  },
  getStationById: {
    path: 'universe/stations/{stationId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['stationId'],
  },
  getStructures: {
    path: 'universe/structures',
    method: 'GET',
    requiresAuth: false,
  },
  getStructureById: {
    path: 'universe/structures/{structureId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['structureId'],
  },
  getSystemJumps: {
    path: 'universe/system_jumps',
    method: 'GET',
    requiresAuth: false,
  },
  getSystemKills: {
    path: 'universe/system_kills',
    method: 'GET',
    requiresAuth: false,
  },
  getSystems: {
    path: 'universe/systems',
    method: 'GET',
    requiresAuth: false,
  },
  getSystemById: {
    path: 'universe/systems/{systemId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['systemId'],
  },
  getTypes: {
    path: 'universe/types',
    method: 'GET',
    requiresAuth: false,
  },
  getTypeById: {
    path: 'universe/types/{typeId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['typeId'],
  },
} as const satisfies EndpointMap;
