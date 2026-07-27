/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { mailEndpoints } from '../../core/endpoints/mailEndpoints';
import { MailLabelsResponseSchema, MailMessageSchema, MailingListSchema } from '../../schemas/mail';

export class GeneratedMailClient extends BaseEsiClient<typeof mailEndpoints> {
  constructor(client: ApiClient) {
    super(client, mailEndpoints);
  }

  /**
   * GET getCharacterMailHeaders
   * @requires Authentication
   */
  getCharacterMailHeaders(characterId: number | string): Promise<(z.infer<typeof MailMessageSchema>)[]> {
    return this.api.getCharacterMailHeaders(characterId) as Promise<(z.infer<typeof MailMessageSchema>)[]>;
  }

  /**
   * POST sendMail
   * @requires Authentication
   */
  sendMail(characterId: number | string, body: unknown): Promise<unknown> {
    return (this.api.sendMail as any)(characterId, body) as Promise<unknown>;
  }

  /**
   * GET getMail
   * @requires Authentication
   */
  getMail(characterId: number | string, mailId: number | string): Promise<z.infer<typeof MailMessageSchema>> {
    return this.api.getMail(characterId, mailId) as Promise<z.infer<typeof MailMessageSchema>>;
  }

  /**
   * DELETE deleteMail
   * @requires Authentication
   */
  deleteMail(characterId: number | string, mailId: number | string): Promise<unknown> {
    return this.api.deleteMail(characterId, mailId) as Promise<unknown>;
  }

  /**
   * PUT updateMailMetadata
   * @requires Authentication
   */
  updateMailMetadata(characterId: number | string, mailId: number | string, body: unknown): Promise<unknown> {
    return (this.api.updateMailMetadata as any)(characterId, mailId, body) as Promise<unknown>;
  }

  /**
   * GET getMailLabels
   * @requires Authentication
   */
  getMailLabels(characterId: number | string): Promise<z.infer<typeof MailLabelsResponseSchema>> {
    return this.api.getMailLabels(characterId) as Promise<z.infer<typeof MailLabelsResponseSchema>>;
  }

  /**
   * POST createMailLabel
   * @requires Authentication
   */
  createMailLabel(characterId: number | string, body: unknown): Promise<unknown> {
    return (this.api.createMailLabel as any)(characterId, body) as Promise<unknown>;
  }

  /**
   * DELETE deleteMailLabel
   * @requires Authentication
   */
  deleteMailLabel(characterId: number | string, labelId: number | string): Promise<unknown> {
    return this.api.deleteMailLabel(characterId, labelId) as Promise<unknown>;
  }

  /**
   * GET getMailingLists
   * @requires Authentication
   */
  getMailingLists(characterId: number | string): Promise<(z.infer<typeof MailingListSchema>)[]> {
    return this.api.getMailingLists(characterId) as Promise<(z.infer<typeof MailingListSchema>)[]>;
  }
}
