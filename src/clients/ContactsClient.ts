import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { contactEndpoints } from '../core/endpoints/contactEndpoints';
import { Contact, ContactLabel } from '../types/api-responses';

export class ContactsClient {
    private api: ReturnType<typeof createClient<typeof contactEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, contactEndpoints);
    }

    async getAllianceContacts(allianceId: number): Promise<Contact[]> {
        return this.api.getAllianceContacts(allianceId);
    }

    async getAllianceContactLabels(allianceId: number): Promise<ContactLabel[]> {
        return this.api.getAllianceContactLabels(allianceId);
    }

    async deleteCharacterContacts(characterId: number, contactIds: number[]): Promise<void> {
        return this.api.deleteCharacterContacts(characterId, contactIds);
    }

    async getCharacterContacts(characterId: number): Promise<Contact[]> {
        return this.api.getCharacterContacts(characterId);
    }

    async postCharacterContacts(characterId: number, contacts: object): Promise<number[]> {
        return this.api.addContacts(characterId, contacts);
    }

    async putCharacterContacts(characterId: number, contacts: object): Promise<void> {
        return this.api.editContacts(characterId, contacts);
    }

    async getCharacterContactLabels(characterId: number): Promise<ContactLabel[]> {
        return this.api.getCharacterContactLabels(characterId);
    }

    async getCorporationContacts(corporationId: number): Promise<Contact[]> {
        return this.api.getCorporationContacts(corporationId);
    }

    async getCorporationContactLabels(corporationId: number): Promise<ContactLabel[]> {
        return this.api.getCorporationContactLabels(corporationId);
    }
}
