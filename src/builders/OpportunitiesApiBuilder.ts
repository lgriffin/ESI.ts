import { ApiClient } from '../core/ApiClient';
import { OpportunitiesClient } from '../clients/OpportunitiesClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class OpportunitiesApiBuilder implements IAPIBuilder {
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
