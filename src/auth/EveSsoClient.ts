import type { FetchLike } from '../core/ApiClient';
import { USER_AGENT } from '../core/constants';
import { SsoError, TokenRevokedError } from './errors';

export const DEFAULT_SSO_BASE_URL = 'https://login.eveonline.com';

export interface EveSsoClientConfig {
  /** The application's client id from developers.eveonline.com. */
  clientId: string;
  /**
   * The application's client secret. Omit for a public (PKCE) client; token
   * requests then identify the application by `client_id` in the form body.
   */
  clientSecret?: string | undefined;
  /** Redirect URI registered for the application. Used by {@link EveSsoClient.getAuthorizationUrl}. */
  callbackUrl?: string | undefined;
  /** Override the SSO host, for tests or a proxy. Defaults to https://login.eveonline.com. */
  ssoBaseUrl?: string | undefined;
  /** Custom fetch implementation. Defaults to `globalThis.fetch` resolved at call time. */
  fetch?: FetchLike | undefined;
  /**
   * Give up on a token, refresh or revoke request that SSO has not answered,
   * body included, within this many milliseconds. The request then rejects
   * with an {@link SsoError} with error code `timeout`: status 0 and
   * retryable when no status arrived; the status SSO sent when only the body
   * was late, so a late 2xx is not retryable (the refresh token has probably
   * been rotated). Fractions of a millisecond round up.
   * Unset by default: requests wait as long as the connection stays open.
   * Must be a positive, finite number.
   */
  timeoutMs?: number | undefined;
}

/** A successful response from the SSO token endpoint. */
export interface SsoTokenResponse {
  accessToken: string;
  refreshToken: string;
  /** Lifetime of `accessToken` in seconds, as reported by SSO. */
  expiresIn: number;
  tokenType: string;
}

export interface AuthorizationUrlOptions {
  /** Scopes to request. */
  scopes: readonly string[];
  /** Opaque value echoed back on the callback; use {@link generateState}. */
  state: string;
  /** PKCE challenge for public clients; see {@link generatePkcePair}. */
  codeChallenge?: string | undefined;
  /** Overrides `callbackUrl` from the config. */
  redirectUri?: string | undefined;
}

export interface ExchangeCodeOptions {
  /** PKCE verifier that produced the challenge sent in the authorization URL. */
  codeVerifier?: string | undefined;
  /**
   * The redirect URI that was sent in the authorization request. Defaults to
   * the configured `callbackUrl`; when neither is set the field is omitted.
   */
  redirectUri?: string | undefined;
}

export interface RefreshOptions {
  /** Request a subset of the originally granted scopes. */
  scopes?: readonly string[] | undefined;
}

interface SsoTokenJson {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
}

interface SsoErrorJson {
  error?: unknown;
  error_description?: unknown;
}

/** An SSO answer with its body already read, so the timeout covers the body too. */
interface SsoReply {
  status: number;
  ok: boolean;
  body: string;
}

/** Which OAuth2 grant a token request carried; decides how `invalid_grant` is classified. */
type GrantType = 'authorization_code' | 'refresh_token';

/**
 * Rejects once the signal aborts and never settles otherwise. Raced against
 * each await, it ends the wait even when a custom fetch ignores the signal.
 */
function rejectOnAbort(signal: AbortSignal): Promise<never> {
  const aborted = new Promise<never>((_resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => reject(new Error('SSO request timed out')),
      {
        once: true,
      },
    );
  });
  // Nothing may be racing it when the deadline passes after the reply.
  aborted.catch(() => undefined);
  return aborted;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Minimal client for the EVE SSO OAuth2 endpoints: building the login URL,
 * exchanging an authorization code, refreshing, and revoking.
 *
 * Supports confidential clients (HTTP Basic with the client secret) and
 * public clients (PKCE with `client_id` in the body). No JWT signature
 * verification is performed; tokens are trusted because they arrive directly
 * from SSO over TLS. `verifyAccessToken` checks a token against SSO's JWKS.
 */
export class EveSsoClient {
  private readonly clientId: string;
  private readonly clientSecret?: string | undefined;
  private readonly callbackUrl?: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchFn?: FetchLike | undefined;
  private readonly timeoutMs?: number | undefined;

