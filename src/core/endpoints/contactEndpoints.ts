import { EndpointMap } from './EndpointDefinition';

export const contactEndpoints = {
  getAllianceContacts: {
    path: 'alliances/{allianceId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
  },
  getAllianceContactLabels: {
    path: 'alliances/{allianceId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
  },
  getCharacterContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterContactLabels: {
    path: 'characters/{characterId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationContacts: {
    path: 'corporations/{corporationId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getCorporationContactLabels: {
    path: 'corporations/{corporationId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  addContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
  },
  editContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
  },
  deleteCharacterContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId'],
    bodyBuilder: (contactIds: number[]) => ({ contact_ids: contactIds }),
  },
} as const satisfies EndpointMap;
