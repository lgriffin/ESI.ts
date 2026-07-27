/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { contactEndpoints } from '../../core/endpoints/contactEndpoints';
import { ContactLabelSchema, ContactSchema } from '../../schemas/contacts';

export class GeneratedContactClient extends BaseEsiClient<typeof contactEndpoints> {
  constructor(client: ApiClient) {
    super(client, contactEndpoints);
  }

  /**
   * GET getAllianceContacts
   * @requires Authentication
   */
  getAllianceContacts(allianceId: number | string): Promise<(z.infer<typeof ContactSchema>)[]> {
    return this.api.getAllianceContacts(allianceId) as Promise<(z.infer<typeof ContactSchema>)[]>;
  }

  /**
   * GET getAllianceContactLabels
   * @requires Authentication
   */
  getAllianceContactLabels(allianceId: number | string): Promise<(z.infer<typeof ContactLabelSchema>)[]> {
    return this.api.getAllianceContactLabels(allianceId) as Promise<(z.infer<typeof ContactLabelSchema>)[]>;
  }

  /**
   * GET getCharacterContacts
   * @requires Authentication
   */
  getCharacterContacts(characterId: number | string): Promise<(z.infer<typeof ContactSchema>)[]> {
    return this.api.getCharacterContacts(characterId) as Promise<(z.infer<typeof ContactSchema>)[]>;
  }

  /**
   * GET getCharacterContactLabels
   * @requires Authentication
   */
  getCharacterContactLabels(characterId: number | string): Promise<(z.infer<typeof ContactLabelSchema>)[]> {
    return this.api.getCharacterContactLabels(characterId) as Promise<(z.infer<typeof ContactLabelSchema>)[]>;
  }

  /**
   * GET getCorporationContacts
   * @requires Authentication
   */
  getCorporationContacts(corporationId: number | string): Promise<(z.infer<typeof ContactSchema>)[]> {
    return this.api.getCorporationContacts(corporationId) as Promise<(z.infer<typeof ContactSchema>)[]>;
  }

  /**
   * GET getCorporationContactLabels
   * @requires Authentication
   */
  getCorporationContactLabels(corporationId: number | string): Promise<(z.infer<typeof ContactLabelSchema>)[]> {
    return this.api.getCorporationContactLabels(corporationId) as Promise<(z.infer<typeof ContactLabelSchema>)[]>;
  }

  /**
   * POST addContacts
   * @requires Authentication
   */
  addContacts(...args: Parameters<(typeof this.api)['addContacts']>): Promise<unknown> {
    return this.api.addContacts(...args) as Promise<unknown>;
  }

  /**
   * PUT editContacts
   * @requires Authentication
   */
  editContacts(...args: Parameters<(typeof this.api)['editContacts']>): Promise<unknown> {
    return this.api.editContacts(...args) as Promise<unknown>;
  }

  /**
   * DELETE deleteCharacterContacts
   * @requires Authentication
   */
  deleteCharacterContacts(characterId: number | string, contactIds?: string | number | boolean): Promise<unknown> {
    return this.api.deleteCharacterContacts(characterId, contactIds) as Promise<unknown>;
  }
}
