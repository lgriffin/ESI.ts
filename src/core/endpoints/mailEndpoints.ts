import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  MailHeaderSchema,
  MailMessageSchema,
  MailLabelSchema,
  MailLabelsResponseSchema,
  MailingListSchema,
  MailIdSchema,
  MailLabelIdSchema,
} from '../../schemas/mail';

export const mailEndpoints = {
  getCharacterMailHeaders: fromOperation('GetCharactersCharacterIdMail', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MailHeaderSchema),
  }),
  sendMail: fromOperation('PostCharactersCharacterIdMail', {
    trailingSlash: true,
    responseSchema: MailIdSchema,
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
  }),
  getMail: fromOperation('GetCharactersCharacterIdMailMailId', {
    trailingSlash: true,
    pathParams: ['characterId', 'mailId'],
    responseSchema: MailMessageSchema,
  }),
  deleteMail: fromOperation('DeleteCharactersCharacterIdMailMailId', {
    trailingSlash: true,
    pathParams: ['characterId', 'mailId'],
  }),
  updateMailMetadata: fromOperation('PutCharactersCharacterIdMailMailId', {
    trailingSlash: true,
    pathParams: ['characterId', 'mailId'],
    hasBody: true,
  }),
  getMailLabels: fromOperation('GetCharactersCharacterIdMailLabels', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: MailLabelsResponseSchema,
  }),
  createMailLabel: fromOperation('PostCharactersCharacterIdMailLabels', {
    trailingSlash: true,
    responseSchema: MailLabelIdSchema,
    pathParams: ['characterId'],
    hasBody: true,
  }),
  deleteMailLabel: fromOperation(
    'DeleteCharactersCharacterIdMailLabelsLabelId',
    {
      trailingSlash: true,
      pathParams: ['characterId', 'labelId'],
    },
  ),
  getMailingLists: fromOperation('GetCharactersCharacterIdMailLists', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MailingListSchema),
  }),
} as const satisfies EndpointMap;
