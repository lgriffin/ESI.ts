import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { createClient } from '../core/endpoints/createClient';
import { allianceEndpoints } from '../core/endpoints/allianceEndpoints';
import { contactEndpoints } from '../core/endpoints/contactEndpoints';
import {
  AllianceInfo,
  AllianceContact,
  AllianceContactLabel,
  AllianceIcon,
} from '../types/api-responses';
import { logWarn } from '../core/logger/loggerUtil';

export class AllianceClient extends BaseEsiClient<typeof allianceEndpoints> {
  private contactApi: ReturnType<typeof createClient<typeof contactEndpoints>>;

  constructor(client: ApiClient) {
    super(client, allianceEndpoints);
    this.contactApi = createClient(client, contactEndpoints);
  }

  /**
   * Retrieve public information about an alliance.
   *
   * @param allianceId - The ID of the alliance to look up
   * @returns Public alliance information including name, ticker, and founding date
   */
  getAllianceById(allianceId: number): Promise<AllianceInfo> {
    return this.api.getAllianceById(allianceId);
  }

  /**
   * Retrieve contacts for an alliance.
   *
   * @deprecated Use ContactsClient.getAllianceContacts() instead
   * @param allianceId - The ID of the alliance whose contacts to retrieve
   * @returns A list of alliance contacts with standings and contact types
   * @requires Authentication
   */
  getContacts(allianceId: number): Promise<AllianceContact[]> {
    logWarn(
      'AllianceClient.getContacts() is deprecated. Use ContactsClient.getAllianceContacts() instead. Planned removal in next major version.',
    );
    // Schema mismatch: ContactSchema uses a wider contact_type enum than AllianceContactSchema.
    // Cast through unknown until schemas are unified.
    return this.contactApi.getAllianceContacts(
      allianceId,
    ) as unknown as Promise<AllianceContact[]>;
  }

  /**
   * Retrieve custom contact labels for an alliance.
   *
   * @deprecated Use ContactsClient.getAllianceContactLabels() instead
   * @param allianceId - The ID of the alliance whose contact labels to retrieve
   * @returns A list of custom labels used to categorize alliance contacts
   * @requires Authentication
   */
  getContactLabels(allianceId: number): Promise<AllianceContactLabel[]> {
    logWarn(
      'AllianceClient.getContactLabels() is deprecated. Use ContactsClient.getAllianceContactLabels() instead. Planned removal in next major version.',
    );
    // Schema mismatch: ContactLabelSchema vs AllianceContactLabelSchema are structurally
    // identical but TypeScript treats them as distinct nominal types from different schemas.
    return this.contactApi.getAllianceContactLabels(allianceId);
  }

  /**
   * Retrieve the list of corporation IDs that are members of an alliance.
   *
   * @param allianceId - The ID of the alliance whose member corporations to retrieve
   * @returns An array of corporation IDs belonging to the alliance
   */
  getCorporations(allianceId: number): Promise<number[]> {
    return this.api.getCorporations(allianceId);
  }

  /**
   * Retrieve icon URLs for an alliance.
   *
   * @param allianceId - The ID of the alliance whose icons to retrieve
   * @returns Icon URLs at various resolutions for the alliance
   */
  getIcons(allianceId: number): Promise<AllianceIcon> {
    return this.api.getIcons(allianceId);
  }

  /**
   * Retrieve a list of all active alliance IDs in EVE Online.
   *
   * @returns An array of all active alliance IDs
   */
  getAlliances(): Promise<number[]> {
    return this.api.getAlliances();
  }
}
