import { theSsoClient } from '../../support/sso-client';
import { attempt } from '../../support/token-manager';
import { When } from '../../support/steps';

When(
  'the SSO client refreshes {string}',
  async function (refreshToken: string) {
    await attempt(this, () => theSsoClient(this).refresh(refreshToken));
  },
);
