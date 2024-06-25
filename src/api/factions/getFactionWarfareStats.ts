import { ApiClient } from '../../core/ApiClient';
import { ApiError } from '../../core/ApiError';
import logger from '../../core/logger/logger';

export class FactionWarfareStatsApi {
    constructor(private client: ApiClient) {}

    private async handleRequest(endpoint: string, requiresAuth: boolean = false): Promise<any> {
        const url = `${this.client.getLink()}/${endpoint}`;
        const headers: HeadersInit = {};
        const authHeader = this.client.getAuthorizationHeader();
        if (requiresAuth && authHeader) {
            headers['Authorization'] = authHeader;
        }

        logger.info(`Hitting endpoint: ${url}`);
        try {
            const response = await fetch(url, { headers });
            if (response.status === 401) {
                logger.warn(`Authorization not provided for endpoint: ${url}`);
                return { error: 'authorization not provided' };
            }
            if (!response.ok) {
                throw new ApiError(response.status, `Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                logger.error(`API Error: ${error.message} (Status Code: ${error.statusCode})`);
            } else if (error instanceof Error) {
                logger.error(`Unexpected Error: ${error.message}`);
            } else {
                logger.error(`Unexpected Error: ${error}`);
            }
            throw error;
        }
    }

    async getStats(): Promise<object> {
        return await this.handleRequest('fw/stats');
    }

    async getCharacterStats(characterId: number): Promise<object> {
        return await this.handleRequest(`characters/${characterId}/fw/stats`, true);
    }

    async getCorporationStats(corporationId: number): Promise<object> {
        return await this.handleRequest(`corporations/${corporationId}/fw/stats`, true);
    }
}
