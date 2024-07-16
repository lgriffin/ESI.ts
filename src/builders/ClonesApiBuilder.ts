import { ApiClient } from '../core/ApiClient';
import { ClonesClient } from '../clients/ClonesClient';

export class ClonesApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): ClonesClient {
        return new ClonesClient(this.client);
    }
}
