import { ApiClient } from './ApiClient';
import { ApiError } from './ApiError';
import logger from './logger/logger';

// we most likely do NOT need all of these but for completeness keeping it here to stay consistent with most web API errors
const statusHandlers: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Authorization not provided',
    402: 'Payment Required',
    403: 'Forbidden returned',
    404: 'Resource not found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal server error',
    503: 'Service Unavailable',
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
