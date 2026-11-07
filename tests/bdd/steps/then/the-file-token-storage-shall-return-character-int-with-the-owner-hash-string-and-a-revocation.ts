import { Then } from '../../support/steps';

Then(
  'the file token storage shall return character {int} with the owner hash {string} and a revocation time',
  function (characterId: number, ownerHash: string) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual([
      expect.objectContaining({
        characterId,
        ownerHash,
        revokedAt: 1_800_000_000_000,
      }),
    ]);
  },
);
