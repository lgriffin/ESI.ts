import {
  decodeAccessToken,
  decodeJwtPayload,
  parseCharacterId,
  parseScopes,
} from '../../../src/auth/jwt';
import { TokenDecodeError } from '../../../src/auth/errors';
import { makeJwt } from '../helpers/ssoFixtures';

const b64 = (v: unknown) =>
  Buffer.from(JSON.stringify(v)).toString('base64url');

describe('jwt', () => {
  describe('decodeJwtPayload', () => {
    it('decodes the payload segment of a JWT', () => {
      const token = makeJwt({ characterId: 42, characterName: 'Test Pilot' });
      const claims = decodeJwtPayload(token);
      expect(claims.sub).toBe('CHARACTER:EVE:42');
      expect(claims.name).toBe('Test Pilot');
    });

    it('rejects a token without three segments', () => {
      expect(() => decodeJwtPayload('not-a-jwt')).toThrow(TokenDecodeError);
      expect(() => decodeJwtPayload('a.b')).toThrow(/three dot-separated/);
    });

    it('rejects a token with an empty payload segment', () => {
      expect(() => decodeJwtPayload('a..c')).toThrow(TokenDecodeError);
    });

    it('rejects a payload that is not JSON', () => {
      const token = `${b64({ alg: 'none' })}.${Buffer.from('{oops').toString('base64url')}.sig`;
      expect(() => decodeJwtPayload(token)).toThrow(/not valid JSON/);
    });

    it('rejects a payload that is not an object', () => {
      const token = `${b64({ alg: 'none' })}.${b64('string')}.sig`;
      expect(() => decodeJwtPayload(token)).toThrow(/not an object/);
      const nullToken = `${b64({ alg: 'none' })}.${b64(null)}.sig`;
      expect(() => decodeJwtPayload(nullToken)).toThrow(/not an object/);
    });
  });

  describe('parseCharacterId', () => {
    it('extracts the numeric id from an EVE character subject', () => {
      expect(parseCharacterId('CHARACTER:EVE:2114794365')).toBe(2114794365);
    });

    it('rejects a missing or non-string subject', () => {
      expect(() => parseCharacterId(undefined)).toThrow(/no sub claim/);
      expect(() => parseCharacterId(123)).toThrow(TokenDecodeError);
    });

    it('rejects a subject that is not a character', () => {
      expect(() => parseCharacterId('CORPORATION:EVE:1')).toThrow(
        /not a character subject/,
      );
    });
  });

  describe('parseScopes', () => {
    it('accepts an array of scopes', () => {
      expect(parseScopes(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('drops non-string entries from an array', () => {
      expect(parseScopes(['a', 1, null, 'b'])).toEqual(['a', 'b']);
    });

    it('splits a space-separated string', () => {
      expect(parseScopes('a b  c')).toEqual(['a', 'b', 'c']);
    });

    it('returns an empty list for a missing claim', () => {
      expect(parseScopes(undefined)).toEqual([]);
      expect(parseScopes(42)).toEqual([]);
    });
  });

  describe('decodeAccessToken', () => {
    it('extracts identity, scopes, expiry and owner hash', () => {
      const token = makeJwt({
        characterId: 7,
        characterName: 'Seven',
        scopes: ['s1', 's2'],
        expiresInSeconds: 100,
        ownerHash: 'owner-7',
      });
      const decoded = decodeAccessToken(token);
      expect(decoded.characterId).toBe(7);
      expect(decoded.characterName).toBe('Seven');
      expect(decoded.scopes).toEqual(['s1', 's2']);
      expect(decoded.ownerHash).toBe('owner-7');
      expect(decoded.expiresAt).toBeGreaterThan(Date.now());
      expect(decoded.claims.sub).toBe('CHARACTER:EVE:7');
    });

    it('tolerates a token with only a subject', () => {
      const token = `${b64({ alg: 'none' })}.${b64({ sub: 'CHARACTER:EVE:9' })}.sig`;
      const decoded = decodeAccessToken(token);
      expect(decoded.characterId).toBe(9);
      expect(decoded.characterName).toBe('');
      expect(decoded.scopes).toEqual([]);
      expect(decoded.expiresAt).toBeUndefined();
      expect(decoded.ownerHash).toBeUndefined();
    });
  });
});
