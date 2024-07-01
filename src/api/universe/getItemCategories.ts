import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseCategoriesApi {
    constructor(private client: ApiClient) {}

    async getCategories(): Promise<object[]> {
        return handleRequest(this.client, 'universe/categories');
    }
}
