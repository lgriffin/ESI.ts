import { ApiClient } from './ApiClient';
import { ApiError } from './ApiError';
import logger from './logger/logger';

const statusHandlers: Record<number, string> = {
    204 : 'No Content',
    201: 'Created',
    400: 'Bad Request',
    401: 'Authorization not provided',
    403: 'Forbidden returned',
    404: 'Resource not found',
    422: 'Unprocessable Entity',
    429: 'Too many requests',
    500: 'Internal server error',
    503: 'Service Unavailable',
    520: 'Internal server error, did the request terminate too soon?',
};

export const handleRequest = async (
    client: ApiClient,
    endpoint: string,
    method: string,
    body?: string,
    requiresAuth: boolean = false  //false by default
): Promise<any> => {
    const url = `${client.getLink()}/${endpoint}`;
    const headers: HeadersInit = {};
    const authHeader = client.getAuthorizationHeader();
   // console.log(headers); //this is just the init above as {} so we aren't getting the servers understanding of whether auth is needed or not and we shuold build this header up later
   // console.log(authHeader);
    // this will always fail as requiresAuth never gets set from the headers
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
            if (response.status === 204) {
                logger.info(`${errorMessage} for endpoint: ${url}`);
                return { error: 'no content' };
            } else {
                logger.warn(`${errorMessage} for endpoint: ${url}`);
                return { error: errorMessage.toLowerCase() };
            }
        }
        // Leigh to come back to this as I seem to need to declare this explicitly for some tests
        if (response.status === 204) {
            return { error: 'no content' };
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
