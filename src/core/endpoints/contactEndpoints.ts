import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { ContactSchema, ContactLabelSchema } from '../../schemas/contacts';

export const contactEndpoints = {
  getAllianceContacts: {
    path: 'alliances/{allianceId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
    responseSchema: z.array(ContactSchema),
  },
  getAllianceContactLabels: {
    path: 'alliances/{allianceId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
    responseSchema: z.array(ContactLabelSchema),
  },
  getCharacterContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(ContactSchema),
  },
  getCharacterContactLabels: {
    path: 'characters/{characterId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(ContactLabelSchema),
  },
  getCorporationContacts: {
    path: 'corporations/{corporationId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(ContactSchema),
  },
  getCorporationContactLabels: {
    path: 'corporations/{corporationId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(ContactLabelSchema),
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
    bodyBuilder: (contactIds: number[]) => contactIds,
  },
} as const satisfies EndpointMap;
