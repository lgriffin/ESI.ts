import { ApiClient } from '../ApiClient';
import { handleRequest } from '../ApiRequestHandler';
import { EndpointMap, EndpointArgs } from './EndpointDefinition';
import { CursorPaginationHandler, CursorTokens } from '../pagination/CursorPaginationHandler';

export interface CursorOptions {
    before?: string;
    after?: string;
}

export interface CursorResult<T = any> {
    data: T[];
    cursors: CursorTokens;
}

type ClientMethods<T extends EndpointMap> = {
    [K in keyof T]: (...args: EndpointArgs<T[K]>) => Promise<any>;
};

export function createClient<T extends EndpointMap>(
    apiClient: ApiClient,
    endpoints: T
): ClientMethods<T> {
    const client = {} as ClientMethods<T>;

    for (const [methodName, def] of Object.entries(endpoints)) {
        (client as any)[methodName] = async (...args: any[]) => {
            let argIndex = 0;

            // Substitute path parameters
            let path = def.path;
            if (def.pathParams) {
                for (const param of def.pathParams) {
                    path = path.replace(`{${param}}`, String(args[argIndex++]));
                }
            }

            // Append query parameters
            if (def.queryParams) {
                const queryParts: string[] = [];
                for (const [, queryKey] of Object.entries(def.queryParams)) {
                    const value = args[argIndex++];
                    if (value !== undefined) {
                        queryParts.push(`${queryKey}=${encodeURIComponent(String(value))}`);
                    }
                }
                if (queryParts.length > 0) {
                    path += (path.includes('?') ? '&' : '?') + queryParts.join('&');
                }
            }

            // Build body — match existing behavior: pass JSON.stringify'd string to handleRequest
            let body: any = undefined;
            if (def.bodyBuilder) {
                body = def.bodyBuilder(...args.slice(argIndex));
            } else if (def.hasBody) {
                body = args[argIndex];
            }

            // For cursor-paginated endpoints, check for trailing cursor options arg
            if (def.cursorPagination) {
                const lastArg = args[args.length - 1];
                const cursorOpts: CursorOptions | undefined =
                    lastArg && typeof lastArg === 'object' && ('before' in lastArg || 'after' in lastArg)
                        ? lastArg
                        : undefined;

                if (cursorOpts) {
                    const parts: string[] = [];
                    if (cursorOpts.before) parts.push(`before=${encodeURIComponent(cursorOpts.before)}`);
                    if (cursorOpts.after) parts.push(`after=${encodeURIComponent(cursorOpts.after)}`);
                    if (parts.length > 0) {
                        path += (path.includes('?') ? '&' : '?') + parts.join('&');
                    }
                }

                const response = await handleRequest(apiClient, path, def.method, body, def.requiresAuth);
                const data = Array.isArray(response.body) ? response.body : response.body != null ? [response.body] : [];
                return {
                    data,
                    cursors: response.cursors ?? { before: null, after: null },
                } as CursorResult;
            }

            const response = await handleRequest(apiClient, path, def.method, body, def.requiresAuth);
            return response.body;
        };
    }

    return client;
}

/**
 * Fetch all pages of a cursor-paginated endpoint.
 * Pass a function that calls the cursor endpoint method.
 *
 * Usage:
 *   const allProjects = await fetchAllCursorPages(
 *       (cursor) => corpClient.getProjects(corpId, cursor)
 *   );
 */
export async function fetchAllCursorPages<T = any>(
    fetcher: (cursor?: CursorOptions) => Promise<CursorResult<T>>,
): Promise<T[]> {
    const allData: T[] = [];
    let cursor: CursorOptions | undefined;

    while (true) {
        const result = await fetcher(cursor);

        if (result.data.length === 0) {
            break;
        }

        allData.push(...result.data);

        if (!result.cursors.after) {
            break;
        }

        cursor = { after: result.cursors.after };
    }

    return allData;
}
