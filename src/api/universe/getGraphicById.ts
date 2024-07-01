import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseGraphicByIdApi {
    constructor(private client: ApiClient) {}

    async getGraphicById(graphicId: number): Promise<object> {
        return handleRequest(this.client, `universe/graphics/${graphicId}`);
    }
}
