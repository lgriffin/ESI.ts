import { ApiClient } from '../ApiClient';
import { handleRequest } from '../ApiRequestHandler';
import { EndpointMap, EndpointArgs } from './EndpointDefinition';

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

            const response = await handleRequest(apiClient, path, def.method, body, def.requiresAuth);
            return response.body;
        };
    }

    return client;
}
