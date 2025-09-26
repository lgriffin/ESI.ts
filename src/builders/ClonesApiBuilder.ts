import { ApiClient } from '../core/ApiClient';
import { ClonesClient } from '../clients/ClonesClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class ClonesApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): ClonesClient {
        return new ClonesClient(this.client);
    }
}
