import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const mailEndpoints = {
    getCharacterMailHeaders: {
        path: 'characters/{characterId}/mail/',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId'],
    },
    sendMail: {
        path: 'characters/{characterId}/mail/',
        method: 'POST',
        requiresAuth: true,
        pathParams: ['characterId'],
        hasBody: true,
    },
    getMail: {
        path: 'characters/{characterId}/mail/{mailId}/',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId', 'mailId'],
    },
    deleteMail: {
        path: 'characters/{characterId}/mail/{mailId}/',
        method: 'DELETE',
        requiresAuth: true,
        pathParams: ['characterId', 'mailId'],
    },
    updateMailMetadata: {
        path: 'characters/{characterId}/mail/{mailId}/',
        method: 'PUT',
        requiresAuth: true,
        pathParams: ['characterId', 'mailId'],
        hasBody: true,
    },
    getMailLabels: {
        path: 'characters/{characterId}/mail/labels/',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId'],
    },
    createMailLabel: {
        path: 'characters/{characterId}/mail/labels/',
        method: 'POST',
        requiresAuth: true,
        pathParams: ['characterId'],
        hasBody: true,
    },
    deleteMailLabel: {
        path: 'characters/{characterId}/mail/labels/{labelId}/',
        method: 'DELETE',
        requiresAuth: true,
        pathParams: ['characterId', 'labelId'],
    },
    getMailingLists: {
        path: 'characters/{characterId}/mail/lists/',
        method: 'GET',
        requiresAuth: true,
        pathParams: ['characterId'],
    },
} as const satisfies EndpointMap;
