import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { mailEndpoints } from '../core/endpoints/mailEndpoints';
import { MailMessage, MailLabel } from '../types/api-responses';

export class MailClient {
  private api: ReturnType<typeof createClient<typeof mailEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof mailEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, mailEndpoints);
  }

  /**
   * Retrieves the mail headers (subject, sender, timestamp) for a character's inbox.
   *
   * @param characterId - The ID of the character whose mail headers to fetch
   * @returns A list of mail message headers
   * @requires Authentication
   */
  getMailHeaders(characterId: number): Promise<MailMessage[]> {
    return this.api.getCharacterMailHeaders(characterId) as Promise<
      MailMessage[]
    >;
  }

  /**
   * Sends a new mail on behalf of a character via POST.
   *
   * @param characterId - The ID of the character sending the mail
   * @param body - The mail content including recipients, subject, and body text
   * @returns The ID of the newly created mail
   * @requires Authentication
   */
  sendMail(characterId: number, body: object): Promise<number> {
    return this.api.sendMail(characterId, body) as Promise<number>;
  }

  /**
   * Deletes a specific mail from a character's mailbox.
   *
   * @param characterId - The ID of the character who owns the mail
   * @param mailId - The ID of the mail to delete
   * @returns void
   * @requires Authentication
   */
  deleteMail(characterId: number, mailId: number): Promise<void> {
    return this.api.deleteMail(characterId, mailId) as Promise<void>;
  }

  /**
   * Retrieves the full contents of a specific mail including its body text.
   *
   * @param characterId - The ID of the character who owns the mail
   * @param mailId - The ID of the mail to retrieve
   * @returns The full mail message including body, sender, and recipients
   * @requires Authentication
   */
  getMail(characterId: number, mailId: number): Promise<MailMessage> {
    return this.api.getMail(characterId, mailId) as Promise<MailMessage>;
  }

  /**
   * Updates the metadata of a mail, such as read status or labels, via PUT.
   *
   * @param characterId - The ID of the character who owns the mail
   * @param mailId - The ID of the mail to update
   * @param body - The metadata fields to update (e.g., labels, read status)
   * @returns void
   * @requires Authentication
   */
  updateMailMetadata(
    characterId: number,
    mailId: number,
    body: object,
  ): Promise<void> {
    return this.api.updateMailMetadata(
      characterId,
      mailId,
      body,
    ) as Promise<void>;
  }

  /**
   * Retrieves the mail labels and total unread count for a character.
   *
   * @param characterId - The ID of the character whose labels to fetch
   * @returns The character's mail labels and total unread mail count
   * @requires Authentication
   */
  getMailLabels(
    characterId: number,
  ): Promise<{ total_unread_count?: number; labels?: MailLabel[] }> {
    return this.api.getMailLabels(characterId) as Promise<{
      total_unread_count?: number;
      labels?: MailLabel[];
    }>;
  }

  /**
   * Creates a new custom mail label for a character via POST.
   *
   * @param characterId - The ID of the character to create the label for
   * @param body - The label definition including name and optional color
   * @returns The ID of the newly created label
   * @requires Authentication
   */
  createMailLabel(characterId: number, body: object): Promise<number> {
    return this.api.createMailLabel(characterId, body) as Promise<number>;
  }

  /**
   * Deletes a custom mail label from a character's mailbox.
   *
   * @param characterId - The ID of the character who owns the label
   * @param labelId - The ID of the label to delete
   * @returns void
   * @requires Authentication
   */
  deleteMailLabel(characterId: number, labelId: number): Promise<void> {
    return this.api.deleteMailLabel(characterId, labelId) as Promise<void>;
  }

  /**
   * Retrieves the mailing lists that a character is subscribed to.
   *
   * @param characterId - The ID of the character whose mailing lists to fetch
   * @returns A list of mailing lists with their IDs and names
   * @requires Authentication
   */
  getMailingLists(
    characterId: number,
  ): Promise<{ mailing_list_id: number; name: string }[]> {
    return this.api.getMailingLists(characterId) as Promise<
      { mailing_list_id: number; name: string }[]
    >;
  }

  withMetadata(): WithMetadata<Omit<MailClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, mailEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<MailClient, 'withMetadata'>
    >;
  }
}
