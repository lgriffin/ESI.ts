import { ApiClient } from '../core/ApiClient';
import { AllianceClient } from '../clients/AllianceClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class AllianceApiBuilder implements IAPIBuilder<AllianceClient> {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): AllianceClient {
        return new AllianceClient(this.client);
    }
}