  constructor(config: EveSsoClientConfig) {
    if (!config.clientId) {
      throw new Error('EveSsoClient requires a clientId');
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.callbackUrl = config.callbackUrl;
    this.baseUrl = (config.ssoBaseUrl ?? DEFAULT_SSO_BASE_URL).replace(
      /\/$/,
      '',
    );
    this.fetchFn = config.fetch;
    if (
      config.timeoutMs !== undefined &&
      !(Number.isFinite(config.timeoutMs) && config.timeoutMs > 0)
    ) {
      throw new RangeError(
        `EveSsoClient timeoutMs must be a positive, finite number (got ${String(config.timeoutMs)})`,
      );
    }
    this.timeoutMs = config.timeoutMs;
  }

  /** The application's SSO client id; tokens it obtains carry it in `aud`. */
  getClientId(): string {
    return this.clientId;
  }

  /** True when a client secret is configured (confidential client). */
  isConfidential(): boolean {
    return this.clientSecret !== undefined && this.clientSecret !== '';
  }

  get tokenUrl(): string {
    return `${this.baseUrl}/v2/oauth/token`;
  }

  get authorizeUrl(): string {
    return `${this.baseUrl}/v2/oauth/authorize`;
  }

  get revokeUrl(): string {
    return `${this.baseUrl}/v2/oauth/revoke`;
  }

  /** Build the URL to send a player to for login. */
  getAuthorizationUrl(options: AuthorizationUrlOptions): string {
    const redirectUri = options.redirectUri ?? this.callbackUrl;
    if (!redirectUri) {
      throw new Error(
        'getAuthorizationUrl requires a redirectUri or a configured callbackUrl',
      );
    }
    const url = new URL(this.authorizeUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('scope', options.scopes.join(' '));
    url.searchParams.set('state', options.state);
    if (options.codeChallenge) {
      url.searchParams.set('code_challenge', options.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    return url.toString();
  }

  /** Exchange the authorization code from the callback for tokens. */
  async exchangeCode(
    code: string,
    options: ExchangeCodeOptions = {},
  ): Promise<SsoTokenResponse> {
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
    });
    // OAuth2 (RFC 6749 §4.1.3) requires the token request to repeat the
    // redirect_uri that was sent in the authorization request.
    const redirectUri = options.redirectUri ?? this.callbackUrl;
    if (redirectUri) {
      form.set('redirect_uri', redirectUri);
    }
    if (options.codeVerifier) {
      form.set('code_verifier', options.codeVerifier);
    }
    return this.tokenRequest(form, 'authorization_code');
  }

  /** Obtain a new access token (and rotated refresh token) from a refresh token. */
  async refresh(
    refreshToken: string,
    options: RefreshOptions = {},
  ): Promise<SsoTokenResponse> {
    const form = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    if (options.scopes && options.scopes.length > 0) {
      form.set('scope', options.scopes.join(' '));
    }
    return this.tokenRequest(form, 'refresh_token');
  }

  /** Revoke a refresh token so it can no longer be used. */
  async revoke(
    token: string,
    tokenTypeHint: 'refresh_token' | 'access_token' = 'refresh_token',
  ): Promise<void> {
    const form = new URLSearchParams({
      token_type_hint: tokenTypeHint,
      token,
    });
    // A successful revoke carries nothing the caller needs, so its body is
    // not waited for.
    const reply = await this.post(this.revokeUrl, form, false);
    if (!reply.ok) {
      throw this.errorFromReply(reply);
    }
  }

  private async tokenRequest(
    form: URLSearchParams,
    grant: GrantType,
  ): Promise<SsoTokenResponse> {
    const reply = await this.post(this.tokenUrl, form);
    if (!reply.ok) {
      throw this.errorFromReply(reply, grant);
    }
    // A proxy or outage page can answer 2xx with HTML, an empty body, or a
    // JSON value that is not an object. All of those are SSO faults to the
    // caller, so they surface as SsoError rather than a raw parser error.
    let parsed: unknown;
    try {
      parsed = JSON.parse(reply.body);
    } catch {
      throw new SsoError(
        reply.status,
        'invalid_response',
        'Token response body was not valid JSON',
      );
    }
    if (!isRecord(parsed)) {
      throw new SsoError(
        reply.status,
        'invalid_response',
        'Token response body was not a JSON object',
      );
    }
    const json = parsed as SsoTokenJson;
    if (
      typeof json.access_token !== 'string' ||
      typeof json.refresh_token !== 'string'
    ) {
      throw new SsoError(
        reply.status,
        'invalid_response',
        'Token response did not include access_token and refresh_token',
      );
    }
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresIn: typeof json.expires_in === 'number' ? json.expires_in : 0,
      tokenType:
        typeof json.token_type === 'string' ? json.token_type : 'Bearer',
    };
  }

  /**
   * POST the form and read the whole body (on success only when
   * `readSuccessBody`). With a timeout configured, the request and the body
   * read share one deadline, which also cuts off a custom fetch that ignores
   * the abort signal. Missing the deadline becomes an `SsoError` with error
   * code `timeout` and status 0 when no status arrived (retryable), or the
   * status SSO sent before the body stalled. A 2xx with a stalled body is not
   * retryable: SSO has probably rotated the refresh token already.
   */
  private async post(
    url: string,
    form: URLSearchParams,
    readSuccessBody = true,
  ): Promise<SsoReply> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    };
    if (this.isConfidential()) {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      form.set('client_id', this.clientId);
    }
    const fetchFn = this.fetchFn ?? globalThis.fetch;
    const init: RequestInit = {
      method: 'POST',
      headers,
      body: form.toString(),
    };
    // AbortSignal.timeout does not keep the process alive. It takes whole
    // milliseconds, so a fractional timeout rounds up.
    const signal =
      this.timeoutMs === undefined
        ? undefined
        : AbortSignal.timeout(Math.ceil(this.timeoutMs));
    if (signal) init.signal = signal;
    const deadline = signal ? rejectOnAbort(signal) : undefined;
    const beforeDeadline = <T>(work: Promise<T>): Promise<T> =>
      deadline ? Promise.race([work, deadline]) : work;

