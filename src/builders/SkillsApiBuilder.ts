import { ApiClient } from '../core/ApiClient';
import { CharacterSkillsClient } from '../clients/SkillsClient';

export class SkillsApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CharacterSkillsClient {
        return new CharacterSkillsClient(this.client);
    }
}
