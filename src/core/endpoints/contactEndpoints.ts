import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  ContactSchema,
  ContactLabelSchema,
  AddedContactIdsSchema,
} from '../../schemas/contacts';

export const contactEndpoints = {
  getAllianceContacts: fromOperation('GetAlliancesAllianceIdContacts', {
    pathParams: ['allianceId'],
    responseSchema: z.array(ContactSchema),
  }),
  getAllianceContactLabels: fromOperation(
    'GetAlliancesAllianceIdContactsLabels',
    {
      pathParams: ['allianceId'],
      responseSchema: z.array(ContactLabelSchema),
    },
  ),
  getCharacterContacts: fromOperation('GetCharactersCharacterIdContacts', {
    pathParams: ['characterId'],
    responseSchema: z.array(ContactSchema),
  }),
  getCharacterContactLabels: fromOperation(
    'GetCharactersCharacterIdContactsLabels',
    {
      pathParams: ['characterId'],
      responseSchema: z.array(ContactLabelSchema),
    },
  ),
  getCorporationContacts: fromOperation(
    'GetCorporationsCorporationIdContacts',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(ContactSchema),
    },
  ),
  getCorporationContactLabels: fromOperation(
    'GetCorporationsCorporationIdContactsLabels',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(ContactLabelSchema),
    },
  ),
  addContacts: fromOperation('PostCharactersCharacterIdContacts', {
    responseSchema: AddedContactIdsSchema,
    pathParams: ['characterId'],
    queryParams: { standing: 'standing' },
    bodyBuilder: (contactIds: number[]) => contactIds,
    requestSchema: z.array(z.number().int()),
  }),
  editContacts: fromOperation('PutCharactersCharacterIdContacts', {
    pathParams: ['characterId'],
    queryParams: { standing: 'standing' },
    bodyBuilder: (contactIds: number[]) => contactIds,
  }),
  deleteCharacterContacts: fromOperation(
    'DeleteCharactersCharacterIdContacts',
    {
      pathParams: ['characterId'],
      queryParams: { contactIds: 'contact_ids' },
    },
  ),
} as const satisfies EndpointMap;
