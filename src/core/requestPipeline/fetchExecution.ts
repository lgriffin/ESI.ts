import { ApiClient } from '../ApiClient';
import { markTokenAccepted } from '../cache/cacheKey';
import {
  EsiError,
  EsiNetworkError,
  EsiParseError,
  TimeoutError,
} from '../util/error';
import { logInfo, logWarn, logError } from '../logger/clientLog';
import { parseHeaders, ParsedHeaders } from '../util/headersUtil';
import { ICache } from '../cache/ICache';
import { IRateLimiter } from '../rateLimiter/IRateLimiter';
import { ICircuitBreaker } from '../circuitBreaker/ICircuitBreaker';
import { buildRequestHeaders } from './headers';
import { applyRequestMiddleware } from './middlewareBridge';
import { readEsiErrorReason, statusMessage } from './statusHandling';

export interface RawFetchResult {
  response: Response;
  parsed: ParsedHeaders;
  url: string;
  /** The Authorization header the request carried, if any. */
  authorization?: string | undefined;
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
function networkError(err: unknown, url: string): EsiNetworkError {
  const reason = err instanceof Error ? err.message : String(err);
  return new EsiNetworkError(reason, url, err);
}

/**
 * A redirect the fetch did not follow: a 3xx other than 304, or the opaque
 * redirect a browser returns for `redirect: 'manual'`.
 */
function isRedirect(response: Response): boolean {
  if (response.type === 'opaqueredirect') return true;
  return (
    response.status >= 300 && response.status < 400 && response.status !== 304
  );
}

/**
 * The error a refused redirect is reported with. It names only the target's
 * origin, so a token or query in the Location header never reaches the
 * message. An opaque redirect hides its status and target, and is reported
 * as a 302.
 */
function redirectRefused(
  response: Response,
  url: string,
  parsed: ParsedHeaders,
): EsiError {
  const status = response.status >= 300 ? response.status : 302;
  let target = 'a location the runtime did not disclose';
  const location = response.headers.get('location');
  if (location) {
    try {
      target = new URL(location, url).origin;
    } catch {
      target = 'an unparsable location';
    }
  }
  return new EsiError(
    status,
    `Redirect refused: ESI answered ${status} with a redirect to ${target}, and the client does not follow redirects`,
    url,
    parsed.requestId ?? undefined,
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
  accept?: string,
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
    accept,
  ) as Record<string, string>;

  const req = await applyRequestMiddleware(
    client,
    rawUrl,
    endpoint,
    method,
    builtHeaders,
    body,
  );

  // Redirects are never followed: the host allowlist is checked on the base
  // URL, so a redirect would carry the request, and with it the path and any
  // body, to a host nothing checked (security model P6). A redirect arrives
  // as its own 3xx response and is refused below.
  const options: RequestInit = {
    method,
    headers: req.headers,
    redirect: 'manual',
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
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
      // A transport that already speaks the SDK's error language (a test
      // double refusing a request it has no answer for) is passed through:
      // wrapping it as a network failure would rename it and retry it.
      if (err instanceof EsiError) throw err;
      if (isAbortError(err)) {
        throw new TimeoutError(timeoutMs, url);
      }
      throw networkError(err, url);
    }
    clearTimeout(timer);

    const parsed = parseHeaders(response.headers);

    // A 2xx or 304 to a bearer token is ESI accepting it: from here the
    // character it names keys what this client serves without a request.
    if (requiresAuth && (response.ok || response.status === 304)) {
      const sent = req.headers['Authorization'];
      if (sent) markTokenAccepted(client, sent);
    }

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

    if (isRedirect(response)) throw redirectRefused(response, url, parsed);

    return {
      response,
      parsed,
      url,
      authorization: req.headers['Authorization'],
    };
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
    throw new EsiParseError(`Invalid JSON response: ${msg}`, _url, jsonError);
  }
}

/**
 * ESI's answer when a route has nothing to return: a 204, or a 200 with
 * `Content-Length: 0` where its spec says 204 (an expired public contract).
 */
function answeredWithNoContent(response: Response): boolean {
  return (
    response.status === 204 ||
    (response.status === 200 && response.headers.get('content-length') === '0')
  );
}

/**
 * Fetch a single page: execute the fetch, check for errors, parse JSON.
 * With `emptyWhenNoContent`, a page ESI answers with no content
 * (`answeredWithNoContent`) has `undefined` data instead of failing to parse.
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
  emptyWhenNoContent: boolean = false,
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
    const text = statusMessage(response);
    const reason = await readEsiErrorReason(response);
    throw new EsiError(
      response.status,
      reason ? `${text}: ${reason}` : text,
      url,
      parsed.requestId ?? undefined,
    );
  }

  if (emptyWhenNoContent && answeredWithNoContent(response)) {
    logInfo(client, `No Content for endpoint: ${url}`, {
      status: response.status,
    });
    return { data: undefined, parsed, url };
  }

  const data = await parseJsonBody(client, response, url);
  return { data, parsed, url };
}
