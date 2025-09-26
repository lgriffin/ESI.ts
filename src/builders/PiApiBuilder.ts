import { ApiClient } from '../core/ApiClient';
import { PIClient } from '../clients/PiClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class PiApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): PIClient {
        return new PIClient(this.client);
    }
}
