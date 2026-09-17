import { ApiClient } from '../ApiClient';
import { EsiError, TimeoutError } from '../util/error';
import { logInfo, logWarn, logError } from '../logger/clientLog';
import { parseHeaders, ParsedHeaders } from '../util/headersUtil';
import { ICache } from '../cache/ICache';
import { IRateLimiter } from '../rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../circuitBreaker/ICircuitBreaker';
import { buildError } from '../util/error';
import { buildRequestHeaders } from './headers';
import { applyRequestMiddleware } from './middlewareBridge';
import { STATUS_MESSAGES, readEsiErrorReason } from './statusHandling';

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
 * An abort from the request timer. Matched by name because DOMException is not
 * an `instanceof Error` in every runtime.
 */
function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: unknown }).name === 'AbortError'
  );
}

/**
 * A request that never produced an HTTP response (DNS, connection reset, TLS).
 * Status 0 makes it an EsiError like every other request failure, and
 * retryable for GET; the original error is kept as `cause`.
 */
function networkError(err: unknown, url: string): EsiError {
  const reason = err instanceof Error ? err.message : String(err);
  return Object.assign(
    new EsiError(0, `Network request failed: ${reason}`, url),
    { cause: err },
  );
}

/**
 * Read the whole body while the request timer is still running, then let
 * `text()` and `json()` answer from that copy. Later stages read the body
 * after this function returns, when a stalled or reset stream would no longer
 * be under the timeout or classed as a network failure.
 */
async function bufferBody(response: Response): Promise<void> {
  if (typeof response.text !== 'function') return;
  const text = await response.text();
  Object.defineProperties(response, {
    text: { value: () => Promise.resolve(text), configurable: true },
    json: {
      value: () => Promise.resolve(text).then((t) => JSON.parse(t) as unknown),
      configurable: true,
    },
  });
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
  logInfo(client, `Hitting endpoint: ${url}`, { method, endpoint });

  const cb = resolveCircuitBreaker(client);
  const cbKey =
    cb && templatePath && cb.getKeyStrategy?.() === 'template'
      ? templatePath
      : endpoint;

  if (cb) cb.checkCircuit(cbKey);

  let cbRecorded = false;

  try {
    const rateLimiter = resolveRateLimiter(client);
    await rateLimiter.checkRateLimit(templatePath, method, req.headers);

    const timeoutMs = requestTimeout ?? client.getTimeout();
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    options.signal = controller.signal;

    let response: Response;
    try {
      response = await client.getFetch()(url, options);
      // The timeout covers the body as well as the headers, and a body that
      // fails to arrive is a network failure, not a malformed response.
      await bufferBody(response);
    } catch (err) {
      clearTimeout(timer);
      if (cb) {
        cb.recordFailure(cbKey, 0);
        cbRecorded = true;
      }
      if (isAbortError(err)) {
        throw new TimeoutError(timeoutMs, url);
      }
      throw networkError(err, url);
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
        cb.recordFailure(cbKey, response.status);
      } else {
        cb.recordSuccess(cbKey);
      }
      cbRecorded = true;
    }

    if (parsed.warning) {
      logWarn(
        client,
        `ESI Warning ${parsed.warning.code}: ${parsed.warning.message}`,
        {
          url,
          warningCode: parsed.warning.code,
        },
      );
    }

    return { response, parsed, url };
  } finally {
    if (cb && !cbRecorded) {
      cb.recordFailure(cbKey, 0);
    }
  }
}

/**
 * Parse a JSON response body, throwing on parse failure.
 */
export async function parseJsonBody(
  client: ApiClient | null | undefined,
  response: Response,
  _url: string,
): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (jsonError) {
    const msg =
      jsonError instanceof Error ? jsonError.message : String(jsonError);
    logError(client, `Failed to parse JSON response: ${msg}`, { url: _url });
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
    const statusMessage =
      STATUS_MESSAGES[response.status] || response.statusText;
    const reason = await readEsiErrorReason(response);
    throw new EsiError(
      response.status,
      reason ? `${statusMessage}: ${reason}` : statusMessage,
      url,
      parsed.requestId ?? undefined,
    );
  }

  const data = await parseJsonBody(client, response, url);
  return { data, parsed, url };
}
