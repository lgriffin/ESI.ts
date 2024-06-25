import { ApiClient } from '../../../../src/core/ApiClient';
import { ApiError } from '../../../../src/core/ApiError';

export class FactionWarfareWarsApi {
    constructor(private client: ApiClient) {}

    private async handleRequest(endpoint: string): Promise<any> {
        const url = `${this.client.getLink()}/${endpoint}`;
        const headers = {
            'Authorization': this.client.getAuthorizationHeader()
        };

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new ApiError(response.status, `Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                console.error(`API Error: ${error.message} (Status Code: ${error.statusCode})`);
            } else if (error instanceof Error) {
                console.error(`Unexpected Error: ${error.message}`);
            } else {
                console.error(`Unexpected Error: ${error}`);
            }
            throw error;
        }
    }

    async getWars(): Promise<object> {
        return await this.handleRequest('fw/wars');
    }
}
