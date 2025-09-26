import { ApiClient } from '../core/ApiClient';
import { BookmarkClient } from '../clients/BookmarkClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class BookmarkApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): BookmarkClient {
        return new BookmarkClient(this.client);
    }
}
