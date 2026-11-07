import { getDefaultClient } from '../../../../src/EsiClient';
import { Then } from '../../support/steps';

Then(
  'the default EsiClient asked for twice shall be the same object',
  function () {
    const first = getDefaultClient();
    this.cleanups.push(() => first.shutdown());
    expect(first).toBeDefined();
    expect(getDefaultClient()).toBe(first);
  },
);
