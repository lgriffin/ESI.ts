import { ApiClient } from '../core/ApiClient';
import { MailClient } from '../clients/MailClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class MailApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): MailClient {
        return new MailClient(this.client);
    }
}
