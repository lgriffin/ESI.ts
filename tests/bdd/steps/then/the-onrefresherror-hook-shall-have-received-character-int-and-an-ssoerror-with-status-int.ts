import { SsoError } from '../../../../src/auth/errors';
import { manager } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the onRefreshError hook shall have received character {int} and an SsoError with status {int}',
  function (characterId: number, status: number) {
    const calls = manager(this).hooks.refreshErrors;
    expect(calls).toHaveLength(1);
    expect(calls[0]?.characterId).toBe(characterId);
    expect(calls[0]?.error).toBeInstanceOf(SsoError);
    expect((calls[0]?.error as SsoError).statusCode).toBe(status);
  },
);
