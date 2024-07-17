import { ApiClient } from './ApiClient';
import { ApiError } from './ApiError';
import logger from './logger/logger';

const statusHandlers: Record<number, string> = {
    204 : 'No Content',
    401: 'Authorization not provided',
    403: 'Forbidden returned',
    404: 'Resource not found',
    500: 'Internal server error',
    520: 'Internal server error, did the request terminate too soon?',
};

export const handleRequest = async (
    client: ApiClient,
    endpoint: string,
    method: string = 'GET',
    body?: string,
    requiresAuth: boolean = false
): Promise<any> => {
    const url = `${client.getLink()}/${endpoint}`;
    const headers: HeadersInit = {};
    const authHeader = client.getAuthorizationHeader();
    if (requiresAuth && authHeader) {
        headers['Authorization'] = authHeader;
    }

    logger.info(`Hitting endpoint: ${url}`);
    try {
        const options: RequestInit = {
            method,
            headers,
        };

        if (body) {
            headers['Content-Type'] = 'application/json';
            options.body = body;
        }

        const response = await fetch(url, options);
        if (statusHandlers[response.status]) {
            const errorMessage = statusHandlers[response.status];
            logger.warn(`${errorMessage} for endpoint: ${url}`);
            return { error: errorMessage.toLowerCase() };
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