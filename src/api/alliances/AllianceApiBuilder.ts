import { ApiClient } from '../../core/ApiClient';
import { AllianceClient } from './AllianceClient';

export class AllianceApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    build(): AllianceClient {
        return new AllianceClient(this.client);
    }
}
