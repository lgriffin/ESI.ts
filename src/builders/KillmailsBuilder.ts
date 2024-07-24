import { ApiClient } from '../core/ApiClient';
import { KillmailsClient } from '../clients/KillmailsClient';

export class KillmailsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): KillmailsClient {
        return new KillmailsClient(this.client);
    }
}
