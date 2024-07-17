import { ApiClient } from '../core/ApiClient';
import { CharacterClient } from '../clients/CharacterClient';

export class CharacterApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CharacterClient {
        return new CharacterClient(this.client);
    }
}
