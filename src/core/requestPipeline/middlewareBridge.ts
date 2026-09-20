import { ApiClient } from '../ApiClient';
import { RequestContext, ResponseContext } from '../middleware/Middleware';
import { EsiHandlerResponse } from './cachePolicy';

/**
 * Apply request interceptors from the middleware pipeline.
 */
export async function applyRequestMiddleware(
  client: ApiClient,
  url: string,
  endpoint: string,
  method: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ url: string; headers: Record<string, string>; body: unknown }> {
  const middleware = client.getMiddleware();
  if (!middleware.hasInterceptors()) {
    return { url, headers, body };
  }
  const reqCtx: RequestContext = {
    url,
    endpoint,
    method,
    headers: { ...headers },
    body,
  };
  const modified = await middleware.applyRequestInterceptors(reqCtx);
  return {
    url: modified.url,
    headers: modified.headers,
    body: modified.body,
  };
}

/**
 * Apply response interceptors from the middleware pipeline.
 */
export async function applyResponseInterceptors(
  client: ApiClient,
  result: EsiHandlerResponse,
  url: string,
  endpoint: string,
  method: string,
  startTime: number,
): Promise<EsiHandlerResponse> {
  const middleware = client.getMiddleware();
  if (!middleware.hasInterceptors()) return result;

  const responseCtx: ResponseContext = {
    url,
    endpoint,
    method,
    status: result.status ?? 200,
    headers: result.headers,
    body: result.body,
    durationMs: Date.now() - startTime,
    fromCache: result.fromCache ?? false,
  };

  const modified = await middleware.applyResponseInterceptors(responseCtx);
  return {
    ...result,
    headers: modified.headers,
    body: modified.body,
  };
}
