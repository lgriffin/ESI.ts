import { GetCharacterMailHeadersApi } from '../api/mail/getCharacterMailHeaders';
import { PostCharacterMailApi } from '../api/mail/postCharacterMail';
import { DeleteCharacterMailApi } from '../api/mail/deleteCharacterMail';
import { GetCharacterMailApi } from '../api/mail/getCharacterMail';
import { PutCharacterMailApi } from '../api/mail/putCharacterMail';
import { GetCharacterMailLabelsApi } from '../api/mail/getCharacterMailLabels';
import { PostCharacterMailLabelsApi } from '../api/mail/postCharacterMailLabels';
import { DeleteCharacterMailLabelApi } from '../api/mail/deleteCharacterMailLabel';
import { GetCharacterMailingListsApi } from '../api/mail/getCharacterMailingLists';
import { ApiClient } from '../core/ApiClient';

export class MailClient {
    private getCharacterMailHeadersApi: GetCharacterMailHeadersApi;
    private postCharacterMailApi: PostCharacterMailApi;
    private deleteCharacterMailApi: DeleteCharacterMailApi;
    private getCharacterMailApi: GetCharacterMailApi;
    private putCharacterMailApi: PutCharacterMailApi;
    private getCharacterMailLabelsApi: GetCharacterMailLabelsApi;
    private postCharacterMailLabelsApi: PostCharacterMailLabelsApi;
    private deleteCharacterMailLabelApi: DeleteCharacterMailLabelApi;
    private getCharacterMailingListsApi: GetCharacterMailingListsApi;

    constructor(client: ApiClient) {
        this.getCharacterMailHeadersApi = new GetCharacterMailHeadersApi(client);
        this.postCharacterMailApi = new PostCharacterMailApi(client);
        this.deleteCharacterMailApi = new DeleteCharacterMailApi(client);
        this.getCharacterMailApi = new GetCharacterMailApi(client);
        this.putCharacterMailApi = new PutCharacterMailApi(client);
        this.getCharacterMailLabelsApi = new GetCharacterMailLabelsApi(client);
        this.postCharacterMailLabelsApi = new PostCharacterMailLabelsApi(client);
        this.deleteCharacterMailLabelApi = new DeleteCharacterMailLabelApi(client);
        this.getCharacterMailingListsApi = new GetCharacterMailingListsApi(client);
    }

    async getMailHeaders(characterId: number): Promise<any> {
        return await this.getCharacterMailHeadersApi.getCharacterMailHeaders(characterId);
    }

    async sendMail(characterId: number, body: object): Promise<any> {
        return await this.postCharacterMailApi.sendMail(characterId, body);
    }

    async deleteMail(characterId: number, mailId: number): Promise<any> {
        return await this.deleteCharacterMailApi.deleteMail(characterId, mailId);
    }

    async getMail(characterId: number, mailId: number): Promise<any> {
        return await this.getCharacterMailApi.getMail(characterId, mailId);
    }

    async updateMailMetadata(characterId: number, mailId: number, body: object): Promise<any> {
        return await this.putCharacterMailApi.updateMailMetadata(characterId, mailId, body);
    }

    async getMailLabels(characterId: number): Promise<any> {
        return await this.getCharacterMailLabelsApi.getMailLabels(characterId);
    }

    async createMailLabel(characterId: number, body: object): Promise<any> {
        return await this.postCharacterMailLabelsApi.createMailLabel(characterId, body);
    }

    async deleteMailLabel(characterId: number, labelId: number): Promise<any> {
        return await this.deleteCharacterMailLabelApi.deleteMailLabel(characterId, labelId);
    }

    async getMailingLists(characterId: number): Promise<any> {
        return await this.getCharacterMailingListsApi.getMailingLists(characterId);
    }
}
