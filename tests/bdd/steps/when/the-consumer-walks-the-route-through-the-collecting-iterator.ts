import { walkWithCollectingIterator } from '../../support/security-boundary';
import { When } from '../../support/steps';

When(
  'the consumer walks the route through the collecting iterator',
  async function () {
    await walkWithCollectingIterator(this);
  },
);
