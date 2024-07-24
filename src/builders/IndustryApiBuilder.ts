import { ApiClient } from '../core/ApiClient';
import { IndustryClient } from '../clients/IndustryClient';

export class IndustryApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): IndustryClient {
        return new IndustryClient(this.client);
    }
}
