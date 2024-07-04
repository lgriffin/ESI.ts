import { ApiClient } from '../core/ApiClient';
import { InsuranceApi } from '../api/insurance/getInsurancePrices';

export class InsuranceClient {
    private insuranceApi: InsuranceApi;

    constructor(client: ApiClient) {
        this.insuranceApi = new InsuranceApi(client);
    }

    async getInsurancePrices(): Promise<any> {
        return await this.insuranceApi.getInsurancePrices();
    }
}
