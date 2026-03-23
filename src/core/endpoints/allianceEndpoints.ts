import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const allianceEndpoints = {
    getAllianceById: {
        path: 'alliances/{allianceId}/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['allianceId'],
    },
    getContacts: {
        path: 'alliances/{allianceId}/contacts',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['allianceId'],
    },
    getContactLabels: {
        path: 'alliances/{allianceId}/contacts/labels',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['allianceId'],
    },
    getCorporations: {
        path: 'alliances/{allianceId}/corporations/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['allianceId'],
    },
    getIcons: {
        path: 'alliances/{allianceId}/icons/',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['allianceId'],
    },
    getAlliances: {
        path: 'alliances',
        method: 'GET',
        requiresAuth: false,
    },
} as const satisfies EndpointMap;
