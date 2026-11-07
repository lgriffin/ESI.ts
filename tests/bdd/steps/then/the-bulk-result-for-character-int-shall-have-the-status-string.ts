import { bulkResult } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the bulk result for character {int} shall have the status {string}',
  function (characterId: number, status: string) {
    expect(bulkResult(this, characterId).status).toBe(status);
  },
);
