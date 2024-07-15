import { ApiClient } from '../core/ApiClient';
import { OpportunitiesClient } from '../clients/OpportunitiesClient';

export class OpportunitiesApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): OpportunitiesClient {
        return new OpportunitiesClient(
            this.client
        );
    }
}
