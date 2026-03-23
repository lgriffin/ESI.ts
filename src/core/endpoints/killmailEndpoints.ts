import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const killmailEndpoints = {
    getCharacterRecentKillmails: {
        path: 'characters/{characterId}/killmails/recent',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId'],
    },
    getCorporationRecentKillmails: {
        path: 'corporations/{corporationId}/killmails/recent',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['corporationId'],
    },
    getKillmail: {
        path: 'killmails/{killmailId}/{killmailHash}',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['killmailId', 'killmailHash'],
    },
} as const satisfies EndpointMap;
