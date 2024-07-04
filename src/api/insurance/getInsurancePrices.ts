import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class InsuranceApi {
    constructor(private client: ApiClient) {}

    async getInsurancePrices(): Promise<any> {
        return handleRequest(this.client, 'insurance/prices');
    }
}
