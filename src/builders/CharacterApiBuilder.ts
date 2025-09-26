import { ApiClient } from '../core/ApiClient';
import { CharacterClient } from '../clients/CharacterClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class CharacterApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CharacterClient {
        return new CharacterClient(this.client);
    }
}
