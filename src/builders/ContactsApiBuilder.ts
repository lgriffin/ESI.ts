import { ApiClient } from '../core/ApiClient';
import { ContactsClient } from '../clients/ContactsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class ContactsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): ContactsClient {
        return new ContactsClient(this.client);
    }
}
