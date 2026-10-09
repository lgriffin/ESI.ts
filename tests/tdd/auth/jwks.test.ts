import { generateKeyPairSync, sign } from 'crypto';
import {
  DEFAULT_SSO_JWKS_URL,
  SsoJwks,
  verifyAccessToken,
} from '../../../src/auth/jwks';
import type { FetchLike } from '../../../src/core/ApiClient';
import {
  TokenVerificationError,
  isTokenVerificationError,
} from '../../../src/auth/errors';
import {
  jwksBody,
  makeSignedJwt,
  signingKey,
  withEditedPayload,
} from '../helpers/ssoFixtures';

const CLIENT_ID = 'test-client-id';

const b64 = (v: unknown) =>
  Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString(
    'base64url',
  );

function jsonResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** A fetch that answers every call with the key set for `keys`. */
function jwksFetch(...keys: ReturnType<typeof signingKey>[]) {
  return jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(() =>
    Promise.resolve(jsonResponse(jwksBody(keys))),
  );
}

async function reasonOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (err: unknown) {
    expect(err).toBeInstanceOf(TokenVerificationError);
    return (err as TokenVerificationError).reason;
  }
  throw new Error('expected a rejection');
}

/** Sign an arbitrary header and payload with the current test key. */
function signRaw(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): string {
  const input = `${b64(header)}.${b64(payload)}`;
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(input),
    signingKey().privateKey,
  );
  return `${input}.${signature.toString('base64url')}`;
}

function payload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    sub: 'CHARACTER:EVE:2114794365',
    name: 'Aurora Vale',
    scp: ['esi-wallet.read_character_wallet.v1'],
    exp: Math.floor(Date.now() / 1000) + 1200,
    iss: 'login.eveonline.com',
    aud: [CLIENT_ID, 'EVE Online'],
    ...overrides,
  };
}

