import { bulkResult } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the bulk result for character {int} shall have the status {string} and not be retryable',
  function (characterId: number, status: string) {
    const result = bulkResult(this, characterId);
    expect(result.status).toBe(status);
    expect(result.retryable).toBe(false);
  },
);
