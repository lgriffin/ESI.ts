/**
 * What createEsi builds, beyond what 0056-shared-runtime.feature specifies at
 * the transport seam: the shape of the runtime, how views share it, and the
 * options that reach the pipeline.
 */
import fetchMock from 'jest-fetch-mock';
import {
  createEsi,
  identityFromProvider,
  identityFromToken,
  type Identity,
} from '../../../src/client';

fetchMock.enableMocks();

const OPTIONS = {
  userAgent: 'runtime-test/1.0 (dev@example.com)',
  logLevel: 'error' as const,
  rateLimiterConfig: { minDelayMs: 0 },
  retryConfig: { maxRetries: 0 },
};

const sent = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i]!;
  return { url: new URL(String(url)), headers: new Headers(init?.headers) };
};

describe('createEsi', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('refuses a user agent that is not a string', () => {
    expect(() => createEsi({ userAgent: 42 as unknown as string })).toThrow(
      /^\[VALIDATION_ERROR\] userAgent/,
    );
  });

  it('refuses a host other than ESI without unsafeAllowCustomHost', () => {
    expect(() =>
      createEsi({ ...OPTIONS, baseUrl: 'https://example.com' }),
    ).toThrow();
    expect(() =>
      createEsi({
        ...OPTIONS,
        baseUrl: 'https://example.com',
        unsafeAllowCustomHost: true,
      }),
    ).not.toThrow();
  });

  it('is frozen: nothing can replace the public view or as()', () => {
    const esi = createEsi(OPTIONS);
    expect(Object.isFrozen(esi)).toBe(true);
  });

  it('returns the same view for the same identity object', () => {
    const esi = createEsi(OPTIONS);
    const identity = identityFromToken('t');
    expect(esi.as(identity)).toBe(esi.as(identity));
    expect(esi.as(identity)).not.toBe(esi.as(identityFromToken('t')));
  });

  it('sends the tenant, compatibility date, language and datasource from every view', async () => {
    const esi = createEsi({
      ...OPTIONS,
      tenant: 'singularity',
      compatibilityDate: '2026-08-18',
      language: 'de',
      datasource: 'singularity',
    });
    fetchMock.mockResponses('{"players":1}', '12.5');

    await esi.public.status.get();
    await esi.as(identityFromToken('t')).character(1).wallet.get();

    for (const i of [0, 1]) {
      expect(sent(i).headers.get('x-tenant')).toBe('singularity');
      expect(sent(i).headers.get('x-compatibility-date')).toBe('2026-08-18');
      expect(sent(i).headers.get('accept-language')).toBe('de');
      expect(sent(i).url.searchParams.get('datasource')).toBe('singularity');
    }
  });

  it('sends every request through the configured transport', async () => {
    const transport = jest.fn(
      async () => new Response('{"players":3}', { status: 200 }),
    );
    const esi = createEsi({ ...OPTIONS, transport });

    await esi.public.status.get();
    await esi.as(identityFromToken('t')).status.get();

    expect(transport).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('runs the request and response interceptors on a view', async () => {
    const seen: string[] = [];
    const esi = createEsi({
      ...OPTIONS,
      requestInterceptors: [
        (req) => {
          seen.push(`request ${req.url}`);
          return req;
        },
      ],
      responseInterceptors: [
        (res) => {
          seen.push(`response ${res.status}`);
          return res;
        },
      ],
    });
    fetchMock.mockResponseOnce('12.5');

    await esi.as(identityFromToken('t')).character(1).wallet.get();

    expect(seen).toEqual([
      'request https://esi.evetech.net/characters/1/wallet',
      'response 200',
    ]);
  });

  it('does not ask a public operation for a token', async () => {
    const accessToken = jest.fn(() => Promise.resolve('t'));
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponseOnce('{"players":1}');

    await esi.as({ accessToken }).status.get();

    expect(accessToken).not.toHaveBeenCalled();
    expect(sent().headers.get('authorization')).toBeNull();
  });

  it('pages an authenticated collection under the identity token', async () => {
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponses(
      ['[{"item_id":1}]', { headers: { 'x-pages': '2' } }],
      ['[{"item_id":2}]', { headers: { 'x-pages': '2' } }],
    );

    const ids: number[] = [];
    for await (const asset of esi
      .as(identityFromToken('t'))
      .character(1)
      .assets.get()) {
      ids.push(asset.item_id);
    }

    expect(ids).toEqual([1, 2]);
    expect(sent(0).headers.get('authorization')).toBe('Bearer t');
    expect(sent(1).headers.get('authorization')).toBe('Bearer t');
  });

  it('refuses an authenticated paged operation on the public view before the wire', async () => {
    const esi = createEsi(OPTIONS);
    const forced = esi.public as unknown as ReturnType<typeof esi.as>;

    const iterate = async () => {
      for await (const asset of forced.character(1).assets.get()) void asset;
    };

    await expect(iterate()).rejects.toThrow(/^\[NO_AUTH_TOKEN\] /);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('installs no token provider for an identity that cannot refresh', async () => {
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponseOnce('{"error":"expired"}', { status: 401 });

    await expect(
      esi.as(identityFromToken('t')).character(1).wallet.get(),
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes through the identity on a 401 and retries once', async () => {
    const tokens = ['first', 'second'];
    const identity: Identity = {
      accessToken: () => Promise.resolve(tokens[0]!),
      refreshAccessToken: () => Promise.resolve(tokens[1]!),
    };
    const esi = createEsi(OPTIONS);
    fetchMock.mockResponses(
      ['{"error":"expired"}', { status: 401 }],
      ['12.5', { status: 200 }],
    );

    await expect(esi.as(identity).character(1).wallet.get()).resolves.toBe(
      12.5,
    );
    expect(sent(0).headers.get('authorization')).toBe('Bearer first');
    expect(sent(1).headers.get('authorization')).toBe('Bearer second');
  });

  it('rejects the call when the identity cannot supply a token', async () => {
    const esi = createEsi(OPTIONS);
    const identity = identityFromProvider(() =>
      Promise.reject(new Error('no session')),
    );

    await expect(esi.as(identity).character(1).wallet.get()).rejects.toThrow(
      'no session',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
