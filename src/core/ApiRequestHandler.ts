import { ApiClient } from './ApiClient';
import { buildError } from '../core/util/error';
import { logInfo, logWarn, logError, logDebug } from '../core/logger/loggerUtil';
import HeadersUtil from '../core/util/headersUtil';
import { ETagCacheManager } from './cache/ETagCacheManager';

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

// Global ETag cache instance
let etagCache: ETagCacheManager | null = null;

export const initializeETagCache = (config?: any): ETagCacheManager => {
    if (!etagCache) {
        etagCache = new ETagCacheManager(config);
    }
    return etagCache;
};

export const getETagCache = (): ETagCacheManager | null => {
    return etagCache;
};

export const resetETagCache = (): void => {
    if (etagCache) {
        etagCache.shutdown();
    }
    etagCache = null;
};

// Helper function for backward compatibility - returns just the body
export const handleRequestBody = async (
    client: ApiClient,
    endpoint: string,
    method: string,
    body?: any,
    requiresAuth: boolean = false,
    useETag: boolean = true
): Promise<any> => {
    const response = await handleRequest(client, endpoint, method, body, requiresAuth, useETag);
    return response.body || response; // Handle both new and old response formats
};

const fetchPageData = async (
    client: ApiClient,
    baseEndpoint: string,
    method: string,
    page: number,
    requiresAuth: boolean,
    body?: any
): Promise<any> => {
    // Build the correct paginated endpoint for the specific page
    const paginatedEndpoint = `${baseEndpoint}?page=${page}`;

    // Log the correct endpoint with incremented page number
    logInfo(`Fetching page ${page}: ${client.getLink()}/${paginatedEndpoint}`);

    // Fetch the specific page data
    const response = await fetch(`${client.getLink()}/${paginatedEndpoint}`, {
        method,
        headers: {
            accept: 'gzip, deflate, br',
            'User-Agent': 'esiJS/1.0.0',
            ...(requiresAuth ? { Authorization: client.getAuthorizationHeader() } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        throw buildError(`Error: ${response.statusText}`, 'API_ERROR');
    }

    const responseData = await response.json();
    return responseData;  // Return only the data (body)
};

export const handleRequest = async (
    client: ApiClient,
    endpoint: string,
    method: string,
    body?: any,
    requiresAuth: boolean = false,
    useETag: boolean = true
): Promise<any> => {
    // Extract the base URL (without any pagination or extra query params)
    const [baseEndpoint] = endpoint.split('?');  // Get only the part before `?`

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

    // Add ETag support for GET requests
    if (useETag && method === 'GET' && etagCache) {
        const cachedETag = etagCache.getETag(url);
        if (cachedETag) {
            headers['If-None-Match'] = cachedETag;
            logDebug(`Adding If-None-Match header: ${cachedETag}`);
        }
    }

    const options: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    logInfo(`Hitting endpoint: ${url}`);

    try {
        // Fetch the first page (page 1)
        const response = await fetch(url, options);
        const responseHeaders = HeadersUtil.extractHeaders(response.headers);

        if (statusHandlers[response.status]) {
            const errorMessage = statusHandlers[response.status];
            if (response.status === 204) {
                logInfo(`${errorMessage} for endpoint: ${url}`);
                return { headers: responseHeaders, body: { error: 'no content' } };
            } else if (response.status === 304) {
                // Not Modified - return cached data
                if (useETag && etagCache) {
                    const cachedEntry = etagCache.get(url);
                    if (cachedEntry) {
                        logInfo(`Cache hit (304) for endpoint: ${url}`);
                        return { 
                            headers: { ...cachedEntry.headers, ...responseHeaders }, 
                            body: cachedEntry.data,
                            fromCache: true 
                        };
                    }
                }
                logWarn(`${errorMessage} for endpoint: ${url} - no cached data available`);
                return { headers: responseHeaders, body: { error: errorMessage.toLowerCase() } };
            } else {
                logWarn(`${errorMessage} for endpoint: ${url}`);
                return { headers: responseHeaders, body: { error: errorMessage.toLowerCase() } };
            }
        }

        if (!response.ok) {
            throw buildError(`Error: ${response.statusText}`, 'API_ERROR');
        }

        // Get the data and number of pages from the first response
        const data = await response.json();
        const totalPages = HeadersUtil.xPages;

        // Cache the response if ETag is present and this is a GET request
        if (useETag && method === 'GET' && etagCache && HeadersUtil.etag) {
            etagCache.set(url, HeadersUtil.etag, data, responseHeaders);
            logDebug(`Cached response for ${url} with ETag ${HeadersUtil.etag}`);
        }

        // If there's only one page, return the data immediately
        if (totalPages <= 1) {
            return { headers: responseHeaders, body: data };
        }

        // Now fetch the additional pages (starting from page 2)
        logInfo(`Found ${totalPages} pages, fetching additional pages...`);
        const allData = [data];  // Store data from page 1

        for (let page = 2; page <= totalPages; page++) {
            logInfo(`Fetching page ${page}...`);
            const paginatedData = await fetchPageData(client, baseEndpoint, method, page, requiresAuth, body);
            allData.push(...paginatedData);  // Append the paginated data
        }

        // Merge all pages' data into one response
        const finalData = allData.flat();
        
        // Cache the complete paginated response if ETag is present
        if (useETag && method === 'GET' && etagCache && HeadersUtil.etag) {
            etagCache.set(url, HeadersUtil.etag, finalData, responseHeaders);
            logDebug(`Cached paginated response for ${url} with ETag ${HeadersUtil.etag}`);
        }
        
        return { headers: responseHeaders, body: finalData };  // Flatten the array if needed
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
