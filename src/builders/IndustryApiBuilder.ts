import { ApiClient } from '../core/ApiClient';
import { IndustryClient } from '../clients/IndustryClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class IndustryApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): IndustryClient {
        return new IndustryClient(this.client);
    }
}
