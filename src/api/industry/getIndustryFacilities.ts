import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetIndustryFacilitiesApi {
    constructor(private client: ApiClient) {}

    async getIndustryFacilities(): Promise<any> {
        return handleRequest(this.client, `industry/facilities`);
    }
}
