import fetchMock from 'jest-fetch-mock';
import {
  EveSsoClient,
  DEFAULT_SSO_BASE_URL,
} from '../../../src/auth/EveSsoClient';
import { SsoError, TokenRevokedError } from '../../../src/auth/errors';
import {
  readFormBody,
  readHeader,
  ssoErrorBody,
  ssoTokenBody,
} from '../helpers/ssoFixtures';

describe('EveSsoClient', () => {
  const confidential = () =>
    new EveSsoClient({
      clientId: 'cid',
      clientSecret: 'secret',
      callbackUrl: 'https://app.example/callback',
    });

  it('requires a client id', () => {
    expect(() => new EveSsoClient({ clientId: '' })).toThrow(/clientId/);
  });

  it('exposes the SSO endpoints and strips a trailing slash from the base URL', () => {
    const sso = new EveSsoClient({
      clientId: 'cid',
      ssoBaseUrl: 'https://sso.test/',
    });
    expect(sso.tokenUrl).toBe('https://sso.test/v2/oauth/token');
    expect(sso.authorizeUrl).toBe('https://sso.test/v2/oauth/authorize');
    expect(sso.revokeUrl).toBe('https://sso.test/v2/oauth/revoke');
    expect(DEFAULT_SSO_BASE_URL).toBe('https://login.eveonline.com');
  });

  it('reports whether it is confidential', () => {
    expect(confidential().isConfidential()).toBe(true);
    expect(new EveSsoClient({ clientId: 'cid' }).isConfidential()).toBe(false);
    expect(
      new EveSsoClient({ clientId: 'cid', clientSecret: '' }).isConfidential(),
    ).toBe(false);
  });

  describe('getAuthorizationUrl', () => {
    it('builds the login URL with scopes, state and the configured callback', () => {
      const url = new URL(
        confidential().getAuthorizationUrl({
          scopes: ['esi-a.v1', 'esi-b.v1'],
          state: 'st',
        }),
      );
      expect(url.origin + url.pathname).toBe(
        'https://login.eveonline.com/v2/oauth/authorize',
      );
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('cid');
      expect(url.searchParams.get('redirect_uri')).toBe(
        'https://app.example/callback',
      );
      expect(url.searchParams.get('scope')).toBe('esi-a.v1 esi-b.v1');
      expect(url.searchParams.get('state')).toBe('st');
      expect(url.searchParams.has('code_challenge')).toBe(false);
    });

    it('includes the PKCE challenge and lets redirectUri override the callback', () => {
      const url = new URL(
        confidential().getAuthorizationUrl({
          scopes: [],
          state: 'st',
          codeChallenge: 'chal',
          redirectUri: 'https://other/cb',
        }),
      );
      expect(url.searchParams.get('code_challenge')).toBe('chal');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('redirect_uri')).toBe('https://other/cb');
    });

    it('throws when no redirect URI is available', () => {
      const sso = new EveSsoClient({ clientId: 'cid' });
      expect(() => sso.getAuthorizationUrl({ scopes: [], state: 's' })).toThrow(
        /redirectUri/,
      );
    });
  });

  describe('refresh', () => {
    it('sends grant_type=refresh_token with the optional scope subset', async () => {
      fetchMock.mockResponseOnce(
        ssoTokenBody({ accessToken: 'a', refreshToken: 'r', expiresIn: 5 }),
      );
      const result = await confidential().refresh('old', {
        scopes: ['x', 'y'],
      });
      const [, init] = fetchMock.mock.calls[0]!;
      const body = readFormBody(init);
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('refresh_token')).toBe('old');
      expect(body.get('scope')).toBe('x y');
      expect(readHeader(init, 'User-Agent')).toMatch(/esi/i);
      expect(result).toEqual({
        accessToken: 'a',
        refreshToken: 'r',
        expiresIn: 5,
        tokenType: 'Bearer',
      });
    });

    it('omits the scope field for an empty scope list', async () => {
      fetchMock.mockResponseOnce(ssoTokenBody());
      await confidential().refresh('old', { scopes: [] });
      expect(readFormBody(fetchMock.mock.calls[0]![1]).has('scope')).toBe(
        false,
      );
    });

    it('defaults expires_in and token_type when SSO omits them', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ access_token: 'a', refresh_token: 'r' }),
      );
      const result = await confidential().refresh('old');
      expect(result.expiresIn).toBe(0);
      expect(result.tokenType).toBe('Bearer');
    });

    it('throws SsoError when the 200 body lacks tokens', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ token_type: 'Bearer' }));
      await expect(confidential().refresh('old')).rejects.toMatchObject({
        name: 'SsoError',
        statusCode: 200,
        errorCode: 'invalid_response',
      });
    });

    it('throws SsoError with code unknown for a non-JSON error body', async () => {
      fetchMock.mockResponseOnce('<html>Bad Gateway</html>', { status: 502 });
      const err = await confidential()
        .refresh('old')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(SsoError);
      expect((err as SsoError).statusCode).toBe(502);
      expect((err as SsoError).errorCode).toBe('unknown');
      expect((err as SsoError).errorDescription).toBeUndefined();
      expect((err as SsoError).isRetryable()).toBe(true);
    });

    it('surfaces the SSO description on invalid_grant', async () => {
      fetchMock.mockResponseOnce(
        ssoErrorBody('invalid_grant', 'token expired'),
        { status: 400 },
      );
      const err = await confidential()
        .refresh('old')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(TokenRevokedError);
      expect((err as Error).message).toContain('token expired');
    });

    it('uses a custom fetch when provided', async () => {
      const custom = jest.fn(
        async () => new Response(ssoTokenBody(), { status: 200 }),
      );
      const sso = new EveSsoClient({ clientId: 'cid', fetch: custom });
      await sso.refresh('old');
      expect(custom).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('posts the token with a refresh_token hint by default', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });
      await confidential().revoke('r-1');
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(String(url)).toBe('https://login.eveonline.com/v2/oauth/revoke');
      const body = readFormBody(init);
      expect(body.get('token')).toBe('r-1');
      expect(body.get('token_type_hint')).toBe('refresh_token');
      expect(readHeader(init, 'Authorization')).toMatch(/^Basic /);
    });

    it('accepts an access_token hint and adds client_id for public clients', async () => {
      fetchMock.mockResponseOnce('', { status: 200 });
      await new EveSsoClient({ clientId: 'cid' }).revoke('a-1', 'access_token');
      const body = readFormBody(fetchMock.mock.calls[0]![1]);
      expect(body.get('token_type_hint')).toBe('access_token');
      expect(body.get('client_id')).toBe('cid');
    });

    it('throws SsoError on a failed revoke', async () => {
      fetchMock.mockResponseOnce(ssoErrorBody('invalid_client'), {
        status: 401,
      });
      await expect(confidential().revoke('r-1')).rejects.toBeInstanceOf(
        SsoError,
      );
    });
  });

  describe('exchangeCode', () => {
    it('sends the configured callback as redirect_uri', async () => {
      fetchMock.mockResponseOnce(ssoTokenBody());
      await confidential().exchangeCode('code');
      const [, init] = fetchMock.mock.calls[0]!;
      expect(readFormBody(init).get('redirect_uri')).toBe(
        'https://app.example/callback',
      );
    });

    it('lets a per-request redirectUri override the callback', async () => {
      fetchMock.mockResponseOnce(ssoTokenBody());
      await confidential().exchangeCode('code', {
        redirectUri: 'https://app.example/other',
      });
      const [, init] = fetchMock.mock.calls[0]!;
      expect(readFormBody(init).get('redirect_uri')).toBe(
        'https://app.example/other',
      );
    });

    it('omits redirect_uri when neither a callback nor an override is set', async () => {
      fetchMock.mockResponseOnce(ssoTokenBody());
      await new EveSsoClient({ clientId: 'cid' }).exchangeCode('code');
      const [, init] = fetchMock.mock.calls[0]!;
      expect(readFormBody(init).has('redirect_uri')).toBe(false);
    });

    it('reports invalid_grant on a code exchange as SsoError, not a revocation', async () => {
      fetchMock.mockResponseOnce(
        ssoErrorBody('invalid_grant', 'code expired'),
        {
          status: 400,
        },
      );
      const err = await confidential()
        .exchangeCode('stale')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(SsoError);
      expect(err).not.toBeInstanceOf(TokenRevokedError);
      expect((err as SsoError).statusCode).toBe(400);
      expect((err as SsoError).errorCode).toBe('invalid_grant');
      expect((err as SsoError).errorDescription).toBe('code expired');
    });
  });

  describe('malformed success bodies', () => {
    it.each([
      ['invalid JSON', '<html>ok</html>'],
      ['null', 'null'],
      ['an array', '["a", "r"]'],
      ['a string', '"token"'],
      ['a number', '42'],
    ])('reports %s as SsoError invalid_response', async (_label, body) => {
      fetchMock.mockResponseOnce(body, { status: 200 });
      const err = await confidential()
        .refresh('old')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(SsoError);
      expect((err as SsoError).statusCode).toBe(200);
      expect((err as SsoError).errorCode).toBe('invalid_response');
    });
  });

  describe('revoke error classification', () => {
    it('reports invalid_grant on revoke as SsoError, not a revocation', async () => {
      fetchMock.mockResponseOnce(ssoErrorBody('invalid_grant'), {
        status: 400,
      });
      const err = await confidential()
        .revoke('tok')
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(SsoError);
      expect(err).not.toBeInstanceOf(TokenRevokedError);
    });
  });
});
