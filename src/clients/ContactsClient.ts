import { getAllianceContacts } from '../api/contacts/getAllianceContacts';
import { getAllianceContactLabels } from '../api/contacts/getAllianceContactLabels';
import { deleteCharacterContacts } from '../api/contacts/deleteCharacterContacts';
import { getCharacterContacts } from '../api/contacts/getCharacterContacts';
import { postCharacterContacts } from '../api/contacts/postCharacterContacts';
import { putCharacterContacts } from '../api/contacts/putCharacterContacts';
import { getCharacterContactLabels } from '../api/contacts/getCharacterContactLabels';
import { getCorporationContacts } from '../api/contacts/getCorporationContacts';
import { getCorporationContactLabels } from '../api/contacts/getCorporationContactLabels';
import { ApiClient } from '../core/ApiClient';

export class ContactsClient {
    private getAllianceContactsApi: getAllianceContacts;
    private getAllianceContactLabelsApi: getAllianceContactLabels;
    private deleteCharacterContactsApi: deleteCharacterContacts;
    private getCharacterContactsApi: getCharacterContacts;
    private postCharacterContactsApi: postCharacterContacts;
    private putCharacterContactsApi: putCharacterContacts;
    private getCharacterContactLabelsApi: getCharacterContactLabels;
    private getCorporationContactsApi: getCorporationContacts;
    private getCorporationContactLabelsApi: getCorporationContactLabels;

    constructor(client: ApiClient) {
        this.getAllianceContactsApi = new getAllianceContacts(client);
        this.getAllianceContactLabelsApi = new getAllianceContactLabels(client);
        this.deleteCharacterContactsApi = new deleteCharacterContacts(client);
        this.getCharacterContactsApi = new getCharacterContacts(client);
        this.postCharacterContactsApi = new postCharacterContacts(client);
        this.putCharacterContactsApi = new putCharacterContacts(client);
        this.getCharacterContactLabelsApi = new getCharacterContactLabels(client);
        this.getCorporationContactsApi = new getCorporationContacts(client);
        this.getCorporationContactLabelsApi = new getCorporationContactLabels(client);
    }

    async getAllianceContacts(allianceId: number): Promise<any> {
        return await this.getAllianceContactsApi.getAllianceContacts(allianceId);
    }

    async getAllianceContactLabels(allianceId: number): Promise<any> {
        return await this.getAllianceContactLabelsApi.getAllianceContactLabels(allianceId);
    }

    async deleteCharacterContacts(characterId: number, contactIds: number[]): Promise<any> {
        return await this.deleteCharacterContactsApi.deleteCharacterContacts(characterId, contactIds);
    }

    async getCharacterContacts(characterId: number): Promise<any> {
        return await this.getCharacterContactsApi.getContacts(characterId);
    }

    async postCharacterContacts(characterId: number, contacts: object): Promise<any> {
        return await this.postCharacterContactsApi.addContacts(characterId, contacts);
    }

    async putCharacterContacts(characterId: number, contacts: object): Promise<any> {
        return await this.putCharacterContactsApi.editContacts(characterId, contacts);
    }

    async getCharacterContactLabels(characterId: number): Promise<any> {
        return await this.getCharacterContactLabelsApi.getLabels(characterId);
    }

    async getCorporationContacts(corporationId: number): Promise<any> {
        return await this.getCorporationContactsApi.getContacts(corporationId);
    }

    async getCorporationContactLabels(corporationId: number): Promise<any> {
        return await this.getCorporationContactLabelsApi.getLabels(corporationId);
    }
}