    let response: Response;
    try {
      response = await beforeDeadline(fetchFn(url, init));
    } catch (err) {
      if (signal?.aborted) {
        throw this.timeoutError(0, 'No response from EVE SSO');
      }
      throw err;
    }
    if (response.ok && !readSuccessBody) {
      return { status: response.status, ok: true, body: '' };
    }
    let body = '';
    try {
      body = await beforeDeadline(response.text());
    } catch {
      if (signal?.aborted) {
        throw this.timeoutError(
          response.status,
          `EVE SSO answered ${String(response.status)} but the body did not arrive`,
        );
      }
      // A body that breaks off otherwise reads as empty: invalid_response on
      // a 2xx, `unknown` on an error status.
    }
    return { status: response.status, ok: response.ok, body };
  }

  private timeoutError(status: number, what: string): SsoError {
    return new SsoError(
      status,
      'timeout',
      `${what} within ${String(this.timeoutMs)} ms`,
    );
  }

  /**
   * Map a non-2xx SSO response to an error. `invalid_grant` means "the
   * refresh token is dead" only for a refresh grant; on a code exchange (or
   * a revoke) it describes the login code or request, so it stays an
   * `SsoError` and does not trigger the re-authentication path.
   */
  private errorFromReply(reply: SsoReply, grant?: GrantType): Error {
    let errorCode = 'unknown';
    let description: string | undefined;
    try {
      const json: unknown = JSON.parse(reply.body);
      if (isRecord(json)) {
        const body = json as SsoErrorJson;
        if (typeof body.error === 'string') errorCode = body.error;
        if (typeof body.error_description === 'string') {
          description = body.error_description;
        }
      }
    } catch {
      // Non-JSON body; keep the defaults.
    }
    if (errorCode === 'invalid_grant' && grant === 'refresh_token') {
      return new TokenRevokedError(
        `EVE SSO rejected the refresh token (invalid_grant)${
          description ? `: ${description}` : ''
        }`,
      );
    }
    return new SsoError(reply.status, errorCode, description);
  }
}
