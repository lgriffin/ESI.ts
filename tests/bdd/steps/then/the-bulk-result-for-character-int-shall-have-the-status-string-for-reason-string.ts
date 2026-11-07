import { bulkResult } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the bulk result for character {int} shall have the status {string} for reason {string}',
  function (characterId: number, status: string, reason: string) {
    const result = bulkResult(this, characterId);
    expect(result.status).toBe(status);
    expect(result.reason).toBe(reason);
  },
);
