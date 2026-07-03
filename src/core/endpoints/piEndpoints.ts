import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  PlanetaryColonySchema,
  CustomsOfficeSchema,
  ColonyLayoutSchema,
} from '../../schemas/pi';

export const piEndpoints = {
  getColonies: {
    path: 'characters/{characterId}/planets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(PlanetaryColonySchema),
  },
  getColonyLayout: {
    path: 'characters/{characterId}/planets/{planetId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'planetId'],
    responseSchema: ColonyLayoutSchema,
  },
  getCorporationCustomsOffices: {
    path: 'corporations/{corporationId}/customs_offices',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(CustomsOfficeSchema),
  },
  getSchematicInformation: {
    path: 'universe/schematics/{schematicId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['schematicId'],
  },
} as const satisfies EndpointMap;
