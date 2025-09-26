import { ApiClient } from '../core/ApiClient';
import { UIClient } from '../clients/UiClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class UiApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): UIClient {
        return new UIClient(this.client);
    }
}
