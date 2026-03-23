import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const piEndpoints = {
    getColonies: {
        path: 'characters/{characterId}/planets',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId'],
    },
    getColonyLayout: {
        path: 'characters/{characterId}/planets/{planetId}',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId', 'planetId'],
    },
    getCorporationCustomsOffices: {
        path: 'corporations/{corporationId}/customs_offices',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['corporationId'],
    },
    getSchematicInformation: {
        path: 'universe/schematics/{schematicId}',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['schematicId'],
    },
} as const satisfies EndpointMap;
