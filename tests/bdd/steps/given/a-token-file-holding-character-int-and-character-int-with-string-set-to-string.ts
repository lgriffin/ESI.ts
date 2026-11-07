import { tokenRecord, writeTokenFile } from '../../support/token-storage';
import { Given } from '../../support/steps';

Given(
  'a token file holding character {int} and character {int} with {string} set to {string}',
  function (good: number, bad: number, field: string, value: string) {
    writeTokenFile(this, [
      [String(good), tokenRecord(good)],
      [String(bad), { ...tokenRecord(bad), [field]: JSON.parse(value) }],
    ]);
  },
);
