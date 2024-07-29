import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class WarKillmailsApi {
    constructor(private client: ApiClient) {}

    async getWarKillmails(warId: number): Promise<object[]> {
        return handleRequest(this.client, `wars/${warId}/killmails`, 'GET', undefined, false);
    }
}
