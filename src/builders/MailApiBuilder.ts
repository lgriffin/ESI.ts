import { ApiClient } from '../core/ApiClient';
import { MailClient } from '../clients/MailClient';

export class MailApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): MailClient {
        return new MailClient(this.client);
    }
}
