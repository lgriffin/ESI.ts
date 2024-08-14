import { ApiClient } from './ApiClient';
import { buildError } from '../core/util/error';
import { logInfo, logWarn, logError } from '../core/logger/loggerUtil';
import HeadersUtil from '../core/util/headersUtil';

const statusHandlers: Record<number, string> = {
    201: 'Created',
    204: 'No Content',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Resource not found',
    420: 'Error Limited',
    422: 'Unprocessable Entity',
    429: 'Too many requests',
    500: 'Internal server error',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    520: 'Internal server error, did the request terminate too soon?',
};

export const handleRequest = async (
    client: ApiClient,
    endpoint: string,
    method: string,
    body?: any,
    requiresAuth: boolean = false
): Promise<any> => {
    const url = `${client.getLink()}/${endpoint}`;
    const headers: HeadersInit = {
        accept: 'gzip, deflate, br',
        'User-Agent': `esiJS/1.0.0`  // Use the version from package.json ideally
    };

    if (requiresAuth) {
        const authHeader = client.getAuthorizationHeader();
        if (!authHeader) {
            throw buildError('Authorization header is required but not provided', 'NO_AUTH_TOKEN');
        }
        headers['Authorization'] = authHeader;
    }

    const options: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    logInfo(`Hitting endpoint: ${url}`);

    try {
        const response = await fetch(url, options);
        
        const responseHeaders = HeadersUtil.extractHeaders(response.headers);

        if (statusHandlers[response.status]) {
            const errorMessage = statusHandlers[response.status];
            if (response.status === 204) {
                logInfo(`${errorMessage} for endpoint: ${url}`);
                return { headers: responseHeaders, body: { error: 'no content' } };
            } else {
                logWarn(`${errorMessage} for endpoint: ${url}`);
                return { headers: responseHeaders, body: { error: errorMessage.toLowerCase() } };
            }
        }

        if (!response.ok) {
            throw buildError(`Error: ${response.statusText}`, 'API_ERROR');
        }

        const data = await response.json();
        return { headers: responseHeaders, body: data };
      //  return data;
    } catch (error) {
        if (error instanceof Error) {
            logError(`Unexpected error: ${error.message}`);
            throw buildError(error.message, 'ESIJS_ERROR');
        } else {
            logError(`Unexpected error: ${error}`);
            throw buildError(String(error), 'ESIJS_ERROR');
        }
    }
};
