import { ApiClient } from '../core/ApiClient';
import { WarsApi } from '../api/wars/getWars';
import { WarByIdApi } from '../api/wars/getWarById';
import { WarKillmailsApi } from '../api/wars/getWarKillmails';
import { WarsClient } from '../clients/WarsClient';

export class WarsAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): WarsClient {
        return new WarsClient(
            new WarsApi(this.client),
            new WarByIdApi(this.client),
            new WarKillmailsApi(this.client)
        );
    }
}
