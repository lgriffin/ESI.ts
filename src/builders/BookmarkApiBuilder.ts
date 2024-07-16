import { ApiClient } from '../core/ApiClient';
import { BookmarkClient } from '../clients/BookmarkClient';

export class BookmarkApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): BookmarkClient {
        return new BookmarkClient(this.client);
    }
}
