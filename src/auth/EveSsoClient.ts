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
  clientSecret?: string;
  /** Redirect URI registered for the application. Used by {@link EveSsoClient.getAuthorizationUrl}. */
  callbackUrl?: string;
  /** Override the SSO host, for tests or a proxy. Defaults to https://login.eveonline.com. */
  ssoBaseUrl?: string;
  /** Custom fetch implementation. Defaults to `globalThis.fetch` resolved at call time. */
  fetch?: FetchLike;
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
  codeChallenge?: string;
  /** Overrides `callbackUrl` from the config. */
  redirectUri?: string;
}

export interface ExchangeCodeOptions {
  /** PKCE verifier that produced the challenge sent in the authorization URL. */
  codeVerifier?: string;
}

export interface RefreshOptions {
  /** Request a subset of the originally granted scopes. */
  scopes?: readonly string[];
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

/**
 * Minimal client for the EVE SSO OAuth2 endpoints: building the login URL,
 * exchanging an authorization code, refreshing, and revoking.
 *
 * Supports confidential clients (HTTP Basic with the client secret) and
 * public clients (PKCE with `client_id` in the body). No JWT signature
 * verification is performed; tokens are trusted because they arrive directly
 * from SSO over TLS.
 */
export class EveSsoClient {
  private readonly clientId: string;
  private readonly clientSecret?: string;
  private readonly callbackUrl?: string;
  private readonly baseUrl: string;
  private readonly fetchFn?: FetchLike;

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
    if (options.codeVerifier) {
      form.set('code_verifier', options.codeVerifier);
    }
    return this.tokenRequest(form);
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
    return this.tokenRequest(form);
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
    const response = await this.post(this.revokeUrl, form);
    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }
  }

  private async tokenRequest(form: URLSearchParams): Promise<SsoTokenResponse> {
    const response = await this.post(this.tokenUrl, form);
    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }
    const json = (await response.json()) as SsoTokenJson;
    if (
      typeof json.access_token !== 'string' ||
      typeof json.refresh_token !== 'string'
    ) {
      throw new SsoError(
        response.status,
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

  private async post(url: string, form: URLSearchParams): Promise<Response> {
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
    return fetchFn(url, { method: 'POST', headers, body: form.toString() });
  }

  private async errorFromResponse(response: Response): Promise<Error> {
    let errorCode = 'unknown';
    let description: string | undefined;
    try {
      const json = (await response.json()) as SsoErrorJson;
      if (typeof json.error === 'string') errorCode = json.error;
      if (typeof json.error_description === 'string') {
        description = json.error_description;
      }
    } catch {
      // Non-JSON body; keep the defaults.
    }
    if (errorCode === 'invalid_grant') {
      return new TokenRevokedError(
        `EVE SSO rejected the refresh token (invalid_grant)${
          description ? `: ${description}` : ''
        }`,
      );
    }
    return new SsoError(response.status, errorCode, description);
  }
}
