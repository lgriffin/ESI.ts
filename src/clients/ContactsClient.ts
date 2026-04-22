import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { contactEndpoints } from '../core/endpoints/contactEndpoints';
import { Contact, ContactLabel } from '../types/api-responses';

export class ContactsClient {
  private api: ReturnType<typeof createClient<typeof contactEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof contactEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, contactEndpoints);
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
      contactIds,
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
   * @param contacts - Contact data including IDs, standings, and optional labels
   * @returns An array of contact IDs that were successfully added
   * @requires Authentication
   */
  postCharacterContacts(
    characterId: number,
    contacts: object,
  ): Promise<number[]> {
    return this.api.addContacts(characterId, contacts) as Promise<number[]>;
  }

  /**
   * Update existing contacts in a character's contact list via a PUT request.
   *
   * @param characterId - The ID of the character whose contacts to update
   * @param contacts - Updated contact data including IDs, standings, and optional labels
   * @requires Authentication
   */
  putCharacterContacts(characterId: number, contacts: object): Promise<void> {
    return this.api.editContacts(characterId, contacts) as Promise<void>;
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

  withMetadata(): WithMetadata<Omit<ContactsClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, contactEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<ContactsClient, 'withMetadata'>
    >;
  }
}
