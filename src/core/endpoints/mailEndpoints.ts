import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  MailMessageSchema,
  MailLabelSchema,
  MailLabelsResponseSchema,
  MailingListSchema,
} from '../../schemas/mail';

export const mailEndpoints = {
  getCharacterMailHeaders: {
    path: 'characters/{characterId}/mail/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MailMessageSchema),
  },
  sendMail: {
    path: 'characters/{characterId}/mail/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    requestSchema: z.looseObject({
      recipients: z.array(
        z.looseObject({
          recipient_id: z.number().int(),
          recipient_type: z.enum([
            'alliance',
            'character',
            'corporation',
            'mailing_list',
          ]),
        }),
      ),
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
  },
  getMail: {
    path: 'characters/{characterId}/mail/{mailId}/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'mailId'],
    responseSchema: MailMessageSchema,
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
    responseSchema: MailLabelsResponseSchema,
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
    responseSchema: z.array(MailingListSchema),
  },
} as const satisfies EndpointMap;
