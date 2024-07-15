import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetOpportunitiesTaskByIdApi {
    constructor(private client: ApiClient) {}

    async getOpportunitiesTaskById(taskId: number): Promise<any> {
        return await handleRequest(this.client, `opportunities/tasks/${taskId}`);
    }
}
