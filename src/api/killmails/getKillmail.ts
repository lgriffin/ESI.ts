import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetKillmailApi {
    constructor(private client: ApiClient) {}

    async getKillmail(killmailId: number, killmailHash: string): Promise<any> {
        return handleRequest(this.client, `killmails/${killmailId}/${killmailHash}`);
    }
}
