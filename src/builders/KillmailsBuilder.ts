import { ApiClient } from '../core/ApiClient';
import { KillmailsClient } from '../clients/KillmailsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class KillmailsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): KillmailsClient {
        return new KillmailsClient(this.client);
    }
}
