import { createHash } from 'crypto';
import {
  callerIdentity,
  characterIdOfToken,
} from '../../../src/core/util/callerIdentity';

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

/** An unsigned JWT with the given payload; the header and signature are filler. */
function jwtWith(payload: unknown): string {
  return [
    base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    base64url(typeof payload === 'string' ? payload : JSON.stringify(payload)),
    base64url('signature'),
  ].join('.');
}

const sha16 = (input: string) =>
  createHash('sha256').update(input).digest('hex').slice(0, 16);

describe('characterIdOfToken', () => {
  it('reads the character id out of an SSO subject claim', () => {
    expect(characterIdOfToken(jwtWith({ sub: 'CHARACTER:EVE:95465499' }))).toBe(
      95465499,
    );
  });

  it('returns the id as a number, not the digits', () => {
    const id = characterIdOfToken(jwtWith({ sub: 'CHARACTER:EVE:7' }));
    expect(id).toBe(7);
    expect(typeof id).toBe('number');
  });

  it.each([
    ['an opaque token', 'opaque-token'],
    ['two segments', 'a.b'],
    ['four segments', 'a.b.c.d'],
    ['an empty payload segment', 'a..c'],
    ['a payload that is not base64url JSON', 'a.!!!.c'],
    ['a payload that is a JSON string', jwtWith('"CHARACTER:EVE:1"')],
    ['a payload that is JSON null', jwtWith('null')],
    ['a payload with no sub', jwtWith({ name: 'Nobody' })],
    ['a sub that is not a string', jwtWith({ sub: 95465499 })],
    ['a sub for another kind of subject', jwtWith({ sub: 'USER:EVE:1' })],
    ['a sub with a trailing segment', jwtWith({ sub: 'CHARACTER:EVE:1:x' })],
    ['a sub with no id', jwtWith({ sub: 'CHARACTER:EVE:' })],
    ['a sub with a non-numeric id', jwtWith({ sub: 'CHARACTER:EVE:abc' })],
  ])('returns null for %s', (_case, token) => {
    expect(characterIdOfToken(token)).toBeNull();
  });
});

describe('callerIdentity', () => {
  const tokenFor = (characterId: number, extra: object = {}) =>
    jwtWith({ sub: `CHARACTER:EVE:${characterId}`, ...extra });

  it('names the character for a bearer SSO token', () => {
    expect(callerIdentity(`Bearer ${tokenFor(95465499)}`)).toBe(
      'character:95465499',
    );
  });

  it('gives two tokens for one character the same identity', () => {
    const before = callerIdentity(`Bearer ${tokenFor(95465499, { jti: 'a' })}`);
    const after = callerIdentity(`Bearer ${tokenFor(95465499, { jti: 'b' })}`);
    expect(before).toBe(after);
  });

  it('gives tokens for different characters different identities', () => {
    expect(callerIdentity(`Bearer ${tokenFor(1)}`)).not.toBe(
      callerIdentity(`Bearer ${tokenFor(2)}`),
    );
  });

  it('hashes the whole header for a token that names no character', () => {
    const header = 'Bearer opaque-token';
    expect(callerIdentity(header)).toBe(sha16(header));
  });

  it('keeps the hash to 16 hex characters and out of the character namespace', () => {
    const identity = callerIdentity('Bearer opaque-token');
    expect(identity).toMatch(/^[0-9a-f]{16}$/);
    expect(identity.startsWith('character:')).toBe(false);
  });

  it('gives different opaque tokens different identities', () => {
    expect(callerIdentity('Bearer one')).not.toBe(callerIdentity('Bearer two'));
  });

  it('reads the token from a header without a Bearer prefix', () => {
    expect(callerIdentity(tokenFor(42))).toBe('character:42');
  });

  it('does not treat a Bearer prefix as part of the token', () => {
    // With the prefix left on, the first segment would be "Bearer <header>",
    // still three segments, so the payload decodes; the id is what matters.
    expect(callerIdentity(`Bearer ${tokenFor(42)}`)).toBe(
      callerIdentity(tokenFor(42)),
    );
  });

  it('hashes the header, not the bare token, for an opaque token', () => {
    expect(callerIdentity('Bearer opaque')).not.toBe(sha16('opaque'));
  });
});
