import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { allianceEndpoints } from '../core/endpoints/allianceEndpoints';
import { contactEndpoints } from '../core/endpoints/contactEndpoints';
import {
  AllianceInfo,
  AllianceContact,
  AllianceContactLabel,
  AllianceIcon,
} from '../types/api-responses';

export class AllianceClient {
  private api: ReturnType<typeof createClient<typeof allianceEndpoints>>;
  private contactApi: ReturnType<typeof createClient<typeof contactEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof allianceEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, allianceEndpoints);
    this.contactApi = createClient(client, contactEndpoints);
  }

  /**
   * Retrieve public information about an alliance.
   *
   * @param allianceId - The ID of the alliance to look up
   * @returns Public alliance information including name, ticker, and founding date
   */
  getAllianceById(allianceId: number): Promise<AllianceInfo> {
    return this.api.getAllianceById(allianceId) as Promise<AllianceInfo>;
  }

  /**
   * Retrieve contacts for an alliance.
   *
   * @param allianceId - The ID of the alliance whose contacts to retrieve
   * @returns A list of alliance contacts with standings and contact types
   * @requires Authentication
   */
  getContacts(allianceId: number): Promise<AllianceContact[]> {
    return this.contactApi.getAllianceContacts(allianceId) as Promise<
      AllianceContact[]
    >;
  }

  /**
   * Retrieve custom contact labels for an alliance.
   *
   * @param allianceId - The ID of the alliance whose contact labels to retrieve
   * @returns A list of custom labels used to categorize alliance contacts
   * @requires Authentication
   */
  getContactLabels(allianceId: number): Promise<AllianceContactLabel[]> {
    return this.contactApi.getAllianceContactLabels(allianceId) as Promise<
      AllianceContactLabel[]
    >;
  }

  /**
   * Retrieve the list of corporation IDs that are members of an alliance.
   *
   * @param allianceId - The ID of the alliance whose member corporations to retrieve
   * @returns An array of corporation IDs belonging to the alliance
   */
  getCorporations(allianceId: number): Promise<number[]> {
    return this.api.getCorporations(allianceId) as Promise<number[]>;
  }

  /**
   * Retrieve icon URLs for an alliance.
   *
   * @param allianceId - The ID of the alliance whose icons to retrieve
   * @returns Icon URLs at various resolutions for the alliance
   */
  getIcons(allianceId: number): Promise<AllianceIcon> {
    return this.api.getIcons(allianceId) as Promise<AllianceIcon>;
  }

  /**
   * Retrieve a list of all active alliance IDs in EVE Online.
   *
   * @returns An array of all active alliance IDs
   */
  getAlliances(): Promise<number[]> {
    return this.api.getAlliances() as Promise<number[]>;
  }

  withMetadata(): WithMetadata<Omit<AllianceClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, allianceEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<AllianceClient, 'withMetadata'>
    >;
  }
}
