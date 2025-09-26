import { ApiClient } from '../core/ApiClient';
import { CharacterSkillsClient } from '../clients/SkillsClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class SkillsApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CharacterSkillsClient {
        return new CharacterSkillsClient(this.client);
    }
}
