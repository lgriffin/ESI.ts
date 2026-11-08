import { manager, storedToken } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  "the stored token for character {int} shall expire {int} ms after the manager's current time",
  async function (characterId: number, ms: number) {
    const stored = await storedToken(this, characterId);
    expect(stored.expiresAt).toBe(manager(this).clock + ms);
  },
);
