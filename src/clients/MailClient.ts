import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { mailEndpoints } from '../core/endpoints/mailEndpoints';
import { MailMessage, MailLabel } from '../types/api-responses';

export class MailClient {
    private api: ReturnType<typeof createClient<typeof mailEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, mailEndpoints);
    }

    async getMailHeaders(characterId: number): Promise<MailMessage[]> {
        return this.api.getCharacterMailHeaders(characterId);
    }

    async sendMail(characterId: number, body: object): Promise<number> {
        return this.api.sendMail(characterId, body);
    }

    async deleteMail(characterId: number, mailId: number): Promise<void> {
        return this.api.deleteMail(characterId, mailId);
    }

    async getMail(characterId: number, mailId: number): Promise<MailMessage> {
        return this.api.getMail(characterId, mailId);
    }

    async updateMailMetadata(characterId: number, mailId: number, body: object): Promise<void> {
        return this.api.updateMailMetadata(characterId, mailId, body);
    }

    async getMailLabels(characterId: number): Promise<{ total_unread_count?: number; labels?: MailLabel[] }> {
        return this.api.getMailLabels(characterId);
    }

    async createMailLabel(characterId: number, body: object): Promise<number> {
        return this.api.createMailLabel(characterId, body);
    }

    async deleteMailLabel(characterId: number, labelId: number): Promise<void> {
        return this.api.deleteMailLabel(characterId, labelId);
    }

    async getMailingLists(characterId: number): Promise<{ mailing_list_id: number; name: string }[]> {
        return this.api.getMailingLists(characterId);
    }
}
