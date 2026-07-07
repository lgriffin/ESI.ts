import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { contactEndpoints } from '../core/endpoints/contactEndpoints';
import { Contact, ContactLabel } from '../types/api-responses';

export class ContactsClient extends BaseEsiClient<typeof contactEndpoints> {
  constructor(client: ApiClient) {
    super(client, contactEndpoints);
  }

  /**
   * Retrieve contacts for an alliance.
   *
   * @param allianceId - The ID of the alliance whose contacts to retrieve
   * @returns A list of alliance contacts with standings and contact types
   * @requires Authentication
   */
  getAllianceContacts(allianceId: number): Promise<Contact[]> {
    return this.api.getAllianceContacts(allianceId) as Promise<Contact[]>;
  }

  /**
   * Retrieve custom contact labels for an alliance.
   *
   * @param allianceId - The ID of the alliance whose contact labels to retrieve
   * @returns A list of custom labels used to categorize alliance contacts
   * @requires Authentication
   */
  getAllianceContactLabels(allianceId: number): Promise<ContactLabel[]> {
    return this.api.getAllianceContactLabels(allianceId) as Promise<
      ContactLabel[]
    >;
  }

  /**
   * Delete contacts from a character's contact list.
   *
   * @param characterId - The ID of the character whose contacts to delete
   * @param contactIds - An array of contact IDs to remove
   * @requires Authentication
   */
  deleteCharacterContacts(
    characterId: number,
    contactIds: number[],
  ): Promise<void> {
    return this.api.deleteCharacterContacts(
      characterId,
      contactIds.join(','),
    ) as Promise<void>;
  }

  /**
   * Retrieve a character's contact list.
   *
   * @param characterId - The ID of the character whose contacts to retrieve
   * @returns A list of character contacts with standings, labels, and contact types
   * @requires Authentication
   */
  getCharacterContacts(characterId: number): Promise<Contact[]> {
    return this.api.getCharacterContacts(characterId) as Promise<Contact[]>;
  }

  /**
   * Add contacts to a character's contact list via a POST request.
   *
   * @param characterId - The ID of the character to add contacts for
   * @param standing - Standing value for the contacts (-10 to 10)
   * @param contactIds - Array of character/corporation/alliance IDs to add
   * @returns An array of contact IDs that were successfully added
   * @requires Authentication
   */
  postCharacterContacts(
    characterId: number,
    standing: number,
    contactIds: number[],
  ): Promise<number[]> {
    return this.api.addContacts(characterId, standing, contactIds) as Promise<
      number[]
    >;
  }

  /**
   * Update existing contacts in a character's contact list via a PUT request.
   *
   * @param characterId - The ID of the character whose contacts to update
   * @param standing - New standing value for the contacts (-10 to 10)
   * @param contactIds - Array of contact IDs to update
   * @requires Authentication
   */
  putCharacterContacts(
    characterId: number,
    standing: number,
    contactIds: number[],
  ): Promise<void> {
    return this.api.editContacts(
      characterId,
      standing,
      contactIds,
    ) as Promise<void>;
  }

  /**
   * Retrieve custom contact labels for a character.
   *
   * @param characterId - The ID of the character whose contact labels to retrieve
   * @returns A list of custom labels used to categorize character contacts
   * @requires Authentication
   */
  getCharacterContactLabels(characterId: number): Promise<ContactLabel[]> {
    return this.api.getCharacterContactLabels(characterId) as Promise<
      ContactLabel[]
    >;
  }

  /**
   * Retrieve contacts for a corporation.
   *
   * @param corporationId - The ID of the corporation whose contacts to retrieve
   * @returns A list of corporation contacts with standings and contact types
   * @requires Authentication
   */
  getCorporationContacts(corporationId: number): Promise<Contact[]> {
    return this.api.getCorporationContacts(corporationId) as Promise<Contact[]>;
  }

  /**
   * Retrieve custom contact labels for a corporation.
   *
   * @param corporationId - The ID of the corporation whose contact labels to retrieve
   * @returns A list of custom labels used to categorize corporation contacts
   * @requires Authentication
   */
  getCorporationContactLabels(corporationId: number): Promise<ContactLabel[]> {
    return this.api.getCorporationContactLabels(corporationId) as Promise<
      ContactLabel[]
    >;
  }
}
