import { ApiClient } from '../../core/ApiClient';
import { WarsApi } from './getWars';
import { WarByIdApi } from './getWarById';
import { WarKillmailsApi } from './getWarKillmails';
import { WarsClient } from './WarsClient';

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
