import { ApiClient } from '../core/ApiClient';
import { UIClient } from '../clients/UiClient';

export class UiApiBuilder  {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): UIClient {
        return new UIClient(this.client);
    }
}
