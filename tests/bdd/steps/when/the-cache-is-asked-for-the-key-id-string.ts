import { askForKey } from '../../support/token-verification';
import { When } from '../../support/steps';

When(
  'the cache is asked for the key id {string}',
  async function (kid: string) {
    await askForKey(this, kid);
  },
);
