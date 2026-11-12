import {
  REFRESH_MARGIN_MS,
  TokenSource,
  expiryOf,
  refreshAccessToken,
  stillFresh,
} from '../../../scripts/auth/sso-refresh';

/** An unsigned JWT with the given claims; the script only reads them. */
function jwt(claims: Record<string, unknown>): string {
  const part = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part(claims)}.sig`;
}

const NOW = Date.parse('2026-11-12T12:00:00Z');
const expSeconds = (ms: number) => Math.floor(ms / 1000);

function stubFetch(status: number, body: unknown): jest.SpyInstance {
  return jest
    .spyOn(global, 'fetch')
    .mockResolvedValue(
      new Response(JSON.stringify(body), { status }) as unknown as Response,
    );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('expiryOf', () => {
  it('reads exp, in milliseconds', () => {
    expect(expiryOf(jwt({ exp: 1_800_000_000 }))).toBe(1_800_000_000_000);
  });

  it('rejects a token that is not a JWT or has no exp', () => {
    expect(() => expiryOf('opaque')).toThrow('not a JWT');
    expect(() => expiryOf(jwt({ sub: 'x' }))).toThrow('no exp claim');
  });
});

describe('stillFresh', () => {
  it('holds while more than the margin is left', () => {
    expect(stillFresh(NOW + REFRESH_MARGIN_MS + 1, NOW)).toBe(true);
    expect(stillFresh(NOW + REFRESH_MARGIN_MS, NOW)).toBe(false);
  });
});

describe('refreshAccessToken', () => {
  it('posts a refresh_token grant with the client ID and no secret', async () => {
    const token = jwt({ exp: expSeconds(NOW) + 1200 });
    const fetchSpy = stubFetch(200, {
      access_token: token,
      refresh_token: 'refresh-1',
    });

    const minted = await refreshAccessToken('client-1', 'refresh-1');

    expect(minted).toEqual({
      accessToken: token,
      expiresAt: (expSeconds(NOW) + 1200) * 1000,
      rotated: false,
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://login.eveonline.com/v2/oauth/token');
    const body = new URLSearchParams(String(init.body));
    expect(Object.fromEntries(body)).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'refresh-1',
      client_id: 'client-1',
    });
  });

  it('reports a rotated refresh token', async () => {
    stubFetch(200, {
      access_token: jwt({ exp: expSeconds(NOW) + 1200 }),
      refresh_token: 'refresh-2',
    });
    await expect(
      refreshAccessToken('client-1', 'refresh-1'),
    ).resolves.toMatchObject({ rotated: true });
  });

  it("fails with SSO's error and never echoes the refresh token", async () => {
    stubFetch(400, {
      error: 'invalid_grant',
      error_description: 'Invalid refresh token.',
    });
    const failure = refreshAccessToken('client-1', 'secret-refresh');
    await expect(failure).rejects.toThrow(
      'Token refresh failed (HTTP 400): invalid_grant — Invalid refresh token.',
    );
    await expect(failure).rejects.not.toThrow('secret-refresh');
  });
});

describe('TokenSource', () => {
  it('needs a refresh token and client ID, or an access token', () => {
    expect(() => TokenSource.fromEnv({})).toThrow(
      'needs ESI_SSO_CLIENT_ID and ESI_REFRESH_TOKEN',
    );
    expect(() => TokenSource.fromEnv({ ESI_REFRESH_TOKEN: 'r' })).toThrow(
      'needs ESI_SSO_CLIENT_ID and ESI_REFRESH_TOKEN',
    );
  });

  it('mints once, and again only when the token nears expiry', async () => {
    const first = jwt({ exp: expSeconds(NOW) + 1200 });
    const second = jwt({ exp: expSeconds(NOW) + 2400 });
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: first })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: second })),
      );
    const source = TokenSource.fromEnv({
      ESI_SSO_CLIENT_ID: 'c',
      ESI_REFRESH_TOKEN: 'r',
    });

    await expect(source.get(NOW)).resolves.toBe(first);
    await expect(source.get(NOW + 10 * 60_000)).resolves.toBe(first);
    await expect(source.get(NOW + 16 * 60_000)).resolves.toBe(second);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('prefers the refresh token over a fixed access token', async () => {
    const minted = jwt({ exp: expSeconds(NOW) + 1200 });
    stubFetch(200, { access_token: minted });
    const source = TokenSource.fromEnv({
      ESI_SSO_CLIENT_ID: 'c',
      ESI_REFRESH_TOKEN: 'r',
      ESI_ACCESS_TOKEN: jwt({ exp: expSeconds(NOW) + 1200 }),
    });
    await expect(source.get(NOW)).resolves.toBe(minted);
  });

  it('uses a fixed access token until it expires, then says how to get another', async () => {
    const fixed = jwt({ exp: expSeconds(NOW) + 60 });
    const fetchSpy = jest.spyOn(global, 'fetch');
    const source = TokenSource.fromEnv({ ESI_ACCESS_TOKEN: fixed });

    await expect(source.get(NOW)).resolves.toBe(fixed);
    await expect(source.get(NOW + 120_000)).rejects.toThrow(
      'ESI_ACCESS_TOKEN has expired',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
