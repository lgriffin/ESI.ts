import { tokenRecord, writeTokenFile } from '../../support/token-storage';
import { Given } from '../../support/steps';

Given(
  'a token file holding character {int} with the owner hash {string} and a revocation time',
  function (characterId: number, ownerHash: string) {
    writeTokenFile(this, [
      [
        String(characterId),
        {
          ...tokenRecord(characterId),
          ownerHash,
          revokedAt: 1_800_000_000_000,
        },
      ],
    ]);
  },
);
