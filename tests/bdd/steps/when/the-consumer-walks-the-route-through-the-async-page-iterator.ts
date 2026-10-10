import { walkWithAsyncIterator } from '../../support/security-boundary';
import { When } from '../../support/steps';

When(
  'the consumer walks the route through the async page iterator',
  async function () {
    await walkWithAsyncIterator(this);
  },
);
