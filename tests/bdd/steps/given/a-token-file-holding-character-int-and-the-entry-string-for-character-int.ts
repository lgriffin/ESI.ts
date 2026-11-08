import { tokenRecord, writeTokenFile } from '../../support/token-storage';
import { Given } from '../../support/steps';

Given(
  'a token file holding character {int} and the entry {string} for character {int}',
  function (good: number, value: string, bad: number) {
    writeTokenFile(this, [
      [String(good), tokenRecord(good)],
      [String(bad), JSON.parse(value)],
    ]);
  },
);
