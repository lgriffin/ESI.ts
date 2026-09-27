import { identityFromProvider, identityFromToken } from '../../../src/client';

function jwtFor(characterId: number): string {
  const b64 = (s: string) => Buffer.from(s).toString('base64url');
  return [
    b64(JSON.stringify({ alg: 'RS256' })),
    b64(JSON.stringify({ sub: `CHARACTER:EVE:${characterId}` })),
    b64('sig'),
  ].join('.');
}

describe('identityFromToken', () => {
  it('hands out the token it was given', async () => {
    await expect(identityFromToken('raw').accessToken()).resolves.toBe('raw');
  });

  it('cannot refresh', () => {
    expect(identityFromToken('raw').refreshAccessToken).toBeUndefined();
  });

  it('reads the character from an SSO token', () => {
    expect(identityFromToken(jwtFor(95465499)).characterId).toBe(95465499);
  });

  it('names no character for an opaque token', () => {
    expect(identityFromToken('raw').characterId).toBeUndefined();
  });

  it('is frozen', () => {
    expect(Object.isFrozen(identityFromToken('raw'))).toBe(true);
  });
});

describe('identityFromProvider', () => {
  it('asks the provider for the token and for the refresh alike', async () => {
    let calls = 0;
    const provider = () => Promise.resolve(`token-${++calls}`);
    const identity = identityFromProvider(provider);

    await expect(identity.accessToken()).resolves.toBe('token-1');
    await expect(identity.refreshAccessToken!()).resolves.toBe('token-2');
    expect(calls).toBe(2);
  });

  it('carries the character id it was told', () => {
    const identity = identityFromProvider(() => Promise.resolve('t'), {
      characterId: 7,
    });
    expect(identity.characterId).toBe(7);
  });

  it('names no character when not told one', () => {
    expect(
      identityFromProvider(() => Promise.resolve('t')).characterId,
    ).toBeUndefined();
  });

  it('propagates a provider failure', async () => {
    const identity = identityFromProvider(() =>
      Promise.reject(new Error('sso down')),
    );
    await expect(identity.accessToken()).rejects.toThrow('sso down');
  });
});