describe('verifyAccessToken', () => {
  it('decodes a token signed by a published key', async () => {
    const fetch = jwksFetch(signingKey());
    const decoded = await verifyAccessToken(
      makeSignedJwt({ characterId: 42, characterName: 'Test Pilot' }),
      { clientId: CLIENT_ID, fetch },
    );
    expect(decoded.characterId).toBe(42);
    expect(decoded.characterName).toBe('Test Pilot');
    expect(String(fetch.mock.calls[0]![0])).toBe(DEFAULT_SSO_JWKS_URL);
  });

  it('accepts both issuer forms SSO emits', async () => {
    const fetch = jwksFetch(signingKey());
    for (const iss of ['login.eveonline.com', 'https://login.eveonline.com']) {
      await expect(
        verifyAccessToken(
          signRaw({ alg: 'RS256', kid: 'JWT-Signature-Key' }, payload({ iss })),
          { clientId: CLIENT_ID, fetch },
        ),
      ).resolves.toMatchObject({ characterId: 2114794365 });
    }
  });

  it('rejects a payload edited after signing', async () => {
    const forged = withEditedPayload(makeSignedJwt(), (c) => ({
      ...c,
      sub: 'CHARACTER:EVE:1',
    }));
    expect(
      await reasonOf(
        verifyAccessToken(forged, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe('signature');
  });

  it('rejects a token signed by a key that is not SSO’s, under SSO’s kid', async () => {
    const impostor = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const input = `${b64({ alg: 'RS256', kid: 'JWT-Signature-Key' })}.${b64(payload())}`;
    const token = `${input}.${sign('RSA-SHA256', Buffer.from(input), impostor.privateKey).toString('base64url')}`;
    expect(
      await reasonOf(
        verifyAccessToken(token, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe('signature');
  });

  it.each(['none', 'HS256', 'ES256', undefined])(
    'rejects alg %s without fetching keys',
    async (alg) => {
      const fetch = jwksFetch(signingKey());
      const token = `${b64({ alg, kid: 'JWT-Signature-Key' })}.${b64(payload())}.${b64('x')}`;
      expect(
        await reasonOf(
          verifyAccessToken(token, { clientId: CLIENT_ID, fetch }),
        ),
      ).toBe('algorithm');
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['not-a-jwt'],
    ['a.b'],
    ['a..c'],
    [`${b64('not json')}.${b64(payload())}.${b64('x')}`],
    [`${b64([1])}.${b64(payload())}.${b64('x')}`],
    [`${b64({ alg: 'RS256' })}.${b64(payload())}.${b64('x')}`],
  ])('rejects malformed token %s', async (token) => {
    expect(
      await reasonOf(
        verifyAccessToken(token, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe('malformed');
  });

  it('rejects a signed payload that is not a JSON object', async () => {
    const input = `${b64({ alg: 'RS256', kid: 'JWT-Signature-Key' })}.${b64('"text"')}`;
    const token = `${input}.${sign('RSA-SHA256', Buffer.from(input), signingKey().privateKey).toString('base64url')}`;
    expect(
      await reasonOf(
        verifyAccessToken(token, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe('malformed');
  });

  it('rejects a signed token whose sub is not a character', async () => {
    const token = signRaw(
      { alg: 'RS256', kid: 'JWT-Signature-Key' },
      payload({ sub: 'CORPORATION:EVE:1' }),
    );
    expect(
      await reasonOf(
        verifyAccessToken(token, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe('malformed');
  });

  it.each([
    ['another issuer', { iss: 'https://evil.example' }, 'issuer'],
    ['no issuer', { iss: undefined }, 'issuer'],
    ['another client id', { aud: ['other', 'EVE Online'] }, 'audience'],
    ['no EVE Online audience', { aud: [CLIENT_ID] }, 'audience'],
    ['a string audience', { aud: CLIENT_ID }, 'audience'],
    ['no audience', { aud: undefined }, 'audience'],
    ['no exp', { exp: undefined }, 'expired'],
    ['a past exp', { exp: Math.floor(Date.now() / 1000) - 1 }, 'expired'],
  ])('rejects a token with %s', async (_label, overrides, reason) => {
    const token = signRaw(
      { alg: 'RS256', kid: 'JWT-Signature-Key' },
      payload(overrides),
    );
    expect(
      await reasonOf(
        verifyAccessToken(token, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe(reason);
  });

  it('allows clockToleranceSeconds past exp', async () => {
    const exp = 1_000_000;
    const token = signRaw(
      { alg: 'RS256', kid: 'JWT-Signature-Key' },
      payload({ exp }),
    );
    const now = () => (exp + 20) * 1000;
    await expect(
      verifyAccessToken(token, {
        clientId: CLIENT_ID,
        fetch: jwksFetch(signingKey()),
        now,
        clockToleranceSeconds: 30,
      }),
    ).resolves.toBeDefined();
    expect(
      await reasonOf(
        verifyAccessToken(token, {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
          now,
          clockToleranceSeconds: 10,
        }),
      ),
    ).toBe('expired');
  });

  it('rejects a kid the key set does not hold', async () => {
    const rotated = signingKey('JWT-Signature-Key-rotated');
    expect(
      await reasonOf(
        verifyAccessToken(makeSignedJwt({}, rotated), {
          clientId: CLIENT_ID,
          fetch: jwksFetch(signingKey()),
        }),
      ),
    ).toBe('unknown-key');
  });
});

describe('SsoJwks', () => {
  it('reuses the cached key set inside the cache lifetime', async () => {
    const fetch = jwksFetch(signingKey());
    let now = 0;
    const jwks = new SsoJwks({ fetch, now: () => now });
    await jwks.getKey('JWT-Signature-Key');
    now += 59 * 60_000;
    await jwks.getKey('JWT-Signature-Key');
    expect(fetch).toHaveBeenCalledTimes(1);
    now += 60_000;
    await jwks.getKey('JWT-Signature-Key');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('refetches an unknown kid at most once per cooldown', async () => {
    const fetch = jwksFetch(signingKey());
    let now = 0;
    const jwks = new SsoJwks({ fetch, now: () => now });
    await jwks.getKey('JWT-Signature-Key');
    await expect(jwks.getKey('made-up')).rejects.toThrow(/no RS256 key/);
    expect(fetch).toHaveBeenCalledTimes(1);
    now += 60_000;
    await expect(jwks.getKey('made-up')).rejects.toThrow(/no RS256 key/);
    expect(fetch).toHaveBeenCalledTimes(2);
    await expect(jwks.getKey('made-up-again')).rejects.toThrow(/no RS256 key/);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shares one fetch between concurrent callers', async () => {
    const fetch = jwksFetch(signingKey());
    const jwks = new SsoJwks({ fetch });
    await Promise.all([
      jwks.getKey('JWT-Signature-Key'),
      jwks.getKey('JWT-Signature-Key'),
      jwks.getKey('JWT-Signature-Key'),
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches from a custom URL with a GET', async () => {
    const fetch = jwksFetch(signingKey());
    const jwks = new SsoJwks({ fetch, jwksUrl: 'https://sso.example/jwks' });
    await jwks.getKey('JWT-Signature-Key');
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://sso.example/jwks');
    expect(init?.method).toBe('GET');
  });

  it('skips keys that are not RS256 RSA keys', async () => {
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const body = JSON.stringify({
      keys: [
        { ...ec.publicKey.export({ format: 'jwk' }), kid: 'ec', alg: 'ES256' },
        {
          ...signingKey().publicKey.export({ format: 'jwk' }),
          kid: 'rs512',
          alg: 'RS512',
        },
        { kty: 'RSA', kid: 'broken', n: '', e: '' },
        null,
        JSON.parse(jwksBody([signingKey()])).keys[0],
      ],
    });
    const jwks = new SsoJwks({
      fetch: () => Promise.resolve(jsonResponse(body)),
    });
    await expect(jwks.getKey('JWT-Signature-Key')).resolves.toBeDefined();
    await expect(jwks.getKey('ec')).rejects.toThrow(TokenVerificationError);
    await expect(jwks.getKey('rs512')).rejects.toThrow(TokenVerificationError);
    await expect(jwks.getKey('broken')).rejects.toThrow(TokenVerificationError);
  });

  it.each([
    ['a non-2xx status', () => Promise.resolve(jsonResponse('{}', 503))],
    ['a network failure', () => Promise.reject(new Error('ECONNRESET'))],
    ['a non-JSON body', () => Promise.resolve(jsonResponse('<html>'))],
    ['a body with no keys', () => Promise.resolve(jsonResponse('{"keys":[]}'))],
    ['a body that is not a key set', () => Promise.resolve(jsonResponse('[]'))],
  ])('reports jwks-unavailable for %s', async (_label, fetch: FetchLike) => {
    const jwks = new SsoJwks({ fetch });
    const error = await jwks.getKey('JWT-Signature-Key').catch((e) => e);
    expect(isTokenVerificationError(error)).toBe(true);
    expect((error as TokenVerificationError).reason).toBe('jwks-unavailable');
  });

  it('retries the fetch on the next call after a failure', async () => {
    const fetch = jest
      .fn<ReturnType<FetchLike>, Parameters<FetchLike>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(jsonResponse(jwksBody([signingKey()])));
    const jwks = new SsoJwks({ fetch });
    await expect(jwks.getKey('JWT-Signature-Key')).rejects.toThrow(/down/);
    await expect(jwks.getKey('JWT-Signature-Key')).resolves.toBeDefined();
  });
});
