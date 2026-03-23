import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { insuranceEndpoints } from '../core/endpoints/insuranceEndpoints';
import { InsurancePrice } from '../types/api-responses';

export class InsuranceClient {
    private api: ReturnType<typeof createClient<typeof insuranceEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, insuranceEndpoints);
    }

    async getInsurancePrices(): Promise<InsurancePrice[]> {
        return this.api.getInsurancePrices();
    }
}
