import { SsoError } from '../../../../src/auth/errors';
import { When } from '../../support/steps';

When(
  'the token manager refreshes the character and SSO refuses it',
  async function () {
    await expect(
      this.values.tokenManager.refresh(this.values.characterId),
    ).rejects.toBeInstanceOf(SsoError);
  },
);
