import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseCategoryByIdApi {
    constructor(private client: ApiClient) {}

    async getCategoryById(categoryId: number): Promise<object> {
        return handleRequest(this.client, `universe/categories/${categoryId}`, 'GET', undefined, false);
    }
}
