import { ApiClient } from '../ApiClient';
import { EsiError, TimeoutError } from '../util/error';
import { logInfo, logWarn, logError } from '../logger/loggerUtil';
import { parseHeaders, ParsedHeaders } from '../util/headersUtil';
import { ICache } from '../cache/ICache';
import { IRateLimiter } from '../rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../circuitBreaker/ICircuitBreaker';
import { buildError } from '../util/error';
import { buildRequestHeaders } from './headers';
import { applyRequestMiddleware } from './middlewareBridge';
import { STATUS_MESSAGES } from './statusHandling';

export interface RawFetchResult {
  response: Response;
  parsed: ParsedHeaders;
  url: string;
}

export interface SingleFetchResult {
  data: unknown;
  parsed: ParsedHeaders;
  url: string;
}

/**
 * Execute a single HTTP fetch with rate limiting, circuit breaker, and timeout.
 */
export async function executeSingleFetch(
  client: ApiClient,
  endpoint: string,
  method: string,
  body: unknown,
  requiresAuth: boolean,
  useETag: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
  resolveRateLimiter: (client: ApiClient) => IRateLimiter,
  resolveCircuitBreaker: (client: ApiClient) => ICircuitBreaker | null,
  requestTimeout?: number,
  templatePath?: string,
): Promise<RawFetchResult> {
  const rawUrl = `${client.getLink()}/${endpoint}`;
  const builtHeaders = buildRequestHeaders(
    client,
    rawUrl,
    method,
    requiresAuth,
    useETag,
    body,
    resolveCache,
  ) as Record<string, string>;

  const req = await applyRequestMiddleware(
    client,
    rawUrl,
    endpoint,
    method,
    builtHeaders,
    body,
  );

  const options: RequestInit = {
    method,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body) : undefined,
  };

  const url = req.url;
  logInfo(`Hitting endpoint: ${url}`);

  const cb = resolveCircuitBreaker(client);
  if (cb) cb.checkCircuit(endpoint);

  const rateLimiter = resolveRateLimiter(client);
  await rateLimiter.checkRateLimit(templatePath, method, req.headers);

  const timeoutMs = requestTimeout ?? client.getTimeout();
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  options.signal = controller.signal;

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    clearTimeout(timer);
    if (cb) {
      // Status 0 = network/timeout failure — counts toward opening the circuit
      cb.recordFailure(endpoint, 0);
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new TimeoutError(timeoutMs, url);
    }
    throw err;
  }
  clearTimeout(timer);

  const parsed = parseHeaders(response.headers);

  rateLimiter.updateFromResponse(
    parsed.raw,
    response.status,
    templatePath,
    method,
    req.headers,
  );

  if (cb) {
    if (
      response.status >= 500 ||
      response.status === 420 ||
      response.status === 429
    ) {
      cb.recordFailure(endpoint, response.status);
    } else {
      cb.recordSuccess(endpoint);
    }
  }

  if (parsed.warning) {
    logWarn(
      `ESI Warning ${parsed.warning.code} for ${url}: ${parsed.warning.message}`,
    );
  }

  return { response, parsed, url };
}

/**
 * Parse a JSON response body, throwing on parse failure.
 */
export async function parseJsonBody(
  response: Response,
  _url: string,
): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (jsonError) {
    const msg =
      jsonError instanceof Error ? jsonError.message : String(jsonError);
    logError(`Failed to parse JSON response: ${msg}`);
    throw buildError(`Invalid JSON response: ${msg}`, 'JSON_PARSE_ERROR');
  }
}

/**
 * Fetch a single page: execute the fetch, check for errors, parse JSON.
 */
export async function fetchOnePage(
  client: ApiClient,
  endpoint: string,
  method: string,
  body: unknown,
  requiresAuth: boolean,
  useETag: boolean,
  resolveCache: (client: ApiClient) => ICache | null,
  resolveRateLimiter: (client: ApiClient) => IRateLimiter,
  resolveCircuitBreaker: (client: ApiClient) => ICircuitBreaker | null,
  requestTimeout?: number,
  templatePath?: string,
): Promise<SingleFetchResult> {
  const { response, parsed, url } = await executeSingleFetch(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
    useETag,
    resolveCache,
    resolveRateLimiter,
    resolveCircuitBreaker,
    requestTimeout,
    templatePath,
  );

  if (!response.ok) {
    throw new EsiError(
      response.status,
      STATUS_MESSAGES[response.status] || response.statusText,
      url,
      parsed.requestId ?? undefined,
    );
  }

  const data = await parseJsonBody(response, url);
  return { data, parsed, url };
}
