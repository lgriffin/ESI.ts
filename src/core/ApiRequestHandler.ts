import { ApiClient } from './ApiClient';
import { ApiError } from './ApiError';
import logger from './logger/logger';

export const handleRequest = async (client: ApiClient, endpoint: string, requiresAuth: boolean = false): Promise<any> => {
    const url = `${client.getLink()}/${endpoint}`;
    const headers: HeadersInit = {};
    const authHeader = client.getAuthorizationHeader();
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
};
