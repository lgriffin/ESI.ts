import { listedCharacter } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the character list shall hold character {int} {string} with the scopes {string}, not revoked',
  function (characterId: number, characterName: string, scopes: string) {
    const entry = listedCharacter(this, characterId);
    expect(entry).toMatchObject({
      characterName,
      scopes: scopes.split(' '),
      revoked: false,
    });
    expect(typeof entry.expiresAt).toBe('number');
  },
);
