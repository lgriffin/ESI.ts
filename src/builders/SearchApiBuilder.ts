import { ApiClient } from '../core/ApiClient';
import { SearchClient } from '../clients/SearchClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class SearchApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): SearchClient {
        return new SearchClient(this.client);
    }
}
