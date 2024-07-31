import { ApiClient } from '../core/ApiClient';
import { ContactsClient } from '../clients/ContactsClient';

export class ContactsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): ContactsClient {
        return new ContactsClient(this.client);
    }
}
